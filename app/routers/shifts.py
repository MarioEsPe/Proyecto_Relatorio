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
    ShiftRead, ShiftClose, StatusLogCreate, StatusLogRead, ShiftReadWithDetails, 
    EventLogCreate, EventLogRead, ShiftCreate, ShiftAttendanceReadWithDetails, 
    TankReadingRead, TankReadingCreate, TaskLogCreate, TaskLogReadWithDetails,
    NoveltyLogCreate, NoveltyLogReadWithUser, GenerationRampCreate, GenerationRampReadWithUser,
    OperationalReadingCreate, OperationalReadingReadWithDetails
)     
from app.routers.login import get_current_user

router = APIRouter(prefix="/shifts", tags=["Shifts"])
SessionDep = Annotated[Session, Depends(get_session)]

@router.post("/", response_model = ShiftRead, status_code = status.HTTP_201_CREATED)
def create_shift(
    shift_data: ShiftCreate,
    session: SessionDep,
    current_user: Annotated[User, Depends(get_current_user)]
) -> Shift:
    """
    Inicia un nuevo Turno, lo asocia a un grupo y genera la hoja de asistenacia inicial.
    """
    #  1. Verificaer que el grupo seleccionado exista
    db_group = session.get(ShiftGroup, shift_data.scheduled_group_id)
    if not db_group:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Sheduled Group not found")
    
    # 2. Crear el nuevo objeto de turno con los datos proporcionados
    new_shift = Shift(
        status="ABIERTO",
        outgoing_superintendent_id=current_user.id,
        scheduled_group_id=db_group.id
    )
    session.add(new_shift)
    session.commit()
    session.refresh(new_shift)
    
    # 3. Generar la hoja de asistencia inicial
    for member in db_group.members:
        attendance_record = ShiftAttendance(
            shift_id=new_shift.id,
            scheduled_employee_id=member.id,
            actual_employee_id=member.id,
            attendance_status="Presente",
            position_id=member.base_position_id
        )
        session.add(attendance_record)
        
    session.commit()
    session.refresh(new_shift)    
    
    return new_shift

@router.get("/{shift_id}", response_model=ShiftReadWithDetails)
def read_shift(shift_id: int, session: SessionDep) -> Shift:
    """
    Obtiene los detalles de un turno, incluyendo todos sus registros de estado.
    """
    # CORRECCIÓN: Usamos un 'select' con 'options' para forzar la carga de las relaciones
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

@router.put("/{shift_id}/close", response_model = ShiftRead)
def close_shift(
    shift_id: int,
    session: SessionDep,
    current_user: Annotated[User, Depends(get_current_user)]
) -> Shift:
    """
    Cierra un turno existente y lo asocia al usuario autenticado.
    """
    shift_to_close = session.get(Shift, shift_id)
    if not shift_to_close:
        raise HTTPException(status_code= status.HTTP_404_NOT_FOUND, detail="Shift not found")
    if shift_to_close.status == "CERRADO":
        raise HTTPException(status_code= status.HTTP_400_BAD_REQUEST, detail = "Shift is already closed")
    
    # --- LÍNEAS MODIFICADAS ---
    shift_to_close.end_time = datetime.utcnow()
    shift_to_close.status = "CERRADO"
    # Asociamos el id del usuario que cierra el turno
    shift_to_close.incoming_superintendent_id = current_user.id
    
    session.add(shift_to_close)
    session.commit()
    session.refresh(shift_to_close)
    
    return shift_to_close

@router.post("/{shift_id}/equipment-status/", response_model=StatusLogRead, status_code=status.HTTP_201_CREATED)
def log_equipment_status_for_shift(
    shift_id: int,
    status_log: StatusLogCreate,
    session: SessionDep
) -> EquipmentStatusLog:
    """
    Registra un nuevo estado de equipo para un turno específico.
    """
    # 1. Verificar que el turno exista y esté abierto
    db_shift = session.get(Shift, shift_id)
    if not db_shift:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Shift not found")
    if db_shift.status != "ABIERTO":
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Cannot add logs to a closed shift")
    
    # 2. Verificar que el equipo exista
    db_equipment = session.get(Equipment, status_log.equipment_id)
    if not db_equipment:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Equipment not found")
    
    # 3. Crear el nuevo registro de estado, asociándolo con el turno
    new_log_entry = EquipmentStatusLog.model_validate(status_log, update={"shift_id": shift_id})
    # 4. Sincronizar el estado del equipo maestro con el nuevo estado del log
    db_equipment.status = new_log_entry.status
    
    session.add(new_log_entry)
    session.add(db_equipment)
    session.commit()
    session.refresh(new_log_entry)
    
    return new_log_entry
    
@router.post("/{shift_id}/events/", response_model=EventLogRead, status_code=status.HTTP_201_CREATED)
def event_log_for_shift(
    shift_id: int,
    event_data: EventLogCreate,
    session: SessionDep
) -> EventLog:
    """
    Registra un nuevo evento para un turno específico.
    """
    # 1. Verificar que el turno exista y esté abierto
    db_shift = session.get(Shift, shift_id)
    if not db_shift:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Shift not found")
    if db_shift.status != "ABIERTO":
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Cannot add logs to a closed shift")
       
    # 2. Crear el nuevo registro de estado, asociándolo con el turno
    new_event_log_entry = EventLog.model_validate(event_data, update={"shift_id": shift_id})
    
    session.add(new_event_log_entry)
    session.commit()
    session.refresh(new_event_log_entry)
    
    return new_event_log_entry

@router.get(
    "/{shift_id}/attendance",
    response_model=List[ShiftAttendanceReadWithDetails],
    summary="Obtener la Hoja de Asistencia de un Turno"
)    
def get_shift_attendance(
    *,
    db: Session = Depends(get_session),
    shift_id: int
):
    """
    Obtiene la lista completa y detallada del personal para un turno específico,
    reflejando el estado actual de la asistencia (presentes, ausentes, coberturas)
    """
    db_shift = db.get(Shift, shift_id)
    if not db_shift:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Turno no encontrado")
    
    # Gracias a la relación, SQLModel carga los registros automáticamente
    return db_shift.attendance_records

@router.post("/{shift_id}/tank-readings/", response_model=TankReadingRead, status_code=status.HTTP_201_CREATED)
def create_tank_reading_for_shift(
    shift_id: int,
    tank_reading_data: TankReadingCreate,
    session: SessionDep,
    current_user: Annotated[User, Depends(get_current_user)]
) -> TankReading:
    """
    Registra una nueva medición de nivel de tanque para un turno específico.
    """
    # 1. Verificar que el turno exista y esté abierto
    db_shift = session.get(Shift, shift_id)
    if not db_shift:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Shift not found")
    if db_shift.status != "ABIERTO":
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Cannot add tank_readings to a closed shift")
    
    # Verificar que el tanque exista
    db_tank = session.get(Tank, tank_reading_data.tank_id)
    if not db_tank:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Tank not found")
    
    # Incluir user_id en la data a actualizar
    update_data = {
        "shift_id": shift_id,
        "user_id": current_user.id
    }
       
    # 2. Registra una nueva medicion de nivel del tanque, asociándolo con el turno
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
    current_user: Annotated[User, Depends(get_current_user)]
):
    """
    Registra la finalizacion de una tarea programada para un turno especifico.
    """
    db_shift = session.get(Shift, shift_id)
    if not db_shift:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Shift not found")
    if db_shift.status != "ABIERTO":
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Cannot add tasks to a closed shift")
    
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
    Obtiene todos los registros de tareas completadas durante un turno específico.
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
    current_user: Annotated[User, Depends(get_current_user)]
):
    """
    Registra una nueva novedad, instrucción o incidente para un turno específico.
    """
    db_shift = session.get(Shift, shift_id)
    if not db_shift:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Shift not found")
    if db_shift.status != "ABIERTO":
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Cannot add novelties to a closed shift")

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
    Obtiene todos los registros de novedades para un turno específico.
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
    current_user: Annotated[User, Depends(get_current_user)]
):
    """
    Registra una nueva rampa de ajuste y calcula automáticamente su cumplimiento.
    """
    db_shift = session.get(Shift, shift_id)
    if not db_shift:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Shift not found")
    if db_shift.status != "ABIERTO":
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Cannot add ramps to a closed shift")

    # --- LÓGICA DE CÁLCULO ---
    
    # 1. Calcular deltas
    time_delta = ramp_data.end_time - ramp_data.start_time
    load_delta = ramp_data.final_load_mw - ramp_data.initial_load_mw

    # 2. Convertir tiempo a minutos (evitar división por cero)
    time_delta_minutes = time_delta.total_seconds() / 60
    if time_delta_minutes <= 0:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="End time must be after start time.")

    # 3. Calcular la rampa real
    actual_ramp_rate = load_delta / time_delta_minutes

    # 4. Determinar cumplimiento
    is_compliant_calculated = actual_ramp_rate >= ramp_data.target_ramp_rate_mw_per_minute
    
    # --- FIN DE LA LÓGICA DE CÁLCULO ---

    # Combinar datos recibidos con datos del servidor y calculados
    ramp_data_dict = ramp_data.model_dump()
    
    new_ramp_log = GenerationRamp(
        **ramp_data_dict,
        is_compliant=is_compliant_calculated, # <-- Usamos el valor calculado
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
    Obtiene todos los registros de rampas de ajuste para un turno específico.
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
    current_user: Annotated[User, Depends(get_current_user)],
):
    """Registra una nueva lectura de parámetro operativo para un turno específico."""
    db_shift = session.get(Shift, shift_id)
    if not db_shift:
        raise HTTPException(status_code=404, detail="Turno no encontrado")
    if db_shift.status != "ABIERTO":
        raise HTTPException(status_code=400, detail="No se pueden añadir lecturas a un turno cerrado")

    # Verificar que el parámetro y el equipo existen
    if not session.get(OperationalParameter, reading_data.parameter_id):
        raise HTTPException(status_code=404, detail="ID de Parámetro no encontrado")
    if not session.get(Equipment, reading_data.equipment_id):
        raise HTTPException(status_code=404, detail="ID de Equipo no encontrado")

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
    """Obtiene todas las lecturas de parámetros operativos registradas en un turno."""
    statement = select(OperationalReading).where(OperationalReading.shift_id == shift_id)
    readings = session.exec(statement).all()
    return readings