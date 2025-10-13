# app/schemas.py
from sqlmodel import SQLModel, Field
from datetime import datetime
from typing import List, Optional

from app.enums import UserRole, EmployeeType, EquipmentStatus, EventType, TicketType, TicketStatus, LicenseStatus, TaskCategory, NoveltyType, ResourceType

""" 
--- CATÁLOGOS Y ENTIDADES FUNDAMENTALES ---
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
class PositionBase(SQLModel):
    name: str
    description: str | None = None
    
class PositionCreate(PositionBase):
    pass

class PositionRead(PositionBase):
    id: int

# 1.2 ShiftGroup
class ShiftGroupBase(SQLModel):
    name: str
    
class ShiftGroupCreate(ShiftGroupBase):
    pass

class ShiftGroupRead(ShiftGroupBase):
    id: int
        
# 1.3 Employee
class EmployeeBase(SQLModel):
    full_name: str
    rpe: str
    employee_type: EmployeeType
    base_position_id: int | None = None
    
class EmployeeCreate(EmployeeBase):
    pass        

class EmployeeRead(EmployeeBase):
    id: int

class EmployeeReadWithPosition(EmployeeRead):
    base_position: PositionRead | None = None

class EmployeeReadWithDetails(EmployeeReadWithPosition):
    groups: List[ShiftGroupRead] = []   

# 1.4 User 
class UserCreate(SQLModel):
    username: str
    rpe: str
    role: UserRole = UserRole.SHIFT_SUPERINTENDENT
    password: str
    
class UserRead(SQLModel):
    id: int
    username: str
    rpe: str
    role: UserRole

# 1.5 Equipment
class EquipmentBase(SQLModel):
    name: str = Field(index=True, max_length=100)
    location: Optional[str] = Field(default=None, max_length=255)
    status: EquipmentStatus = Field(default=EquipmentStatus.AVAILABLE)
    unavailability_reason: Optional[str] = Field(default=None, max_length=500)

class EquipmentRead(EquipmentBase):
    id: int

class EquipmentCreate(EquipmentBase):
    pass 

class EquipmentUpdate(SQLModel):
    name: Optional[str] = None
    location: Optional[str]= None
    status: Optional[EquipmentStatus] = None
    unavailability_reason: Optional[str] = None 

# 1.6 Tank
class TankBase(SQLModel):
    name: str
    resource_type: ResourceType
    capacity_liters: float

class TankCreate(TankBase):
    pass 

class TankRead(TankBase):
    id: int

class TankUpdate(SQLModel):
    name: Optional[str] = None
    capacity_liters: Optional[float] = None

# 1.7 ScheduledTask
class ScheduledTaskBase(SQLModel):
    name: str
    description: Optional[str] = None
    category: TaskCategory
    is_active: bool = Field(default=True)

class ScheduledTaskCreate(ScheduledTaskBase):
    pass

class ScheduledTaskRead(ScheduledTaskBase):
    id: int
    
class ScheduledTaskUpdate(SQLModel):  
    name: Optional[str] = None
    description: Optional[str] = None
    category: Optional[TaskCategory] = None
    is_active: Optional[bool] = None  

# 1.8 OperationalParameter
class OperationalParameterBase(SQLModel):
    name: str
    unit: str
    description: Optional[str] = None
    is_active: bool = True

class OperationalParameterCreate(OperationalParameterBase):
    pass

class OperationalParameterRead(OperationalParameterBase):
    id: int

class OperationalParameterUpdate(SQLModel):
    name: Optional[str] = None
    unit: Optional[str] = None
    description: Optional[str] = None
    is_active: Optional[bool] = None

""" 
--- MÓDULO DE TURNO ---
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
class ShiftCreate(SQLModel):
    scheduled_group_id: int

class ShiftRead(SQLModel):
    id: int
    start_time: datetime
    end_time: datetime | None
    status: str
    outgoing_superintendent_id: int | None = None
    incoming_superintendent_id: int | None = None
    scheduled_group_id: int | None = None

class ShiftReadWithGroup(ShiftRead):
    scheduled_group: ShiftGroupRead | None = None

class ShiftClose(SQLModel):
    pass 
      
# 2.2 ShiftAttendance
class ShiftAttendanceRead(SQLModel):
    id: int
    attendance_status: str
    shift_id: int
    
class ShiftAttendanceReadWithDetails(ShiftAttendanceRead):
    position: PositionRead
    scheduled_employee: EmployeeRead
    actual_employee: EmployeeRead

class ShiftAttendanceUpdate(SQLModel):
    attendance_status: str | None = None
    actual_employee_id : int | None = None     

# 2.3 EquipmentStatusLog
class StatusLogCreate(SQLModel):
    equipment_id: int
    status: EquipmentStatus 
    reason: str | None = None
    timestamp: datetime # Campo obligatorio añadido
    
class StatusLogRead(SQLModel):
    id: int
    timestamp: datetime
    status: str
    reason: str | None = None
    shift_id: int
    equipment_id: int   

# 2.4 EventLog    
class EventLogCreate(SQLModel):
    event_type: EventType
    timestamp: datetime
    description: str
        
class EventLogRead(SQLModel):
    id: int
    timestamp: datetime
    event_type: str
    description: str
    shift_id: int               

# 2.5 TaskLog
class TaskLogCreate(SQLModel):
    scheduled_task_id: int 
    completion_time: datetime
    notes: Optional[str] = None
    
class TaskLogRead(SQLModel): 
    id: int 
    completion_time: datetime
    notes: Optional[str] = None
    shift_id: int         
    user_id: int
    scheduled_task_id: int 
    
class TaskLogReadWithDetails(TaskLogRead):
    user: UserRead
    scheduled_task: ScheduledTaskRead

# 2.6 NoveltyLog
class NoveltyLogCreate(SQLModel):
    novelty_type: NoveltyType
    timestamp: Optional[datetime] = Field(default=None)
    description: str
    user_id: int

class NoveltyLogRead(SQLModel):
    id: int
    timestamp: datetime
    novelty_type: NoveltyType
    description: str
    user_id: int
    
class NoveltyLogReadWithUser(NoveltyLogRead):
    user: UserRead

# 2.7 GenerationRamp
class GenerationRampCreate(SQLModel):
    cenace_operator_name: str
    start_time: datetime
    end_time: datetime
    non_compliance_reason: Optional[str] = None

    initial_load_mw: float
    final_load_mw: float
    target_ramp_rate_mw_per_minute: float

class GenerationRampRead(SQLModel):
    id: int
    cenace_operator_name: str
    start_time: datetime
    end_time: datetime
    is_compliant: bool
    non_compliance_reason: Optional[str] = None
    user_id: int

    initial_load_mw: float
    final_load_mw: float
    target_ramp_rate_mw_per_minute: float    

class GenerationRampReadWithUser(GenerationRampRead):
    user: UserRead

# 2.8 TankReading
class TankReadingBase(SQLModel):
    level_liters: float
    reading_timestamp: datetime
    tank_id: int = Field(foreign_key="tank.id")

class TankReadingCreate(TankReadingBase):
    pass 

class TankReadingRead(TankReadingBase):
    id: int
    shift_id: int
    user_id: int

# 2.9 OperationalReading
class OperationalReadingBase(SQLModel):
    value: float
    parameter_id: int
    equipment_id: int

class OperationalReadingCreate(OperationalReadingBase):
    timestamp: Optional[datetime] = None

class OperationalReadingRead(OperationalReadingBase):
    id: int
    timestamp: datetime
    shift_id: int
    user_id: int

class OperationalReadingReadWithDetails(OperationalReadingRead):
    parameter: OperationalParameterRead
    equipment: EquipmentRead
    user: UserRead
        
""" 
--- MÓDULOS AUXILIARES ---
3.1 MaintenanceTicket 
3.2 License
"""    
# 3.1 MaintenanceTicket
class MaintenanceTicketBase(SQLModel):
    description: str
    impact: Optional[str] = None
    ticket_type: TicketType
    equipment_id: int

class MaintenanceTicketCreate(MaintenanceTicketBase):
    pass
    
class MaintenanceTicketRead(MaintenanceTicketBase):
    id: int
    ticket_status: TicketStatus 
    created_at: datetime
    completed_at: Optional[datetime] = None
    created_by_user_id: int        
    
class MaintenanceTicketReadWithEquipment(MaintenanceTicketRead):
    equipment: EquipmentRead
    
class MaintenanceTicketUpdate(SQLModel):
    ticket_status: Optional[TicketStatus] = None
    description: Optional[str] = None
    impact: Optional[str] = None
        
# 3.2 License 
class LicenseCreate(SQLModel):
    license_number: str
    affected_unit: str
    description: str
    start_time: datetime  
        
class LicenseRead(SQLModel):
    id: int
    license_number: str
    affected_unit: str
    description: str
    status: LicenseStatus
    start_time: datetime
    end_time: Optional[datetime] = None
    created_by_user_id: int
    closed_by_user_id: Optional[int] = None    

class LicenseClose(SQLModel):
    end_time: datetime
"""
SCHEMAS COMPUESTOS
"""    
class ShiftReadWithDetails(ShiftReadWithGroup):
    status_logs: List[StatusLogRead] = []
    event_logs: List[EventLogRead] = []
    task_logs: list[TaskLogReadWithDetails] = []
    novelty_logs: list[NoveltyLogReadWithUser] = []   
    generation_ramps: list[GenerationRampReadWithUser] = [] 
    operational_readings: list[OperationalReadingReadWithDetails] = []