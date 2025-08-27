# To-Do API (FastAPI Backend)

A simple FastAPI-powered To-Do / Task Manager backend with CRUD operations, ready for any frontend.  
Tasks are stored in a JSON file for now, but the project is designed to be extended with a database and a custom frontend.

---

## Features

- Create, Read, Update, Delete (CRUD) tasks
- Task fields: `title`, `description`, `deadline (optional)`, `priority (1=High, 2=Medium, 3=Low)`, `status (Complete/Incomplete)`
- Auto-generated timestamps (`created_at`, `updated_at`)
- Filter tasks by status or priority
- Sort tasks by priority (ascending/descending)
- Interactive API documentation available at `/docs` (Swagger UI)

---

## Project Structure

```

todo-api/
├── api.py            # FastAPI app and routes
├── tasks.json        # Task storage (auto-created)
├── requirements.txt  # Dependencies
└── readme.md         # Documentation

```

---

## Installation & Setup

### 1. Clone the Repository

```bash
git clone https://github.com/viraj-sh/todo-api.git
cd todo-api
```

### 2. Create and Activate Virtual Environment

#### Linux / macOS

```bash
python3 -m venv venv
source venv/bin/activate
```

#### Windows (PowerShell)

```powershell
python -m venv venv
venv\Scripts\activate
```

### 3. Install Dependencies

```bash
pip install -r requirements.txt
```

### 4. Run the API

```bash
uvicorn api:app --reload
```

The server will start at: [http://127.0.0.1:8000](http://127.0.0.1:8000)

---

## API Documentation

FastAPI provides interactive documentation at:

- Swagger UI: [http://127.0.0.1:8000/docs](http://127.0.0.1:8000/docs)
- ReDoc: [http://127.0.0.1:8000/redoc](http://127.0.0.1:8000/redoc)

---

## Example Endpoints

### Create Task

```http
POST /tasks
```

Request Body:

```json
{
  "title": "Finish project",
  "description": "Complete FastAPI project",
  "priority": 1
}
```

### Get All Tasks

```http
GET /tasks
```

Optional query params:

- `status` → `Complete` / `Incomplete`
- `priority` → `asc` / `desc` OR `1`, `2`, `3`

Example:

```
/tasks?status=Incomplete&priority=asc
```

### Get Task by ID

```http
GET /tasks/{tid}
```

### Update Task

```http
PUT /tasks/{tid}
```

Request Body (partial update allowed):

```json
{
  "status": "Complete",
  "priority": 2
}
```

### Delete Task

```http
DELETE /tasks/{tid}
```

---

## Future Improvements

- Frontend: A default frontend may be added in the future. Contributions with React, Vue, or Angular implementations are welcome.
- Database Support: Current storage is JSON. Future versions will use a database such as SQLite (lightweight, file-based) or PostgreSQL (production-ready).
- Authentication: Add user accounts and JWT-based authentication.

---

## Contributing

Contributions are welcome.

- Frontend integration
- Database support
- Bug fixes and improvements

Please open an issue or submit a pull request.

---

## License

This project is open-source and available under the [MIT License](LICENSE).
