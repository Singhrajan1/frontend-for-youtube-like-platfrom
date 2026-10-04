import axios from "axios";

// Primary API baseURL uses the proxy path '/api/v1', or VITE_API_URL if specified
const baseURL = import.meta.env.VITE_API_URL || "/api/v1";

const apiClient = axios.create({
  baseURL,
  withCredentials: true, // Send httpOnly cookies automatically
  headers: {
    "Content-Type": "application/json",
  },
});

// In-memory token storage (also synced with localStorage for cross-tab persistence)
let memoryAccessToken = localStorage.getItem("vortex_access_token") || null;

export const setStoredAccessToken = (token) => {
  memoryAccessToken = token;
  if (token) {
    localStorage.setItem("vortex_access_token", token);
  } else {
    localStorage.removeItem("vortex_access_token");
  }
};

export const getStoredAccessToken = () => {
  return memoryAccessToken || localStorage.getItem("vortex_access_token");
};

// Request interceptor: attach authorization header if token exists
apiClient.interceptors.request.use(
  (config) => {
    const token = getStoredAccessToken();
    if (token && !config.headers.Authorization) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Concurrency lock for refresh token
let isRefreshing = false;
let failedQueue = [];

const processQueue = (error, token = null) => {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token);
    }
  });
  failedQueue = [];
};

// Response interceptor: handle 401 & refresh token
apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // Check if error is 401 and request hasn't been retried yet
    // Skip refresh token logic if the failed request itself is login, register, or refreshToken
    const isAuthRoute =
      originalRequest.url.includes("/users/login") ||
      originalRequest.url.includes("/users/register") ||
      originalRequest.url.includes("/users/refreshToken");

    if (error.response?.status === 401 && !originalRequest._retry && !isAuthRoute) {
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        })
          .then((token) => {
            originalRequest.headers.Authorization = `Bearer ${token}`;
            return apiClient(originalRequest);
          })
          .catch((err) => Promise.reject(err));
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        const refreshToken = localStorage.getItem("vortex_refresh_token");
        // Attempt refresh (backend reads cookie or body)
        const response = await axios.post(
          `${baseURL}/users/refreshToken`,
          { refreshToken: refreshToken || undefined },
          { withCredentials: true }
        );

        const newAccessToken = response.data?.data?.accessToken;
        const newRefreshToken = response.data?.data?.refreshToken;

        if (newAccessToken) {
          setStoredAccessToken(newAccessToken);
          if (newRefreshToken) {
            localStorage.setItem("vortex_refresh_token", newRefreshToken);
          }
          apiClient.defaults.headers.common.Authorization = `Bearer ${newAccessToken}`;
          originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
          processQueue(null, newAccessToken);
          return apiClient(originalRequest);
        } else {
          throw new Error("No access token returned in refresh response");
        }
      } catch (refreshError) {
        processQueue(refreshError, null);
        setStoredAccessToken(null);
        localStorage.removeItem("vortex_refresh_token");
        // Dispatch custom event so AuthContext can clean up session
        window.dispatchEvent(new CustomEvent("vortex_auth_expired"));
        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }

    // Format error message for easier consumption in components
    const errorMsg =
      error.response?.data?.message ||
      error.response?.data?.errors?.[0] ||
      error.message ||
      "An unexpected error occurred";

    return Promise.reject(new Error(errorMsg));
  }
);

export default apiClient;
