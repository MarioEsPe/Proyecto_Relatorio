# app/routers/shifts.py
from typing import Annotated, List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlmodel import Session, select
from sqlalchemy.orm import selectinload
from datetime import datetime

from app.database import get_session
from app.models import (
    Shift, EquipmentStatusLog, Equipment, EventLog, User, ShiftGroup, 
    ShiftAttendance, TankReading, Tank, TaskLog, ScheduledTask, NoveltyLog,
    GenerationRamp, OperationalReading, OperationalParameter
)    
from app.schemas import (
    ShiftRead, StatusLogCreate, StatusLogRead, ShiftReadWithDetails, 
    EventLogCreate, EventLogRead, ShiftAttendanceReadWithDetails, 
    TankReadingRead, TankReadingCreate, TaskLogCreate, TaskLogReadWithDetails,
    NoveltyLogCreate, NoveltyLogReadWithUser, GenerationRampCreate, GenerationRampReadWithUser,
    OperationalReadingCreate, OperationalReadingReadWithDetails,
    ShiftHandoverRequest
)     
from app.routers.login import get_current_user
from app.dependencies import require_role, UserRole
from app.security import verify_password

router = APIRouter(prefix="/shifts", tags=["Shifts"])
SessionDep = Annotated[Session, Depends(get_session)]
CurrentUser = Annotated[User, Depends(get_current_user)]

@router.post(
    "/handover",
    response_model=ShiftRead,
    summary="Atomic Shift Handover",
    dependencies= [Depends(require_role([UserRole.SHIFT_SUPERINTENDENT]))]
)
def handover_shift(
    *,
    session:SessionDep,
    handover_data: ShiftHandoverRequest,
    current_user: Annotated[User, Depends(get_current_user)]
):
    """
    Performs the atomic shift handover ("digital handshake").
    
    1. Validates the credentials of the Outgoing Superintendent (logged in).
    2. Validates the credentials of the Incoming Superintendent (can be the same user).
    3. Closes the old shift.
    4. Opens a new shift for the incoming user and generates their attendance sheet.
    All in a single transaction.
    """
    # 1. Validate Outgoing Superintendent (User A)
    if not verify_password(handover_data.outgoing_superintendent_password,current_user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid credentials for outgoing superintendent"
        )
    
    # 2. Validate Incoming Superintendent (User B)    
    user_b_statement = select(User).where(User.username == handover_data.incoming_superintendent_username)
    user_b = session.exec(user_b_statement).first()
    
    if not user_b or not verify_password(handover_data.incoming_superintendent_password, user_b.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED, 
            detail="Invalid credentials for incoming superintendent"
        )

    # 3. Validate the shift-to-close and the new group
    shift_to_close = session.get(Shift, handover_data.shift_to_close_id)
    if not shift_to_close:
        raise HTTPException(status_code=404, detail="Shift to close not found")
    if shift_to_close.status != "OPEN":
         raise HTTPException(status_code=400, detail="Shift is already closed")
         
    # Ownership check: Only the superintendent who *received* (opened) the shift can hand it over.
    if shift_to_close.incoming_superintendent_id != current_user.id:
        raise HTTPException(status_code=403, detail="You are not authorized to hand over this shift")
    
    new_group = session.get(ShiftGroup, handover_data.next_scheduled_group_id)
    if not new_group:
        raise HTTPException(status_code=404, detail="Scheduled group not found")

    # --- ATOMIC TRANSACTION START ---
    try:
        # 4. Close the old shift
        shift_to_close.end_time = datetime.utcnow()
        shift_to_close.status = "CLOSED"
        shift_to_close.outgoing_superintendent_id = current_user.id # User A (Outgoing)
        session.add(shift_to_close)

        # 5. Create the new shift
        new_shift = Shift(
            start_time=shift_to_close.end_time, # New shift starts exactly when the old one ends
            status="OPEN",
            incoming_superintendent_id=user_b.id, # User B (Incoming)
            scheduled_group_id=new_group.id
        )
        session.add(new_shift)
        session.commit() # Commit both changes
        
        # 6. Generate the attendance sheet for the *new* shift
        session.refresh(new_shift)
        for member in new_group.members:
            attendance_record = ShiftAttendance(
                shift_id=new_shift.id,
                scheduled_employee_id=member.id,
                actual_employee_id=member.id,
                attendance_status="Present",
                position_id=member.base_position_id
            )
            session.add(attendance_record)
            
        session.commit()
        session.refresh(new_shift)
    
    except Exception as e:
        session.rollback()
        raise HTTPException(status_code=500, detail=f"Transaction failed: {e}")
    # --- TRANSACTION END ---
    
    return new_shift
            

@router.get("/{shift_id}", response_model=ShiftReadWithDetails)
def read_shift(shift_id: int, session: SessionDep) -> Shift:
    """
    Get the details of a shift, including all its status records.
    """
    statement = (
        select(Shift)
        .where(Shift.id==shift_id)
        .options(
            selectinload(Shift.status_logs),
            selectinload(Shift.event_logs),
            selectinload(Shift.task_logs),
            selectinload(Shift.novelty_logs),
            selectinload(Shift.generation_ramps),
            selectinload(Shift.operational_readings)
        )
    )
    
    shift=session.exec(statement).first()
    
    if not shift:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Shift not found")
    return shift

@router.post("/{shift_id}/equipment-status/", response_model=StatusLogRead, status_code=status.HTTP_201_CREATED, dependencies=[Depends(require_role([UserRole.OPS_MANAGER, UserRole.SHIFT_SUPERINTENDENT]))])
def log_equipment_status_for_shift(
    shift_id: int,
    status_log: StatusLogCreate,
    session: SessionDep,
    current_user: CurrentUser
) -> EquipmentStatusLog:
    """
    Register a new equipment status for a specific shift.
    """
    db_shift = session.get(Shift, shift_id)
    if not db_shift:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Shift not found")
    if db_shift.status != "OPEN":
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Cannot add logs to a closed shift")
    if db_shift.incoming_superintendent_id != current_user.id:
        raise HTTPException(status_code=403, detail="You are not authorized to log data for this shift")
    
    db_equipment = session.get(Equipment, status_log.equipment_id)
    if not db_equipment:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Equipment not found")
    
    new_log_entry = EquipmentStatusLog.model_validate(status_log, update={"shift_id": shift_id})
    db_equipment.status = new_log_entry.status
    
    session.add(new_log_entry)
    session.add(db_equipment)
    session.commit()
    session.refresh(new_log_entry)
    
    return new_log_entry
    
@router.post("/{shift_id}/events/", response_model=EventLogRead, status_code=status.HTTP_201_CREATED, dependencies=[Depends(require_role([UserRole.OPS_MANAGER, UserRole.SHIFT_SUPERINTENDENT]))])
def event_log_for_shift(
    shift_id: int,
    event_data: EventLogCreate,
    session: SessionDep,
    current_user: CurrentUser
) -> EventLog:
    """
    Log a new event for a specific shift.
    """
    db_shift = session.get(Shift, shift_id)
    if not db_shift:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Shift not found")
    if db_shift.status != "OPEN":
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Cannot add logs to a closed shift")
    if db_shift.incoming_superintendent_id != current_user.id:
        raise HTTPException(status_code=403, detail="You are not authorized to log data for this shift")
       
    new_event_log_entry = EventLog.model_validate(event_data, update={"shift_id": shift_id})
    
    session.add(new_event_log_entry)
    session.commit()
    session.refresh(new_event_log_entry)
    
    return new_event_log_entry

@router.get(
    "/{shift_id}/attendance",
    response_model=List[ShiftAttendanceReadWithDetails],
    summary="Get the Attendance Sheet for a Shift"
)    
def get_shift_attendance(
    *,
    db: Session = Depends(get_session),
    shift_id: int
):
    """
    Get the complete and detailed list of personnel for a specific shift, reflecting the current
    attendance status (present, absent, covering employees).
    """
    db_shift = db.get(Shift, shift_id)
    if not db_shift:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Shift Not Found")
    
    return db_shift.attendance_records

@router.post("/{shift_id}/tank-readings/", response_model=TankReadingRead, status_code=status.HTTP_201_CREATED)
def create_tank_reading_for_shift(
    shift_id: int,
    tank_reading_data: TankReadingCreate,
    session: SessionDep,
    current_user: CurrentUser
) -> TankReading:
    """
    Log a new tank level reading for a specific shift.
    """
    db_shift = session.get(Shift, shift_id)
    if not db_shift:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Shift not found")
    if db_shift.status != "OPEN":
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Cannot add tank_readings to a closed shift")
    if db_shift.incoming_superintendent_id != current_user.id:
        raise HTTPException(status_code=403, detail="You are not authorized to log data for this shift")
    
    db_tank = session.get(Tank, tank_reading_data.tank_id)
    if not db_tank:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Tank not found")
    
    update_data = {
        "shift_id": shift_id,
        "user_id": current_user.id
    }
       
    new_tank_reading = TankReading.model_validate(tank_reading_data, update=update_data)
    
    session.add(new_tank_reading)
    session.commit()
    session.refresh(new_tank_reading)
    
    return new_tank_reading

@router.post("/{shift_id}/task-logs/", response_model=TaskLogReadWithDetails, status_code=status.HTTP_201_CREATED)
def log_task_for_shift(
    shift_id: int,
    log_data: TaskLogCreate, 
    session: SessionDep,
    current_user: CurrentUser
):
    """
    Log the completion of a scheduled task for a specific shift.
    """
    db_shift = session.get(Shift, shift_id)
    if not db_shift:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Shift not found")
    if db_shift.status != "OPEN":
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Cannot add tasks to a closed shift")
    if db_shift.incoming_superintendent_id != current_user.id:
        raise HTTPException(status_code=403, detail="You are not authorized to log data for this shift")
    
    db_scheduled_task = session.get(ScheduledTask, log_data.scheduled_task_id)
    if not db_scheduled_task:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="ScheduledTask not found")   
    
    update_data = {
        "shift_id": shift_id,
        "user_id": current_user.id
    }
    
    new_task_log_entry = TaskLog.model_validate(log_data, update=update_data)
    
    session.add(new_task_log_entry)
    session.commit()
    session.refresh(new_task_log_entry)
    
    return new_task_log_entry
    
@router.get("/{shift_id}/task-logs/", response_model=list[TaskLogReadWithDetails])
def get_task_logs_for_shift(shift_id: int, session: SessionDep):
    """
    Get all completed task logs for a specific shift.
    """
    statement = (
        select(Shift)
        .where(Shift.id==shift_id)
        .options(
            selectinload(Shift.task_logs))
    )
    shift = session.exec(statement).first()
    
    if not shift:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Shift not found")
    return shift.task_logs

@router.post("/{shift_id}/novelties/", response_model=NoveltyLogReadWithUser, status_code=status.HTTP_201_CREATED)
def log_novelty_for_shift(
    shift_id: int,
    novelty_data: NoveltyLogCreate,
    session: SessionDep,
    current_user: CurrentUser
):
    """
    Record a new update, instruction, or incident for a specific shift.
    """
    db_shift = session.get(Shift, shift_id)
    if not db_shift:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Shift not found")
    if db_shift.status != "OPEN":
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Cannot add novelties to a closed shift")
    if db_shift.incoming_superintendent_id != current_user.id:
        raise HTTPException(status_code=403, detail="You are not authorized to log data for this shift")
    
    update_data = {
        "shift_id": shift_id,
        "user_id": current_user.id
    }
    
    if novelty_data.timestamp is None:
        novelty_data.timestamp = datetime.utcnow()

    new_novelty_log = NoveltyLog.model_validate(novelty_data, update=update_data)
    
    session.add(new_novelty_log)
    session.commit()
    session.refresh(new_novelty_log)
    
    return new_novelty_log

@router.get("/{shift_id}/novelties/", response_model=List[NoveltyLogReadWithUser])
def get_novelties_for_shift(shift_id: int, session: SessionDep):
    """
    Get all novelties logs for a specific shift.
    """
    db_shift = session.get(Shift, shift_id)
    if not db_shift:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Shift not found")
        
    return db_shift.novelty_logs

@router.post("/{shift_id}/ramps/", response_model=GenerationRampReadWithUser, status_code=status.HTTP_201_CREATED)
def log_generation_ramp_for_shift(
    shift_id: int,
    ramp_data: GenerationRampCreate,
    session: SessionDep,
    current_user: CurrentUser
):
    """
    Record a new Generation ramp and automatically calculate its compliance.
    """
    db_shift = session.get(Shift, shift_id)
    if not db_shift:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Shift not found")
    if db_shift.status != "OPEN":
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Cannot add ramps to a closed shift")
    if db_shift.incoming_superintendent_id != current_user.id:
        raise HTTPException(status_code=403, detail="You are not authorized to log data for this shift")
    
    time_delta = ramp_data.end_time - ramp_data.start_time
    load_delta = ramp_data.final_load_mw - ramp_data.initial_load_mw

    time_delta_minutes = time_delta.total_seconds() / 60
    if time_delta_minutes <= 0:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="End time must be after start time.")

    actual_ramp_rate = load_delta / time_delta_minutes

    is_compliant_calculated = actual_ramp_rate >= ramp_data.target_ramp_rate_mw_per_minute
    
    ramp_data_dict = ramp_data.model_dump()
    
    new_ramp_log = GenerationRamp(
        **ramp_data_dict,
        is_compliant=is_compliant_calculated, 
        shift_id=shift_id,
        user_id=current_user.id
    )
    
    session.add(new_ramp_log)
    session.commit()
    session.refresh(new_ramp_log)
    
    return new_ramp_log

@router.get("/{shift_id}/ramps/", response_model=List[GenerationRampReadWithUser])
def get_ramps_for_shift(shift_id: int, session: SessionDep):
    """
    Get all records of Generation ramps for a specific shift."
    """
    db_shift = session.get(Shift, shift_id)
    if not db_shift:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Shift not found")
        
    return db_shift.generation_ramps

@router.post(
    "/{shift_id}/operational-readings/",
    response_model=OperationalReadingReadWithDetails,
    status_code=status.HTTP_201_CREATED,
)
def log_operational_reading_for_shift(
    shift_id: int,
    reading_data: OperationalReadingCreate,
    session: SessionDep,
    current_user: CurrentUser
):
    """
    Log a new operational parameter reading for a specific shift.
    """
    db_shift = session.get(Shift, shift_id)
    if not db_shift:
        raise HTTPException(status_code=404, detail="Shift Not Found")
    if db_shift.status != "OPEN":
        raise HTTPException(status_code=400, detail="Readings cannot be added to a closed shift.")
    if db_shift.incoming_superintendent_id != current_user.id:
        raise HTTPException(status_code=403, detail="You are not authorized to log data for this shift")
    
    if not session.get(OperationalParameter, reading_data.parameter_id):
        raise HTTPException(status_code=404, detail="Parameter ID not found")
    if not session.get(Equipment, reading_data.equipment_id):
        raise HTTPException(status_code=404, detail="Parameter ID not found")

    if reading_data.timestamp is None:
        reading_data.timestamp = datetime.utcnow()

    update_data = {"shift_id": shift_id, "user_id": current_user.id}
    new_reading = OperationalReading.model_validate(reading_data, update=update_data)

    session.add(new_reading)
    session.commit()
    session.refresh(new_reading)
    return new_reading

@router.get(
    "/{shift_id}/operational-readings/",
    response_model=List[OperationalReadingReadWithDetails],
)
def get_readings_for_shift(shift_id: int, session: SessionDep):
    """
    Get all operational parameter readings recorded in a shift.
    """
    statement = select(OperationalReading).where(OperationalReading.shift_id == shift_id)
    readings = session.exec(statement).all()
    return readings