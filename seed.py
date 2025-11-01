# seed.py
from sqlmodel import Session, SQLModel
from sqlalchemy import delete 
from app.database import engine
from app.models import (
    User, Position, Employee, ShiftGroup, Equipment,
    Shift, EventLog, NoveltyLog, GroupMembership,
    ShiftAttendance, EquipmentStatusLog, TaskLog,
    GenerationRamp, TankReading, OperationalReading, 
    MaintenanceTicket, License, Tank, ScheduledTask, 
    OperationalParameter
)
from app.enums import (
    UserRole, EmployeeType, EquipmentStatus, EventType, 
    NoveltyType, ShiftDesignator
)
from app.security import get_password_hash
from datetime import datetime, timedelta, timezone, date 

# --- SAMPLE DATA ---
POSITIONS_DATA = [
    {"name": "Shift Superintendent"}, {"name": "Boiler Operator"},
    {"name": "Turbine Operator"}, {"name": "Operator Assistant"},
]
EMPLOYEES_DATA = [
    {"full_name": "John Doe", "rpe": "EMP001", "employee_type": EmployeeType.PERMANENT},
    {"full_name": "Jane Smith", "rpe": "EMP002", "employee_type": EmployeeType.PERMANENT},
    {"full_name": "Mike Williams", "rpe": "EMP003", "employee_type": EmployeeType.TEMPORARY},
]
EQUIPMENT_DATA = [
    {"name": "Steam Generator U1", "status": EquipmentStatus.IN_SERVICE},
    {"name": "Steam Turbine U1", "status": EquipmentStatus.IN_SERVICE},
    {"name": "Feedwater Pump 1A", "status": EquipmentStatus.AVAILABLE},
    {"name": "Feedwater Pump 1B", "status": EquipmentStatus.OUT_OF_SERVICE, "unavailability_reason": "Scheduled maintenance"},
]

def seed_database():
    print("Starting the seeding process...")
    
    SQLModel.metadata.create_all(engine)
    
    with Session(engine) as session:
        print("Clearing the database...")
        session.execute(delete(GroupMembership))
        session.execute(delete(ShiftAttendance))
        session.execute(delete(EquipmentStatusLog))
        session.execute(delete(EventLog))
        session.execute(delete(TaskLog))
        session.execute(delete(NoveltyLog))
        session.execute(delete(GenerationRamp))
        session.execute(delete(TankReading))
        session.execute(delete(OperationalReading)) 
        session.execute(delete(MaintenanceTicket))
        session.execute(delete(License))
        session.commit()
        
        session.execute(delete(Shift))
        session.execute(delete(Employee))
        session.commit()
        
        session.execute(delete(User))
        session.execute(delete(ShiftGroup))
        session.execute(delete(Position))
        session.execute(delete(Equipment))
        session.execute(delete(EventLog))
        session.execute(delete(Tank))
        session.execute(delete(ScheduledTask))
        session.execute(delete(OperationalParameter))
        session.commit()

        print("Creating new data...")
        hashed_password_demo = get_password_hash("demopass123")
        hashed_password_admin = get_password_hash("adminpass123")
        user_demo = User(username="demo_user", rpe="DEMO001", role=UserRole.SHIFT_SUPERINTENDENT, hashed_password=hashed_password_demo)
        user_admin = User(username="admin_ops", rpe="ADMIN001", role=UserRole.OPS_MANAGER, hashed_password=hashed_password_admin)
        session.add_all([user_demo, user_admin])
        session.commit()
        
        session.refresh(user_demo)
        session.refresh(user_admin)
        
        print(f"Created user '{user_demo.username}' with ID: {user_demo.id}")
        print(f"Created user '{user_admin.username}' with ID: {user_admin.id}")

        positions = [Position(**data) for data in POSITIONS_DATA]
        equipment = [Equipment(**data) for data in EQUIPMENT_DATA]
        employees = [Employee(**data) for data in EMPLOYEES_DATA]
        session.add_all(positions + equipment + employees)
        session.commit()
        
        start_of_shift = datetime.now(timezone.utc) - timedelta(hours=4)
        
        shift = Shift(
            start_time=start_of_shift, 
            status="OPEN",
            outgoing_superintendent_id=user_admin.id,
            incoming_superintendent_id=user_demo.id,
            shift_date=start_of_shift.date(), 
            shift_designator=ShiftDesignator.SHIFT_1.value
        )
        session.add(shift)
        session.commit()

        event = EventLog(
            timestamp=datetime.now(timezone.utc) - timedelta(hours=2), 
            description="Unit 1 went out of service due to a high furnace pressure protection trip.",
            event_type=EventType.PROTECTION_TRIP,
            shift_id=shift.id,
        )
        novelty = NoveltyLog(
            timestamp=datetime.now(timezone.utc) - timedelta(hours=1), 
            description="Special instruction: Prioritize maintenance for Feedwater Pump 1B.",
            novelty_type=NoveltyType.SPECIAL_INSTRUCTION,
            shift_id=shift.id,
            user_id=user_admin.id,
        )
        session.add_all([event, novelty])
        session.commit()

        print("Seeding completed successfully!")

if __name__ == "__main__":
    seed_database()