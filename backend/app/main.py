import os
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.config import settings
from app.database import database
from app.routers import scans, webhooks

app = FastAPI(title="Nullscan API")

cors_origins = [o.strip() for o in settings.cors_origins.split(",") if o.strip()]
if os.environ.get("ENV") != "production":
    cors_origins += ["http://localhost:3000", "http://127.0.0.1:3000"]

app.add_middleware(
    CORSMiddleware,
    allow_origins=cors_origins,
    allow_credentials=False,
    allow_methods=["GET", "POST"],
    allow_headers=["*"],
)

app.include_router(scans.router)
app.include_router(webhooks.router)


@app.on_event("startup")
async def startup():
    await database.connect()


@app.on_event("shutdown")
async def shutdown():
    await database.disconnect()


@app.get("/health")
async def health_check():
    return {"status": "healthy"}
