from fastapi import APIRouter, status, HTTPException, Query
from app.schemas.list import (
    ListCreate,
    ListResponse,
    ListDetailedResponse,
    ItemCreate,
    ListUpdate,
    ItemResponse,
    ItemBase,
    ItemUpdatePartial,
)
from app.models import List
from beanie import PydanticObjectId
from typing import Annotated
from app.auth import currentUser

router = APIRouter()


@router.get("", status_code=status.HTTP_200_OK)
async def fetch_lists(current_user: currentUser):
    return await List.list_summaries(current_user.id)


@router.post("", response_model=ListResponse, status_code=status.HTTP_201_CREATED)
async def create_lists(list_data: ListCreate, current_user: currentUser):
    new_list = List(name=list_data.name, user_id=current_user.id)
    await new_list.create()
    return new_list


@router.get(
    "/{list_id}", response_model=ListDetailedResponse, status_code=status.HTTP_200_OK
)
async def fetch_lists_details(list_id: PydanticObjectId, current_user: currentUser):
    list_details = await List.find_one(
        List.user_id == current_user.id, List.id == list_id
    )
    if not list_details:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="todo list not found"
        )
    return list_details


@router.patch(
    "/{list_id}", response_model=ListResponse, status_code=status.HTTP_202_ACCEPTED
)
async def update_lists(
    list_id: PydanticObjectId, list_data: ListUpdate, current_user: currentUser
):
    list = await List.find_one(List.user_id == current_user.id, List.id == list_id)
    if not list:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="list not found"
        )
    if list_data.name != None:
        await list.update({"$set": {"name": list_data.name}})
    return await List.find_one(List.user_id == current_user.id, List.id == list_id)


@router.delete("/{list_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_lists(list_id: PydanticObjectId, current_user: currentUser):
    list = await List.find_one(List.user_id == current_user.id, List.id == list_id)
    if not list:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="todo list not found"
        )
    await list.delete()


@router.post(
    "/{list_id}/items",
    response_model=ListDetailedResponse,
    status_code=status.HTTP_200_OK,
)
async def create_list_item(
    list_id: PydanticObjectId, item_data: ItemCreate, current_user: currentUser
):
    todolist = await List.find_one(List.user_id == current_user.id, List.id == list_id)
    if not todolist:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="todo list not found"
        )
    await todolist.update({"$push": {"items": item_data.model_dump()}})
    return await List.find_one(List.user_id == current_user.id, List.id == list_id)


@router.patch(
    "/{list_id}/items",
    response_model=ListDetailedResponse,
    status_code=status.HTTP_200_OK,
)
async def update_item_state(
    list_id: PydanticObjectId, update: ItemUpdatePartial, current_user: currentUser
):
    todolist = await List.find_one(List.user_id == current_user.id, List.id == list_id)
    if not todolist:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="todo list not found"
        )
    for item in todolist.items:
        if item.id == update.item_id:
            if update.checked != None:
                item.checked = update.checked
                await todolist.save()
            if update.label != None:
                item.label = update.label
                await todolist.save()
            return await List.find_one(
                List.user_id == current_user.id, List.id == list_id
            )

    raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="item not found")


@router.delete("/{list_id}/items/{item_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_item(
    list_id: PydanticObjectId, item_id: str, current_user: currentUser
):
    item_deleted = False
    todolist = await List.find_one(List.user_id == current_user.id, List.id == list_id)
    if not todolist:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="todo list not found"
        )
    for item in todolist.items:
        if item.id == item_id:
            todolist.items.remove(item)
            item_deleted = True
            await todolist.save()
            break
    if not item_deleted:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="item not found"
        )
