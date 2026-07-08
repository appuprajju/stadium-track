import logging
from sqlalchemy import create_engine
from sqlalchemy.exc import OperationalError
from sqlalchemy.orm import declarative_base, sessionmaker
from app.config import settings

logger = logging.getLogger("stadiummind.database")

db_url = settings.DATABASE_URL
connect_args = {}

# Try connecting to the primary database, fallback to SQLite if it fails
try:
    if db_url.startswith("sqlite"):
        connect_args["check_same_thread"] = False
        engine = create_engine(
            db_url,
            pool_pre_ping=True,
            connect_args=connect_args
        )
    else:
        # PostgreSQL configurations
        engine = create_engine(
            db_url,
            pool_pre_ping=True,
            pool_size=10,
            max_overflow=20
        )
    # Test connection
    with engine.connect() as conn:
        pass
    logger.info("Successfully connected to primary database.")
except (OperationalError, Exception) as e:
    if not db_url.startswith("sqlite"):
        logger.warning(
            f"Failed to connect to primary database ({e}). "
            "Falling back to local SQLite database (stadiummind.db)..."
        )
        db_url = "sqlite:///stadiummind.db"
        connect_args = {"check_same_thread": False}
        engine = create_engine(
            db_url,
            pool_pre_ping=True,
            connect_args=connect_args
        )
    else:
        raise e

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
