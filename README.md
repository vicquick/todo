# Cairn — self-hosted todo

A self-hosted task management app: workspaces → lists → items. Fork of
[OyaAIProd/todo](https://github.com/OyaAIProd/todo), rebuilt on PostgreSQL
and actively developed.

**Stack:** FastAPI · SQLAlchemy 2.0 (async) · PostgreSQL · React · Vite · Tailwind · shadcn/ui

## Features

- User authentication (JWT + refresh tokens, argon2) and account management
- API keys for automation
- Workspace-based organization, lists, items with priorities, tags, deadlines
- Completion tracking, bulk item actions
- MCP server (`/mcp`) exposing 15 operations
- Password reset via any SMTP server (self-hosted Mailu works fine)
- Light and dark mode

## Roadmap

- Core parity tranche: recurring items, subtasks, manual sort order
- Workspace/project images and thumbnails
- Kanban, table and gantt views
- Telegram bot (create via message, daily digest)
- Quick-add natural language parsing
- AI-assisted task creation

## Development

```bash
cp .env.example .env   # fill in values
docker compose up --build
```

Backend on :8888, frontend on :5173, PostgreSQL 17 with a persisted volume.

## Deployment

Built as two Docker images (`backend/Dockerfile`, `frontend/Dockerfile`).
`VITE_API_BASE_URL` is baked at frontend build time — leave it empty for
same-origin `/api` behind a reverse proxy. See `.env.example` for backend
configuration; `DATABASE_URL` must use the `postgresql+asyncpg://` scheme.

## License

AGPL-3.0
