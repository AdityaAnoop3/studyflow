from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.core.config import settings
from app.api.endpoints.analytics import router as analytics_router  # type: ignore
from app.api.endpoints.recommendations import router as recommendations_router  # type: ignore
from app.api.endpoints.spaced_repetition import router as spaced_repetition_router  # type: ignore

app = FastAPI(
    title="StudyFlow Intelligence Service",
    description="Advanced analytics and ML-powered study recommendations",
    version="1.0.0"
)

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(
    analytics_router,
    prefix="/api/analytics",
    tags=["analytics"]
)
app.include_router(
    recommendations_router,
    prefix="/api/recommendations",
    tags=["recommendations"]
)
app.include_router(
    spaced_repetition_router,
    prefix="/api/spaced-repetition",
    tags=["spaced-repetition"]
)

@app.get("/")
def root():
    return {
        "service": "StudyFlow Intelligence Service",
        "status": "operational",
        "endpoints": {
            "analytics": "/api/analytics",
            "recommendations": "/api/recommendations",
            "spaced_repetition": "/api/spaced-repetition"
        }
    }

@app.get("/health")
def health_check():
    return {"status": "healthy"}