# app/routers/personnel.py
from typing import Annotated, List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlmodel import Session, select

from app.database import get_session
from app.dependencies import require_role
from app.enums import UserRole
from app.models import Position, Employee, ShiftGroup, User
from app.schemas import (
    PositionCreate, PositionRead,
    EmployeeCreate, EmployeeReadWithDetails,
    ShiftGroupCreate, ShiftGroupRead
)
from app.routers.login import get_current_user

# --- CONFIGURACION DEL ROUTER ---
router = APIRouter(prefix="/personnel", tags=["Personnel Management"])
SessionDep = Annotated[Session, Depends(get_session)]
AuthUser = Annotated[User, Depends(get_current_user)]

# --- ENDPOINTS PARA GESTIONAR PUESTOS (POSITIONS) ---

@router.post("/positions/", response_model=PositionRead, dependencies=[Depends(require_role(UserRole.OPS_MANAGER))])
def create_position(position_data: PositionCreate, session: SessionDep) -> Position:
    """Crea un nuevo puesto de trabajo (Solo Jefes de Operación)."""
    db_position = Position.model_validate(position_data)
    session.add(db_position)
    session.commit()
    session.refresh(db_position)
    return db_position

@router.get("/positions/", response_model=List[PositionRead])
def get_all_positions(session: SessionDep, current_user: AuthUser) -> List[Position]:
    """Obtiene una lista de todos los puestos de trabajo."""
    positions = session.exec(select(Position)).all()
    return positions

# --- ENDPOINTS PARA GESTIONAR EMPLEADOS (EMPLOYEES) ---

@router.post("/employees/", response_model=EmployeeReadWithDetails, dependencies=[Depends(require_role(UserRole.OPS_MANAGER))])
def create_employee(employee_data: EmployeeCreate, session: SessionDep) -> Employee:
    """Crea un nuevo empleado (Solo Jefes de Operación)."""
    db_employee = Employee.model_validate(employee_data)
    session.add(db_employee)
    session.commit()
    session.refresh(db_employee)
    return db_employee

@router.get("/employees/", response_model=List[EmployeeReadWithDetails])
def get_all_employees(session: SessionDep, current_user: AuthUser) -> List[Employee]:
    """Obtiene una lista de todos los empleados con sus detalles."""
    employees = session.exec(select(Employee)).all()
    return employees

# --- ENDPOINTS PARA GESTIONAR GRUPOS (SHIFTGROUPS) Y SUS MIEMBROS ---

@router.post("/groups/", response_model=ShiftGroupRead, dependencies=[Depends(require_role(UserRole.OPS_MANAGER))]) 
def create_shift_group(group_data: ShiftGroupCreate, session: SessionDep) -> ShiftGroup:
    """Crea un nuevo grupo de turno (Solo Jefes de Operación)."""
    db_group = ShiftGroup.model_validate(group_data)
    session.add(db_group)
    session.commit()
    session.refresh(db_group)
    return db_group

@router.post("/groups/{group_id}/members/{employee_id}", response_model=ShiftGroupRead, dependencies=[Depends(require_role(UserRole.OPS_MANAGER))])
def add_employee_to_group(group_id: int, employee_id: int, session: SessionDep) -> ShiftGroup:
    """Asigna un empleado a un grupo (Muchos-a-Muchos)."""
    # 1. Busca el grupo y el empleado en la base de datos
    db_group = session.get(ShiftGroup, group_id)
    if not db_group:
        raise HTTPException(status_code=404, detail="Shift Group not found")
    
    db_employee = session.get(Employee, employee_id)
    if not db_employee:
        raise HTTPException(status_code=404, detail="Employee not found")
    
    # 2. Añade el empleado a la lista de miembros del grupo.
    #   SQLModel es lo suficientemente inteligente para crear el registro
    #   en la tabla de asociación (GroupMembership) automáticamente.
    db_group.members.append(db_employee)
    
    # 3. Guarda los cambios en la base de datos
    session.add(db_group)
    session.commit()
    session.refresh(db_group)
    return db_group