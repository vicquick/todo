from contextlib import asynccontextmanager
from fastapi import FastAPI
from database import init_db, close_db
from routers import system, list


@asynccontextmanager
async def lifespan(app_: FastAPI):
    # Startup
    await init_db()
    yield
    # Shutdown
    close_db()


app = FastAPI(lifespan=lifespan)
app.include_router(router=system.router, prefix="", tags=["system"])
app.include_router(router=list.router, prefix="/api/lists", tags=["todo list"])
