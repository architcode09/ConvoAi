import express from "express";
import http from "http";
import { Server } from "socket.io";

const app = express();
const server = http.createServer(app);

function getAllowedOrigins() {
  const configuredOrigins = process.env.FRONTEND_URL?.split(",")
    .map((origin) => origin.trim())
    .filter(Boolean);

  const defaults = ["http://localhost:5173", "http://127.0.0.1:5173"];
  return [...new Set([...(configuredOrigins || []), ...defaults])];
}

const allowedOrigins = getAllowedOrigins();

const io = new Server(server, {
  cors: {
    origin: (origin, callback) => {
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
        return;
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
