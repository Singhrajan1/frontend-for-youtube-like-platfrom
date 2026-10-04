import apiClient from "./client";

export const likeApi = {
  // Toggle video like
  toggleVideoLike: async (videoId) => {
    const response = await apiClient.post(`/likes/toggle/video/${videoId}`);
    return response.data?.data; // { liked: boolean }
  },

  // Toggle comment like
  toggleCommentLike: async (commentId) => {
    const response = await apiClient.post(`/likes/toggle/comment/${commentId}`);
    return response.data?.data; // { liked: boolean }
  },

  // Toggle post like
  togglePostLike: async (postId) => {
    const response = await apiClient.post(`/likes/toggle/post/${postId}`);
    return response.data?.data; // { liked: boolean }
  },

  // Get video likes count
  getVideoLikesCount: async (videoId) => {
    const response = await apiClient.get(`/likes/count/video/${videoId}`);
    return response.data?.data?.count ?? 0;
  },

  // Get comment likes count
  getCommentLikesCount: async (commentId) => {
    const response = await apiClient.get(`/likes/count/comment/${commentId}`);
    return response.data?.data?.count ?? 0;
  },

  // Get post likes count
  getPostLikesCount: async (postId) => {
    const response = await apiClient.get(`/likes/count/post/${postId}`);
    return response.data?.data?.count ?? 0;
  },

  // Check if video is liked by logged in user
  isVideoLiked: async (videoId) => {
    const response = await apiClient.get(`/likes/status/video/${videoId}`);
    return !!response.data?.data?.liked;
  },

  // Check if comment is liked by logged in user
  isCommentLiked: async (commentId) => {
    const response = await apiClient.get(`/likes/status/comment/${commentId}`);
    return !!response.data?.data?.liked;
  },

  // Check if post is liked by logged in user
  isPostLiked: async (postId) => {
    const response = await apiClient.get(`/likes/status/post/${postId}`);
    return !!response.data?.data?.liked;
  },
};
