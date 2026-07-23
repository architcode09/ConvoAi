import express from "express";
import http from "http";
import { Server } from "socket.io";

const app = express();
const server = http.createServer(app);

function getAllowedOrigins() {
  const configuredOrigins = process.env.FRONTEND_URL?.split(",")
    .map((origin) => origin.trim())
    .filter(Boolean);

  // If no explicit list is configured, we'll handle dynamically (monolith mode)
  return configuredOrigins || [];
}

const allowedOrigins = getAllowedOrigins();

const io = new Server(server, {
  cors: {
    origin: (origin, callback, req) => {
      // No origin header \u2192 non-browser or same-site request \u2192 allow
      if (!origin) return callback(null, true);

      // No allow-list configured \u2192 allow all (monolith: frontend served from same origin)
      if (allowedOrigins.length === 0) return callback(null, true);

      // Explicitly listed origin \u2192 allow
      if (allowedOrigins.includes(origin)) return callback(null, true);

      // Always allow the app's own host (handles Render/production same-origin WS)
      const host = req?.headers?.host;
      if (host && (origin === `https://${host}` || origin === `http://${host}`)) {
        return callback(null, true);
      }

      callback(new Error("Socket.IO origin not allowed"));
    },
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
