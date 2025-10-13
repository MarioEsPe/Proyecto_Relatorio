# app/enums.py
from enum import Enum

class UserRole(str, Enum):
    OPS_MANAGER = "OPS_MANAGER"
    SHIFT_SUPERINTENDENT = "SHIFT_SUPERINTENDENT"
    
class EmployeeType(str, Enum):
    PERMANENT = "PERMANENT"
    TEMPORARY = "TEMPORARY"    
    
class EquipmentStatus(str, Enum):
    IN_SERVICE = "IN_SERVICE"
    AVAILABLE = "AVAILABLE"
    OUT_OF_SERVICE = "OUT_OF_SERVICE"   
    
class EventType(str, Enum):
    PROTECTION_TRIP = "PROTECCION_TRIP"
    FORCED_OUTAGE = "FORCED_OUTAGE"
    LOAD_REDUCTION = "LOAD_REDUCTION"
    UNIT_SYNC = "UNIT_SYNCHRONIZATION"
    UNIT_SHUTDOWN = "UNIT_SHUTDOWN"
    ROUTINE_TEST = "ROUTINE_TEST"
    OTHER = "OTHER"
    
class TicketType(str, Enum):
    FAULT_REPORT = "FAULT_REPORT"
    PLANNED_MAINTENANCE = "PLANNED_MAINTENANCE"    
    
class TicketStatus(str, Enum):
    OPEN = "OPEN"
    IN_PROGRESS = "IN PROGRESS"
    COMPLETED = "COMPLETED"    
    
class ResourceType(str, Enum):
    FUEL = "FUEL"
    POTABLE_WATER = "POTABLE_WATER"
    DESMINERALIZED_WATER = "DESMINERALIZED_WATER"
    
class LicenseStatus(str, Enum):
    ACTIVE = "ACTIVE"
    CLOSED = "CLOSED"        
    
class TaskCategory(str, Enum):
    ROUTINE_ACTIVITY = "ROUTINE_ACTIVITY"
    OPERATIVE_TEST = "OPERATIVE_TEST"    
    
class NoveltyType(str, Enum):
    GENERAL = "GENERAL"
    SPECIAL_INSTRUCTION = "SPECIAL_INSTRUCTION"
    SAFETY_INCIDENT = "SAFETY_INCIDENT"
    ENVIRONMENTAL_INCIDENT = "ENVIRONMENTAL_INCIDENT"    