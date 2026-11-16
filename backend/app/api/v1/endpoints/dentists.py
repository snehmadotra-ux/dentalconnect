from fastapi import APIRouter, HTTPException
from app.core.db import query_all, query_one

router = APIRouter()

@router.get("/")
async def list_dentists():
    """List dentists using raw SQL join."""
    sql = """
    SELECT d.id, d.user_id, u.full_name as name, u.email, u.phone,
           d.license_number, d.specialization, d.years_of_experience,
           d.bio, d.consultation_fee
    FROM dentist_profiles d
    JOIN users u ON d.user_id = u.id
    WHERE u.is_active = 1
    """
    return query_all(sql)

@router.get("/{dentist_id}")
async def get_dentist(dentist_id: str):
    sql = """
    SELECT d.id, d.user_id, u.full_name as name, u.email, u.phone,
           d.license_number, d.specialization, d.years_of_experience,
           d.bio, d.consultation_fee
    FROM dentist_profiles d
    JOIN users u ON d.user_id = u.id
    WHERE d.id = %s
    """
    dentist = query_one(sql, (dentist_id,))
    if not dentist:
        raise HTTPException(status_code=404, detail="Dentist not found")
    return dentist
