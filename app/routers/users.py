# app/routers/users.py
from typing import Annotated
from fastapi import APIRouter, Depends, HTTPException, status
from sqlmodel import Session, select

from app.database import get_session
from app.models import User
from app.schemas import UserCreate, UserRead
from app.security import get_password_hash
from app.dependencies import require_role
from app.enums import UserRole

router = APIRouter(prefix="/users", tags=["Users"])
SessionDep = Annotated[Session, Depends(get_session)]

@router.post(
    "/",
    response_model=UserRead,
    status_code=status.HTTP_201_CREATED,
    dependencies=[Depends(require_role(UserRole.OPS_MANAGER))]
)
def create_user(user_create: UserCreate, session: SessionDep) -> User:
    """
    A new user may be created in the system. This is only authorized for users with the 'Operations Manager' role.
    """
    user_data = user_create.model_dump(exclude={"password"})
    hashed_password = get_password_hash(user_create.password)
    db_user = User(**user_data, hashed_password=hashed_password)
    
    session.add(db_user)
    session.commit()
    session.refresh(db_user)
    
    return db_user
