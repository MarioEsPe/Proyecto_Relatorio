# app/routers/reports.py
from typing import Annotated, List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlmodel import Session, select
from sqlalchemy.orm import selectinload
from datetime import date

from app.database import get_session
from app.models import (
    User, Shift, TaskLog, NoveltyLog, GenerationRamp, 
    OperationalReading
)
from app.schemas import ShiftReadWithDetails, ShiftReadWithGroup
from app.routers.login import get_current_user
from app.dependencies import require_role, UserRole
from app.enums import ShiftDesignator

router = APIRouter(
    prefix="/reports",
    tags=["Reports Archive"],
)

SessionDep = Annotated[Session, Depends(get_session)]
CurrentUser = Annotated[User, Depends(get_current_user)]

@router.get(
    "/",
    response_model=List[ShiftReadWithGroup],
    summary="Get List of Closed Shift Reports"
)
def get_closed_reports(
    session: SessionDep,
    current_user: CurrentUser,
    offset: int = 0,
    limit: int = Query(default=25, le=100),
    shift_date: Optional[date] = Query(default=None, description="Filter by operational date"),
    designator: Optional[ShiftDesignator] = Query(default=None, description="Filter by shift designator (1, 2, or 3)")
):
    """
    Get a paginated list of all shifts that are 'CLOSED'.
    Allows filtering by operational date and shift designator.
    """
    query = (
        select(Shift)
        .where(Shift.status == "CLOSED")
        .options(selectinload(Shift.scheduled_group)) 
        .order_by(Shift.start_time.desc()) 
    )
    
    if shift_date:
        query = query.where(Shift.shift_date == shift_date)
    if designator:
        query = query.where(Shift.shift_designator == designator.value)

    reports = session.exec(query.offset(offset).limit(limit)).all()
    return reports


@router.get(
    "/{report_id}",
    response_model=ShiftReadWithDetails,
    summary="Get Full Details for a Single Closed Report"
)
def get_closed_report_details(
    report_id: int,
    session: SessionDep,
    current_user: CurrentUser
):
    """
    Get the complete, detailed view of a single 'CLOSED' shift report,
    including all related logs (events, novelties, tasks, etc.).
    """
    statement = (
        select(Shift)
        .where(Shift.id == report_id)
        .where(Shift.status == "CLOSED") 
        .options(
            selectinload(Shift.scheduled_group),
            selectinload(Shift.status_logs),
            selectinload(Shift.event_logs),
            selectinload(Shift.task_logs).selectinload(TaskLog.user),
            selectinload(Shift.task_logs).selectinload(TaskLog.scheduled_task),
            selectinload(Shift.novelty_logs).selectinload(NoveltyLog.user),
            selectinload(Shift.generation_ramps).selectinload(GenerationRamp.user),
            selectinload(Shift.operational_readings).selectinload(OperationalReading.parameter),
            selectinload(Shift.operational_readings).selectinload(OperationalReading.equipment),
            selectinload(Shift.operational_readings).selectinload(OperationalReading.user)
        )
    )
    
    report = session.exec(statement).first()
    
    if not report:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Closed report not found"
        )
        
    return report