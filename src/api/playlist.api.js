import apiClient from "./client";

export const playlistApi = {
  // Create playlist
  createPlaylist: async ({ name, description }) => {
    const response = await apiClient.post("/playlists", { name, description });
    return response.data?.data;
  },

  // Get all playlists by user ID
  getUserPlaylists: async (userId) => {
    const response = await apiClient.get(`/playlists/user/${userId}`);
    return response.data?.data || [];
  },

  // Get playlist by ID (includes populated videos & owner)
  getPlaylistById: async (playlistId) => {
    const response = await apiClient.get(`/playlists/${playlistId}`);
    return response.data?.data;
  },

  // Update playlist details
  updatePlaylist: async (playlistId, { name, description }) => {
    const response = await apiClient.patch(`/playlists/${playlistId}`, {
      name,
      description,
    });
    return response.data?.data;
  },

  // Delete playlist
  deletePlaylist: async (playlistId) => {
    const response = await apiClient.delete(`/playlists/${playlistId}`);
    return response.data?.data;
  },

  // Add video to playlist
  addVideoToPlaylist: async (playlistId, videoId) => {
    const response = await apiClient.post(`/playlists/${playlistId}/videos/${videoId}`);
    return response.data?.data;
  },

  // Remove specific video from playlist
  removeVideoFromPlaylist: async (playlistId, videoId) => {
    const response = await apiClient.delete(`/playlists/${playlistId}/videos/${videoId}`);
    return response.data?.data;
  },
};
