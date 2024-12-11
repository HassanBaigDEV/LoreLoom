import apiClient from './axios';

export const subscriptionService = {
  async getPlans() {
    const response = await apiClient.get('/subscription/plans');
    return response.data;
  },

  async getCurrentSubscription() {
    const response = await apiClient.get('/subscription/my-subscription');
    return response.data;
  },

  async createCheckoutSession(tier) {
    const response = await apiClient.post(`/subscription/create-checkout-session/${tier}`);
    return response.data;
  },

  async upgrade(tier) {
    const response = await apiClient.post(`/subscription/upgrade/${tier}`);
    return response.data;
  },

  async checkLimits() {
    const response = await apiClient.get('/subscription/check-limits');
    return response.data;
  },

  async verifySession(sessionId) {
    const response = await apiClient.post('/subscription/verify-session', { sessionId });
    return response.data;
  }
}; 