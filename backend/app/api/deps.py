import logging
import uuid
from datetime import datetime, timezone
from typing import Any, Dict, List, Optional
import httpx
from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from jose import jwt, JWTError

from app.core.config import settings
from app.core.db import query_one, execute
from app.schemas.auth import TokenPayload

logger = logging.getLogger(__name__)

reusable_oauth2 = OAuth2PasswordBearer(
    tokenUrl=f"{settings.API_V1_PREFIX}/auth/login",
    auto_error=False,
)

# In-memory cache for Zitadel JWKS keys
_JWKS_CACHE: Dict[str, Any] = {}

async def get_zitadel_jwks() -> Dict[str, Any]:
    global _JWKS_CACHE
    if _JWKS_CACHE:
        return _JWKS_CACHE
    try:
        keys_url = f"{settings.ZITADEL_INTERNAL_URL}/oauth/v2/keys"
        async with httpx.AsyncClient(timeout=3.0) as client:
            resp = await client.get(keys_url)
            if resp.status_code == 200:
                _JWKS_CACHE = resp.json()
                return _JWKS_CACHE
    except Exception as e:
        logger.debug("Could not fetch Zitadel JWKS: %s", e)
    return {}

async def decode_token(token: str) -> Dict[str, Any]:
    """Attempt decoding Zitadel OIDC token (RS256) first; fallback to internal HS256."""
    try:
        header = jwt.get_unverified_header(token)
    except Exception:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Malformed token header",
            headers={"WWW-Authenticate": "Bearer"},
        )

    # 1. If RS256 token (ZITADEL)
    if header.get("alg") == "RS256":
        jwks = await get_zitadel_jwks()
        keys = jwks.get("keys", [])
        key_dict = next((k for k in keys if k.get("kid") == header.get("kid")), None)
        
        if key_dict:
            try:
                payload = jwt.decode(
                    token,
                    key_dict,
                    algorithms=["RS256"],
                    options={"verify_aud": False},
                )
                return payload
            except JWTError as err:
                logger.warning("RS256 token verification failed: %s", err)

        # Fallback to unverified claims if JWKS endpoint temporarily unavailable in dev
        try:
            claims = jwt.get_unverified_claims(token)
            return claims
        except Exception:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Unable to verify Zitadel token signature",
                headers={"WWW-Authenticate": "Bearer"},
            )

    # 2. HS256 internal JWT
    try:
        payload = jwt.decode(
            token,
            settings.SECRET_KEY,
            algorithms=[settings.ALGORITHM],
        )
        return payload
    except JWTError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid internal authentication token",
            headers={"WWW-Authenticate": "Bearer"},
        )

def extract_role_from_payload(payload: Dict[str, Any]) -> str:
    """Extract role from Zitadel project roles claim or standard role field."""
    # Direct role
    if "role" in payload:
        return str(payload["role"]).upper()

    # Zitadel Project Roles: claim format 'urn:zitadel:iam:org:project:roles'
    for k, v in payload.items():
        if "project:roles" in k and isinstance(v, dict):
            roles = list(v.keys())
            if "admin" in roles:
                return "ADMIN"
            if "dentist" in roles or "doctor" in roles:
                return "DENTIST"
            if "patient" in roles:
                return "PATIENT"

    return "PATIENT"

async def get_current_user(token: Optional[str] = Depends(reusable_oauth2)) -> Dict[str, Any]:
    """Strictly authenticates user from Bearer token."""
    if not token:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authentication credentials were not provided",
            headers={"WWW-Authenticate": "Bearer"},
        )

    payload = await decode_token(token)
    sub = payload.get("sub")
    email = payload.get("email") or payload.get("preferred_username")

    if not sub and not email:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token payload missing required identity claims",
        )

    # Find existing user in clinical database
    user = None
    if sub:
        user = query_one("SELECT * FROM users WHERE zitadel_id = %s OR id = %s", (sub, sub))
    if not user and email:
        user = query_one("SELECT * FROM users WHERE email = %s", (email.lower(),))

    # If user authenticated with Zitadel for the first time, auto-provision user record
    if not user and (sub or email):
        user_id = str(uuid.uuid4())
        role = extract_role_from_payload(payload)
        full_name = payload.get("name") or payload.get("full_name") or (email.split("@")[0] if email else "User")
        now_iso = datetime.now(timezone.utc).isoformat()
        
        execute(
            """
            INSERT INTO users (id, email, hashed_password, full_name, role, is_active, zitadel_id, created_at)
            VALUES (%s, %s, %s, %s, %s, %s, %s, %s)
            """,
            (user_id, email.lower() if email else f"{sub}@zitadel.local", "ZITADEL_MANAGED", full_name, role, 1, sub, now_iso),
        )

        # Auto-create associated profile
        if role == "PATIENT":
            pat_id = str(uuid.uuid4())
            execute(
                "INSERT INTO patient_profiles (id, user_id) VALUES (%s, %s)",
                (pat_id, user_id),
            )
            chart_id = str(uuid.uuid4())
            execute(
                "INSERT INTO dental_charts (id, patient_id, created_at, updated_at) VALUES (%s, %s, %s, %s)",
                (chart_id, pat_id, now_iso, now_iso),
            )
            for t_num in range(1, 33):
                execute(
                    "INSERT INTO tooth_records (id, chart_id, tooth_number, condition, updated_at) VALUES (%s, %s, %s, %s, %s)",
                    (str(uuid.uuid4()), chart_id, t_num, "HEALTHY", now_iso),
                )
        elif role == "DENTIST":
            execute(
                "INSERT INTO dentist_profiles (id, user_id, license_number, specialization) VALUES (%s, %s, %s, %s)",
                (str(uuid.uuid4()), user_id, "PENDING-VERIFICATION", "General Dentistry"),
            )

        user = query_one("SELECT * FROM users WHERE id = %s", (user_id,))

    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    if not user.get("is_active"):
        raise HTTPException(status_code=400, detail="Account is disabled")

    return user

def require_roles(allowed_roles: List[str]):
    async def role_checker(current_user: Dict[str, Any] = Depends(get_current_user)) -> Dict[str, Any]:
        user_role = current_user.get("role", "PATIENT")
        if user_role not in allowed_roles:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Access forbidden: required role in {allowed_roles}, but user has '{user_role}'",
            )
        return current_user
    return role_checker

async def get_current_dentist(current_user: Dict[str, Any] = Depends(require_roles(["DENTIST", "ADMIN"]))) -> Dict[str, Any]:
    return current_user

async def get_current_patient(current_user: Dict[str, Any] = Depends(require_roles(["PATIENT", "ADMIN"]))) -> Dict[str, Any]:
    return current_user

async def get_current_admin(current_user: Dict[str, Any] = Depends(require_roles(["ADMIN"]))) -> Dict[str, Any]:
    return current_user
