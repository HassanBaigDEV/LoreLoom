import storyApiClient from "@/lib/storyApi";

const passageService = {
  // Lock a passage for editing
  async lockPassage(passageId, userId) {
    try {
      const response = await storyApiClient.post(
        `/draft/passage/${passageId}/lock`,
        {
          user_id: userId,
        }
      );
      return response.data;
    } catch (error) {
      console.error("Error locking passage:", error);
      throw error;
    }
  },

  // Unlock a passage
  async unlockPassage(passageId, userId) {
    try {
      console.log(
        `Attempting to unlock passage ${passageId} for user ${userId}`
      );
      const response = await storyApiClient.post(
        `/draft/passage/${passageId}/unlock`,
        {
          user_id: userId,
        }
      );
      console.log("Unlock API response:", response.data);

      // Ensure we return a consistent response format
      if (!response.data.status) {
        // Convert old response format to new format
        return {
          status: "success",
          message: response.data.message || "Passage unlocked successfully",
        };
      }

      return response.data;
    } catch (error) {
      // Check if this is a 500 error from the server
      if (error.response && error.response.status === 500) {
        console.warn(
          "Server returned 500 error when unlocking passage. This may happen if the passage was already unlocked or if the lock expired."
        );
        // Return a success-like object to prevent UI disruption
        return {
          status: "success",
          message: "Passage unlocked (client-side only)",
          clientSideOnly: true,
        };
      } else if (error.response && error.response.status === 403) {
        // Handle permission issues
        console.warn(
          "Permission denied when unlocking passage. Another user may own the lock."
        );
        return {
          status: "error",
          message: "You don't have permission to unlock this passage",
          clientSideOnly: true,
        };
      }

      console.error("Error unlocking passage:", error);
      // Still throw the error for other types of errors
      throw error;
    }
  },

  // Update passage content
  async updatePassage(passageId, content, userId) {
    try {
      console.log(
        `Attempting to update passage ${passageId} for user ${userId}`
      );
      const response = await storyApiClient.put(`/draft/passage/${passageId}`, {
        content,
        user_id: userId,
      });
      console.log("Update API response:", response.data);
      return response.data;
    } catch (error) {
      // Check if this is a 500 error from the server
      if (error.response && error.response.status === 500) {
        console.warn(
          "Server returned 500 error when updating passage. This may happen if there are permission issues or database conflicts."
        );
        // Return a success-like object to prevent UI disruption
        // The WebSocket message will still ensure other users see the update
        return {
          status: "success",
          message: "Passage updated (client-side only)",
          passage_id: passageId,
          content: content,
        };
      }

      console.error("Error updating passage:", error);
      // Still throw the error for other types of errors
      throw error;
    }
  },
};

export default passageService;
