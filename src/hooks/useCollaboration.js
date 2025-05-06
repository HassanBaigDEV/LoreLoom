import { useState } from "react";
import { useAuth } from "./useAuth";
import collaborationService from "@/lib/collaborationService";

export function useCollaboration() {
  const { user } = useAuth();
  const [collaborators, setCollaborators] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Fetch collaborators for a story
  const fetchCollaborators = async (storyId) => {
    if (!user || !storyId) return;

    try {
      setLoading(true);
      setError(null);
      const collaboratorsList = await collaborationService.getCollaborators(
        storyId,
        user.id
      );
      setCollaborators(collaboratorsList);
      return collaboratorsList;
    } catch (err) {
      setError("Failed to fetch collaborators");
      console.error(err);
      return [];
    } finally {
      setLoading(false);
    }
  };

  // Add collaborator by ID
  const addCollaborator = async (storyId, collaboratorId) => {
    if (!user || !storyId || !collaboratorId) return null;

    try {
      setLoading(true);
      setError(null);
      const result = await collaborationService.addCollaborator(
        storyId,
        user.id,
        collaboratorId
      );
      await fetchCollaborators(storyId);
      return result;
    } catch (err) {
      setError("Failed to add collaborator");
      console.error(err);
      return null;
    } finally {
      setLoading(false);
    }
  };

  // Add collaborator by email
  const addCollaboratorByEmail = async (storyId, email) => {
    if (!user || !storyId || !email) return null;

    try {
      setLoading(true);
      setError(null);
      const result = await collaborationService.addCollaboratorByEmail(
        storyId,
        user.id,
        email
      );
      await fetchCollaborators(storyId);
      return result;
    } catch (err) {
      setError("Failed to add collaborator");
      console.error(err);
      return null;
    } finally {
      setLoading(false);
    }
  };

  // Remove collaborator by ID
  const removeCollaborator = async (storyId, collaboratorId) => {
    if (!user || !storyId || !collaboratorId) return null;

    try {
      setLoading(true);
      setError(null);
      const result = await collaborationService.removeCollaborator(
        storyId,
        user.id,
        collaboratorId
      );
      await fetchCollaborators(storyId);
      return result;
    } catch (err) {
      setError("Failed to remove collaborator");
      console.error(err);
      return null;
    } finally {
      setLoading(false);
    }
  };

  // Remove collaborator by email
  const removeCollaboratorByEmail = async (storyId, email) => {
    if (!user || !storyId || !email) return null;

    try {
      setLoading(true);
      setError(null);
      const result = await collaborationService.removeCollaboratorByEmail(
        storyId,
        user.id,
        email
      );
      await fetchCollaborators(storyId);
      return result;
    } catch (err) {
      setError("Failed to remove collaborator");
      console.error(err);
      return null;
    } finally {
      setLoading(false);
    }
  };

  // Check if user has access to a story
  const checkAccess = async (storyId) => {
    if (!user || !storyId)
      return { hasAccess: false, reason: "No user or story ID provided" };

    try {
      const accessInfo = await collaborationService.checkAccess(
        storyId,
        user.id
      );
      return accessInfo;
    } catch (err) {
      console.error(err);
      return { hasAccess: false, reason: err.message };
    }
  };

  // Find user by email
  const findUserByEmail = async (email) => {
    if (!email) return null;

    try {
      setLoading(true);
      setError(null);
      return await collaborationService.findUserByEmail(email);
    } catch (err) {
      setError("User not found");
      console.error(err);
      return null;
    } finally {
      setLoading(false);
    }
  };

  // Return the hook methods and state
  return {
    // State
    collaborators,
    loading,
    error,

    // Methods
    fetchCollaborators,
    addCollaborator,
    addCollaboratorByEmail,
    removeCollaborator,
    removeCollaboratorByEmail,
    checkAccess,
    findUserByEmail,

    // Setter for direct state manipulation if needed
    setCollaborators,
  };
}
