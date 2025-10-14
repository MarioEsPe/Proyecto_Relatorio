# app/database.py
import os
from sqlmodel import create_engine, Session

sqlite_file_name = "database.db"
sqlite_url = f"sqlite:///{sqlite_file_name}"

database_url = os.getenv("DATABASE_URL", default=sqlite_url)

engine = create_engine(database_url)

def get_session():
    with Session(engine) as session:
        yield session