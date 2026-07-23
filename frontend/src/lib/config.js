function trimTrailingSlash(value) {
  return value?.replace(/\/+$/, "") || "";
}

const apiUrl = trimTrailingSlash(import.meta.env.VITE_API_URL);
const socketUrl = trimTrailingSlash(import.meta.env.VITE_SOCKET_URL);

export const API_BASE_URL = apiUrl || (import.meta.env.MODE === "development" ? "http://localhost:3000/api" : "/api");
export const SOCKET_BASE_URL =
  socketUrl || (import.meta.env.MODE === "development" ? "http://localhost:3000" : "/");
