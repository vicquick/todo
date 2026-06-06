FROM python:3.12-alpine AS builder

WORKDIR /app

COPY requirements.txt .

RUN pip install --no-cache-dir --prefix=/install -r requirements.txt

FROM python:3.12-alpine AS runner

WORKDIR /app

COPY --from=builder /install /usr/local

# Keep the `app` package intact so `from app.X import ...` works
COPY app ./app

CMD ["fastapi", "run", "app/main.py", "--port", "80"]

EXPOSE 80
