import os
import mimetypes
from fastapi import APIRouter, Depends, HTTPException, Request
from fastapi.responses import FileResponse
from sqlalchemy.orm import Session
from typing import List
from jose import jwt, JWTError
from app.core.config import settings
from app.core.database import get_db
from app.api.deps import get_current_user
from app.models.user import User
from app.models.document import Document
from app.schemas.document import DocumentResponse

router = APIRouter()


@router.get("/", response_model=List[DocumentResponse])
async def list_documents(
    category: str = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    List all documents belonging to the current user.
    Optionally filter by category.
    """
    query = db.query(Document).filter(Document.owner_id == current_user.id)

    if category:
        query = query.filter(Document.category == category)

    return query.all()


# ---------------------------------------------------------------
# FIX 1: Sub-routes (/download, /preview) MUST come before the
#         generic /{document_id} route, otherwise FastAPI tries to
#         cast the literal string "download" / "preview" to int
#         and returns a 422 Unprocessable Entity error.
# ---------------------------------------------------------------

@router.get("/{document_id}/download")
async def download_document(
    document_id: int,
    request: Request,
    token: str = None,
    db: Session = Depends(get_db)
):
    """Download a document securely."""
    auth_header = request.headers.get("Authorization")
    jwt_token = None
    if auth_header and auth_header.startswith("Bearer "):
        jwt_token = auth_header.split(" ")[1]
    elif token:
        jwt_token = token

    if not jwt_token:
        raise HTTPException(status_code=401, detail="Not authenticated")

    try:
        payload = jwt.decode(
            jwt_token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM]
        )
        user_id = payload.get("sub")
        if not user_id:
            raise HTTPException(status_code=403, detail="Could not validate credentials")
    except JWTError:
        raise HTTPException(status_code=403, detail="Could not validate credentials")

    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    doc = db.query(Document).filter(
        Document.id == document_id,
        Document.owner_id == user.id
    ).first()

    if not doc:
        raise HTTPException(status_code=404, detail="Document not found")

    if not os.path.exists(doc.file_path):
        raise HTTPException(status_code=404, detail="File not found on disk")

    return FileResponse(
        path=doc.file_path,
        filename=doc.name,
        media_type='application/octet-stream'
    )


@router.get("/{document_id}/preview")
async def preview_document(
    document_id: int,
    request: Request,
    token: str = None,
    db: Session = Depends(get_db)
):
    """Stream a document for in-browser preview."""
    auth_header = request.headers.get("Authorization")
    jwt_token = None
    if auth_header and auth_header.startswith("Bearer "):
        jwt_token = auth_header.split(" ")[1]
    elif token:
        jwt_token = token

    if not jwt_token:
        raise HTTPException(status_code=401, detail="Not authenticated")

    try:
        payload = jwt.decode(
            jwt_token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM]
        )
        user_id = payload.get("sub")
        if not user_id:
            raise HTTPException(status_code=403, detail="Could not validate credentials")
    except JWTError:
        raise HTTPException(status_code=403, detail="Could not validate credentials")

    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    doc = db.query(Document).filter(
        Document.id == document_id,
        Document.owner_id == user.id
    ).first()

    if not doc:
        raise HTTPException(status_code=404, detail="Document not found")

    if not os.path.exists(doc.file_path):
        raise HTTPException(status_code=404, detail="File not found on disk")

    mime_type, _ = mimetypes.guess_type(doc.name)
    mime_type = mime_type or 'application/octet-stream'

    headers = {
        "Content-Disposition": f'inline; filename="{doc.name}"'
    }

    return FileResponse(
        path=doc.file_path,
        media_type=mime_type,
        headers=headers
    )


@router.get("/{document_id}", response_model=DocumentResponse)
async def get_document(
    document_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get details of a specific document."""
    doc = db.query(Document).filter(
        Document.id == document_id,
        Document.owner_id == current_user.id
    ).first()

    if not doc:
        raise HTTPException(status_code=404, detail="Document not found")

    return doc


@router.delete("/{document_id}", status_code=204)
async def delete_document(
    document_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Delete a document from the database and local storage."""
    from app.services.storage_service import storage_service
    from app.models.share import SharedLink

    doc = db.query(Document).filter(
        Document.id == document_id,
        Document.owner_id == current_user.id
    ).first()

    if not doc:
        raise HTTPException(status_code=404, detail="Document not found")

    # Delete any active shared links associated with this document first
    db.query(SharedLink).filter(SharedLink.document_id == document_id).delete(synchronize_session=False)

    # Log the activity
    from app.services.activity_service import activity_service
    activity_service.log_action(
        db,
        user_id=current_user.id,
        action="DELETE",
        details=f"Permanently deleted document: {doc.name}"
    )

    storage_service.delete_file(doc.file_path)

    db.delete(doc)
    db.commit()

    return None