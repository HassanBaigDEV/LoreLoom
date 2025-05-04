import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "./useAuth";
import websocketManager from "@/utils/websocketManager";
import { toast } from "react-hot-toast";

export function useWebSocketCollaboration(storyId) {
  const router = useRouter();
  const { user } = useAuth();
  const [isConnected, setIsConnected] = useState(false);
  const [activeCollaborators, setActiveCollaborators] = useState([]);
  const [lockedPassages, setLockedPassages] = useState({});
  const [error, setError] = useState(null);

  // Connect to WebSocket
  const connect = useCallback(() => {
    if (!user?.id || !storyId) {
      setError("User or story ID not provided");
      return;
    }

    try {
      // Debug user data
      console.log("User data for WebSocket:", user);
      console.log("User ID for WebSocket:", user.id);
      console.log("Story ID for WebSocket:", storyId);

      // Check if user has MongoDB _id field
      const mongoUserId = user._id || user.id;
      console.log("Using MongoDB user ID:", mongoUserId);

      // Clear any previous handlers
      websocketManager.clearHandlers();

      // Set up handlers
      websocketManager
        .onConnect(() => {
          setIsConnected(true);
          toast.success("Connected to collaboration session");
          setError(null);
        })
        .onDisconnect(() => {
          setIsConnected(false);
          // Show a toast only if we were previously connected
          if (isConnected) {
            toast.error("Disconnected from collaboration session");
          }
        })
        .onError((err) => {
          setError(`Connection error: ${err.message}`);
          toast.error("Collaboration connection error");
        })
        .onMessage("user_joined", (message) => {
          const { client_id } = message;
          setActiveCollaborators((prev) => {
            if (!prev.includes(client_id)) {
              toast.success("A collaborator has joined");
              return [...prev, client_id];
            }
            return prev;
          });
        })
        .onMessage("user_left", (message) => {
          const { client_id } = message;
          setActiveCollaborators((prev) => {
            if (prev.includes(client_id)) {
              toast("A collaborator has left", { icon: "🔵" });
              return prev.filter((id) => id !== client_id);
            }
            return prev;
          });
        })
        .onMessage("content_update", (message) => {
          // Handle content updates from other users
          // This will be implemented by the components using this hook
        })
        .onMessage("cursor_position", (message) => {
          // Handle cursor position updates from other users
          // This will be implemented by the components using this hook
        })
        .onMessage("passage_lock", (message) => {
          // Handle passage lock updates
          const { section, username, client_id } = message;
          console.log(
            `[WebSocket] Received passage_lock for ${section} by ${username}`
          );
          setLockedPassages((prev) => ({
            ...prev,
            [section]: { username, client_id, timestamp: Date.now() },
          }));
        })
        .onMessage("passage_unlock", (message) => {
          // Handle passage unlock updates
          const { section, username } = message;
          console.log(
            `[WebSocket] Received passage_unlock for ${section} by ${username}`
          );

          setLockedPassages((prev) => {
            console.log(`[WebSocket] Current locked passages:`, prev);
            if (prev[section]) {
              console.log(`[WebSocket] Removing lock for ${section}`);
              const newState = { ...prev };
              delete newState[section];
              return newState;
            } else {
              console.log(
                `[WebSocket] No lock found for ${section}, state unchanged`
              );
              return prev;
            }
          });

          // Notify other components about the unlock
          const unlockEvent = new CustomEvent("passage-unlocked", {
            detail: {
              passageId: section,
              username: username,
              timestamp: Date.now(),
            },
          });
          window.dispatchEvent(unlockEvent);
        });

      // Connect to the WebSocket
      websocketManager.connect(storyId, mongoUserId);
    } catch (err) {
      setError(`Failed to connect: ${err.message}`);
      toast.error("Failed to connect to collaboration session");
      console.error("WebSocket connection error:", err);
    }
  }, [user?.id, storyId]);

  // Disconnect from WebSocket
  const disconnect = useCallback(() => {
    websocketManager.disconnect();
    setIsConnected(false);
  }, []);

  // Send content update
  const sendContentUpdate = useCallback(
    (content, section) => {
      if (!isConnected) {
        setError("Not connected to collaboration session");
        return false;
      }

      return websocketManager.sendContentUpdate(content, section);
    },
    [isConnected]
  );

  // Send passage lock notification
  const sendPassageLock = useCallback(
    (section, username) => {
      if (!isConnected) {
        setError("Not connected to collaboration session");
        return false;
      }

      return websocketManager.sendPassageLock(section, username);
    },
    [isConnected]
  );

  // Send passage unlock notification
  const sendPassageUnlock = useCallback(
    (section, username) => {
      if (!isConnected) {
        setError("Not connected to collaboration session");
        return false;
      }

      return websocketManager.sendPassageUnlock(section, username);
    },
    [isConnected]
  );

  // Send cursor position
  const sendCursorPosition = useCallback(
    (position, section) => {
      if (!isConnected) return false;

      return websocketManager.sendCursorPosition(position, section);
    },
    [isConnected]
  );

  // Connect when the component mounts and disconnect when it unmounts
  useEffect(() => {
    if (user?.id && storyId) {
      connect();
    }

    return () => {
      disconnect();
    };
  }, [user?.id, storyId, connect, disconnect]);

  // Register a message handler
  const registerMessageHandler = useCallback((type, handler) => {
    websocketManager.onMessage(type, handler);

    // Return a function to unregister the handler
    return () => websocketManager.offMessage(type, handler);
  }, []);

  return {
    isConnected,
    activeCollaborators,
    lockedPassages,
    error,
    connect,
    disconnect,
    sendContentUpdate,
    sendCursorPosition,
    sendPassageLock,
    sendPassageUnlock,
    registerMessageHandler,
  };
}
