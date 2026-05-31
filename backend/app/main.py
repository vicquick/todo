from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.database import init_db, close_db
from app.routes import system, list, user


@asynccontextmanager
async def lifespan(app_: FastAPI):
    # Startup
    await init_db()
    yield
    # Shutdown
    close_db()


app = FastAPI(lifespan=lifespan)

origins = ["http://localhost:5173", "http://localhost:5174"]

app.add_middleware(
    middleware_class=CORSMiddleware,
    allow_origins=origins,
    allow_methods=["*"],
    allow_headers=["*"],
)


app.include_router(router=system.router, prefix="", tags=["system"])
app.include_router(router=user.router, prefix="/api/user", tags=["user"])
app.include_router(router=list.router, prefix="/api/lists", tags=["todo list"])
