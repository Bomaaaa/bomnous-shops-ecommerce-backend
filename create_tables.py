from app.db import engine
from app.models import Base

# This means create tables according to the models defined in models.py and only if they do not already exist
Base.metadata.create_all(bind=engine) 
