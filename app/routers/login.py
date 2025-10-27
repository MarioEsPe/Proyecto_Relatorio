# app/routers/login.py
from datetime import timedelta
from typing import Annotated, Any

from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm, OAuth2PasswordBearer
from sqlmodel import Session, select
from jose import JWTError, jwt

from app.database import get_session
from app.models import User 
from app.security import ACCESS_TOKEN_EXPIRE_MINUTES, create_access_token, verify_password, SECRET_KEY, ALGORITHM
from app.schemas import UserRead

router = APIRouter(tags=["Login"])
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="token")
SessionDep = Annotated[Session, Depends(get_session)]


def get_current_user(
    token: Annotated[str, Depends(oauth2_scheme)],
    session: SessionDep
) -> User:
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        username: str | None = payload.get("sub")
        if username is None:
            raise credentials_exception
    except JWTError:
        raise credentials_exception
    
    user = session.exec(select(User).where(User.username == username)).first()   
    if user is None:
        raise credentials_exception
    
    return user 

@router.get("/users/me", response_model=UserRead)
def read_users_me(
    current_user: Annotated[User, Depends(get_current_user)]
):
    """
    Get the details of the currently authenticated user.
    """
    return current_user

@router.post("/token")
def login_for_access_token(
    form_data: Annotated[OAuth2PasswordRequestForm, Depends()],
    session: SessionDep,
) -> dict[str, Any]:
    """
    Exchange username and password for a JWT access token.
    """
    statement = select(User).where(User.username == form_data.username)
    user = session.exec(statement). first()
    
    if not user or not verify_password(form_data.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect username or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
        
    access_token_expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        data={"sub": user.username}, expires_delta=access_token_expires
    )   
    
    return {"access_token": access_token, "token_type": "bearer"} 