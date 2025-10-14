# seed.py
from sqlmodel import Session, SQLModel
from sqlalchemy import delete 
from app.database import engine
from app.models import (
    User, Position, Employee, ShiftGroup, Equipment,
    Shift, EventLog, NoveltyLog
)
from app.enums import (
    UserRole, EmployeeType, EquipmentStatus, EventType, NoveltyType
)
from app.security import get_password_hash
from datetime import datetime, timedelta, timezone 

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
        session.execute(delete(NoveltyLog))
        session.execute(delete(EventLog))
        session.execute(delete(Shift))
        session.execute(delete(Equipment))
        session.execute(delete(ShiftGroup))
        session.execute(delete(Employee))
        session.execute(delete(Position))
        session.execute(delete(User))
        session.commit()

        print("Creating new data...")
        hashed_password_demo = get_password_hash("demopass123")
        hashed_password_admin = get_password_hash("adminpass123")
        user_demo = User(username="demo_user", rpe="DEMO001", role=UserRole.SHIFT_SUPERINTENDENT, hashed_password=hashed_password_demo)
        user_admin = User(username="admin_ops", rpe="ADMIN001", role=UserRole.OPS_MANAGER, hashed_password=hashed_password_admin)
        session.add_all([user_demo, user_admin])
        session.commit()

        positions = [Position(**data) for data in POSITIONS_DATA]
        equipment = [Equipment(**data) for data in EQUIPMENT_DATA]
        employees = [Employee(**data) for data in EMPLOYEES_DATA]
        session.add_all(positions + equipment + employees)
        session.commit()
        
        shift = Shift(
            start_time=datetime.now(timezone.utc) - timedelta(hours=4), 
            status="OPEN",
            outgoing_superintendent_id=user_admin.id,
            incoming_superintendent_id=user_demo.id,
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