import logging
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from apscheduler.schedulers.background import BackgroundScheduler
from apscheduler.triggers.interval import IntervalTrigger

from app.core.config import settings
from app.db.database import engine, Base
from app.api.endpoints import router as api_router
from app.services.scheduler_tasks import run_all_active_agents_cycle

# Setup logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s"
)
logger = logging.getLogger(__name__)

# Global scheduler reference
scheduler = BackgroundScheduler()

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup: Create tables
    logger.info("Initializing database tables...")
    Base.metadata.create_all(bind=engine)
    with engine.connect() as conn:
        try:
            from sqlalchemy import text
            conn.execute(text("ALTER TABLE agents ADD COLUMN score_threshold FLOAT DEFAULT 75.0;"))
            conn.commit()
        except Exception:
            pass

    # Start APScheduler (Continuous Discovery Engine - 30s interval)
    logger.info("Starting Engine 1: Continuous Discovery Engine with 30-second interval...")
    scheduler.add_job(
        func=run_all_active_agents_cycle,
        trigger=IntervalTrigger(seconds=30),
        id="continuous_discovery_engine",
        name="Engine 1: Continuous Discovery Engine",
        replace_existing=True
    )
    scheduler.start()
    
    yield

    # Shutdown: Stop scheduler
    logger.info("Shutting down autonomous scheduler...")
    scheduler.shutdown()

app = FastAPI(
    title=settings.PROJECT_NAME,
    version=settings.VERSION,
    description="Autonomous Technology Intelligence Platform - Navrachna",
    lifespan=lifespan
)

# Enable CORS for hackathon evaluator & web clients
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register routes
app.include_router(api_router)

from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
import os

static_dir = os.path.join(os.path.dirname(__file__), "static")
assets_dir = os.path.join(static_dir, "assets")

if os.path.exists(assets_dir):
    app.mount("/assets", StaticFiles(directory=assets_dir), name="assets")

# Serve static dashboard UI at root
@app.get("/")
def read_root():
    static_file_path = os.path.join(static_dir, "index.html")
    if os.path.exists(static_file_path):
        return FileResponse(static_file_path)
    return {
        "status": "online",
        "platform": settings.PROJECT_NAME,
        "tagline": "Discover. Evaluate. Remember. Publish.",
        "documentation": "/docs"
    }
