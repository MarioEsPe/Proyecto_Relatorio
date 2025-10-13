# app/routers/tank.py
from typing import Annotated, List
from fastapi import APIRouter, Depends, HTTPException, Query, status, Response
from sqlmodel import Session, select

from app.database import get_session
from app.models import Tank
from app.schemas import TankCreate, TankRead, TankUpdate
from app.dependencies import require_role
from app.enums import UserRole

router = APIRouter(
    prefix="/tank",
    tags=["Tank"],
)

SessionDep = Annotated[Session, Depends(get_session)]

# --- Endpoint de Creación Actualizado ---    
@router.post("/", response_model=TankRead, status_code=status.HTTP_201_CREATED, dependencies=[Depends(require_role(UserRole.OPS_MANAGER))])
def create_tank(tank: TankCreate, session: SessionDep) -> Tank:
    db_tank = Tank.model_validate(tank)
    session.add(db_tank)
    session.commit()
    session.refresh(db_tank)
    return db_tank
    
# Read Equipments    

@router.get("/", response_model=list[TankRead])
def read_tanks(
    session: SessionDep,
    offset: int = 0,
    limit: int = Query(default=100, le=100)) -> list[Tank]:
    tanks = session.exec(select(Tank).offset(offset).limit(limit)).all()
    return tanks

# Read One Tank

@router.get("/{tank_id}", response_model=TankRead)
def read_tank(tank_id: int, session: SessionDep) -> Tank:
    tank = session.get(Tank, tank_id)
    if not tank:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Tank not found")
    return tank 

# Delete a Tank 

@router.delete("/{tank_id}", status_code=status.HTTP_204_NO_CONTENT, dependencies=[Depends(require_role(UserRole.OPS_MANAGER))])
def delete_tank(tank_id: int, session: SessionDep):
    tank = session.get(Tank, tank_id)
    if not tank:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail= "Tank not found")
    session.delete(tank)
    session.commit()
    return Response(status_code=status.HTTP_204_NO_CONTENT)

@router.put("/{tank_id}", response_model=TankRead, dependencies=[Depends(require_role(UserRole.OPS_MANAGER))])
def update_tank(
    tank_id: int,
    tank_data: TankUpdate,
    session: SessionDep
) -> Tank:
    db_tank = session.get(Tank, tank_id)
    if not db_tank:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Tank not found")
    
    # Obtenemos los datos del pydantic model que no son None
    update_data = tank_data.model_dump(exclude_unset=True)
    
    # actualizamos el objeto de la base de datos
    for key, value in update_data.items():
        setattr(db_tank, key, value)
        
    session.add(db_tank)
    session.commit()
    session.refresh(db_tank)
    
    return db_tank    
