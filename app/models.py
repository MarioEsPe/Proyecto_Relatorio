# app/models.py
from sqlmodel import Field, SQLModel, Relationship, Session
from datetime import datetime,date
from typing import List, Optional

from app.enums import (
    UserRole, EmployeeType, EquipmentStatus, EventType, TicketType, 
    TicketStatus, ResourceType, LicenseStatus, TaskCategory, NoveltyType,
    ShiftDesignator
)    
from app.schemas import EquipmentBase, TankBase, TankReadingBase,ScheduledTaskBase

""" 
--- CATALOGS AND CORE ENTITIES ---
1.1 Position 
1.2 ShiftGroup
1.3 Employee
1.4 User
1.5 Equipment
1.6 Tank
1.7 ScheduledTask
1.8 OperationalParameter
"""
# 1.1 Position
class Position(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    name: str = Field(unique=True)
    description: Optional[str] = None
    
    employees: List["Employee"] = Relationship(back_populates="base_position")

# 1.2 ShiftGroup
class GroupMembership(SQLModel, table=True):
    group_id: Optional[int] = Field(default=None, foreign_key="shiftgroup.id", primary_key=True)
    employee_id: Optional[int] = Field(default=None, foreign_key="employee.id", primary_key=True)

class ShiftGroup(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    name: str = Field(unique=True)
     
    members: List["Employee"] = Relationship(back_populates="groups", link_model=GroupMembership) 
    shifts: List["Shift"] = Relationship(back_populates="scheduled_group")

# 1.3 Employee
class Employee(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    full_name: str
    rpe: str = Field(unique=True)
    employee_type: EmployeeType   
    
    base_position_id: Optional[int] = Field(default=None, foreign_key="position.id")
    base_position: Optional[Position] = Relationship(back_populates="employees")         
    groups: List[ShiftGroup] = Relationship(back_populates="members", link_model=GroupMembership)

# 1.4 User
class User(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    username: str = Field(index=True, unique=True)
    rpe: str = Field(unique=True)
    role: UserRole 
    hashed_password: str

# 1.5 Equipment    
class Equipment(EquipmentBase, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    
    status_logs: List["EquipmentStatusLog"] = Relationship(back_populates="equipment")
    maintenance_tickets: List["MaintenanceTicket"] = Relationship(back_populates="equipment")        

# 1.6 Tank
class Tank(TankBase, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    readings: List["TankReading"] = Relationship(back_populates="tank")

# 1.7 ScheduledTask
class ScheduledTask(ScheduledTaskBase, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    task_logs: list["TaskLog"] = Relationship(back_populates="scheduled_task")

# 1.8 OperationalParameter
class OperationalParameter(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    name: str = Field(index=True, max_length=255, unique=True)
    unit: str = Field(max_length=50)
    description: Optional[str] = Field(default=None, max_length=1000)
    is_active: bool = Field(default=True)

    readings: list["OperationalReading"] = Relationship(back_populates="parameter")
    
""" 
--- SHIFT MODULE ---
2.1 Shift 
2.2 ShiftAttendance
2.3 EquipmentStatusLog
2.4 EventLog
2.5 TaskLog
2.6 NoveltyLog
2.7 GenerationRamp
2.8 TankReading
2.9 OperationalReading
"""

# 2.1 Shift
class Shift(SQLModel, table=True):
    id: Optional[int] = Field(default = None, primary_key=True)
    start_time: datetime = Field(default_factory=datetime.utcnow, nullable=False)
    end_time: datetime | None = Field(default = None)
    status: str = Field(index=True)
    
    shift_date: Optional[date] = Field(default=None, index=True)
    shift_designator: Optional[int] = Field(default=None, index=True)
    
    
    outgoing_superintendent_id: Optional[int] = Field(default = None, foreign_key="user.id")
    incoming_superintendent_id: Optional[int] = Field(default = None, foreign_key="user.id")
    scheduled_group_id: Optional[int] = Field(default=None, foreign_key="shiftgroup.id")
    scheduled_group: Optional[ShiftGroup] = Relationship(back_populates="shifts")
    
    attendance_records: List["ShiftAttendance"] = Relationship(back_populates="shift")
    status_logs: list["EquipmentStatusLog"] = Relationship(back_populates="shift")
    event_logs: list["EventLog"] = Relationship(back_populates="shift")
    task_logs: list["TaskLog"] = Relationship(back_populates="shift")
    novelty_logs: list["NoveltyLog"] = Relationship(back_populates="shift")
    generation_ramps: list["GenerationRamp"] = Relationship(back_populates="shift")
    operational_readings: list["OperationalReading"] = Relationship(back_populates="shift")

# 2.2 ShiftAttendance
class ShiftAttendance(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    shift_id: int = Field(foreign_key="shift.id")
    scheduled_employee_id: int = Field(foreign_key="employee.id")
    actual_employee_id: int = Field(foreign_key="employee.id")
    position_id: int = Field(foreign_key="position.id")
    attendance_status: str = Field(default="Presente")
    
    shift: Shift = Relationship(back_populates="attendance_records")
    position: "Position" = Relationship()
    scheduled_employee: "Employee" = Relationship(
        sa_relationship_kwargs={
            "foreign_keys": "[ShiftAttendance.scheduled_employee_id]"
        }
    )
    actual_employee: "Employee" = Relationship(
        sa_relationship_kwargs={
            "foreign_keys": "[ShiftAttendance.actual_employee_id]"
        }
    )

# 2.3 EquipmentStatusLog    
class EquipmentStatusLog(SQLModel, table=True):
    id: Optional[int] = Field(default = None, primary_key=True)
    timestamp: datetime 
    status: EquipmentStatus
    reason: Optional[str] = Field(default=None)  
    
    shift_id: int = Field(foreign_key="shift.id")
    equipment_id: int = Field(foreign_key="equipment.id")  
    shift: "Shift" = Relationship(back_populates="status_logs")
    equipment: "Equipment" = Relationship(back_populates="status_logs")

# 2.4 EventLog    
class EventLog(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    timestamp: datetime
    description: str
    event_type: EventType
    
    shift_id: int = Field(foreign_key="shift.id") 
    shift: "Shift" = Relationship(back_populates="event_logs")  

# 2.5 TaskLog
class TaskLog(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    completion_time: datetime
    notes: Optional[str] = None
    shift_id: int = Field(foreign_key="shift.id")        
    user_id: int = Field(foreign_key="user.id")
    scheduled_task_id: int = Field(foreign_key="scheduledtask.id")
    shift: "Shift" = Relationship(back_populates="task_logs")
    scheduled_task: "ScheduledTask" = Relationship(back_populates="task_logs")  
    user: "User" = Relationship()

# 2.6 NoveltyLog
class NoveltyLog(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    timestamp: datetime = Field(default_factory=datetime.utcnow)
    novelty_type: NoveltyType
    description: str = Field(max_length=2000)

    shift_id: int = Field(foreign_key="shift.id")
    user_id: int = Field(foreign_key="user.id")
    
    shift: "Shift" = Relationship(back_populates="novelty_logs")
    user: "User" = Relationship()

# 2.7 GenerationRamp
class GenerationRamp(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    cenace_operator_name: str = Field(max_length=255)
    start_time: datetime
    end_time: datetime
    is_compliant: bool 
    non_compliance_reason: Optional[str] = Field(default=None, max_length=2000)

    initial_load_mw: float
    final_load_mw: float
    target_ramp_rate_mw_per_minute: float
    
    shift_id: int = Field(foreign_key="shift.id")
    user_id: int = Field(foreign_key="user.id")

    shift: "Shift" = Relationship(back_populates="generation_ramps")
    user: "User" = Relationship()

# 2.8 TankReading
class TankReading(TankReadingBase, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    shift_id: int = Field(foreign_key="shift.id")
    user_id: int = Field(foreign_key="user.id")
    tank: Tank = Relationship(back_populates="readings")

# 2.9 OperationalReading 
class OperationalReading(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    value: float
    timestamp: datetime = Field(default_factory=datetime.utcnow)

    shift_id: int = Field(foreign_key="shift.id")
    parameter_id: int = Field(foreign_key="operationalparameter.id")
    equipment_id: int = Field(foreign_key="equipment.id")
    user_id: int = Field(foreign_key="user.id")

    shift: "Shift" = Relationship(back_populates="operational_readings") 
    parameter: "OperationalParameter" = Relationship(back_populates="readings")
    equipment: "Equipment" = Relationship()
    user: "User" = Relationship()            
    
""" 
--- AUXILIARY MODULES ---
3.1 MaintenanceTicket 
3.2 License
"""    
# 3.1 MaintenanceTicket    
class MaintenanceTicket(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    description: str = Field(max_length=1000)
    impact: Optional[str]=Field(default=None, max_length=1000)
    ticket_type: TicketType
    ticket_status: TicketStatus = Field(default=TicketStatus.OPEN)
    created_at: datetime = Field(default_factory=datetime.utcnow)
    completed_at: Optional[datetime] = None
    
    equipment_id: int = Field(foreign_key="equipment.id")
    created_by_user_id: int = Field(foreign_key="user.id")

    equipment: "Equipment" = Relationship(back_populates="maintenance_tickets")

# 3.2 License
class License(SQLModel, table=True):
    id: int = Field(default=None, primary_key=True)
    license_number: str = Field(unique=True, index=True)
    affected_unit: str
    description: str = Field(max_length=1000)
    status: LicenseStatus = Field(default=LicenseStatus.ACTIVE)
    start_time: datetime
    end_time: Optional[datetime] = None
    
    created_by_user_id: int = Field(foreign_key="user.id")
    closed_by_user_id: Optional[int] = Field(foreign_key="user.id", default=None)
    