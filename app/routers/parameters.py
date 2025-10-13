# app/routers/parameters.py

from typing import Annotated, List
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlmodel import Session, select

from app.database import get_session
from app.dependencies import require_role
from app.enums import UserRole
from app.models import OperationalParameter, User
from app.schemas import (
    OperationalParameterCreate,
    OperationalParameterRead,
    OperationalParameterUpdate,
)

router = APIRouter(prefix="/operational-parameters", tags=["Operational Parameters"])

SessionDep = Annotated[Session, Depends(get_session)]
AdminUser = Annotated[User, Depends(require_role(UserRole.OPS_MANAGER))]

@router.post("/", response_model=OperationalParameterRead, status_code=status.HTTP_201_CREATED)
def create_operational_parameter(
    parameter_data: OperationalParameterCreate,
    session: SessionDep,
    current_user: AdminUser,
):
    """Crea un nuevo parámetro operativo en el catálogo (Solo Jefes de Operación)."""
    db_parameter = OperationalParameter.model_validate(parameter_data)
    session.add(db_parameter)
    session.commit()
    session.refresh(db_parameter)
    return db_parameter

@router.get("/", response_model=List[OperationalParameterRead])
def get_all_operational_parameters(
    session: SessionDep,
    is_active: bool = True,
    offset: int = 0,
    limit: int = Query(default=100, le=100),
):
    """Obtiene una lista de todos los parámetros operativos definidos."""
    query = select(OperationalParameter).where(OperationalParameter.is_active == is_active)
    parameters = session.exec(query.offset(offset).limit(limit)).all()
    return parameters

@router.put("/{parameter_id}", response_model=OperationalParameterRead)
def update_operational_parameter(
    parameter_id: int,
    parameter_data: OperationalParameterUpdate,
    session: SessionDep,
    current_user: AdminUser,
):
    """Actualiza un parámetro operativo existente (Solo Jefes de Operación)."""
    db_parameter = session.get(OperationalParameter, parameter_id)
    if not db_parameter:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Parámetro no encontrado"
        )
    update_data = parameter_data.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(db_parameter, key, value)
    session.add(db_parameter)
    session.commit()
    session.refresh(db_parameter)
    return db_parameter