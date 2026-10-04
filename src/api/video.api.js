import apiClient from "./client";

export const videoApi = {
  // Get all videos with pagination, search, sorting and user filter
  getAllVideos: async ({
    page = 1,
    limit = 12,
    query = "",
    sortBy = "createdAt",
    sortType = "desc",
    userId = "",
  } = {}) => {
    const params = { page, limit, sortBy, sortType };
    if (query?.trim()) params.query = query.trim();
    if (userId?.trim()) params.userId = userId.trim();

    const response = await apiClient.get("/videos", { params });
    return response.data?.data;
  },

  // Get a single video by ID
  getVideoById: async (videoId) => {
    const response = await apiClient.get(`/videos/${videoId}`);
    return response.data?.data;
  },

  // Publish / upload new video with real progress tracking
  publishVideo: async (formData, onProgress) => {
    const response = await apiClient.post("/videos", formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
      onUploadProgress: (progressEvent) => {
        if (onProgress && progressEvent.total) {
          const percent = Math.round((progressEvent.loaded * 100) / progressEvent.total);
          onProgress(percent, progressEvent.loaded, progressEvent.total);
        }
      },
    });
    return response.data?.data;
  },

  // Delete a video
  deleteVideo: async (videoId) => {
    const response = await apiClient.delete(`/videos/${videoId}`);
    return response.data;
  },
};
