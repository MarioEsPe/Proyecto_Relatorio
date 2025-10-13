# app/dependencies.py
from typing import Annotated
from fastapi import Depends, HTTPException, status

from app.models import User
from app.enums import UserRole
from app.routers.login import get_current_user


def require_role(required_role: UserRole):
    """
    Esta es una dependencia que genera otra dependencia.
    Verifica que el usuario actual tenga el rol requerido.
    """
    def role_checker(current_user: Annotated[User, Depends(get_current_user)]) -> User:
        if current_user.role != required_role:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Acción no permitida. Se requiere el rol: {required_role.value}",            
            )    
        return current_user
    return role_checker    