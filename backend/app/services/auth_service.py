from sqlalchemy.orm import Session
from app.models.user import User
from app.core.security import get_password_hash, verify_password, create_access_token
from fastapi import HTTPException, status

class AuthService:
    def register_user(self, db: Session, user_data: dict):
        # Check if user already exists
        db_user = db.query(User).filter(User.email == user_data['email']).first()
        if db_user:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Email already registered"
            )
        
        db_user_username = db.query(User).filter(User.username == user_data['username']).first()
        if db_user_username:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Username already taken"
            )

        # Hash the password
        hashed_password = get_password_hash(user_data['password'])
        
        # Create user
        new_user = User(
            name=user_data['name'],
            email=user_data['email'],
            username=user_data['username'],
            hashed_password=hashed_password,
            is_active=True
        )
        
        db.add(new_user)
        db.commit()
        db.refresh(new_user)
        return new_user

    def authenticate_user(self, db: Session, email_or_username: str, password: str):
        # Find user by email or username
        user = db.query(User).filter(
            (User.email == email_or_username) | (User.username == email_or_username)
        ).first()
        
        if not user or not verify_password(password, user.hashed_password):
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Incorrect email/username or password",
                headers={"WWW-Authenticate": "Bearer"},
            )
        
        # Create token
        access_token = create_access_token(subject=user.id)
        
        return {
            "access_token": access_token,
            "token_type": "bearer",
            "user": {
                "id": user.id,
                "name": user.name,
                "email": user.email,
                "username": user.username,
                "is_active": user.is_active
            }
        }

auth_service = AuthService()
