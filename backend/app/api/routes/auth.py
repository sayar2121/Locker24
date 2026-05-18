from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.schemas.auth import UserCreate, UserLogin, Token, UserResponse, ProfileUpdate
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from app.api.deps import get_current_user
from app.models.user import User
from app.services.auth_service import auth_service
from app.core.security import get_password_hash, verify_password
from typing import Optional
from pydantic import BaseModel

class GoogleLoginRequest(BaseModel):
    credential: str
    email: str
    name: str
    picture: Optional[str] = None

router = APIRouter()

@router.post("/register", response_model=UserResponse, status_code=status.HTTP_201_CREATED)
async def register(user_in: UserCreate, db: Session = Depends(get_db)):
    """Register a new user in the vault."""
    return auth_service.register_user(db, user_in.model_dump())

@router.post("/login", response_model=Token)
async def login(credentials: UserLogin, db: Session = Depends(get_db)):
    """Authenticate user and return a JWT access token via JSON."""
    return auth_service.authenticate_user(
        db, 
        credentials.email_or_username, 
        credentials.password
    )

@router.post("/login/oauth", response_model=Token)
async def login_oauth(form_data: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(get_db)):
    """Authenticate user and return a JWT access token via OAuth2 Form (for Swagger)."""
    return auth_service.authenticate_user(
        db, 
        form_data.username, 
        form_data.password
    )

@router.get("/me", response_model=UserResponse)
async def get_me(current_user: User = Depends(get_current_user)):
    """Get current user's profile."""
    return current_user

@router.put("/me", response_model=UserResponse)
async def update_profile(
    profile_data: ProfileUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Update current user's profile and/or change password."""
    # If email is being changed, check if it's already taken
    if profile_data.email and profile_data.email != current_user.email:
        existing = db.query(User).filter(User.email == profile_data.email).first()
        if existing:
            raise HTTPException(status_code=400, detail="Email already registered")
        current_user.email = profile_data.email

    if profile_data.name:
        current_user.name = profile_data.name

    # Password change logic
    if profile_data.new_password:
        if not profile_data.current_password:
            raise HTTPException(status_code=400, detail="Current password is required to set a new password")
        if not verify_password(profile_data.current_password, current_user.hashed_password):
            raise HTTPException(status_code=400, detail="Incorrect current password")
        current_user.hashed_password = get_password_hash(profile_data.new_password)

    db.add(current_user)
    db.commit()
    db.refresh(current_user)
    return current_user

@router.delete("/me", status_code=204)
async def deactivate_account(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Deactivate account and permanently delete all user data."""
    # 1. Delete all shared links associated with the user
    from app.models.share import SharedLink
    db.query(SharedLink).filter(SharedLink.owner_id == current_user.id).delete(synchronize_session=False)

    # 2. Delete all user documents and their physical files
    from app.models.document import Document
    from app.services.storage_service import storage_service
    docs = db.query(Document).filter(Document.owner_id == current_user.id).all()
    for doc in docs:
        storage_service.delete_file(doc.file_path)
        db.delete(doc)

    # 3. Delete all user activity logs
    from app.models.activity import ActivityLog
    db.query(ActivityLog).filter(ActivityLog.user_id == current_user.id).delete(synchronize_session=False)

    # 4. Finally delete the user account
    db.delete(current_user)
    db.commit()
    return None

from pydantic import BaseModel, EmailStr
from datetime import timedelta
from app.core.security import create_access_token

class ForgotPasswordRequest(BaseModel):
    email: EmailStr

class ResetPasswordRequest(BaseModel):
    token: str
    new_password: str

@router.post("/forgot-password")
async def forgot_password(payload: ForgotPasswordRequest, db: Session = Depends(get_db)):
    """Generate a secure, short-lived JWT token for password reset."""
    user = db.query(User).filter(User.email == payload.email).first()
    if not user:
        raise HTTPException(status_code=404, detail="No account registered with this email address.")
    
    # Create reset token with a 15-minute expiration
    reset_token = create_access_token(subject=user.id, expires_delta=timedelta(minutes=15))
    reset_url = f"http://localhost:5173/reset-password?token={reset_token}"
    
    return {
        "message": "Recovery details generated successfully.",
        "reset_url": reset_url
    }

@router.post("/reset-password")
async def reset_password(payload: ResetPasswordRequest, db: Session = Depends(get_db)):
    """Verify reset token and update user's security key."""
    from jose import jwt, JWTError
    from app.core.config import settings
    
    try:
        jwt_payload = jwt.decode(
            payload.token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM]
        )
        user_id: int = jwt_payload.get("sub")
        if user_id is None:
            raise HTTPException(status_code=400, detail="Invalid recovery link or token.")
    except JWTError:
        raise HTTPException(status_code=400, detail="The recovery link has expired or is invalid.")
        
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User account not found.")
        
    # Update and hash the new password
    user.hashed_password = get_password_hash(payload.new_password)
    db.add(user)
    db.commit()
    
    return {"message": "Your password has been successfully reset."}

@router.post("/google", response_model=Token)
async def google_login(payload: GoogleLoginRequest, db: Session = Depends(get_db)):
    """Authenticate or register a user via Google OAuth2."""
    from app.services.firebase_service import firebase_service
    from app.core.config import settings

    # Securely verify the Google ID token with Firebase Service
    verified_claims = firebase_service.verify_id_token(
        id_token=payload.credential,
        project_id=settings.FIREBASE_PROJECT_ID
    )

    # Extract verified email and name
    email = verified_claims.get("email", payload.email)
    name = verified_claims.get("name", payload.name)

    # Find existing user by verified email
    user = db.query(User).filter(User.email == email).first()
    
    if not user:
        # Create a new user with Google credentials
        # We generate a unique username from their email
        username = email.split('@')[0]
        # Check if username is taken
        suffix = 1
        base_username = username
        while db.query(User).filter(User.username == username).first():
            username = f"{base_username}{suffix}"
            suffix += 1
            
        user = User(
            email=email,
            username=username,
            name=name,
            hashed_password=get_password_hash(f"google_{payload.credential[:10]}"), # Place-holder hashed password
            is_active=True
        )
        db.add(user)
        db.commit()
        db.refresh(user)
        
        # Log activity
        from app.models.activity import ActivityLog
        activity = ActivityLog(
            user_id=user.id,
            action="LOGIN",
            details=f"New account created and authenticated via Google Auth ({user.email})."
        )
        db.add(activity)
        db.commit()
    else:
        # Existing user, log their Google login activity
        from app.models.activity import ActivityLog
        activity = ActivityLog(
            user_id=user.id,
            action="LOGIN",
            details=f"User successfully logged in via Google Auth ({user.email})."
        )
        db.add(activity)
        db.commit()
        
    # Generate JWT Access Token
    access_token = create_access_token(subject=user.id)
    return {
        "access_token": access_token,
        "token_type": "bearer",
        "user": {
            "id": user.id,
            "username": user.username,
            "email": user.email,
            "name": user.name,
            "is_active": user.is_active
        }
    }
