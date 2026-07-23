# ConvoAI

Full-stack real-time chat app with:

- React + Vite frontend
- Express + MongoDB backend
- Clerk authentication
- Socket.IO realtime messaging
- ImageKit media uploads
- Gemini-powered AI assistance
- Theme presets, wallpapers, and responsive UI

## Project Structure

```text
backend/   Express API, Clerk sync, MongoDB, Socket.IO, uploads
frontend/  React app, Redux Toolkit state, Clerk client, chat UI
```

## Requirements

- Node.js 22+
- npm
- MongoDB Atlas or local MongoDB
- Clerk app
- ImageKit account for media uploads

## Environment Variables

### Backend: `backend/.env`

```bash
PORT=3000
NODE_ENV=development

MONGO_URI=mongodb+srv://<user>:<password>@<cluster>/<db>

CLERK_PUBLISHABLE_KEY=pk_...
CLERK_SECRET_KEY=sk_...
CLERK_WEBHOOK_SIGNING_SECRET=whsec_...

IMAGEKIT_PRIVATE_KEY=private_...
# Backward-compatible fallback if your existing file already uses this typo:
IMAAGEKIT_PRIVATE_KEY=private_...

FRONTEND_URL=http://localhost:5173

# Optional in production for cron health ping
BACKEND_URL=https://your-backend-domain.com

GEMINI_API_KEY=AIza...
GEMINI_MODEL=gemini-3.5-flash-lite
```

### Frontend: `frontend/.env`

```bash
VITE_CLERK_PUBLISHABLE_KEY=pk_...

# Optional overrides
VITE_API_URL=http://localhost:3000/api
VITE_SOCKET_URL=http://localhost:3000
```

You can copy the checked-in templates:

```bash
cp backend/.env.example backend/.env
cp frontend/.env.example frontend/.env
```

## Install

```bash
cd backend
npm install

cd ../frontend
npm install
```

## Run in Development

Start the backend:

```bash
cd backend
npm run dev
```

Start the frontend in a second terminal:

```bash
cd frontend
npm run dev
```

Frontend default URL:

```text
http://localhost:5173
```

Backend health check:

```text
http://localhost:3000/health
```

## Seed Demo Users

The backend includes demo contacts so the chat list is not empty:

```bash
cd backend
npm run db:seed
```

## Production Build

Backend:

```bash
cd backend
npm run build
npm start
```

Frontend:

```bash
cd frontend
npm run build
npm run preview
```

## Docker

The repository includes a root `Dockerfile` that builds the Vite frontend and serves it from the Express backend.

Build:

```bash
docker build -t convoai \
  --build-arg VITE_CLERK_PUBLISHABLE_KEY=pk_... \
  .
```

Run:

```bash
docker run -p 3001:3001 --env-file backend/.env convoai
```

If your deployed frontend needs explicit backend URLs, you can also build with:

```bash
docker build -t convoai \
  --build-arg VITE_CLERK_PUBLISHABLE_KEY=pk_... \
  --build-arg VITE_API_URL=https://your-domain.com/api \
  --build-arg VITE_SOCKET_URL=https://your-domain.com \
  .
```

## Docker Compose

```bash
docker compose up --build
```

The compose file expects:

- `backend/.env` for server-side secrets
- `VITE_CLERK_PUBLISHABLE_KEY` available in your shell or a root `.env` file for build-time injection

## Publish Checklist

Before pushing this repository to GitHub:

1. Rotate any secrets that were previously committed or shared.
2. Keep real secrets only in local `.env` files or deployment secrets.
3. Commit `backend/.env.example` and `frontend/.env.example`, not real `.env` files.
4. Verify `FRONTEND_URL`, `VITE_API_URL`, and `VITE_SOCKET_URL` match your deployed domains.
5. Use a Gemini project with available quota or billing enabled.

## Deployment Notes

- The Docker image serves the built frontend from the Express app, so one container is enough for basic deployments.
- Set `PORT=3001` inside the container and map your host or platform port to it.
- For platforms like Render, Railway, Fly.io, or a VPS, provide backend env vars from `backend/.env.example`.
- `VITE_CLERK_PUBLISHABLE_KEY` must be provided at build time because it is embedded into the frontend bundle.

## Authentication and Clerk Sync

- Frontend signs users in with Clerk.
- Frontend sends the Clerk bearer token to the backend on API requests.
- Backend verifies the Clerk session with `@clerk/express`.
- If a Clerk user is missing in MongoDB, the backend auto-syncs that user on the first authenticated request.
- Clerk webhook support is still present for proactive syncing on create, update, and delete events.

## Verified Features

- Clerk auth bootstrap
- Backend auth check route
- Clerk to MongoDB user sync
- AI rewrite, reply suggestions, chat summaries, and translation through backend routes
- Redux Toolkit state management
- Conversation sidebar
- Message fetching
- Realtime incoming messages with Socket.IO
- Multi-tab online user tracking
- Image/video upload validation
- Theme switching
- Wallpaper switching
- Responsive footer on auth and chat pages

## Validation Commands

Frontend:

```bash
cd frontend
npm run lint
npm run build
```

Backend:

```bash
cd backend
npm run build
```

## Notes

- If you expose real secrets in `.env`, rotate them after testing.
- Media uploads require a valid ImageKit private key.
- For production with separate frontend/backend domains, set `VITE_API_URL`, `VITE_SOCKET_URL`, `FRONTEND_URL`, and `BACKEND_URL` explicitly.
- If Gemini requests fail with quota errors, switch to a project with free-tier availability or enable billing.
