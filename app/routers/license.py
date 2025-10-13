# app/routers/license.py
from typing import Annotated, List
from fastapi import APIRouter, Depends, status, Query, HTTPException
from sqlmodel import Session, select
from datetime import datetime

from app.database import get_session
from app.enums import LicenseStatus
from app.models import License, User
from app.schemas import LicenseRead, LicenseCreate, LicenseClose
from app.routers.login import get_current_user
from app.dependencies import require_role, UserRole

router = APIRouter(
    prefix="/licenses",
    tags=["Licenses"],
)

SessionDep = Annotated[Session, Depends(get_session)]

@router.post("/", response_model=LicenseRead, status_code=status.HTTP_201_CREATED, dependencies=[Depends(require_role([UserRole.SHIFT_SUPERINTENDENT]))])
def create_license(
    license: LicenseCreate, 
    session: SessionDep,
    current_user: Annotated[User, Depends(get_current_user)]
    ) -> License:
    
    db_license = License.model_validate(
        license,
        update={"created_by_user_id": current_user.id}
    )
    
    session.add(db_license)
    session.commit()
    session.refresh(db_license)
    return db_license
    
@router.get("/", response_model=List[LicenseRead])
def read_licenses(
    session: SessionDep,
    status: LicenseStatus | None = None,
    offset: int = 0,
    limit: int = Query(default=100, le=100)) -> List[License]:
    query = select(License)
    if status:
        query = query.where(License.status == status)
        
    licenses = session.exec(query.offset(offset).limit(limit)).all()
    return licenses

@router.get("/{license_id}", response_model=LicenseRead)
def read_license(license_id: int, session: SessionDep) -> License:
    license = session.get(License, license_id)
    if not license:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="License not found")
    return license

@router.put("/{license_id}/close", response_model=LicenseRead, dependencies=[Depends(require_role([UserRole.SHIFT_SUPERINTENDENT]))])
def close_license(
    license_id: int,
    license_data: LicenseClose,
    session: SessionDep,
    current_user: Annotated[User, Depends(get_current_user)]
) -> License:
    db_license = session.get(License, license_id)
    if not db_license:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="License not found")
        
    if db_license.status == LicenseStatus.CLOSED:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="License is already closed")
    
    db_license.end_time = license_data.end_time
    db_license.status = LicenseStatus.CLOSED
    db_license.closed_by_user_id = current_user.id
        
    session.add(db_license)
    session.commit()
    session.refresh(db_license)
    
    return db_license    