# app/routers/tasks.py
from typing import Annotated
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlmodel import Session, select

from app.database import get_session
from app.dependencies import require_role
from app.enums import UserRole
from app.models import ScheduledTask, User
from app.schemas import ScheduledTaskCreate, ScheduledTaskRead, ScheduledTaskUpdate 
from app.routers.login import get_current_user


router = APIRouter(
    prefix="/scheduled-tasks",
    tags=["Scheduled Tasks"],
)

SessionDep = Annotated[Session, Depends(get_session)]
AdminUser = Annotated[User, Depends(require_role(UserRole.OPS_MANAGER))]

@router.post("/", response_model=ScheduledTaskRead, status_code=status.HTTP_201_CREATED)
def create_scheduled_task(
    task_data: ScheduledTaskCreate, 
    session: SessionDep,
    current_user: AdminUser
    ):
    """
    Crea una nueva tarea programada en el catalogo general.
    """
    db_scheduled_task = ScheduledTask.model_validate(task_data)
    
    session.add(db_scheduled_task)
    session.commit()
    session.refresh(db_scheduled_task)
    return db_scheduled_task
    
@router.get("/", response_model=list[ScheduledTaskRead])
def get_all_scheduled_tasks(
    *,
    session: SessionDep,
    offset: int = 0,
    limit: int = Query(default=100, le=100),
    is_active: bool = True
):
    """
    Obtiene una lista de tareas programadas, por defecto solo las activas.
    """
    query = select(ScheduledTask).where(ScheduledTask.is_active == is_active)
        
    scheduled_tasks = session.exec(query.offset(offset).limit(limit)).all()
    return scheduled_tasks

@router.put("/{task_id}", response_model=ScheduledTaskRead)
def update_scheduled_task(
    task_id: int,
    task_data: ScheduledTaskUpdate,
    session: SessionDep,
    current_user: AdminUser
):
    """
    Actualiza una tarea programada existente en el catalogo.
    """    
    db_scheduled_task = session.get(ScheduledTask, task_id)
    if not db_scheduled_task:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="ScheduledTask not found")
    
    # Obtenemos los datos del pydantic model que no son None
    update_data = task_data.model_dump(exclude_unset=True)
    
    for key, value in update_data.items():
        setattr(db_scheduled_task, key,value)
        
    session.add(db_scheduled_task)
    session.commit()
    session.refresh(db_scheduled_task)
    
    return db_scheduled_task                      
                      