FROM node:24 AS builder

WORKDIR /app

COPY package*.json .

RUN npm install --verbose

COPY . .

# Vite bakes env vars into the bundle at build time — must be set before `npm run build`
ARG VITE_API_BASE_URL
ENV VITE_API_BASE_URL=$VITE_API_BASE_URL

RUN npm run build

FROM nginx:1.30-alpine

COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=builder /app/dist /usr/share/nginx/html

EXPOSE 80
