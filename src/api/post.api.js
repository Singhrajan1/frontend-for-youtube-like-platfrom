import apiClient from "./client";

export const postApi = {
  // Create community post (formData: content, optional image file)
  createPost: async (formData) => {
    const response = await apiClient.post("/posts", formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });
    return response.data?.data;
  },

  // Get all community posts
  getAllPosts: async () => {
    const response = await apiClient.get("/posts/all");
    return response.data?.data || [];
  },

  // Get posts by a specific user
  getUserPosts: async (userId) => {
    const response = await apiClient.get(`/posts/user/${userId}`);
    return response.data?.data || [];
  },

  // Update a post (formData: content, optional image file)
  updatePost: async (postId, formData) => {
    const response = await apiClient.patch(`/posts/${postId}`, formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });
    return response.data?.data;
  },

  // Delete a post
  deletePost: async (postId) => {
    const response = await apiClient.delete(`/posts/${postId}`);
    return response.data;
  },
};
