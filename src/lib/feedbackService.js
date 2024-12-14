import apiClient from '@/lib/axios';

export const feedbackService = {
  // Create new feedback
  createFeedback: async (feedbackData) => {
    const response = await apiClient.post('/api/feedback', feedbackData);
    return response.data;
  },

  // Get user's feedback
  getMyFeedback: async () => {
    const response = await apiClient.get('/api/feedback/me');
    return response.data;
  },
};
