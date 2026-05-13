# from sqlalchemy import create_engine

# engine = create_engine("sqlite:///data/bomnous.db", echo=True)

from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, declarative_base
from dotenv import load_dotenv
import os



load_dotenv()  # Load environment variables from .env file
# Strip whitespace — Railway/UI pastes sometimes add a trailing space after the DB name
# (e.g. .../railway ) which makes Postgres look for database "railway " and fail.
DATABASE_URL = (os.getenv("DATABASE_URL") or "").strip()
if not DATABASE_URL:
    raise RuntimeError(
        "DATABASE_URL is missing or empty. Set it in the environment (e.g. Railway Variables or .env)."
    )

engine = create_engine(DATABASE_URL, echo=True)



SessionLocal = sessionmaker(bind=engine, autoflush=False, autocommit=False)

Base = declarative_base()

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()