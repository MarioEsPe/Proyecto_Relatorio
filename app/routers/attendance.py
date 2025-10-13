# app/routers/attendance.py
from fastapi import APIRouter, Depends, HTTPException, status
from sqlmodel import Session, select

from app.database import get_session
from app.models import ShiftAttendance
from app.schemas import ShiftAttendanceUpdate, ShiftAttendanceReadWithDetails

router = APIRouter(prefix="/attendance", tags=["Attendance"])

@router.patch(
    "/{attendance_id}",
    response_model=ShiftAttendanceReadWithDetails
)
def update_attendance_record(
    *,
    db: Session = Depends(get_session),
    attendance_id: int,
    attendance_in: ShiftAttendanceUpdate
):
    """
    Actualiza un registro de asistencia. Permite cambiar el estado
    (ej. a "Ausente") y/o asignar un empleado de cobertura.
    """
    db_attendance = db.get(ShiftAttendance, attendance_id)
    if not db_attendance:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Registro de asistencia no encontrado")
    
    # Obtiene los datos del Pydantic model que fueron explicitamente enviados
    update_data = attendance_in.model_dump(exclude_unset=True)
    
    # Actualiza el objeto de la base de datos
    for key, value in update_data.items():
        setattr(db_attendance, key, value)
        
    db.add(db_attendance)
    db.commit()
    db.refresh(db_attendance)
    
    return db_attendance    