import axios from "axios";

// Client-side axios instance for calling our own /api routes from client
// components. Auth now rides on the httpOnly `buddyToken` cookie (sent
// automatically for same-origin requests); we still attach a localStorage
// Bearer token when present as a fallback during the migration window.
const api = axios.create({
  baseURL: "/api",
});

api.interceptors.request.use((config) => {
  if (typeof window !== "undefined") {
    const token = localStorage.getItem("buddyToken");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
  }
  return config;
});

export default api;
