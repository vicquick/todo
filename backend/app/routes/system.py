from fastapi import APIRouter, status, HTTPException
from sqlalchemy import text

from app.database import SessionDep

router = APIRouter()


@router.get("/health", status_code=status.HTTP_200_OK)
async def health_check(session: SessionDep):
    try:
        await session.execute(text("SELECT 1"))
        return {"status": "healthy"}
    except Exception:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="database unavailable",
        )
