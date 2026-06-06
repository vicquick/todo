from uuid import UUID

from fastapi import APIRouter, File, HTTPException, Response, UploadFile, status
from sqlalchemy import case, func, select

from app.schemas.list import (
    ListCreate,
    ListResponse,
    ListDetailedResponse,
    ListSummary,
    ItemCreate,
    ListUpdate,
    ItemUpdatePartial,
)
from app.models import Item, List as ListModel, ListImage, Workspace, utcnow
from app.database import SessionDep
from app.utils import normalize_tags
from app.auth import currentUser

router = APIRouter()


async def get_owned_workspace(
    session, workspace_id: UUID, user_id: UUID
) -> Workspace:
    workspace = await session.scalar(
        select(Workspace).where(
            Workspace.id == workspace_id, Workspace.user_id == user_id
        )
    )
    if not workspace:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="workspace not found"
        )
    return workspace


async def get_list_in_workspace(
    session, workspace_id: UUID, list_id: UUID
) -> ListModel:
    # populate_existing: refresh identity-map instances (and their selectin-loaded
    # items) so responses after a commit never serve stale collections
    todolist = await session.scalar(
        select(ListModel)
        .where(ListModel.workspace_id == workspace_id, ListModel.id == list_id)
        .execution_options(populate_existing=True)
    )
    if not todolist:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="todo list not found"
        )
    return todolist


@router.get(
    "/workspaces/{workspace_id}/lists",
    response_model=list[ListSummary],
    status_code=status.HTTP_200_OK,
    operation_id="list_todo_lists",
)
async def fetch_lists(
    workspace_id: UUID, current_user: currentUser, session: SessionDep
):
    await get_owned_workspace(session, workspace_id, current_user.id)
    stmt = (
        select(
            ListModel.id,
            ListModel.name,
            ListModel.description,
            ListModel.image_mime,
            func.count(Item.id).label("item_count"),
            func.coalesce(
                func.sum(case((Item.checked, 1), else_=0)), 0
            ).label("completed_count"),
            ListModel.created_at,
            ListModel.updated_at,
        )
        .outerjoin(Item, Item.list_id == ListModel.id)
        .where(ListModel.workspace_id == workspace_id)
        .group_by(ListModel.id)
        .order_by(ListModel.created_at)
    )
    rows = (await session.execute(stmt)).all()
    return [
        ListSummary(
            id=row.id,
            name=row.name,
            description=row.description,
            image_mime=row.image_mime,
            item_count=row.item_count,
            completed_count=int(row.completed_count or 0),
            created_at=row.created_at,
            updated_at=row.updated_at,
        )
        for row in rows
    ]


@router.post(
    "/workspaces/{workspace_id}/lists",
    response_model=ListResponse,
    status_code=status.HTTP_201_CREATED,
    operation_id="create_todo_list",
)
async def create_lists(
    workspace_id: UUID,
    list_data: ListCreate,
    current_user: currentUser,
    session: SessionDep,
):
    await get_owned_workspace(session, workspace_id, current_user.id)
    new_list = ListModel(name=list_data.name, workspace_id=workspace_id)
    session.add(new_list)
    await session.commit()
    return await get_list_in_workspace(session, workspace_id, new_list.id)


@router.get(
    "/workspaces/{workspace_id}/lists/{list_id}",
    response_model=ListDetailedResponse,
    status_code=status.HTTP_200_OK,
    operation_id="get_todo_list",
)
async def fetch_lists_details(
    workspace_id: UUID,
    list_id: UUID,
    current_user: currentUser,
    session: SessionDep,
):
    await get_owned_workspace(session, workspace_id, current_user.id)
    return await get_list_in_workspace(session, workspace_id, list_id)


@router.patch(
    "/workspaces/{workspace_id}/lists/{list_id}",
    response_model=ListResponse,
    status_code=status.HTTP_200_OK,
    operation_id="update_todo_list",
)
async def update_lists(
    workspace_id: UUID,
    list_id: UUID,
    list_data: ListUpdate,
    current_user: currentUser,
    session: SessionDep,
):
    await get_owned_workspace(session, workspace_id, current_user.id)
    todolist = await get_list_in_workspace(session, workspace_id, list_id)
    changes = list_data.model_dump(exclude_unset=True)
    if changes.get("name") is not None:
        todolist.name = changes["name"]
    if "description" in changes:
        todolist.description = changes["description"]
    todolist.updated_at = utcnow()
    await session.commit()
    return todolist


@router.delete(
    "/workspaces/{workspace_id}/lists/{list_id}",
    status_code=status.HTTP_204_NO_CONTENT,
    operation_id="delete_todo_list",
)
async def delete_lists(
    workspace_id: UUID,
    list_id: UUID,
    current_user: currentUser,
    session: SessionDep,
):
    await get_owned_workspace(session, workspace_id, current_user.id)
    todolist = await get_list_in_workspace(session, workspace_id, list_id)
    await session.delete(todolist)
    await session.commit()


ALLOWED_IMAGE_TYPES = {"image/jpeg", "image/png", "image/webp", "image/gif"}
MAX_IMAGE_BYTES = 3 * 1024 * 1024


@router.put(
    "/workspaces/{workspace_id}/lists/{list_id}/image",
    response_model=ListDetailedResponse,
    status_code=status.HTTP_200_OK,
)
async def set_list_image(
    workspace_id: UUID,
    list_id: UUID,
    current_user: currentUser,
    session: SessionDep,
    file: UploadFile = File(...),
):
    await get_owned_workspace(session, workspace_id, current_user.id)
    todolist = await get_list_in_workspace(session, workspace_id, list_id)
    if file.content_type not in ALLOWED_IMAGE_TYPES:
        raise HTTPException(
            status_code=status.HTTP_415_UNSUPPORTED_MEDIA_TYPE,
            detail="image must be jpeg, png, webp or gif",
        )
    data = await file.read()
    if len(data) > MAX_IMAGE_BYTES:
        raise HTTPException(
            status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
            detail="image must be 3 MB or smaller",
        )
    image = await session.get(ListImage, todolist.id)
    if image:
        image.mime = file.content_type
        image.data = data
        image.updated_at = utcnow()
    else:
        session.add(ListImage(list_id=todolist.id, mime=file.content_type, data=data))
    todolist.image_mime = file.content_type
    todolist.updated_at = utcnow()
    await session.commit()
    return await get_list_in_workspace(session, workspace_id, list_id)


@router.delete(
    "/workspaces/{workspace_id}/lists/{list_id}/image",
    response_model=ListDetailedResponse,
    status_code=status.HTTP_200_OK,
)
async def delete_list_image(
    workspace_id: UUID,
    list_id: UUID,
    current_user: currentUser,
    session: SessionDep,
):
    await get_owned_workspace(session, workspace_id, current_user.id)
    todolist = await get_list_in_workspace(session, workspace_id, list_id)
    image = await session.get(ListImage, todolist.id)
    if image:
        await session.delete(image)
    todolist.image_mime = None
    todolist.updated_at = utcnow()
    await session.commit()
    return await get_list_in_workspace(session, workspace_id, list_id)


@router.get("/workspaces/{workspace_id}/lists/{list_id}/image")
async def fetch_list_image(
    workspace_id: UUID,
    list_id: UUID,
    current_user: currentUser,
    session: SessionDep,
):
    await get_owned_workspace(session, workspace_id, current_user.id)
    todolist = await get_list_in_workspace(session, workspace_id, list_id)
    image = await session.get(ListImage, todolist.id)
    if not image:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="no image set"
        )
    return Response(
        content=image.data,
        media_type=image.mime,
        headers={"Cache-Control": "private, max-age=60"},
    )


@router.post(
    "/workspaces/{workspace_id}/lists/{list_id}/items",
    response_model=ListDetailedResponse,
    status_code=status.HTTP_201_CREATED,
    operation_id="create_todo_item",
)
async def create_list_item(
    workspace_id: UUID,
    list_id: UUID,
    item_data: ItemCreate,
    current_user: currentUser,
    session: SessionDep,
):
    await get_owned_workspace(session, workspace_id, current_user.id)
    todolist = await get_list_in_workspace(session, workspace_id, list_id)
    if item_data.parent_id is not None:
        parent = await session.scalar(
            select(Item).where(
                Item.id == item_data.parent_id, Item.list_id == todolist.id
            )
        )
        if not parent:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="parent task not found in this project",
            )
        if parent.parent_id is not None:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="subtasks cannot have their own subtasks",
            )
    new_item = Item(
        list_id=todolist.id,
        parent_id=item_data.parent_id,
        label=item_data.label,
        checked=item_data.checked,
        priority=item_data.priority,
        tags=normalize_tags(item_data.tags),
        description=item_data.description,
        deadline=item_data.deadline,
    )
    session.add(new_item)
    todolist.updated_at = utcnow()
    await session.commit()
    return await get_list_in_workspace(session, workspace_id, list_id)


@router.patch(
    "/workspaces/{workspace_id}/lists/{list_id}/items",
    response_model=ListDetailedResponse,
    status_code=status.HTTP_200_OK,
    operation_id="update_todo_item",
)
async def update_item_state(
    workspace_id: UUID,
    list_id: UUID,
    update: ItemUpdatePartial,
    current_user: currentUser,
    session: SessionDep,
):
    await get_owned_workspace(session, workspace_id, current_user.id)
    todolist = await get_list_in_workspace(session, workspace_id, list_id)
    item = await session.scalar(
        select(Item).where(Item.id == update.item_id, Item.list_id == todolist.id)
    )
    if not item:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="item not found"
        )

    changes = update.model_dump(exclude={"item_id"}, exclude_unset=True)
    if "tags" in changes:
        changes["tags"] = normalize_tags(changes["tags"])
    for field, value in changes.items():
        if value is None and field in ("label", "checked"):
            continue
        setattr(item, field, value)
    item.updated_at = utcnow()
    todolist.updated_at = utcnow()
    await session.commit()
    return await get_list_in_workspace(session, workspace_id, list_id)


@router.delete(
    "/workspaces/{workspace_id}/lists/{list_id}/items/{item_id}",
    status_code=status.HTTP_204_NO_CONTENT,
    operation_id="delete_todo_item",
)
async def delete_item(
    workspace_id: UUID,
    list_id: UUID,
    item_id: UUID,
    current_user: currentUser,
    session: SessionDep,
):
    await get_owned_workspace(session, workspace_id, current_user.id)
    todolist = await get_list_in_workspace(session, workspace_id, list_id)
    item = await session.scalar(
        select(Item).where(Item.id == item_id, Item.list_id == todolist.id)
    )
    if not item:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="item not found"
        )
    await session.delete(item)
    todolist.updated_at = utcnow()
    await session.commit()
