import json
import os
from datetime import datetime
from fastapi import FastAPI, HTTPException, Query
from pydantic import BaseModel, Field
from typing import Annotated, Literal, Optional, List
from fastapi.responses import JSONResponse


FILE_PATH = "tasks.json"

if not os.path.exists(FILE_PATH):
    with open(FILE_PATH, "w") as f:
        json.dump([], f, indent=2)
        
        
def load_data():
    with open("tasks.json", "r") as f:
        data = json.load(f)
    return data

def save_data(data):
    def default(o):
        if isinstance(o, datetime):
            return o.isoformat()
        raise TypeError(f"Type {type(o)} not serializable")
    with open("tasks.json", "w") as f:
        json.dump(data, f, default=default, indent=2)

class Task(BaseModel):
    tid: Annotated[int, Field(..., description="ID of the task", examples=[1])]
    title: Annotated[str, Field(..., description="Title of the Task", min_length=1)]
    description: Annotated[str, Field(..., description="Description of the Task", min_length=3)]
    deadline: Annotated[Optional[datetime], Field(
        None, description="Deadline by which the task should be completed (optional)"
    )]
    priority: Annotated[int, Field(default=3, description="Priority of the Task (1=High, 2=Medium, 3=Low)")]
    status: Annotated[Literal["Complete", "Incomplete"], Field(default="Incomplete", description="Current Status of the Task")]
    created_at: Annotated[datetime, Field(default_factory=datetime.now, description="ISO time when the task was created")]
    updated_at: Annotated[datetime, Field(default_factory=datetime.now, description="ISO time when the task was last updated")]

class TaskCreate(BaseModel):
    title: Annotated[str, Field(..., description="Title of the Task", min_length=1)]
    description: Annotated[str, Field(..., description="Description of the Task", min_length=3)]
    deadline: Annotated[Optional[datetime], Field(
        None, description="Deadline by which the task should be completed (optional)"
    )]
    priority: Annotated[int, Field(default=3, description="Priority of the Task (1=High, 2=Medium, 3=Low)")]


class TaskUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    deadline: Optional[datetime] = None
    priority: Optional[int] = None
    status: Optional[Literal["Complete", "Incomplete"]] = None
    updated_at: datetime = Field(default_factory=datetime.now)

app = FastAPI()

@app.post("/tasks", response_model=Task)
def create_task(task: TaskCreate):
    data = load_data()
    new_id = 1 + max((d["tid"] for d in data), default=0)

    new_task = Task(
        tid=new_id,
        title=task.title,
        description=task.description,
        deadline=task.deadline,
        priority=task.priority,
        status="Incomplete",
        created_at=datetime.now(),
        updated_at=datetime.now(),
    )

    data.append(new_task.dict())
    save_data(data)
    return new_task  

@app.put("/tasks/{tid}", response_model=Task)
def update_task(tid: int, task: TaskUpdate):
    data = load_data()

    for idx, existing_task in enumerate(data):
        if existing_task["tid"] == tid:
            updated_task = existing_task.copy()

            update_data = task.dict(exclude_unset=True)
            for field, value in update_data.items():
                updated_task[field] = value

         
            updated_task["updated_at"] = datetime.now().isoformat()

            data[idx] = updated_task
            save_data(data)

            
            return Task(**updated_task)

    raise HTTPException(status_code=404, detail="Task not found")

@app.get("/tasks", response_model=List[Task])
def get_tasks(
    status: Optional[str] = Query(None, description="Status: 'Complete' or 'Incomplete'"),
    priority: Optional[str] = Query(
        None,
        description="Sort order: 'asc' or 'desc' OR filter by priority value ('1', '2', '3').",
    ),
):
    data = load_data()

    # if data:
    if status in ["Complete", "Incomplete"]:
        data = [task for task in data if task["status"] == status]

    
    if priority:
        if priority in ["asc", "desc"]:  # sorting
            reverse_sort = priority == "desc"
            data = sorted(data, key=lambda x: x["priority"], reverse=reverse_sort)
        elif priority in ["1", "2", "3"]:  # filtering by exact priority
            data = [task for task in data if str(task["priority"]) == priority]

    return [Task(**task) for task in data]
    # else:
    #     JSONResponse(status_code=200, content={"message": "No Task Found"})


@app.get("/tasks/{tid}", response_model=Task)
def get_task(tid: int):
    data = load_data()
    for d in data:
        if d["tid"] == tid:
            return Task(**d)
    raise HTTPException(status_code=404, detail="Task not Found")

@app.delete("/tasks/{tid}")
def del_task(tid: int):
    data = load_data()
    new_data = [task for task in data if task["tid"] != tid]

    if len(new_data) == len(data):
        raise HTTPException(status_code=404, detail="Task not Found")

    save_data(new_data)
    return JSONResponse(status_code=200, content={"message": "Task deleted"})
