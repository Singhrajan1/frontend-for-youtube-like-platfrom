import apiClient from "./client";

export const subscriptionApi = {
  // Toggle subscription for a channel
  toggleSubscription: async (channelId) => {
    const response = await apiClient.post(`/subscriptions/toggle/${channelId}`);
    return response.data?.data; // { subscribed: boolean }
  },

  // Get list of channels the logged-in user is subscribed to
  getSubscribedChannels: async () => {
    const response = await apiClient.get("/subscriptions/subscribed-channels");
    return response.data?.data || [];
  },

  // Get channel subscribers or subscriber count
  getChannelSubscribers: async (channelId) => {
    const response = await apiClient.get(`/subscriptions/subscribers/${channelId}`);
    return response.data?.data;
  },
};
