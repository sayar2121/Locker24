from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.core.config import settings
from app.api.routes import auth, documents, upload, share, activity

app = FastAPI(
    title="Locker 24 API",
    description="Secure Personal Document Vault API",
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc",
)

# Set up CORS
app.add_middleware(
    CORSMiddleware,
    allow_origin_regex=r"https?://.*",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(auth.router, prefix="/api/auth", tags=["authentication"])
app.include_router(documents.router, prefix="/api/documents", tags=["documents"])
app.include_router(upload.router, prefix="/api/upload", tags=["upload"])
app.include_router(share.router, prefix="/api/share", tags=["sharing"])
app.include_router(activity.router, prefix="/api/activity", tags=["activity"])

@app.get("/")
async def root():
    return {"message": "Welcome to Locker 24 API", "status": "active"}
