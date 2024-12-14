import adminApiClient from "./adminApiClient";

export const adminService = {
  // Get all users
  getAllUsers: async () => {
    const response = await adminApiClient.get("/admin/users");
    return response.data;
  },

  // Update user role
  updateUserRole: async (userId, role) => {
    const response = await adminApiClient.put(`/admin/users/${userId}/role`, {
      role,
    });
    return response.data;
  },

  // Get all feedback
  getAllFeedback: async (status = null) => {
    const url = status ? `/admin/feedback?status=${status}` : "/admin/feedback";
    const response = await adminApiClient.get(url);
    return response.data;
  },

  // Update feedback
  updateFeedback: async (feedbackId, updateData) => {
    const response = await adminApiClient.put(
      `/admin/feedback/${feedbackId}`,
      updateData
    );
    return response.data;
  },

  // Get dashboard stats
  getDashboardStats: async () => {
    const response = await adminApiClient.get("/admin/dashboard");
    return response.data;
  },

  // Admin Login
  login: async (email, password) => {
    // Use the Next.js API route for login
    const response = await fetch("/api/admin/login", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ email, password }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw error;
    }

    return response.json();
  },

  // Get all stories
  getAllStories: async () => {
    const response = await adminApiClient.get("/admin/stories");
    return response.data;
  },
  getAllSubmissions: async () => {
    const response = await adminApiClient.get("/admin/submissions");
    return response.data;
  },

  getFeedback: async (feedbackId) => {
    const response = await adminApiClient.get(`/api/feedback/${feedbackId}`);
    return response.data;
  },

  respondToFeedback: async (feedbackId, responseData) => {
    const response = await adminApiClient.put(
      `/api/feedback/${feedbackId}/response`,
      responseData
    );
    return response.data;
  },

  deleteFeedback: async (feedbackId) => {
    const response = await adminApiClient.delete(`/api/feedback/${feedbackId}`);
    return response.data;
  },

  markFeedbackAsRead: async (feedbackId) => {
    const response = await adminApiClient.put(`/api/feedback/${feedbackId}/mark-read`);
    return response.data;
  },

  getUnreadFeedbackCount: async () => {
    const response = await adminApiClient.get('/api/feedback/unread/count');
    return response.data;
  },
};
