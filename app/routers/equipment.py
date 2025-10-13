# app/routers/equipment.py
from typing import Annotated, List
from fastapi import APIRouter, Depends, HTTPException, Query, status, Response
from sqlmodel import Session, select

from app.database import get_session
from app.models import Equipment
from app.schemas import EquipmentCreate, EquipmentUpdate, EquipmentRead
from app.dependencies import require_role, UserRole

router = APIRouter(
    prefix="/equipment",
    tags=["Equipment"],
)

SessionDep = Annotated[Session, Depends(get_session)]
    
@router.post("/", response_model=EquipmentRead, status_code=status.HTTP_201_CREATED, dependencies=[Depends(require_role([UserRole.OPS_MANAGER]))])
def create_equipment(equipment: EquipmentCreate, session: SessionDep) -> Equipment:
    db_equipment = Equipment.model_validate(equipment)
    session.add(db_equipment)
    session.commit()
    session.refresh(db_equipment)
    return db_equipment
    
@router.get("/", response_model=list[EquipmentRead])
def read_equipments(
    session: SessionDep,
    offset: int = 0,
    limit: int = Query(default=100, le=100)) -> list[Equipment]:
    equipments = session.exec(select(Equipment).offset(offset).limit(limit)).all()
    return equipments

@router.get("/{equipment_id}", response_model=EquipmentRead)
def read_equipment(equipment_id: int, session: SessionDep) -> Equipment:
    equipment = session.get(Equipment, equipment_id)
    if not equipment:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Equipment not found")
    return equipment

@router.delete("/{equipment_id}", status_code=status.HTTP_204_NO_CONTENT, dependencies=[Depends(require_role([UserRole.OPS_MANAGER]))])
def delete_equipment(equipment_id: int, session: SessionDep):
    equipment = session.get(Equipment, equipment_id)
    if not equipment:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail= "Equipment not found")
    session.delete(equipment)
    session.commit()
    return Response(status_code=status.HTTP_204_NO_CONTENT)

@router.put("/{equipment_id}", response_model=EquipmentRead, dependencies=[Depends(require_role([UserRole.OPS_MANAGER]))])
def update_equipment(
    equipment_id: int,
    equipment_data: EquipmentUpdate,
    session: SessionDep
) -> Equipment:
    db_equipment = session.get(Equipment, equipment_id)
    if not db_equipment:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Equipment not found")
    
    update_data = equipment_data.model_dump(exclude_unset=True)
    
    for key, value in update_data.items():
        setattr(db_equipment, key, value)
        
    session.add(db_equipment)
    session.commit()
    session.refresh(db_equipment)
    
    return db_equipment    