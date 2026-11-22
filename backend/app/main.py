import os
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from uvicorn.middleware.proxy_headers import ProxyHeadersMiddleware

from app.core.config import settings
from app.core.db import init_tables, bootstrap_clinic_admin
from app.api.v1.api import api_router

@asynccontextmanager
async def lifespan(app: FastAPI):
    # 1. Initialize SQL tables
    init_tables()
    # 2. Origin Story (Day 0): Auto-provision root Administrator if missing (zero mock users)
    bootstrap_clinic_admin()
    yield

app = FastAPI(
    title=settings.APP_NAME,
    description="DentalConnect REST API (psycopg2 / SQL backend)",
    version="1.0.0",
    openapi_url=f"{settings.API_V1_PREFIX}/openapi.json",
    docs_url="/docs",
    redoc_url="/redoc",
    lifespan=lifespan,
)

# 1. Reverse Proxy / Forwarded Headers Middleware (for cloud deployments behind ALB, Nginx, Render, Railway)
app.add_middleware(ProxyHeadersMiddleware, trusted_hosts="*")

# 2. CORS Middleware: explicit origins + regex for all Vercel deployments (*.vercel.app)
cors_origins = list(settings.BACKEND_CORS_ORIGINS)
if settings.FRONTEND_URL and settings.FRONTEND_URL not in cors_origins:
    cors_origins.append(settings.FRONTEND_URL)

app.add_middleware(
    CORSMiddleware,
    allow_origins=cors_origins,
    allow_origin_regex=r"https://.*\.vercel\.app",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
    expose_headers=["*"],
)

app.include_router(api_router, prefix=settings.API_V1_PREFIX)

@app.get("/health", tags=["Health"])
async def health_check():
    return {
        "status": "healthy",
        "app": settings.APP_NAME,
        "environment": settings.ENVIRONMENT,
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
