# app/routers/maintenance.py
from typing import Annotated
from fastapi import APIRouter, Depends, status, Query, HTTPException
from sqlmodel import Session, select
from datetime import datetime

from app.database import get_session
from app.enums import TicketType, TicketStatus
from app.models import MaintenanceTicket, User
from app.schemas import MaintenanceTicketCreate, MaintenanceTicketRead, MaintenanceTicketUpdate
from app.routers.login import get_current_user
from app.dependencies import require_role, UserRole

router = APIRouter(
    prefix="/maintenance-tickets",
    tags=["Maintenance Tickets"],
)

SessionDep = Annotated[Session, Depends(get_session)]

@router.post("/", response_model=MaintenanceTicketRead, status_code=status.HTTP_201_CREATED,dependencies=[Depends(require_role([UserRole.SHIFT_SUPERINTENDENT]))])
def create_maintenance_ticket(
    maintenance_ticket: MaintenanceTicketCreate, 
    session: SessionDep,
    current_user: Annotated[User, Depends(get_current_user)]
    ) -> MaintenanceTicket:
    
    db_maintenance_ticket = MaintenanceTicket.model_validate(
        maintenance_ticket,
        update={"created_by_user_id": current_user.id}
    )
    
    session.add(db_maintenance_ticket)
    session.commit()
    session.refresh(db_maintenance_ticket)
    return db_maintenance_ticket
       
@router.get("/", response_model=list[MaintenanceTicketRead])
def read_maintenance_tickets(
    session: SessionDep,
    offset: int = 0,
    limit: int = Query(default=100, le=100)) -> list[MaintenanceTicket]:
    maintenance_tickets = session.exec(select(MaintenanceTicket).offset(offset).limit(limit)).all()
    return maintenance_tickets

@router.get("/{maintenance_ticket_id}", response_model=MaintenanceTicketRead)
def read_maintenance_ticket(maintenance_ticket_id: int, session: SessionDep) -> MaintenanceTicket:
    maintenance_ticket = session.get(MaintenanceTicket, maintenance_ticket_id)
    if not maintenance_ticket:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="MaintenanceTicket not found")
    return maintenance_ticket

@router.put("/{maintenance_ticket_id}", response_model=MaintenanceTicketRead, dependencies=[Depends(require_role([UserRole.SHIFT_SUPERINTENDENT]))])
def update_maintenance_ticket(
    maintenance_ticket_id: int,
    maintenance_ticket_data: MaintenanceTicketUpdate,
    session: SessionDep
) -> MaintenanceTicket:
    db_maintenance_ticket = session.get(MaintenanceTicket, maintenance_ticket_id)
    if not db_maintenance_ticket:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="MaintenanceTicket not found")
    
    update_data = maintenance_ticket_data.model_dump(exclude_unset=True)
    
    if update_data.get("ticket_status") == TicketStatus.COMPLETED:
        db_maintenance_ticket.completed_at = datetime.utcnow()
    
    for key, value in update_data.items():
        setattr(db_maintenance_ticket, key, value)
        
    session.add(db_maintenance_ticket)
    session.commit()
    session.refresh(db_maintenance_ticket)
    
    return db_maintenance_ticket    