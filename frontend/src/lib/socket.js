import { io } from "socket.io-client";
import { SOCKET_BASE_URL } from "./config";

let socket;

export function getSocket() {
  return socket ?? null;
}

export function connectSocket(userId) {
  if (!userId) return null;
  if (socket?.connected) return socket;

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
