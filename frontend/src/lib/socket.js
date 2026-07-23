import { io } from "socket.io-client";
import { SOCKET_BASE_URL } from "./config";

let socket;

export function getSocket() {
  return socket ?? null;
}

export function connectSocket(userId) {
  if (!userId) return null;

  // Reuse the existing socket instance even if it's temporarily disconnected.
  // Checking only socket?.connected caused a new socket to be created whenever
  // the server restarted (e.g. Render free-tier spin-down), abandoning the old
  // socket that still had the newMessage listener — requiring a page refresh.
  // Socket.IO's built-in reconnection handles re-establishing the connection
  // without losing any registered event listeners.
  if (socket) return socket;

  socket = io(SOCKET_BASE_URL, {
    autoConnect: true,
    query: { userId },
    withCredentials: true,
    transports: ["websocket", "polling"],
  });

  return socket;
}

export function disconnectSocket() {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
}
