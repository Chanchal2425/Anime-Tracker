// api.js
import axios from "axios";

const API = axios.create({
  baseURL: "http://127.0.0.1:8000/api",
});

API.interceptors.request.use((config) => {
  const token = localStorage.getItem("access");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

API.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && (error.response.status === 401 || error.response.status === 403)) {
      console.warn("Authentication error detected. Clearing invalid token.");
      localStorage.removeItem("access");
      localStorage.removeItem("refresh");

      // Redirect to login page if user isn't on a public route (e.g. public shared notes)
      const isPublicRoute = window.location.pathname.startsWith("/note/");
      if (!isPublicRoute && window.location.pathname !== "/login") {
        window.location.href = "/login";
      }
    }
    return Promise.reject(error);
  }
);

export default API;