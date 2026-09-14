from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.middleware.trustedhost import TrustedHostMiddleware
from app.core.config import settings
from app.core.logging import logger
from app.core.exceptions import add_exception_handlers
from app.api import health, auth, translate, languages, files, speech, jobs, assistant, glossaries, dashboard, usage, subscriptions, projects, memory, teams

from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.util import get_remote_address
from slowapi.errors import RateLimitExceeded
from slowapi.middleware import SlowAPIMiddleware

limiter = Limiter(key_func=get_remote_address, default_limits=["100/minute"])

app = FastAPI(
    title=settings.PROJECT_NAME, 
    version="0.1.0",
    description="The ultimate AI-powered localization platform."
)

# Trusted Hosts Configuration (Prevents HTTP Host Header attacks)
app.add_middleware(
    TrustedHostMiddleware, allowed_hosts=["localhost", "localhost:8000", "127.0.0.1", "127.0.0.1:8000", "app.lingora.ai", "api.lingora.ai", "backend", "frontend"]
)

# CORS Configuration
# Secure defaults: replace wildcard with frontend origin
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "https://app.lingora.ai"], # Restrict to specific domains
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH"],
    allow_headers=["Content-Type", "Authorization", "Accept"],
)

app.add_middleware(SlowAPIMiddleware)
app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

# Add Exception Handlers
add_exception_handlers(app)

# Include Routers
app.include_router(health.router, prefix="/api", tags=["health"])
app.include_router(auth.router, prefix="/api/auth", tags=["auth"])
app.include_router(files.router, prefix="/api/files", tags=["files"])
app.include_router(translate.router, prefix="/api/translate", tags=["translate"])
app.include_router(languages.router, prefix="/api/languages", tags=["languages"])
app.include_router(speech.router, prefix="/api/speech", tags=["speech"])
app.include_router(jobs.router, prefix="/api/jobs", tags=["jobs"])
app.include_router(assistant.router, prefix="/api/assistant", tags=["assistant"])
app.include_router(glossaries.router, prefix="/api/glossaries", tags=["glossaries"])
app.include_router(dashboard.router, prefix="/api/dashboard", tags=["dashboard"])
app.include_router(usage.router, prefix="/api/usage", tags=["usage"])
app.include_router(subscriptions.router, prefix="/api/subscriptions", tags=["subscriptions"])
app.include_router(projects.router, prefix="/api/projects", tags=["projects"])
app.include_router(memory.router, prefix="/api/memory", tags=["memory"])
app.include_router(teams.router, prefix="/api/teams", tags=["teams"])

@app.on_event("startup")
async def startup_event():
    logger.info("Lingora AI Backend starting up...")
