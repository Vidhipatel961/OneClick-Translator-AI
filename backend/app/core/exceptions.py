from fastapi import FastAPI, Request
from fastapi.responses import JSONResponse
from app.core.logging import logger


class BaseLingoraException(Exception):
    def __init__(self, message: str, status_code: int = 400):
        self.message = message
        self.status_code = status_code
        super().__init__(self.message)


# Origins that are allowed — must stay in sync with main.py CORSMiddleware config
_ALLOWED_ORIGINS = {"http://localhost:5173", "https://app.lingora.ai"}


def _cors_headers(request: Request) -> dict:
    """Return CORS headers matching the request origin when it is allowed."""
    origin = request.headers.get("origin", "")
    if origin in _ALLOWED_ORIGINS:
        return {
            "Access-Control-Allow-Origin": origin,
            "Access-Control-Allow-Credentials": "true",
            "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS, PATCH",
            "Access-Control-Allow-Headers": "Content-Type, Authorization, Accept",
            "Vary": "Origin",
        }
    return {}


def add_exception_handlers(app: FastAPI):
    @app.exception_handler(BaseLingoraException)
    async def lingora_exception_handler(request: Request, exc: BaseLingoraException):
        logger.error(f"LingoraException occurred: {exc.message} at {request.url}")
        return JSONResponse(
            status_code=exc.status_code,
            content={"error": True, "message": exc.message},
            headers=_cors_headers(request),
        )

    @app.exception_handler(Exception)
    async def global_exception_handler(request: Request, exc: Exception):
        logger.error(f"Unhandled exception occurred: {str(exc)} at {request.url}")
        return JSONResponse(
            status_code=500,
            content={"error": True, "message": "An unexpected internal server error occurred."},
            headers=_cors_headers(request),
        )
