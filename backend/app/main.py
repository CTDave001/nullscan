import os
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.config import settings
from app.database import database
from app.routers import scans, webhooks, events, marketing


@asynccontextmanager
async def lifespan(app: FastAPI):
    await database.connect()
    yield
    await database.disconnect()


app = FastAPI(title="Nullscan API", lifespan=lifespan)

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
app.include_router(events.router)
app.include_router(marketing.router)


@app.get("/health")
async def health_check():
    return {"status": "healthy"}
