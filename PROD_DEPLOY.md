# Production Deployment Guide

This document provides instructions for deploying the **WeVibin'** server and client for production use.

## Server Deployment (Docker)

The recommended way to deploy the server is using Docker and Docker Compose.

### 1. Prerequisites
- Docker and Docker Compose installed.
- A MongoDB instance (or use the one in Docker Compose).
- Spotify Developer Application credentials.

### 2. Environment Variables
Create a `.env` file in the `server/` directory with the following variables:

```env
NODE_ENV=production
PORT=3001
MONGODB_URI=mongodb://your-mongo-uri
JWT_SECRET=your-secure-jwt-secret
SPOTIFY_CLIENT_ID=your-spotify-id
SPOTIFY_CLIENT_SECRET=your-spotify-secret
SENTRY_DSN=your-sentry-dsn (optional)
LOG_LEVEL=info
```

### 3. Deploying with Docker Compose
Run the following command in the `server/` directory:

```bash
docker-compose up -d --build
```

This will start the server on port 3001 and a local MongoDB instance.

## Client Deployment

The client is an Electron application. For production, you should build the distribution binaries.

### 1. Build Instructions
1. Update `client/src/renderer/services/socket.ts` (or relevant config) to point to your production server URL.
2. Run the build command:

```bash
cd client
npm run build
```

### 2. Packaging
To create an executable for Windows/macOS/Linux:

```bash
npm run package
```

## Monitoring & Observability

### Logging
We use **Pino** for structured logging. Logs are output in JSON format in production, which is compatible with most log management tools (e.g., Logtail, Datadog).

### Error Tracking
**Sentry** is integrated into the server. To enable it, provide a `SENTRY_DSN` in your environment variables.

## Security Recommendations
1. **SSL/TLS**: Always use a reverse proxy like Nginx or Caddy with Let's Encrypt to provide HTTPS/WSS.
2. **Secrets**: Never commit your `.env` file to version control.
3. **CORS**: Update the `ALLOWED_ORIGINS` in your environment variables to match your production domain.
