from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from app.core.config import settings

import logging

logger = logging.getLogger(__name__)

engine = create_engine(settings.DATABASE_URL, pool_pre_ping=True)

try:
    engine.connect().close() # test connection
    logger.info("Database connection successfully verified.")
except Exception as e:
    logger.error(f"Failed to connect to the database. Error: {e}")
    raise RuntimeError(f"Database connection failed. Ensure PostgreSQL is running and DATABASE_URL is correct.")

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
