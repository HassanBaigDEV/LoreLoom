"use client";
import { useState, useCallback, useEffect } from "react";
import {
  Box,
  Typography,
  IconButton,
  TextField,
  Button,
  Stack,
  Collapse,
  Tooltip,
  Menu,
  MenuItem,
  Alert,
  Chip,
  Avatar,
  Paper,
} from "@mui/material";
import {
  Edit as EditIcon,
  Save as SaveIcon,
  Delete as DeleteIcon,
  MoreVert as MoreVertIcon,
  ExpandMore as ExpandMoreIcon,
  ExpandLess as ExpandLessIcon,
  LockOpen as LockOpenIcon,
  Lock as LockIcon,
  Person as PersonIcon,
  AccessTime as AccessTimeIcon,
} from "@mui/icons-material";
import { toast } from "react-hot-toast";
import storyApiClient from "@/lib/storyApi";
import { useWebSocketCollaboration } from "@/hooks/useWebSocketCollaboration";
import passageService from "@/services/passageService";
import websocketManager from "@/utils/websocketManager";

export default function PassageEditor({
  passage,
  onUpdate,
  isReadOnly = false,
}) {
  const [isEditing, setIsEditing] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [content, setContent] = useState(passage.content);
  const [title, setTitle] = useState(passage.title);
  const [anchorEl, setAnchorEl] = useState(null);
  const [loading, setLoading] = useState(false);
  const [lockLoading, setLockLoading] = useState(false);
  const [lastSaved, setLastSaved] = useState(
    new Date(passage.updated_at || passage.created_at)
  );
  const [currentEditor, setCurrentEditor] = useState(null);
  const [localPassage, setLocalPassage] = useState(passage);

  // Get the collaboration tools
  const {
    sendContentUpdate,
    registerMessageHandler,
    sendPassageLock,
    sendPassageUnlock,
    lockedPassages,
    isConnected,
  } = useWebSocketCollaboration();

  // This function will directly update the parent component's passages state
  // without requiring a full fetch from the backend
  const updateParentWithPassage = (updatedPassage) => {
    if (onUpdate) {
      console.log("Updating parent with passage:", updatedPassage);
      onUpdate(updatedPassage);
    }
  };

  // Register lock/unlock handlers immediately on component mount
  useEffect(() => {
    console.log(`[${passage.passage_id}] Setting up WebSocket handlers`);

    // This handler will run when ANY passage is locked
    const handleLock = (message) => {
      console.log(`[${passage.passage_id}] LOCK message received:`, message);

      // Check if this is for our passage
      if (message.section === passage.passage_id) {
        console.log(
          `[${passage.passage_id}] Passage LOCKED by ${message.username}`
        );

        // Always update the current editor
        setCurrentEditor(message.username);

        // Show a toast notification for other users
        const user = JSON.parse(localStorage.getItem("user"));
        const username = user?.username || user?.email;

        if (username !== message.username) {
          toast(`${message.username} is now editing this passage`, {
            icon: "🔒",
            duration: 3000,
          });
        }
      }
    };

    // This handler will run when ANY passage is unlocked
    const handleUnlock = (message) => {
      console.log(`[${passage.passage_id}] UNLOCK message received:`, message);

      // Check if this is for our passage
      if (message.section === passage.passage_id) {
        console.log(
          `[${passage.passage_id}] Passage UNLOCKED by ${message.username}`
        );

        // CRITICAL: Always clear the current editor for ALL clients
        console.log(
          `[${passage.passage_id}] Clearing current editor due to unlock message`
        );
        setCurrentEditor(null);

        // If we were editing, exit edit mode (safety check)
        if (isEditing) {
          const user = JSON.parse(localStorage.getItem("user"));
          const username = user?.username || user?.email;

          if (username === message.username) {
            // We've received our own unlock message, make sure we're not in edit mode
            console.log(
              `[${passage.passage_id}] Received our own unlock, ensuring edit mode is off`
            );
            setIsEditing(false);
          } else {
            // Someone else unlocked a passage we were editing (unusual case)
            console.log(
              `[${passage.passage_id}] Warning: Someone else unlocked our edit, exiting edit mode`
            );
            setIsEditing(false);
            setContent(localPassage.content); // Reset content

            toast.error("Someone else has taken control of this passage", {
              duration: 3000,
            });
          }
        } else {
          // Show toast notification only for other users who weren't editing
          const user = JSON.parse(localStorage.getItem("user"));
          const username = user?.username || user?.email;

          if (username !== message.username) {
            // If this unlock includes updated content, update our local state
            if (message.content) {
              console.log(`[${passage.passage_id}] Unlock includes updated content, updating local state`);
              console.log(`[${passage.passage_id}] New content:`, message.content.substring(0, 50) + "...");
              
              // Create an updated passage object with the new content
              const updatedPassage = {
                ...localPassage,
                content: message.content,
                updated_at: new Date().toISOString(),
              };
              
              // Update our local UI
              console.log(`[${passage.passage_id}] Setting new content to state`);
              setContent(message.content);
              setLocalPassage(updatedPassage);
              setLastSaved(new Date());
              
              // Update the parent component to ensure the change is visible there too
              console.log(`[${passage.passage_id}] Updating parent component via callback`);
              updateParentWithPassage(updatedPassage);
              
              // Show toast with indication that content was updated
              toast.success(`${message.username} updated this passage`, {
                icon: "🔄",
                duration: 3000,
              });
              
              // Add animation to highlight the content change
              const passageElement = document.getElementById(`passage-${passage.passage_id}`);
              if (passageElement) {
                console.log(`[${passage.passage_id}] Adding animation class for content update`);
                passageElement.classList.add('content-updated');
                setTimeout(() => {
                  passageElement.classList.remove('content-updated');
                }, 3000);
              } else {
                console.warn(`[${passage.passage_id}] Passage element not found for animation`);
              }
            } else {
              // Regular unlock notification without content update
              console.log(`[${passage.passage_id}] Regular unlock without content`);
              toast(`${message.username} finished editing this passage`, {
                duration: 2000,
              });
            }
          } else {
            console.log(`[${passage.passage_id}] Ignoring our own unlock notification`);
          }
        }
      } else {
        console.log(`[${passage.passage_id}] Ignoring unlock for different passage: ${message.section}`);
      }
    };

    // Handler for content updates
    const handleContentUpdate = (message) => {
      console.log(`[${passage.passage_id}] CONTENT UPDATE received:`, message);

      // Only update if the update is for this passage
      if (message.section === passage.passage_id) {
        console.log(`[${passage.passage_id}] Received content update for this passage`);

        // Don't update if we're editing this passage
        if (!isEditing) {
          console.log(`[${passage.passage_id}] Not currently editing, applying update`);
          
          // Save the current scroll position
          const scrollableElement = document.querySelector('.MuiContainer-root') || window;
          const scrollPosition = scrollableElement.scrollTop;
          
          // Mark element for animation
          const passageElement = document.getElementById(`passage-${passage.passage_id}`);
          if (passageElement) {
            console.log(`[${passage.passage_id}] Adding animation class to passage element`);
            passageElement.classList.add('content-updated');
            // Remove the class after animation completes
            setTimeout(() => {
              passageElement.classList.remove('content-updated');
            }, 3000);
          } else {
            console.warn(`[${passage.passage_id}] Passage element not found in DOM for animation`);
          }
          
          // Create an updated passage object
          const updatedPassage = {
            ...localPassage,
            content: message.content,
            updated_at: new Date().toISOString(),
          };

          // Update our local state
          setContent(message.content);
          setLocalPassage(updatedPassage);
          setLastSaved(new Date());

          // Update the parent component to prevent refresh
          console.log(`[${passage.passage_id}] Updating parent component with new content`);
          updateParentWithPassage(updatedPassage);
          
          // Restore scroll position after state update
          setTimeout(() => {
            scrollableElement.scrollTop = scrollPosition;
          }, 0);

          // Show toast notification
          const user = JSON.parse(localStorage.getItem("user"));
          const username = user?.username || user?.email;
          if (username !== message.username) {
            toast.success(
              `${message.username || "A collaborator"} updated this passage`,
              {
                duration: 3000,
                icon: "🔄"
              }
            );
          }
        } else {
          console.log(`[${passage.passage_id}] Currently editing, ignoring content update`);
        }
      }
    };

    // Register all handlers
    console.log(`[${passage.passage_id}] Registering WebSocket handlers`);
    const lockUnregister = registerMessageHandler("passage_lock", handleLock);
    const unlockUnregister = registerMessageHandler(
      "passage_unlock",
      handleUnlock
    );
    const contentUnregister = registerMessageHandler(
      "content_update",
      handleContentUpdate
    );

    // Cleanup on unmount - release lock and unregister handlers
    return () => {
      console.log(`[${passage.passage_id}] Cleaning up WebSocket handlers`);

      // If we're still editing when component unmounts, release the lock
      if (isEditing) {
        console.log(
          `[${passage.passage_id}] Still editing on unmount, releasing lock`
        );
        releasePassageLock(true); // Silent mode for cleanup
      }

      lockUnregister();
      unlockUnregister();
      contentUnregister();
    };
  }, [
    passage.passage_id,
    registerMessageHandler,
    isEditing,
    currentEditor,
    localPassage,
    sendPassageUnlock,
    onUpdate,
  ]);

  // Check if passage is locked on initial load and websocket reconnects
  useEffect(() => {
    if (isConnected && !isReadOnly) {
      console.log("Checking lock status for passage:", passage.passage_id);

      // If this passage is in the lockedPassages object, set the currentEditor
      if (lockedPassages && lockedPassages[passage.passage_id]) {
        const lockInfo = lockedPassages[passage.passage_id];
        console.log(`Found lock for this passage by ${lockInfo.username}`);
        setCurrentEditor(lockInfo.username);
      } else {
        // If the passage is not in lockedPassages, make sure currentEditor is cleared
        // This helps recover from inconsistent states
        if (currentEditor && !isEditing) {
          console.log(
            "Passage not locked according to WebSocket state, clearing editor"
          );
          setCurrentEditor(null);
        }
      }

      // If we're editing, make sure we send a lock notification
      if (isEditing) {
        const user = JSON.parse(localStorage.getItem("user"));
        if (user?.id) {
          const username = user.username || user.email;
          console.log("Re-sending lock as we're editing:", username);
          sendPassageLock(passage.passage_id, username);
        }
      }
    }
  }, [
    isConnected,
    passage.passage_id,
    lockedPassages,
    isEditing,
    isReadOnly,
    sendPassageLock,
    currentEditor,
  ]);

  // When the WebSocket connection is established/re-established, check for inconsistencies
  useEffect(() => {
    if (isConnected && !isReadOnly) {
      // When connection is established, clear any existing locks if we're not editing
      if (!isEditing && currentEditor) {
        const user = JSON.parse(localStorage.getItem("user"));
        const username = user?.username || user?.email;

        // If the current editor is us but we're not editing, release the lock
        if (currentEditor === username) {
          console.log(
            `[${passage.passage_id}] Inconsistent state detected on WebSocket connection - releasing lock`
          );
          releasePassageLock(true);
        } else {
          // If someone else is shown as editor, check with WebSocket state
          if (!lockedPassages || !lockedPassages[passage.passage_id]) {
            console.log(
              `[${passage.passage_id}] WebSocket shows no lock but UI shows ${currentEditor} as editor - clearing UI state`
            );
            setCurrentEditor(null);
          }
        }
      }

      // Run synchronization immediately on WebSocket connection
      synchronizeLockStatus();

      // Set up more frequent polling during active sessions
      const interval = setInterval(() => {
        synchronizeLockStatus();
      }, 5000); // Check every 5 seconds

      return () => clearInterval(interval);
    }
  }, [isConnected, isReadOnly, isEditing, currentEditor, lockedPassages]);

  // Update local passage when props change, but avoid resetting during active edits
  useEffect(() => {
    // Only update local state if we're not currently editing
    if (!isEditing) {
      setLocalPassage(passage);
      setContent(passage.content);
      setTitle(passage.title);
      setLastSaved(new Date(passage.updated_at || passage.created_at));
    }
  }, [passage, isEditing]);

  // Cleanup - always release lock on unmount
  useEffect(() => {
    return () => {
      if (isEditing) {
        const user = JSON.parse(localStorage.getItem("user"));
        if (user?.id) {
          const username = user.username || user.email;
          console.log(
            `[${passage.passage_id}] Unmounting - releasing lock:`,
            username
          );
          // First clear UI state
          setCurrentEditor(null);
          // Then ensure WebSocket notification is sent
          sendPassageUnlock(passage.passage_id, username);
          // Try API call in the background but don't wait for it
          const userId = user.id;
          setTimeout(() => {
            try {
              passageService
                .unlockPassage(passage.passage_id, userId)
                .then(() =>
                  console.log(
                    `[${passage.passage_id}] Successfully unlocked on unmount via API`
                  )
                )
                .catch((e) =>
                  console.warn(
                    `[${passage.passage_id}] Failed to unlock on unmount via API:`,
                    e
                  )
                );
            } catch (e) {
              console.warn(
                `[${passage.passage_id}] Error in unmount unlock:`,
                e
              );
            }
          }, 0);
        }
      }
    };
  }, [isEditing, passage.passage_id, sendPassageUnlock]);

  const handleMenuOpen = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  // Enhanced acquirePassageLock with better error handling for server issues
  const acquirePassageLock = async () => {
    try {
      setLockLoading(true);
      console.log(`[${passage.passage_id}] Attempting to acquire lock`);

      // Check if already locked by someone else
      if (currentEditor) {
        const user = JSON.parse(localStorage.getItem("user"));
        const username = user?.username || user?.email;

        // If we're the ones who have the lock, just return true
        if (currentEditor === username) {
          console.log(
            `[${passage.passage_id}] We already have the lock, proceeding with edit`
          );
          return true;
        }

        console.log(
          `[${passage.passage_id}] Already locked by ${currentEditor}`
        );
        toast.error(
          `This passage is currently being edited by ${currentEditor}`
        );
        return false;
      }

      const user = JSON.parse(localStorage.getItem("user"));
      if (!user?.id) throw new Error("User not found");

      const username = user.username || user.email;
      console.log(
        `[${passage.passage_id}] Sending lock message for user ${username}`
      );

      // Set ourselves as editor immediately for better UX
      setCurrentEditor(username);

      // Send the lock message to notify other clients
      sendPassageLock(passage.passage_id, username);

      // Then call the API to formally lock the passage
      try {
        console.log(`[${passage.passage_id}] Calling API to acquire lock`);
        const response = await passageService.lockPassage(
          passage.passage_id,
          user.id
        );
        console.log(`[${passage.passage_id}] Lock API response:`, response);

        if (response.status === "acquired" || response.status === "refreshed") {
          console.log(`[${passage.passage_id}] Lock successful`);
          return true;
        } else if (response.status === "denied") {
          console.log(`[${passage.passage_id}] Lock denied by API`);

          // If API says it's already locked, update UI accordingly
          toast.error(`Passage is currently being edited by another user`);

          // Refresh the current editor information if available
          if (response.locked_by && response.locked_by !== user.id) {
            const ownerName = response.username || response.locked_by;
            console.log(
              `[${passage.passage_id}] Setting current editor to ${ownerName}`
            );
            setCurrentEditor(ownerName);
          } else {
            // No specific owner found, just clear our lock
            console.log(
              `[${passage.passage_id}] Clearing current editor (no specific owner)`
            );
            setCurrentEditor(null);
          }

          // Send an unlock message to correct our previous lock message
          console.log(
            `[${passage.passage_id}] Sending unlock message to correct previous lock`
          );
          sendPassageUnlock(passage.passage_id, username);
          return false;
        }

        // Default case - something went wrong but no clear error
        console.warn(
          `[${passage.passage_id}] Unexpected response from lock API:`,
          response
        );
        return false;
      } catch (apiError) {
        console.error(
          `[${passage.passage_id}] API error acquiring lock:`,
          apiError
        );

        // If it's a server error (500), assume we got the lock via WebSocket already
        if (apiError.response && apiError.response.status === 500) {
          console.warn(
            `[${passage.passage_id}] Server returned 500 when locking, but proceeding with WebSocket lock`
          );
          // We already sent a WebSocket message, so we'll proceed with editing
          // This could cause conflicts but is better than preventing edits entirely
          toast.warning(
            "Server error when locking passage, but proceeding with edit"
          );
          return true;
        }

        // For other errors, release the lock and show error
        console.log(
          `[${passage.passage_id}] Sending unlock message due to API error`
        );
        sendPassageUnlock(passage.passage_id, username);
        setCurrentEditor(null);

        toast.error("Error locking passage for editing");
        return false;
      }
    } catch (error) {
      console.error(
        `[${passage.passage_id}] Error in acquirePassageLock:`,
        error
      );
      toast.error("Failed to lock passage for editing");

      // Send unlock message to correct the lock we sent earlier
      const user = JSON.parse(localStorage.getItem("user"));
      if (user?.id) {
        const username = user.username || user.email;
        console.log(`[${passage.passage_id}] Sending unlock due to error`);
        sendPassageUnlock(passage.passage_id, username);
        setCurrentEditor(null);
      }

      return false;
    } finally {
      setLockLoading(false);
    }
  };

  const releasePassageLock = async (silent = false) => {
    try {
      const user = JSON.parse(localStorage.getItem("user"));
      if (!user?.id) return;

      const username = user.username || user.email;
      console.log(
        `[${passage.passage_id}] Releasing lock for user: ${username}`
      );

      // IMPORTANT: Send WebSocket notification first and independently
      // This helps ensure other clients get the notification even if other steps fail
      console.log(
        `[${passage.passage_id}] Sending direct unlock WebSocket notification`
      );
      const wsNotificationSuccess = sendPassageUnlock(
        passage.passage_id,
        username
      );
      if (!wsNotificationSuccess) {
        console.warn(
          `[${passage.passage_id}] Initial WebSocket unlock notification failed, will retry`
        );
        // Retry immediately with a small delay
        setTimeout(() => {
          console.log(
            `[${passage.passage_id}] Retrying direct WebSocket notification`
          );
          sendPassageUnlock(passage.passage_id, username);
        }, 100);
      }

      // 1. Clear our local UI state first (immediate feedback)
      setCurrentEditor(null);

      // 2. Send WebSocket notification to ALL clients (including ourselves)
      console.log(
        `[${passage.passage_id}] Sending unlock message via WebSocket`
      );
      sendPassageUnlock(passage.passage_id, username);

      // 3. Update the server (backend)
      let retryCount = 0;
      const maxRetries = 2;
      let unlockSuccess = false;

      while (!unlockSuccess && retryCount <= maxRetries) {
        try {
          console.log(
            `[${
              passage.passage_id
            }] Calling server API to unlock passage (attempt ${retryCount + 1})`
          );
          const result = await passageService.unlockPassage(
            passage.passage_id,
            user.id
          );
          console.log(
            `[${passage.passage_id}] Successfully unlocked passage on server:`,
            result
          );

          // Check if the unlock was successful based on the response status
          if (result.status === "success") {
            unlockSuccess = true;

            // Send another WebSocket notification to ensure all clients are updated
            if (retryCount > 0) {
              console.log(
                `[${passage.passage_id}] Sending additional unlock message after retry`
              );
              sendPassageUnlock(passage.passage_id, username);
            }

            if (!silent) {
              toast.success("Passage unlocked successfully");
            }
            break;
          } else if (result.status === "error") {
            console.warn(
              `[${passage.passage_id}] Unlock returned error status: ${result.message}`
            );

            // Even if there was an error, we still want to proceed with UI updates
            // The WebSocket notification has already been sent
            if (result.clientSideOnly) {
              unlockSuccess = true;
              break;
            }
          }
        } catch (apiError) {
          // Check if this is a server error (500)
          if (apiError.response && apiError.response.status === 500) {
            console.warn(
              `[${
                passage.passage_id
              }] Server returned 500 when unlocking - passage may already be unlocked or lock expired (attempt ${
                retryCount + 1
              })`
            );

            // If we're on the last retry, treat it as a success anyway
            // as the WebSocket notification was already sent
            if (retryCount === maxRetries) {
              unlockSuccess = true;

              // Send another WebSocket notification to ensure all clients are updated
              console.log(
                `[${passage.passage_id}] Sending additional unlock message after server error`
              );
              sendPassageUnlock(passage.passage_id, username);
              break;
            }
          } else {
            console.warn(
              `[${passage.passage_id}] API error in unlockPassage (attempt ${
                retryCount + 1
              }):`,
              apiError
            );
          }

          // If we're on the last retry and failed, give up but treat as success
          // since the WebSocket notification was already sent
          if (retryCount === maxRetries) {
            unlockSuccess = true;

            // Send another WebSocket notification to make sure
            console.log(
              `[${passage.passage_id}] Sending final unlock message after failed retries`
            );
            sendPassageUnlock(passage.passage_id, username);
            break;
          }
        }

        // Wait before retrying
        retryCount++;
        if (!unlockSuccess && retryCount <= maxRetries) {
          const delay = 1000 * retryCount; // Increasing delay with each retry
          console.log(
            `[${passage.passage_id}] Waiting ${delay}ms before retry ${retryCount}`
          );
          await new Promise((resolve) => setTimeout(resolve, delay));
        }
      }

      // Final WebSocket refresh to ensure the UI is consistent
      if (unlockSuccess) {
        console.log(
          `[${passage.passage_id}] Unlock completed successfully after ${retryCount} retries`
        );

        // Force refresh lockedPassages state from WebSocket
        if (isConnected) {
          setTimeout(() => {
            synchronizeLockStatus();
          }, 1000); // Give the WebSocket a second to process the message
        }
      } else {
        console.warn(
          `[${passage.passage_id}] Unlock failed after ${maxRetries} retries`
        );
        // Clear editor status as a failsafe
        setCurrentEditor(null);
      }
    } catch (error) {
      console.error(
        `[${passage.passage_id}] Error in releasePassageLock:`,
        error
      );
      // Ensure editor state is cleared even on error
      setCurrentEditor(null);

      // Send one more WebSocket message to make sure all clients are updated
      const user = JSON.parse(localStorage.getItem("user"));
      if (user?.id) {
        const username = user.username || user.email;
        console.log(
          `[${passage.passage_id}] Sending final unlock message after error`
        );
        sendPassageUnlock(passage.passage_id, username);
      }
    }
  };

  const handleStartEditing = async () => {
    handleMenuClose();
    console.log(`[${passage.passage_id}] Attempting to start editing`);

    // Double-check if the passage is locked by someone else
    if (
      currentEditor &&
      currentEditor !==
        (JSON.parse(localStorage.getItem("user"))?.username ||
          JSON.parse(localStorage.getItem("user"))?.email)
    ) {
      console.log(
        `[${passage.passage_id}] Cannot edit - already locked by ${currentEditor}`
      );
      toast.error(`This passage is currently being edited by ${currentEditor}`);
      return;
    }

    // Try to acquire a lock
    console.log(`[${passage.passage_id}] Acquiring lock...`);
    const lockAcquired = await acquirePassageLock();

    if (lockAcquired) {
      console.log(`[${passage.passage_id}] Lock acquired, entering edit mode`);
      setIsEditing(true);
    } else {
      console.log(`[${passage.passage_id}] Failed to acquire lock`);
    }
  };

  const handleCancelEditing = () => {
    console.log(`[${passage.passage_id}] Canceling edit`);

    // First update UI state
    setIsEditing(false);

    // Reset the content to original
    setContent(localPassage.content);

    // Release the lock with a clear console message for debugging
    console.log(`[${passage.passage_id}] Releasing lock due to cancel edit`);
    releasePassageLock(false); // Show toast message

    toast.success("Edit canceled");
  };

  const handleSave = async () => {
    setLoading(true);
    let saveSuccess = false;
    let saveError = null;
    
    try {
      const user = JSON.parse(localStorage.getItem("user"));
      if (!user?.id) throw new Error("User not found");

      const updatedPassage = {
        ...passage,
        content,
        title,
        updated_at: new Date().toISOString(),
      };

      // First, update our local state immediately for optimistic UI update
      setLocalPassage(updatedPassage);
      setLastSaved(new Date());
      
      // Update parent component without triggering a full page refresh
      updateParentWithPassage(updatedPassage);

      // Try to save to backend with retries
      let retryCount = 0;
      const maxRetries = 2;
      let savedSuccessfully = false;
      
      while (!savedSuccessfully && retryCount <= maxRetries) {
        try {
          // Send the update via WebSocket to notify other users
          if (isConnected && sendContentUpdate) {
            console.log(`[${passage.passage_id}] Sending content update via WebSocket (attempt ${retryCount + 1})`);
            sendContentUpdate(passage.passage_id, content);
          }
          
          // Save to backend
          console.log(`[${passage.passage_id}] Saving to backend (attempt ${retryCount + 1})`);
          await storyApiClient.put(
            `/draft/passage/${passage.passage_id}`,
            {
              content,
              title,
              user_id: user.id,
            }
          );
          
          savedSuccessfully = true;
          saveSuccess = true;
          console.log(`[${passage.passage_id}] Successfully saved passage content (attempt ${retryCount + 1})`);
        } catch (err) {
          retryCount++;
          console.error(`[${passage.passage_id}] Error saving content (attempt ${retryCount}):`, err);
          
          if (retryCount > maxRetries) {
            saveError = err;
            throw err;
          }
          
          // Wait before retry
          await new Promise(resolve => setTimeout(resolve, 1000 * retryCount));
        }
      }
      
      // Exit editing mode BEFORE sending unlock message
      setIsEditing(false);
      
      // Include the updated content in the unlock message for real-time updates
      const userName = user.first_name && user.last_name
        ? `${user.first_name} ${user.last_name}`
        : user.username || user.email || "Unknown user";
      
      // Create a combined message with both unlock and content info
      const unlockWithContentMessage = {
        type: "passage_unlock",
        section: passage.passage_id,
        user_id: user.id,
        username: userName,
        content: content, // Include content in unlock message
        timestamp: new Date().toISOString(),
      };
      
      console.log(`[${passage.passage_id}] Sending unlock with content:`, unlockWithContentMessage);
      
      // 1. Send WebSocket message with content
      if (isConnected && websocketManager && websocketManager.socket) {
        try {
          websocketManager.send(unlockWithContentMessage);
          console.log(`[${passage.passage_id}] Unlock with content sent successfully via WebSocket`);
        } catch (err) {
          console.error(`[${passage.passage_id}] Error sending unlock with content via WebSocket:`, err);
        }
      }
      
      // 2. Dispatch a DOM event for local listeners
      try {
        const unlockEvent = new CustomEvent("passage-unlocked", {
          detail: {
            passageId: passage.passage_id,
            username: userName,
            content: content,
            timestamp: new Date().toISOString(),
            source: "local-save"
          }
        });
        window.dispatchEvent(unlockEvent);
        console.log(`[${passage.passage_id}] Dispatched local passage-unlocked event`);
      } catch (err) {
        console.error(`[${passage.passage_id}] Error dispatching passage-unlocked event:`, err);
      }
      
      // 3. Also use the regular unlock process as a backup
      await releasePassageLock();
      
      toast.success("Passage saved");
    } catch (error) {
      console.error("Error saving passage:", error);
      toast.error("Failed to save passage");
      
      // If we failed to save but the content changed,
      // still try to sync with other clients
      if (!saveSuccess && content !== passage.content) {
        try {
          // Dispatch an event to notify clients of the content change
          // even though the save failed
          const contentUpdateEvent = new CustomEvent("passage-content-changed", {
            detail: {
              passageId: passage.passage_id,
              content: content,
              timestamp: new Date().toISOString(),
              success: false
            }
          });
          window.dispatchEvent(contentUpdateEvent);
        } catch (err) {
          console.error("Error dispatching content update after save failure:", err);
        }
      }
    } finally {
      setLoading(false);
    }
  };

  // Add auto-save functionality
  useEffect(() => {
    let autoSaveTimeout;
    
    if (isEditing && content !== passage.content) {
      // Auto-save after 3 seconds of inactivity while editing
      autoSaveTimeout = setTimeout(async () => {
        try {
          const user = JSON.parse(localStorage.getItem("user"));
          if (!user?.id) return;
          
          // Only send to backend, don't change UI state
          await storyApiClient.put(
            `/draft/passage/${passage.passage_id}`,
            {
              content,
              title,
              user_id: user.id,
            }
          );
          
          // Update last saved time
          setLastSaved(new Date());
          
          // Notify other users via WebSocket
          if (isConnected && sendContentUpdate) {
            sendContentUpdate(passage.passage_id, content);
          }
          
          // Show subtle notification
          toast.success("Auto-saved", { duration: 2000 });
        } catch (error) {
          console.error("Auto-save error:", error);
        }
      }, 3000);
    }
    
    return () => {
      if (autoSaveTimeout) clearTimeout(autoSaveTimeout);
    };
  }, [content, isEditing, passage.passage_id, isConnected, sendContentUpdate]);

  const handleDelete = async () => {
    if (!window.confirm("Are you sure you want to delete this passage?"))
      return;

    setLoading(true);
    try {
      const user = JSON.parse(localStorage.getItem("user"));
      if (!user?.id) throw new Error("User not found");

      await storyApiClient.delete(`/draft/passage/${passage.passage_id}`, {
        params: { user_id: user.id },
      });

      toast.success("Passage deleted successfully!");

      // Notify parent to remove this passage
      if (onUpdate) {
        onUpdate(null, passage.passage_id); // Pass null to indicate deletion
      }
    } catch (error) {
      console.error("Error deleting passage:", error);
      toast.error("Failed to delete passage");
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  // Check if this user is the current editor
  const isCurrentUser = () => {
    if (!currentEditor) return false;

    const user = JSON.parse(localStorage.getItem("user"));
    const username = user?.username || user?.email;
    return currentEditor === username;
  };

  // Make the MenuItem disabled if someone else is editing
  const editDisabled = currentEditor && !isCurrentUser();

  // Add periodic check to ensure lock validity
  useEffect(() => {
    // Only run this if we're editing and connected
    if (isEditing && isConnected && currentEditor) {
      const user = JSON.parse(localStorage.getItem("user"));
      const username = user?.username || user?.email;

      // If we think we're editing but our username doesn't match the current editor
      if (currentEditor !== username) {
        console.log("Detected lock ownership mismatch, leaving edit mode");
        setIsEditing(false);

        // Reset content to avoid losing other editor's changes
        setContent(localPassage.content);
      }
    }
  }, [isEditing, isConnected, currentEditor, localPassage]);

  // If the user refreshes and returns to the page, check for broken locks
  useEffect(() => {
    // Check for orphaned locks when component mounts
    const checkOrphanedLock = async () => {
      if (!isReadOnly && isConnected) {
        try {
          const user = JSON.parse(localStorage.getItem("user"));
          if (!user?.id) return;

          const username = user.username || user.email;

          // If we load the page and are shown as the editor but aren't in edit mode,
          // that's likely a stale lock that needs to be cleared
          if (currentEditor === username && !isEditing) {
            console.log("Detected orphaned lock on page load, clearing it");
            await releasePassageLock();
          }
        } catch (error) {
          console.error("Error checking for orphaned locks:", error);
        }
      }
    };

    // Run once when component mounts and WebSocket is connected
    checkOrphanedLock();
  }, [isConnected, isReadOnly]);

  // Check for locked passages on WebSocket reconnect
  useEffect(() => {
    if (isConnected) {
      console.log("WebSocket connected, checking lock status for all passages");

      // Ensure we check locked passages on reconnection
      if (lockedPassages && lockedPassages[passage.passage_id]) {
        const lockInfo = lockedPassages[passage.passage_id];
        console.log(
          `Found lock for passage ${passage.passage_id} by ${lockInfo.username}`
        );
        setCurrentEditor(lockInfo.username);
      } else {
        // If the passage is not in lockedPassages, make sure currentEditor is cleared
        console.log(
          `No lock found for passage ${passage.passage_id}, clearing editor if any`
        );
        setCurrentEditor(null);
      }
    }
  }, [isConnected, passage.passage_id, lockedPassages]);

  // Function to force refresh lock status directly from the backend
  const forceRefreshLockStatus = async () => {
    try {
      console.log(
        `[${passage.passage_id}] Forcing lock status refresh from backend`
      );

      // Add a direct backend endpoint call to check the lock status
      const response = await storyApiClient.get(
        `/draft/passage/${passage.passage_id}/lock-status`
      );
      console.log(
        `[${passage.passage_id}] Lock status from backend:`,
        response.data
      );

      // If the passage is not locked according to the backend, clear our local state
      if (!response.data.locked_by) {
        console.log(
          `[${passage.passage_id}] Backend reports passage is not locked, clearing editor state`
        );
        setCurrentEditor(null);

        // If we were editing, exit edit mode (safety check)
        if (isEditing) {
          console.log(
            `[${passage.passage_id}] We were editing but backend says passage is not locked`
          );
          setIsEditing(false);
          toast.warning("Your edit session has ended");
        }
      } else {
        // If the passage is locked, update our local state accordingly
        const lockOwnerId = response.data.locked_by;

        // Fetch the username if possible
        let lockUsername = lockOwnerId;
        try {
          const userResponse = await storyApiClient.get(`/user/${lockOwnerId}`);
          if (userResponse.data && userResponse.data.username) {
            lockUsername = userResponse.data.username;
          }
        } catch (userError) {
          console.warn(
            `[${passage.passage_id}] Error fetching lock owner username:`,
            userError
          );
        }

        console.log(
          `[${passage.passage_id}] Backend reports passage is locked by ${lockUsername}`
        );

        // Update the current editor
        setCurrentEditor(lockUsername);

        // If we're not the owner of the lock but we're editing, exit edit mode
        const user = JSON.parse(localStorage.getItem("user"));
        if (user?.id !== lockOwnerId && isEditing) {
          console.log(
            `[${passage.passage_id}] We don't own the lock but we're editing - exiting edit mode`
          );
          setIsEditing(false);
          setContent(localPassage.content); // Reset content
          toast.error(`This passage is being edited by ${lockUsername}`);
        }
      }

      return true;
    } catch (error) {
      console.error(
        `[${passage.passage_id}] Error forcing lock status refresh:`,
        error
      );
      // Even on error, assume passage is not locked as a safety measure
      if (currentEditor) {
        console.log(
          `[${passage.passage_id}] Error checking lock status, clearing editor as safety measure`
        );
        setCurrentEditor(null);
      }
      return false;
    }
  };

  // Add this function to the synchronizeLockStatus function
  const synchronizeLockStatus = async () => {
    console.log(`[${passage.passage_id}] Synchronizing lock status...`);

    // Get current user info
    const user = JSON.parse(localStorage.getItem("user"));
    const username = user?.username || user?.email;

    // Check if we're shown as current editor but not editing
    if (currentEditor === username && !isEditing) {
      console.log(
        `[${passage.passage_id}] Detected lock inconsistency - we're shown as editor but not editing`
      );
      await releasePassageLock(true); // Silent mode
      return; // Exit early as we've taken action
    }

    // If we're editing but not shown as editor, try to acquire lock
    if (isEditing && currentEditor !== username) {
      console.log(
        `[${passage.passage_id}] Detected lock inconsistency - we're editing but not shown as editor`
      );
      await acquirePassageLock();
      return; // Exit early as we've taken action
    }

    // Check if known lock status matches WebSocket state
    if (lockedPassages && lockedPassages[passage.passage_id]) {
      const lockInfo = lockedPassages[passage.passage_id];
      console.log(
        `[${passage.passage_id}] WebSocket shows passage locked by ${lockInfo.username}`
      );

      // Update current editor if needed
      if (currentEditor !== lockInfo.username) {
        console.log(
          `[${passage.passage_id}] Updating editor from ${currentEditor} to ${lockInfo.username}`
        );
        setCurrentEditor(lockInfo.username);
      }
    } else if (currentEditor) {
      // WebSocket shows no lock but we have a current editor
      console.log(
        `[${passage.passage_id}] WebSocket shows no lock but current editor is ${currentEditor}`
      );

      // If there's a significant discrepancy, force a backend check
      if (currentEditor && !lockedPassages[passage.passage_id]) {
        console.log(
          `[${passage.passage_id}] Significant lock state discrepancy, forcing backend check`
        );
        await forceRefreshLockStatus();
        return;
      }

      // Check if we are the ones with the editor status
      if (currentEditor === username) {
        // We thought we had the lock but WebSocket state says no
        // If we're not actually editing, clear our editor status
        if (!isEditing) {
          console.log(
            `[${passage.passage_id}] Clearing our editor status as WebSocket shows no lock`
          );
          setCurrentEditor(null);

          // Send a WebSocket unlock message to make sure all clients are synchronized
          sendPassageUnlock(passage.passage_id, username);
        } else {
          // We are editing - refreshing our lock claim
          console.log(
            `[${passage.passage_id}] We're editing but lock not in WebSocket state - refreshing lock`
          );
          sendPassageLock(passage.passage_id, username);

          // Also refresh via API for good measure
          try {
            await passageService.lockPassage(passage.passage_id, user.id);
          } catch (error) {
            console.warn(
              `[${passage.passage_id}] Error refreshing lock via API:`,
              error
            );
          }
        }
      } else {
        // Someone else appears as editor but WebSocket says nobody has the lock
        // This is a stale UI state, clear it
        console.log(
          `[${passage.passage_id}] Clearing stale editor status for ${currentEditor}`
        );
        setCurrentEditor(null);
      }
    }

    // Double check - if WebSocket shows no lock, force refresh the UI status after a small delay
    if (!lockedPassages || !lockedPassages[passage.passage_id]) {
      setTimeout(() => {
        if (currentEditor && !isEditing) {
          console.log(
            `[${passage.passage_id}] Forced clearing of editor status after delay`
          );
          setCurrentEditor(null);
        }
      }, 500);
    }
  };

  // Periodically check lock status to ensure consistency
  useEffect(() => {
    // Set up periodic lock status check with a longer interval
    const interval = setInterval(() => {
      if (isConnected) {
        synchronizeLockStatus();
      }
    }, 15000); // Check every 15 seconds as a backup

    return () => clearInterval(interval);
  }, [isConnected]);

  // Listen for the passage-unlocked custom event
  useEffect(() => {
    // Define an event handler for passage unlock events
    const handlePassageUnlockedEvent = (event) => {
      const { passageId, username } = event.detail;

      // Only process events for this passage
      if (passageId === passage.passage_id) {
        console.log(
          `[${passage.passage_id}] Received passage-unlocked event from ${username}`
        );

        // If we were editing and someone else unlocked our passage (unusual case)
        if (
          isEditing &&
          username !== JSON.parse(localStorage.getItem("user"))?.username
        ) {
          console.log(
            `[${passage.passage_id}] Someone else unlocked our passage while editing!`
          );
          setIsEditing(false);
          setContent(localPassage.content); // Reset content
          toast.error("Someone else has taken control of this passage", {
            duration: 3000,
          });
        }

        // Always clear the editor status for this passage
        setCurrentEditor(null);
      }
    };

    // Register the event listener
    window.addEventListener("passage-unlocked", handlePassageUnlockedEvent);

    // Clean up the event listener when component unmounts
    return () => {
      window.removeEventListener(
        "passage-unlocked",
        handlePassageUnlockedEvent
      );
    };
  }, [passage.passage_id, isEditing, localPassage]);

  // Also listen for the WebSocket connection state and refresh locks
  useEffect(() => {
    if (isConnected && !isReadOnly) {
      // Periodically check lock status to ensure we get unlock notifications
      const lockRefreshInterval = setInterval(() => {
        // If we're not editing but the passage shows as locked
        if (!isEditing && currentEditor) {
          // Double-check with WebSocket state
          if (!lockedPassages || !lockedPassages[passage.passage_id]) {
            console.log(
              `[${passage.passage_id}] Lock state mismatch detected during refresh check`
            );
            setCurrentEditor(null);
          }
        }
      }, 3000); // Check every 3 seconds

      return () => clearInterval(lockRefreshInterval);
    }
  }, [
    isConnected,
    isReadOnly,
    isEditing,
    currentEditor,
    lockedPassages,
    passage.passage_id,
  ]);

  return (
    <Box sx={{ mb: 4 }}>
      <Box
        sx={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          mb: 1,
        }}
      >
        <Box>
          {title && (
            <Typography variant="h6" gutterBottom>
              {title}
            </Typography>
          )}
          <Typography variant="caption" color="text.secondary">
            Last updated: {formatDate(lastSaved)}
          </Typography>
        </Box>

        <Stack direction="row" spacing={1} alignItems="center">
          {currentEditor && !isEditing && (
            <Tooltip title={`Being edited by ${currentEditor}`}>
              <Chip
                icon={<PersonIcon fontSize="small" />}
                label={`${currentEditor} is editing...`}
                color="warning"
                size="small"
                variant="outlined"
                sx={{ fontStyle: "italic" }}
              />
            </Tooltip>
          )}

          {isEditing && (
            <Tooltip title="You are currently editing">
              <Chip
                icon={<LockOpenIcon fontSize="small" />}
                label="You are editing"
                color="success"
                size="small"
                variant="outlined"
              />
            </Tooltip>
          )}

          {!isReadOnly && (
            <>
              <IconButton
                size="small"
                onClick={() => setIsExpanded(!isExpanded)}
                sx={{ color: "text.secondary" }}
              >
                {isExpanded ? <ExpandLessIcon /> : <ExpandMoreIcon />}
              </IconButton>

              <Tooltip
                title={
                  editDisabled
                    ? "Currently being edited by another user"
                    : "Edit options"
                }
              >
                <span>
                  <IconButton
                    size="small"
                    onClick={handleMenuOpen}
                    sx={{ color: "text.secondary" }}
                    disabled={editDisabled && !isEditing}
                  >
                    <MoreVertIcon />
                  </IconButton>
                </span>
              </Tooltip>
            </>
          )}
        </Stack>
      </Box>

      {/* Active editor status bar - visible for both viewers and editors */}
      {currentEditor && !isEditing && (
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            gap: 1,
            py: 1,
            px: 2,
            mb: 1,
            borderRadius: "4px",
            bgcolor: "rgba(251, 191, 36, 0.1)",
            border: "1px dashed rgba(251, 191, 36, 0.6)",
          }}
        >
          <Box
            component="span"
            sx={{
              width: "10px",
              height: "10px",
              borderRadius: "50%",
              bgcolor: "rgb(251 191 36)",
              display: "inline-block",
              animation: "pulse 1.5s infinite ease-in-out",
            }}
          />
          <Typography
            variant="body2"
            color="warning.main"
            sx={{ fontWeight: "medium" }}
          >
            <b>{currentEditor}</b> is currently editing this passage
          </Typography>
        </Box>
      )}

      <Collapse in={!isExpanded}>
        {isEditing ? (
          <Paper
            elevation={0}
            sx={{
              p: 0,
              position: "relative",
              overflow: "hidden",
              bgcolor: "background.paper",
              borderRadius: "4px",
            }}
          >
            {/* Editor Status Bar */}
            <Box
              sx={{
                bgcolor: "rgba(34, 197, 94, 0.1)",
                p: 1.5,
                borderBottom: "1px solid rgba(34, 197, 94, 0.3)",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
              }}
            >
              <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                <LockOpenIcon
                  fontSize="small"
                  sx={{ color: "rgb(34 197 94)" }}
                />
                <Typography
                  variant="body2"
                  sx={{ fontWeight: "medium", color: "rgb(34 197 94)" }}
                >
                  Editing Mode
                </Typography>
              </Box>
              <Chip
                size="small"
                label="You have exclusive access"
                color="success"
                variant="outlined"
                sx={{ height: "24px" }}
              />
            </Box>

            {/* Textfield with custom styling */}
            <TextField
              fullWidth
              multiline
              rows={10}
              value={content}
              onChange={(e) => setContent(e.target.value)}
              variant="outlined"
              placeholder="Write your passage content here..."
              sx={{
                "& .MuiOutlinedInput-root": {
                  backgroundColor: "rgba(255, 255, 255, 0.9)",
                  borderRadius: 0,
                  // Custom border styling that matches the theme
                  "& fieldset": {
                    borderColor: "rgba(34, 197, 94, 0.3)",
                    borderWidth: "0 0 0 0", // Only show left/right/bottom borders
                  },
                  "&:hover fieldset": {
                    borderColor: "rgba(34, 197, 94, 0.6) !important", // Override MUI's default hover border
                  },
                  "&.Mui-focused fieldset": {
                    borderColor: "rgb(34 197 94) !important",
                  },
                },
                "& .MuiOutlinedInput-input": {
                  p: 2, // Adjust padding
                },
              }}
            />

            {/* Action Buttons */}
            <Box
              sx={{
                p: 2,
                display: "flex",
                justifyContent: "flex-end",
                borderTop: "1px solid rgba(34, 197, 94, 0.1)",
              }}
            >
              <Button
                variant="outlined"
                onClick={handleCancelEditing}
                sx={{
                  mr: 1,
                  borderColor: "rgba(34, 197, 94, 0.5)",
                  color: "rgb(34 197 94)",
                  "&:hover": {
                    borderColor: "rgb(34 197 94)",
                    backgroundColor: "rgba(34, 197, 94, 0.04)",
                  },
                }}
              >
                Cancel
              </Button>
              <Button
                variant="contained"
                startIcon={<SaveIcon />}
                onClick={handleSave}
                disabled={loading}
                sx={{
                  bgcolor: "rgb(34 197 94)",
                  "&:hover": { bgcolor: "rgb(22 163 74)" },
                }}
              >
                {loading ? "Saving..." : "Save"}
              </Button>
            </Box>
          </Paper>
        ) : (
          <Paper
            id={`passage-${passage.passage_id}`}
            elevation={0}
            sx={{
              overflow: "hidden",
              borderRadius: "4px",
              border: currentEditor
                ? "1px dashed rgba(251, 191, 36, 0.5)"
                : "1px solid rgba(0, 0, 0, 0.1)",
              ...(currentEditor && {
                boxShadow: "0 0 8px rgba(251, 191, 36, 0.15)",
              }),
              transition: "background-color 0.3s ease-in-out",
              "&.content-updated": {
                animation: "content-highlight 3s ease-in-out"
              }
            }}
          >
            <Typography
              variant="body1"
              sx={{
                whiteSpace: "pre-wrap",
                backgroundColor: "rgba(255, 255, 255, 0.9)",
                p: 2.5,
                minHeight: "100px",
                lineHeight: 1.8,
              }}
            >
              {content || "No content yet."}
            </Typography>
          </Paper>
        )}
      </Collapse>

      <style jsx global>{`
        @keyframes pulse {
          0% {
            opacity: 0.4;
          }
          50% {
            opacity: 1;
          }
          100% {
            opacity: 0.4;
          }
        }
        
        @keyframes content-highlight {
          0% {
            background-color: rgba(34, 197, 94, 0.15);
          }
          50% {
            background-color: rgba(34, 197, 94, 0.05);
          }
          100% {
            background-color: transparent;
          }
        }
        
        .content-updated {
          animation: content-highlight 3s ease-in-out;
        }
      `}</style>

      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleMenuClose}
      >
        <MenuItem
          onClick={handleStartEditing}
          disabled={editDisabled || lockLoading}
          sx={{
            color: "rgb(34 197 94)",
            fontWeight: "bold",
            "&:hover": { bgcolor: "rgba(34, 197, 94, 0.1)" },
          }}
        >
          <EditIcon fontSize="small" sx={{ mr: 1, color: "rgb(34 197 94)" }} />{" "}
          {lockLoading ? "Loading..." : "Edit"}
        </MenuItem>
        <MenuItem
          onClick={() => {
            handleMenuClose();
            handleDelete();
          }}
          disabled={editDisabled}
        >
          <DeleteIcon fontSize="small" sx={{ mr: 1 }} /> Delete
        </MenuItem>
      </Menu>
    </Box>
  );
}
