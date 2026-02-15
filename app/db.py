# from sqlalchemy import create_engine

# engine = create_engine("sqlite:///data/bomnous.db", echo=True)

from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, declarative_base
from dotenv import load_dotenv
import os



load_dotenv()  # Load environment variables from .env file
DATABASE_URL = os.getenv("DATABASE_URL")



engine = create_engine(DATABASE_URL, echo=True)



SessionLocal = sessionmaker(bind=engine, autoflush=False, autocommit=False)

Base = declarative_base()

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()