# Realtime Chat App (MERN + Socket.io)

A full-stack real-time chat application built with **MongoDB, Express, React, Node.js**, and **Socket.io** for instant messaging.

## Features

- Instant messaging via Socket.io (no polling, no page refresh)
- Chat history persisted in MongoDB and reloaded on refresh
- Message timestamps
- Username-based dummy login (no password, stored in `sessionStorage`)
- Typing indicator
- Online user count / presence tracking
- Message status ticks (sent / read)
- Graceful reconnect handling on the client, and error handling on both REST and socket paths

## Project Structure

```
chat-app/
├── backend/
│   ├── config/db.js              # MongoDB connection
│   ├── models/                   # Message.js, User.js (Mongoose schemas)
│   ├── controllers/               # messageController.js — REST handlers
│   ├── routes/messageRoutes.js   # /api/messages routes
│   ├── sockets/chatSocket.js     # All Socket.io event logic
│   ├── middleware/errorHandler.js
│   └── server.js                 # App entry point
└── frontend/
    ├── src/
    │   ├── components/           # Login, ChatWindow, MessageBubble, MessageInput
    │   ├── hooks/useSocket.js    # Socket connection lifecycle
    │   ├── services/api.js       # Axios REST calls
    │   ├── App.jsx
    │   └── index.css
    └── vite.config.js
```

## Setup & Run

### Prerequisites
- Node.js 18+
- A MongoDB instance — either local (`mongod`) or a free [MongoDB Atlas](https://www.mongodb.com/atlas) cluster

### 1. Backend

```bash
cd backend
npm install
cp .env.example .env    # then edit MONGO_URL if needed
npm run dev              # or: npm start
```

Backend runs on `http://localhost:5000` by default.

**Environment variables** (`backend/.env`):
| Variable      | Description             |    Example                                 |
|---------------|------------------------ |------------------------------------------|
| `PORT`        | Port the Express server listens on        | `5000`                                   |
| `MONGO_URI`   | MongoDB connection string                 | `mongodb://127.0.0.1:27017/chat-app`     |
| `CLIENT_URL`  | Frontend origin, used for CORS + sockets  | `http://localhost:5173`                  |

### 2. Frontend

```bash
cd frontend
npm install
cp .env.example .env    # edit VITE_API_URL if backend runs elsewhere
npm run dev
```

Frontend runs on `http://localhost:5173` by default. Open it, enter a username, and start chatting. Open a second browser tab/window with a different username to see real-time delivery.

**Environment variables** (`frontend/.env`):
| Variable        | Description                  | Example                  |
|-----------------|-------------------------------|---------------------------|
| `VITE_API_URL`  | Base URL of the backend API  | `http://localhost:5000`  |

## REST API

| Method | Endpoint         | Description                              |
|--------|-------------------|-------------------------------------------|
| GET    | `/api/messages`   | Fetch chat history (default last 50)      |
| POST   | `/api/messages`   | Save a message (fallback path; also broadcasts via socket) |

## Socket.io Events

| Event              | Direction        | Payload                              | Purpose                          |
|---------------------|------------------|----------------------------------------|-----------------------------------|
| `userJoin`          | client → server | `username`                            | Registers presence                |
| `onlineUsers`       | server → client | `string[]`                            | Broadcast of currently online users |
| `sendMessage`       | client → server | `{ sender, text }`                    | Send a new message                |
| `receiveMessage`    | server → client | message object                        | Broadcast new message to all clients |
| `typing` / `stopTyping` | client → server | `username`                        | Typing indicator                  |
| `userTyping` / `userStopTyping` | server → client | `username`                | Relayed typing indicator          |
| `messageRead`       | client → server | `messageId`                           | Mark a message as read            |
| `messageStatusUpdate` | server → client | `{ _id, status }`                   | Broadcast status change           |
| `errorMessage`      | server → client | `string`                              | Socket-level error notification   |

## Design Decisions

- **Single source of truth for messages**: The client emits `sendMessage` over the socket; the server saves it to MongoDB and then broadcasts the saved document (with its real `_id` and `createdAt`) back to *all* clients, including the sender. This avoids client/server ID or timestamp mismatches, and means a message only ever appears once it's actually persisted.
- **REST `POST /api/messages` still exists** as a fallback/testable path (e.g. via Postman) and also triggers a broadcast if a socket connection is available on the server, so both paths stay consistent.
- **Dummy auth via `sessionStorage`**: no passwords, no JWT — a username is enough to identify a participant for this assignment's scope. Using `sessionStorage` (not `localStorage`) means each browser tab can log in as a different user, which makes local multi-user testing easy.
- **Presence tracked in-memory (`Map`) and mirrored in MongoDB**: the in-memory map is the fast path for broadcasting the online list; MongoDB is updated alongside so `isOnline`/`lastSeen` survive server restarts and could support an "offline inbox" feature later.
- **Central error handler + per-socket-event try/catch**: REST errors flow through Express's `errorHandler` middleware; socket errors are caught individually and relayed to the offending client via an `errorMessage` event, rather than crashing the whole namespace.
- **Vite + plain React** (not Create React App) for a fast dev loop; React Native was not used since the assignment allows either, and this keeps setup single-codebase and simplest to run/test.

## Assumptions

- This is a single global chat room (no private DMs or multiple rooms) — appropriate for the assignment's scope.
- "Delivered" status is treated as equivalent to a message having reached the server and other online sockets (`sent`); a separate `read` status is set explicitly when a client acknowledges via `messageRead`. A more complete delivered/read distinction would require per-recipient tracking, which is out of scope for a single-room broadcast model.
- Chat history is capped at the last 50 messages per fetch (`?limit=` query param supported, capped at 200) to keep initial load fast; infinite scroll/pagination isn't implemented.
- No message editing/deleting — out of scope for the stated requirements.


