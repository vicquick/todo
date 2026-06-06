from uuid import UUID

from fastapi import APIRouter, status, HTTPException
from sqlalchemy import select

from app.schemas.workspace import WorkspaceResponse, WorkspaceCreate, WorkspaceUpdate
from app.auth import currentUser
from app.models import User, Workspace, utcnow
from app.database import SessionDep

router = APIRouter()


@router.get(
    "",
    response_model=list[WorkspaceResponse],
    status_code=status.HTTP_200_OK,
    operation_id="list_workspaces",
)
async def fetch_workspaces(current_user: currentUser, session: SessionDep):
    result = await session.scalars(
        select(Workspace)
        .where(Workspace.user_id == current_user.id)
        .order_by(Workspace.created_at)
    )
    return result.all()


@router.post(
    "",
    response_model=WorkspaceResponse,
    status_code=status.HTTP_201_CREATED,
    operation_id="create_workspace",
)
async def create_workspace(
    current_user: currentUser, workspace_data: WorkspaceCreate, session: SessionDep
):
    existing_workspace = await session.scalar(
        select(Workspace).where(
            Workspace.name == workspace_data.name,
            Workspace.user_id == current_user.id,
        )
    )
    if existing_workspace:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST, detail="workspace already present"
        )
    new_workspace = Workspace(name=workspace_data.name, user_id=current_user.id)
    session.add(new_workspace)
    await session.commit()
    return new_workspace


@router.get(
    "/{workspace_id}",
    response_model=WorkspaceResponse,
    status_code=status.HTTP_200_OK,
    operation_id="get_workspace",
)
async def fetch_workspace_details(
    workspace_id: UUID, current_user: currentUser, session: SessionDep
):
    workspace = await session.scalar(
        select(Workspace).where(
            Workspace.id == workspace_id, Workspace.user_id == current_user.id
        )
    )
    if not workspace:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="workspace not found"
        )
    return workspace


@router.patch(
    "/{workspace_id}",
    response_model=WorkspaceResponse,
    status_code=status.HTTP_200_OK,
    operation_id="update_workspace",
)
async def update_workspace_partial(
    workspace_id: UUID,
    update: WorkspaceUpdate,
    current_user: currentUser,
    session: SessionDep,
):
    workspace = await session.scalar(
        select(Workspace).where(
            Workspace.id == workspace_id, Workspace.user_id == current_user.id
        )
    )
    if not workspace:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="workspace not found"
        )
    if update.user_id is not None:
        user = await session.get(User, update.user_id)
        if not user:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND, detail="updated user not found"
            )
        workspace.user_id = user.id
    if update.name is not None:
        existing_workspace = await session.scalar(
            select(Workspace).where(
                Workspace.name == update.name,
                Workspace.user_id == current_user.id,
                Workspace.id != workspace_id,
            )
        )
        if existing_workspace:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="workspace already present",
            )
        workspace.name = update.name
    workspace.updated_at = utcnow()
    await session.commit()
    return workspace


@router.delete(
    "/{workspace_id}",
    status_code=status.HTTP_204_NO_CONTENT,
    operation_id="delete_workspace",
)
async def delete_workspace(
    workspace_id: UUID, current_user: currentUser, session: SessionDep
):
    workspace = await session.scalar(
        select(Workspace).where(
            Workspace.id == workspace_id, Workspace.user_id == current_user.id
        )
    )
    if not workspace:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="workspace not found"
        )
    # lists and items cascade at the database level
    await session.delete(workspace)
    await session.commit()
