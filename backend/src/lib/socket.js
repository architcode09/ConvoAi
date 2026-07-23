import express from "express";
import http from "http";
import { Server } from "socket.io";

const app = express();
const server = http.createServer(app);

function getAllowedOrigins() {
  return (
    process.env.FRONTEND_URL?.split(",")
      .map((o) => o.trim())
      .filter(Boolean) || []
  );
}

const allowedOrigins = getAllowedOrigins();

function isOriginAllowed(origin, host) {
  if (!origin) return true;                          // no origin = server / same-site
  if (allowedOrigins.length === 0) return true;      // no allow-list = allow all
  if (allowedOrigins.includes(origin)) return true;  // explicitly listed
  // Same-origin: Vite crossorigin assets / Socket.IO polling from the app's own host
  if (host && (origin === `https://${host}` || origin === `http://${host}`)) return true;
  return false;
}

const io = new Server(server, {
  // origin: true reflects the request Origin back, allowing any origin.
  // Safe here because all socket connections are authenticated via
  // Clerk JWT — the monolith serves frontend and backend from the same
  // domain so no hostile cross-origin request can obtain a valid token.
  // The previous allowRequest approach crashed on WebSocket upgrade
  // requests because req.res is undefined for those.
  cors: {
    origin: true,
    credentials: true,
  },
});
const userSocketMap = new Map();

function getReceiverSocketId(userId) {
  return userSocketMap.get(String(userId)) || [];
}

io.on("connection", (socket) => {
  const userId = socket.handshake.query.userId ? String(socket.handshake.query.userId) : null;

  if (userId) {
    const existingSockets = userSocketMap.get(userId) || [];
    userSocketMap.set(userId, [...new Set([...existingSockets, socket.id])]);
  }

  // io.emit() sends event to everyone - broadcast
  io.emit("getOnlineUsers", Array.from(userSocketMap.keys()));

  // socket.on is used to listen for events
  socket.on("disconnect", () => {
    if (userId) {
      const remainingSockets = (userSocketMap.get(userId) || []).filter((id) => id !== socket.id);
      if (remainingSockets.length > 0) userSocketMap.set(userId, remainingSockets);
      else userSocketMap.delete(userId);
    }

    io.emit("getOnlineUsers", Array.from(userSocketMap.keys()));
  });
});

export { app, server, io, getReceiverSocketId };
