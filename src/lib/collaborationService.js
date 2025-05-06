import storyApiClient from "./storyApi";
import { toast } from "react-hot-toast";

export const collaborationService = {
  // Add a collaborator by user ID
  async addCollaborator(storyId, userId, collaboratorId) {
    try {
      const response = await storyApiClient.post(
        `/stories/${storyId}/collaborators`,
        {
          user_id: userId,
          collaborator_id: collaboratorId,
        }
      );
      toast.success("Collaborator added successfully");
      return response.data;
    } catch (error) {
      console.error("Error adding collaborator:", error);
      toast.error(error.response?.data?.detail || "Failed to add collaborator");
      throw error;
    }
  },

  // Add a collaborator by email
  async addCollaboratorByEmail(storyId, userId, email) {
    try {
      const response = await storyApiClient.post(
        `/stories/${storyId}/collaborators/email`,
        {
          user_id: userId,
          email: email,
        }
      );
      toast.success("Collaborator added successfully");
      return response.data;
    } catch (error) {
      console.error("Error adding collaborator by email:", error);
      toast.error(error.response?.data?.detail || "Failed to add collaborator");
      throw error;
    }
  },

  // Remove a collaborator by user ID
  async removeCollaborator(storyId, userId, collaboratorId) {
    try {
      const response = await storyApiClient.delete(
        `/stories/${storyId}/collaborators`,
        {
          data: {
            user_id: userId,
            collaborator_id: collaboratorId,
          },
        }
      );
      toast.success("Collaborator removed successfully");
      return response.data;
    } catch (error) {
      console.error("Error removing collaborator:", error);
      toast.error(
        error.response?.data?.detail || "Failed to remove collaborator"
      );
      throw error;
    }
  },

  // Remove a collaborator by email
  async removeCollaboratorByEmail(storyId, userId, email) {
    try {
      const response = await storyApiClient.delete(
        `/stories/${storyId}/collaborators/email`,
        {
          data: {
            user_id: userId,
            email: email,
          },
        }
      );
      toast.success("Collaborator removed successfully");
      return response.data;
    } catch (error) {
      console.error("Error removing collaborator by email:", error);
      toast.error(
        error.response?.data?.detail || "Failed to remove collaborator"
      );
      throw error;
    }
  },

  // Get all collaborators for a story
  async getCollaborators(storyId, userId) {
    try {
      const response = await storyApiClient.get(
        `/stories/${storyId}/collaborators`,
        {
          params: { user_id: userId },
        }
      );
      return response.data.collaborators;
    } catch (error) {
      console.error("Error fetching collaborators:", error);
      toast.error(
        error.response?.data?.detail || "Failed to fetch collaborators"
      );
      throw error;
    }
  },

  // Check if a user has access to a story
  async checkAccess(storyId, userId) {
    try {
      const response = await storyApiClient.get(`/stories/${storyId}/access`, {
        params: { user_id: userId },
      });
      return {
        hasAccess: response.data.has_access,
        role: response.data.role || "reader",
        reason: response.data.reason,
      };
    } catch (error) {
      console.error("Error checking access:", error);
      return { hasAccess: false, reason: error.message };
    }
  },

  // Find a user by email
  async findUserByEmail(email) {
    try {
      const response = await storyApiClient.get(
        `/stories/users/email/${email}`
      );
      return response.data.user;
    } catch (error) {
      console.error("Error finding user by email:", error);
      toast.error(error.response?.data?.detail || "User not found");
      throw error;
    }
  },
};

export default collaborationService;
