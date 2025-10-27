# app/main.py 
from fastapi import FastAPI 
from sqlmodel import SQLModel
from fastapi.middleware.cors import CORSMiddleware

from app.database import engine
from app.routers import equipment, shifts, users, login, personnel, attendance, tank, license, tasks, parameters, maintenance

def create_db_and_tables():
    SQLModel.metadata.create_all(engine) 
    
app = FastAPI()

origins = [
    "http://localhost:5173",      
    "http://localhost:5174",      
    # "https://relatorio-ui.onrender.com", 
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,      
    allow_credentials=True,   
    allow_methods=["*"],      
    allow_headers=["*"],      
)

@app.on_event("startup")
def on_startup():
    create_db_and_tables()
    
app.include_router(equipment.router) 
app.include_router(shifts.router)
app.include_router(users.router)
app.include_router(login.router)   
app.include_router(personnel.router)
app.include_router(attendance.router)
app.include_router(tank.router)
app.include_router(license.router)
app.include_router(tasks.router)
app.include_router(parameters.router)
app.include_router(maintenance.router)    