# app/dependencies.py
from typing import Annotated
from fastapi import Depends, HTTPException, status

from app.models import User
from app.enums import UserRole
from app.routers.login import get_current_user


def require_role(required_roles: list[UserRole]):
    """
    This is a dependency that generates another dependency. Verify that the current user has the required role.
    """
    def role_checker(current_user: Annotated[User, Depends(get_current_user)]) -> User:
        if current_user.role not in required_roles:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Permission denied. Required role: {[role.value for role in required_roles]}",            
            )    
        return current_user
    return role_checker    