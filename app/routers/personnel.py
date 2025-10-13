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

router = APIRouter(prefix="/personnel", tags=["Personnel Management"])
SessionDep = Annotated[Session, Depends(get_session)]
AuthUser = Annotated[User, Depends(get_current_user)]

@router.post("/positions/", response_model=PositionRead, dependencies=[Depends(require_role(UserRole.OPS_MANAGER))])
def create_position(position_data: PositionCreate, session: SessionDep) -> Position:
    """
    Create a new job title / position (Operations Managers Only).
    """
    db_position = Position.model_validate(position_data)
    session.add(db_position)
    session.commit()
    session.refresh(db_position)
    return db_position

@router.get("/positions/", response_model=List[PositionRead])
def get_all_positions(session: SessionDep, current_user: AuthUser) -> List[Position]:
    """
    Get a list of all job titles / positions.
    """
    positions = session.exec(select(Position)).all()
    return positions

@router.post("/employees/", response_model=EmployeeReadWithDetails, dependencies=[Depends(require_role(UserRole.OPS_MANAGER))])
def create_employee(employee_data: EmployeeCreate, session: SessionDep) -> Employee:
    """
    Create a new employee (Operations Managers Only).
    """
    db_employee = Employee.model_validate(employee_data)
    session.add(db_employee)
    session.commit()
    session.refresh(db_employee)
    return db_employee

@router.get("/employees/", response_model=List[EmployeeReadWithDetails])
def get_all_employees(session: SessionDep, current_user: AuthUser) -> List[Employee]:
    """
    Get a list of all employees with their details.
    """
    employees = session.exec(select(Employee)).all()
    return employees

@router.post("/groups/", response_model=ShiftGroupRead, dependencies=[Depends(require_role(UserRole.OPS_MANAGER))]) 
def create_shift_group(group_data: ShiftGroupCreate, session: SessionDep) -> ShiftGroup:
    """
    Create a new shift group (Operations Managers Only).
    """
    db_group = ShiftGroup.model_validate(group_data)
    session.add(db_group)
    session.commit()
    session.refresh(db_group)
    return db_group

@router.post("/groups/{group_id}/members/{employee_id}", response_model=ShiftGroupRead, dependencies=[Depends(require_role(UserRole.OPS_MANAGER))])
def add_employee_to_group(group_id: int, employee_id: int, session: SessionDep) -> ShiftGroup:
    """
    Assign an employee to a group (Many-to-Many).
    """
    db_group = session.get(ShiftGroup, group_id)
    if not db_group:
        raise HTTPException(status_code=404, detail="Shift Group not found")
    
    db_employee = session.get(Employee, employee_id)
    if not db_employee:
        raise HTTPException(status_code=404, detail="Employee not found")
    
    db_group.members.append(db_employee)
    
    session.add(db_group)
    session.commit()
    session.refresh(db_group)
    return db_group