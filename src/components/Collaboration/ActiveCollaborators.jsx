import React, { useState, useEffect, useRef } from "react";
import { useWebSocketCollaboration } from "@/hooks/useWebSocketCollaboration";
import { useAuth } from "@/hooks/useAuth";
import { useCollaboration } from "@/hooks/useCollaboration";
import { User, Users, Wifi, WifiOff } from "lucide-react";

export default function ActiveCollaborators({ storyId, fetchOnMount = false, showUserNames = false }) {
  const { user } = useAuth();
  const { isConnected, activeCollaborators } =
    useWebSocketCollaboration(storyId);
  const { collaborators, fetchCollaborators } = useCollaboration();

  const [collaboratorMap, setCollaboratorMap] = useState({});
  const hasFetchedRef = useRef(false);

  // Fetch collaborators only once when the component mounts
  useEffect(() => {
    if (storyId && user?.id && (fetchOnMount || !hasFetchedRef.current)) {
      fetchCollaborators(storyId);
      hasFetchedRef.current = true;
    }

    return () => {
      hasFetchedRef.current = false;
    };
  }, [storyId, user?.id, fetchOnMount]); // Added fetchOnMount to dependencies

  // Create a map of collaborator IDs to their names
  useEffect(() => {
    if (!collaborators || collaborators.length === 0) return;

    const map = {};
    collaborators.forEach((collab) => {
      map[collab._id] = {
        name: collab.first_name && collab.last_name 
          ? `${collab.first_name} ${collab.last_name}` 
          : collab.username || collab.email || "User",
        email: collab.email,
        active: activeCollaborators.includes(collab._id),
      };
    });

    // Add the current user to the map if they're not already there
    if (user?.id && !map[user.id]) {
      map[user.id] = {
        name: user.first_name && user.last_name 
          ? `${user.first_name} ${user.last_name}` 
          : user.username || user.email || "You",
        email: user.email,
        active: activeCollaborators.includes(user.id),
        isCurrentUser: true
      };
    }

    setCollaboratorMap(map);
  }, [collaborators, activeCollaborators, user]);

  if (!storyId || !user) return null;

  return (
    <div className="flex flex-col bg-white rounded-lg shadow-md p-4">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-medium text-gray-700">Collaboration</h3>
        {isConnected ? (
          <span className="flex items-center text-green-600 text-xs">
            <Wifi className="h-3 w-3 mr-1" />
            Connected
          </span>
        ) : (
          <span className="flex items-center text-red-600 text-xs">
            <WifiOff className="h-3 w-3 mr-1" />
            Disconnected
          </span>
        )}
      </div>

      <div className="flex items-center mb-2 space-x-1">
        <Users className="h-4 w-4 text-gray-500" />
        <span className="text-xs text-gray-600">Active collaborators</span>
      </div>

      <div className="space-y-1">
        {activeCollaborators.length === 0 ? (
          <p className="text-xs text-gray-500">
            No one else is currently editing
          </p>
        ) : (
          activeCollaborators.map((collabId) => {
            // Skip the current user
            if (collabId === user.id) return null;

            const collaborator = collaboratorMap[collabId];
            const displayName = collaborator
              ? collaborator.name
              : (user.id === collabId ? "You" : "Collaborator");

            return (
              <div
                key={collabId}
                className="flex items-center space-x-2 py-1 px-2 bg-green-50 rounded-md"
              >
                <div className="h-2 w-2 rounded-full bg-green-500"></div>
                <User className="h-3 w-3 text-gray-500" />
                <span className="text-xs font-medium">{displayName}</span>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
 