import React, { useState, useEffect, useRef } from "react";
import { useCollaboration } from "@/hooks/useCollaboration";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "react-hot-toast";
import { Plus, Trash2, Mail, User } from "lucide-react";

export default function CollaboratorList({ storyId, isAuthor }) {
  const { user } = useAuth();
  const {
    collaborators,
    loading,
    error,
    fetchCollaborators,
    addCollaboratorByEmail,
    removeCollaborator,
  } = useCollaboration();

  const [email, setEmail] = useState("");
  const [isAdding, setIsAdding] = useState(false);
  const isMounted = useRef(true);

  useEffect(() => {
    // Set isMounted to true when component mounts
    isMounted.current = true;

    // Only fetch collaborators if we have both storyId and user
    if (storyId && user?.id) {
      fetchCollaborators(storyId);
    }

    // Clean up function to prevent state updates after unmount
    return () => {
      isMounted.current = false;
    };
  }, [storyId, user?.id]); // Removed fetchCollaborators from deps

  // Handle adding a collaborator
  const handleAddCollaborator = async (e) => {
    e.preventDefault();

    if (!email) {
      toast.error("Please enter an email address");
      return;
    }

    try {
      setIsAdding(true);
      console.log("Adding collaborator with email:", email);
      console.log("For story:", storyId);
      console.log("User ID:", user?.id);

      // Make sure to pass the user's ID as well as the story ID and email
      await addCollaboratorByEmail(storyId, email);

      if (isMounted.current) {
        setEmail("");
        // Show success message
        toast.success(`Successfully added collaborator: ${email}`);
      }
    } catch (err) {
      console.error("Failed to add collaborator:", err);
      toast.error(
        "Failed to add collaborator. Make sure the email is registered."
      );
    } finally {
      if (isMounted.current) {
        setIsAdding(false);
      }
    }
  };

  // Handle removing a collaborator
  const handleRemoveCollaborator = async (collaboratorId) => {
    try {
      await removeCollaborator(storyId, collaboratorId);
      toast.success("Collaborator removed successfully");
    } catch (err) {
      console.error("Failed to remove collaborator:", err);
      toast.error("Failed to remove collaborator");
    }
  };

  if (error) {
    return <div className="text-red-500">Error: {error}</div>;
  }

  return (
    <div className="w-full bg-white rounded-lg shadow-md p-4 space-y-4">
      <h2 className="text-xl font-semibold">Collaborators</h2>

      {isAuthor ? (
        <form onSubmit={handleAddCollaborator} className="flex space-x-2">
          <div className="relative flex-grow">
            <Mail className="absolute left-2 top-2.5 h-4 w-4 text-gray-400" />
            <Input
              className="pl-8"
              type="email"
              placeholder="Add by email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={isAdding || loading}
            />
          </div>
          <Button type="submit" disabled={isAdding || loading || !email}>
            {isAdding ? (
              <span className="flex items-center">
                <svg
                  className="animate-spin -ml-1 mr-2 h-4 w-4 text-white"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  ></circle>
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  ></path>
                </svg>
                Adding...
              </span>
            ) : (
              <span className="flex items-center">
                <Plus className="h-4 w-4 mr-1" /> Add
              </span>
            )}
          </Button>
        </form>
      ) : (
        <div className="bg-gray-100 p-3 rounded-md text-sm text-gray-600">
          Only the story owner can add collaborators
        </div>
      )}

      <div className="space-y-2">
        <h3 className="text-sm font-medium text-gray-500">
          Collaborators ({collaborators.length})
        </h3>

        {loading ? (
          <div className="flex justify-center p-4">
            <svg
              className="animate-spin h-6 w-6 text-gray-500"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
            >
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
              ></circle>
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
              ></path>
            </svg>
          </div>
        ) : collaborators.length === 0 ? (
          <div className="text-sm text-gray-500 text-center py-4">
            No collaborators added yet
          </div>
        ) : (
          <ul className="space-y-2">
            {collaborators.map((collaborator) => (
              <li
                key={collaborator._id}
                className="flex items-center justify-between px-3 py-2 bg-gray-50 rounded-md"
              >
                <div className="flex items-center space-x-2">
                  <User className="h-5 w-5 text-gray-400" />
                  <div>
                    <p className="text-sm font-medium">
                      {collaborator.first_name} {collaborator.last_name}
                    </p>
                    <p className="text-xs text-gray-500">
                      {collaborator.email}
                    </p>
                  </div>
                </div>

                {isAuthor && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleRemoveCollaborator(collaborator._id)}
                    className="text-red-500 hover:text-red-700 hover:bg-red-50"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                )}
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
