# WeVibin' - Desktop Music Party App

A desktop application that combines synchronized music playback, push-to-talk voice communication, and a friend system with real-time chat. Now featuring full database persistence and collaborative song queues.

## New Features
- **Persistence**: User accounts, friendships, and room states now persist in MongoDB.
- **Authentication**: Secure JWT-based registration and login system.
- **Collaborative Queue**: Any participant can add songs to the room's global queue.
- **Observability**: Structured logging with Pino and error tracking with Sentry.
- **Containerization**: Ready for production deployment with Docker and Docker Compose.

## Prerequisites
- Node.js (v18 or higher)
- npm or yarn
- MongoDB (Local or Atlas)
- Spotify Premium (for Spotify playback features)

## Installation

### 1. Environment Configuration
Copy `.env.example` to `.env` and fill in your credentials:
```bash
cp .env.example .env
```

### 2. Server Setup
```bash
cd server
npm install
npx prisma generate
npx prisma db push
```

### 3. Client Setup
```bash
cd client
npm install
```

## Running the Application

### 1. Start the Server
```bash
cd server
npm run dev
```
The server will run on `http://localhost:3001`

### 2. Start the Client (Development)
In a terminal:
```bash
cd client
npm run dev
```

In another terminal:
```bash
cd client
npm run electron
```

## Production Deployment
See [PROD_DEPLOY.md](PROD_DEPLOY.md) for detailed instructions on deploying with Docker.

## Project Structure
```
WeVibin'/
├── server/
│   ├── prisma/           # Database schema
│   ├── src/
│   │   ├── lib/          # Prisma client
│   │   ├── middleware/   # Socket.IO & Express auth
│   │   ├── utils/        # Auth, Logger, etc.
│   │   ├── index.ts      # Main server entry
│   │   ├── rooms.ts      # Room & Queue logic
│   │   └── friends.ts    # Friend relationship logic
│   └── Dockerfile        # Container config
└── client/
    ├── src/
    │   ├── main/         # Electron main process
    │   └── renderer/     # React app
    │       ├── components/ # UI (Room, Queue, etc.)
    │       ├── context/    # Auth & State context
...
```

## Troubleshooting
- **Database Connection**: Ensure `MONGODB_URI` is correctly set in your `.env`.
- **Sync Issues**: Audio correction occurs every 5 seconds. Ensure all users have stable internet connections.
- **Spotify Auth**: Check that your Redirect URI in the Spotify Dashboard matches `https://localhost:5176/callback` (dev) or your production domain.

## License
MIT
