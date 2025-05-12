import apiClient from "@/lib/axios";

export const subscriptionService = {
  // Get all available subscription plans
  getPlans: async () => {
    const response = await apiClient.get("/subscription/plans");
    return response.data;
  },

  // Get current user's subscription
  getCurrentSubscription: async () => {
    const response = await apiClient.get("/subscription/my-subscription");
    return response.data;
  },

  // Check subscription limits
  checkLimits: async () => {
    const response = await apiClient.get("/subscription/subscription-limits");
    return response.data;
  },

  // Increment story count
  incrementStoryCount: async () => {
    const response = await apiClient.post(
      "/subscription/increment-story-count"
    );
    return response.data;
  },

  // Create checkout session for subscription upgrade
  createCheckoutSession: async (tier) => {
    const response = await apiClient.post(
      `/subscription/create-checkout-session/${tier}`
    );
    return response.data;
  },

  // Upgrade subscription (for free tier changes)
  upgradeSubscription: async (tier) => {
    const response = await apiClient.post(`/subscription/upgrade/${tier}`);
    return response.data;
  },

  // Cancel subscription
  cancelSubscription: async () => {
    const response = await apiClient.post("/subscription/cancel-subscription");
    return response.data;
  },
};
