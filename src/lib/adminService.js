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
    try {
      // Use the Next.js API route for login
      const response = await fetch("/api/admin/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email, password }),
      });

      if (!response.ok) {
        // Get the content type to check if it's JSON
        const contentType = response.headers.get("content-type");
        if (contentType && contentType.includes("application/json")) {
          const error = await response.json();
          throw error;
        } else {
          // Handle non-JSON responses (like HTML)
          const text = await response.text();
          throw new Error(`Server error: ${response.status}`);
        }
      }

      return response.json();
    } catch (error) {
      console.error("Login error:", error);
      throw error;
    }
  },

  // Get all stories
  getAllStories: async () => {
    const response = await adminApiClient.get("/author/stories");
    console.log("Fetched stories:", response.data);
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
    // First update the response
    const response = await adminApiClient.put(
      `/api/feedback/${feedbackId}/response`,
      { response: responseData.response,
        status: responseData.status
      }
    );

    return response.data;
  },

  statusUP: async (feedbackId, responseData) => {
    const response = await adminApiClient.put(
      `/api/feedback/${feedbackId}/status`,
      { 
        status: responseData.status
      }
    );

    return response.data;
  },

  deleteFeedback: async (feedbackId) => {
    const response = await adminApiClient.delete(`/api/feedback/${feedbackId}`);
    return response.data;
  },

  markFeedbackAsRead: async (feedbackId) => {
    const response = await adminApiClient.put(
      `/api/feedback/${feedbackId}/mark-read`
    );
    return response.data;
  },

  getUnreadFeedbackCount: async () => {
    const response = await adminApiClient.get("/api/feedback/unread/count");
    return response.data;
  },

  getAllSubscriptions: async () => {
    const res = await fetch("/api/admin/subscription-plans");
    if (!res.ok) throw new Error("Failed to fetch subscriptions");
    return res.json();
  },

  getCollaborationStats: async () => {
    const res = await fetch("/api/admin/collaborations/stats");
    if (!res.ok) throw new Error("Failed to fetch collaboration stats");
    return res.json();
  },

  // Update user active status
  updateUserActiveStatus: async (userId, isActive) => {
    const response = await adminApiClient.put(`/admin/users/${userId}/active`, {
      is_active: isActive,
    });
    return response.data;
  },

  // Delete user
  deleteUser: async (userId) => {
    const response = await adminApiClient.delete(`/admin/users/${userId}`);
    return response.data;
  },

  // Delete story
  deleteStory: async (storyId) => {
    const response = await adminApiClient.delete(`/admin/stories/${storyId}`);
    return response.data;
  },
};
