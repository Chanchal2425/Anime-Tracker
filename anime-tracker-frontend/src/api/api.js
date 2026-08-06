import axios from "axios";

const API = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL
    ? `${import.meta.env.VITE_API_BASE_URL}/api`
    : "https://anime-tracker-fltw.onrender.com/api",
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

      // Redirect to login page if user isn't on a public route
      const isPublicRoute = window.location.pathname.startsWith("/note/");
      if (!isPublicRoute && window.location.pathname !== "/login") {
        window.location.href = "/login";
      }
    }
    return Promise.reject(error);
  }
);

export default API;