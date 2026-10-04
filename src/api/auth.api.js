import apiClient, { setStoredAccessToken } from "./client";

export const authApi = {
  // Register with multipart form data: fullname, username, email, password, avatar (file), coverImage (file)
  register: async (formData) => {
    const response = await apiClient.post("/users/register", formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });
    return response.data?.data;
  },

  // Login: { username, email, password }
  login: async ({ username, email, password }) => {
    const payload = {};
    if (username?.trim()) payload.username = username.trim();
    if (email?.trim()) payload.email = email.trim();
    payload.password = password;

    const response = await apiClient.post("/users/login", payload);
    const data = response.data?.data;
    if (data?.accessToken) {
      setStoredAccessToken(data.accessToken);
    }
    if (data?.refreshToken) {
      localStorage.setItem("vortex_refresh_token", data.refreshToken);
    }
    return data;
  },

  // Logout
  logout: async () => {
    try {
      await apiClient.post("/users/logout");
    } finally {
      setStoredAccessToken(null);
      localStorage.removeItem("vortex_refresh_token");
    }
  },

  // Get current authenticated user
  getCurrentUser: async () => {
    const response = await apiClient.get("/users/current-user");
    return response.data?.data;
  },

  // Change current password
  changePassword: async ({ oldPassword, newPassword }) => {
    const response = await apiClient.post("/users/change-password", {
      oldPassword,
      newPassword,
    });
    return response.data;
  },

  // Update account details (fullname, email)
  updateAccountDetails: async ({ fullname, email }) => {
    const response = await apiClient.patch("/users/update-account", {
      fullname,
      email,
    });
    return response.data?.data;
  },

  // Update user avatar (multipart)
  updateAvatar: async (file) => {
    const formData = new FormData();
    formData.append("avatar", file);
    const response = await apiClient.patch("/users/avatar", formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });
    return response.data?.data;
  },

  // Update user cover image (multipart)
  updateCoverImage: async (file) => {
    const formData = new FormData();
    formData.append("coverImage", file);
    const response = await apiClient.patch("/users/cover-image", formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });
    return response.data?.data;
  },

  // Get public channel profile by username
  getChannelProfile: async (username) => {
    const response = await apiClient.get(`/users/c/${encodeURIComponent(username)}`);
    return response.data?.data;
  },

  // Get watch history
  getWatchHistory: async () => {
    const response = await apiClient.get("/users/history");
    return response.data?.data || [];
  },

  // Add video to watch history
  addToWatchHistory: async (videoId) => {
    const response = await apiClient.post(`/users/history/${videoId}`);
    return response.data;
  },
};
