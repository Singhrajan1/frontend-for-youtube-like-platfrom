import apiClient from "./client";

export const commentApi = {
  // Create comment on video
  createVideoComment: async (videoId, content) => {
    const response = await apiClient.post(`/comments/video/${videoId}`, { content });
    return response.data?.data;
  },

  // Create comment on post
  createPostComment: async (postId, content) => {
    const response = await apiClient.post(`/comments/post/${postId}`, { content });
    return response.data?.data;
  },

  // Get video comments with pagination
  getVideoComments: async (videoId, page = 1, limit = 10) => {
    const response = await apiClient.get(`/comments/video/${videoId}`, {
      params: { page, limit },
    });
    return response.data?.data; // { comments, page, limit }
  },

  // Get post comments with pagination
  getPostComments: async (postId, page = 1, limit = 10) => {
    const response = await apiClient.get(`/comments/post/${postId}`, {
      params: { page, limit },
    });
    return response.data?.data; // { comments, page, limit }
  },

  // Update comment
  updateComment: async (commentId, content) => {
    const response = await apiClient.patch(`/comments/${commentId}`, { content });
    return response.data?.data;
  },

  // Delete comment
  deleteComment: async (commentId) => {
    const response = await apiClient.delete(`/comments/${commentId}`);
    return response.data?.data;
  },
};
