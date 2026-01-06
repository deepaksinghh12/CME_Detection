"""
Database configuration and setup for PostgreSQL
"""

import os
from sqlalchemy import create_engine, Column, Integer, String, Float, DateTime, Boolean, Text, func
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
from datetime import datetime
import logging

try:
    from dotenv import load_dotenv
    # Load environment variables from .env file
    load_dotenv()
    ENV_LOADED = True
except ImportError:
    ENV_LOADED = False
    print("python-dotenv not installed. Using default environment variables.")

# Database URL from environment variable
DATABASE_URL = os.getenv(
    "DATABASE_URL", 
    "postgresql://postgres:password@localhost:5432/cme_detection"
)

# Alternative: Build URL from individual components
if not os.getenv("DATABASE_URL"):
    DB_HOST = os.getenv("DB_HOST", "localhost")
    DB_PORT = os.getenv("DB_PORT", "5433")
    DB_NAME = os.getenv("DB_NAME", "cme_detection")
    DB_USER = os.getenv("DB_USER", "postgres")
    DB_PASSWORD = os.getenv("DB_PASSWORD", "password")
    
    DATABASE_URL = f"postgresql://{DB_USER}:{DB_PASSWORD}@{DB_HOST}:{DB_PORT}/{DB_NAME}"

print(f"Database URL configured from environment variables")

# Create engine
engine = create_engine(DATABASE_URL)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# Base class for models
Base = declarative_base()

# Database Models
class CMEEventDB(Base):
    __tablename__ = "cme_events"
    
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(255), nullable=False)  # Added name field
    datetime = Column(DateTime, nullable=False, index=True)
    speed = Column(Float, nullable=False)
    angular_width = Column(Float, nullable=False)
    source_location = Column(String(255))
    estimated_arrival = Column(DateTime)
    confidence = Column(Float, nullable=False)
    analysis_type = Column(String(50))
    sync_timestamp = Column(DateTime, default=func.now())  # When data was synced
    created_at = Column(DateTime, default=func.now())
    
class AnalysisSessionDB(Base):
    __tablename__ = "analysis_sessions"
    
    id = Column(Integer, primary_key=True, index=True)
    session_name = Column(String(255), nullable=False)  # Added session name
    start_date = Column(DateTime, nullable=False)
    end_date = Column(DateTime, nullable=False)
    analysis_type = Column(String(50), nullable=False)
    events_found = Column(Integer, default=0)
    processing_time = Column(Float)
    advanced_settings = Column(Text)  # JSON string
    sync_timestamp = Column(DateTime, default=func.now())  # When configured/synced
    created_at = Column(DateTime, default=func.now())

class DataSyncLog(Base):
    __tablename__ = "data_sync_log"
    
    id = Column(Integer, primary_key=True, index=True)
    sync_name = Column(String(255), nullable=False)
    sync_type = Column(String(50), nullable=False)  # 'configure', 'sync', 'update'
    sync_timestamp = Column(DateTime, default=func.now())
    data_source = Column(String(100))  # 'frontend', 'api', 'manual'
    records_processed = Column(Integer, default=0)
    success = Column(Boolean, default=True)
    error_message = Column(Text)
    created_at = Column(DateTime, default=func.now())

class ParticleDataDB(Base):
    __tablename__ = "particle_data"
    
    id = Column(Integer, primary_key=True, index=True)
    data_name = Column(String(255), nullable=False)  # Added data name
    timestamp = Column(DateTime, nullable=False, index=True)
    velocity = Column(Float)
    density = Column(Float)
    temperature = Column(Float)
    flux = Column(Float)
    source = Column(String(100))
    sync_timestamp = Column(DateTime, default=func.now())  # When synced
    created_at = Column(DateTime, default=func.now())

class SystemStatusDB(Base):
    __tablename__ = "system_status"
    
    id = Column(Integer, primary_key=True, index=True)
    mission_status = Column(String(50), default="operational")
    system_health = Column(String(50), default="excellent")
    data_coverage = Column(String(100))
    last_data_update = Column(DateTime)
    last_sync_timestamp = Column(DateTime)  # Last configure/sync time
    active_alerts = Column(Integer, default=0)
    total_cme_events = Column(Integer, default=0)
    updated_at = Column(DateTime, default=func.now())

# Dependency to get database session
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

# Create tables
def create_tables():
    """Create all tables in the database"""
    try:
        Base.metadata.create_all(bind=engine)
        logging.info("Database tables created successfully")
    except Exception as e:
        logging.error(f"Error creating database tables: {e}")

# Initialize database with sample data
def init_sample_data():
    """Initialize database with sample data"""
    db = SessionLocal()
    try:
        # Check if we already have data
        if db.query(SystemStatusDB).count() == 0:
            # Create initial system status
            system_status = SystemStatusDB(
                mission_status="operational",
                system_health="excellent",
                data_coverage="85.2%",
                last_data_update=datetime.utcnow(),
                last_sync_timestamp=datetime.utcnow(),
                active_alerts=2,
                total_cme_events=23
            )
            db.add(system_status)
        
        db.commit()
        logging.info("Sample data initialized successfully")
    except Exception as e:
        logging.error(f"Error initializing sample data: {e}")
        db.rollback()
        raise e  # CRITICAL FIX: Re-raise to notify main.py of failure
    finally:
        db.close()

if __name__ == "__main__":
    # Create tables and initialize data if run directly
    create_tables()
    init_sample_data()
