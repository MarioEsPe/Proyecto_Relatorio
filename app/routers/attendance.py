# app/routers/attendance.py
from fastapi import APIRouter, Depends, HTTPException, status
from sqlmodel import Session, select

from app.database import get_session
from app.models import ShiftAttendance
from app.schemas import ShiftAttendanceUpdate, ShiftAttendanceReadWithDetails
from app.dependencies import require_role, UserRole

router = APIRouter(prefix="/attendance", tags=["Attendance"])

@router.patch(
    "/{attendance_id}",
    response_model=ShiftAttendanceReadWithDetails,
    dependencies=[Depends(require_role([UserRole.OPS_MANAGER, UserRole.SHIFT_SUPERINTENDENT]))]
)
def update_attendance_record(
    *,
    db: Session = Depends(get_session),
    attendance_id: int,
    attendance_in: ShiftAttendanceUpdate
):
    """
    Update an attendance record. Allows changing the status (e.g., to "Absent") and/or assigning a covering employee.
    """
    db_attendance = db.get(ShiftAttendance, attendance_id)
    if not db_attendance:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Attendance record not found")
    
    update_data = attendance_in.model_dump(exclude_unset=True)
    
    for key, value in update_data.items():
        setattr(db_attendance, key, value)
        
    db.add(db_attendance)
    db.commit()
    db.refresh(db_attendance)
    
    return db_attendance    