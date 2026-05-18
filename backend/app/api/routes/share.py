# app/api/routes/share.py
import os
import secrets
from datetime import datetime, timedelta, timezone
from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import FileResponse
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import List
from app.core.database import get_db
from app.api.deps import get_current_user
from app.models.user import User
from app.models.document import Document
from app.models.share import SharedLink
from app.services.activity_service import activity_service

router = APIRouter()


class CreateShareRequest(BaseModel):
    document_id: int
    expires_in_hours: int = 24  # default 24 hours


class ShareLinkResponse(BaseModel):
    share_token: str
    share_url: str
    expires_at: datetime
    document_name: str


@router.post("/", response_model=ShareLinkResponse)
async def create_share_link(
    body: CreateShareRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Generate a public share link for a document with an expiry."""

    # Validate document belongs to current user
    doc = db.query(Document).filter(
        Document.id == body.document_id,
        Document.owner_id == current_user.id
    ).first()

    if not doc:
        raise HTTPException(status_code=404, detail="Document not found")

    # Clamp expiry between 1 hour and 7 days
    hours = max(1, min(body.expires_in_hours, 168))
    expires_at = datetime.now(timezone.utc) + timedelta(hours=hours)

    # Generate a secure random token
    share_token = secrets.token_urlsafe(32)

    shared_link = SharedLink(
        token=share_token,
        document_id=doc.id,
        owner_id=current_user.id,
        expires_at=expires_at,
    )
    db.add(shared_link)
    db.commit()
    db.refresh(shared_link)

    # Log the activity
    activity_service.log_action(
        db,
        user_id=current_user.id,
        action="SHARE",
        details=f"Shared document: {doc.name} (expires in {hours}h)"
    )

    frontend_url = os.getenv("FRONTEND_URL", "http://127.0.0.1:5173")
    share_url = f"{frontend_url}/shared/{share_token}"

    return ShareLinkResponse(
        share_token=share_token,
        share_url=share_url,
        expires_at=expires_at,
        document_name=doc.name
    )


@router.get("/", response_model=List[dict])
async def list_shared_links(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """List all active shared links created by the current user."""
    links = db.query(SharedLink).filter(
        SharedLink.owner_id == current_user.id,
        SharedLink.is_active == True
    ).all()
    
    result = []
    for link in links:
        doc = db.query(Document).filter(Document.id == link.document_id).first()
        if doc:
            result.append({
                "id": link.id,
                "token": link.token,
                "document_id": link.document_id,
                "document_name": doc.name,
                "size": doc.size,
                "category": doc.category,
                "expires_at": link.expires_at,
                "created_at": link.created_at,
                "is_active": link.is_active
            })
    return result


@router.get("/view/{share_token}")
async def view_shared_document(
    share_token: str,
    db: Session = Depends(get_db)
):
    """Public endpoint — no auth needed. Streams the file if the link is valid."""
    import mimetypes

    link = db.query(SharedLink).filter(
        SharedLink.token == share_token,
        SharedLink.is_active == True
    ).first()

    if not link:
        raise HTTPException(status_code=404, detail="Share link not found or revoked")

    # Check expiry
    now = datetime.now(timezone.utc)
    expires = link.expires_at
    if expires.tzinfo is None:
        expires = expires.replace(tzinfo=timezone.utc)

    if now > expires:
        link.is_active = False
        db.commit()
        raise HTTPException(status_code=410, detail="Share link has expired")

    doc = db.query(Document).filter(Document.id == link.document_id).first()
    if not doc:
        raise HTTPException(status_code=404, detail="Document not found")

    if not os.path.exists(doc.file_path):
        raise HTTPException(status_code=404, detail="File not found on disk")

    mime_type, _ = mimetypes.guess_type(doc.name)
    mime_type = mime_type or "application/octet-stream"

    headers = {"Content-Disposition": f'inline; filename="{doc.name}"'}
    return FileResponse(path=doc.file_path, media_type=mime_type, headers=headers)


@router.get("/info/{share_token}")
async def get_share_info(
    share_token: str,
    db: Session = Depends(get_db)
):
    """Public endpoint to get document info for the share page."""
    import os
    import mimetypes

    link = db.query(SharedLink).filter(
        SharedLink.token == share_token,
        SharedLink.is_active == True
    ).first()

    if not link:
        raise HTTPException(status_code=404, detail="Share link not found or revoked")

    # Robust Expiry Check
    now = datetime.now(timezone.utc)
    expires = link.expires_at
    if expires and expires.tzinfo is None:
        expires = expires.replace(tzinfo=timezone.utc)

    if expires and now > expires:
        link.is_active = False
        db.commit()
        raise HTTPException(status_code=410, detail="Share link has expired")

    doc = db.query(Document).filter(Document.id == link.document_id).first()
    if not doc:
        raise HTTPException(status_code=404, detail="Document not found")

    # Get file size safely
    file_size = 0
    try:
        if doc.file_path and os.path.exists(doc.file_path):
            file_size = os.path.getsize(doc.file_path)
    except Exception:
        pass

    # Guess mime type from filename
    mime_type, _ = mimetypes.guess_type(doc.name or "")
    mime_type = mime_type or "application/octet-stream"

    return {
        "name": doc.name,
        "size": file_size,
        "category": doc.category,
        "expires_at": link.expires_at,
        "created_at": link.created_at,
        "mime_type": mime_type
    }


@router.delete("/{share_token}", status_code=204)
async def revoke_share_link(
    share_token: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Revoke a share link (owner only)."""
    link = db.query(SharedLink).filter(
        SharedLink.token == share_token,
        SharedLink.owner_id == current_user.id
    ).first()

    if not link:
        raise HTTPException(status_code=404, detail="Share link not found")

    link.is_active = False
    db.commit()
    return None