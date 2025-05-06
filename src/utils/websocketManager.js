class WebSocketManager {
  constructor() {
    this.socket = null;
    this.isConnected = false;
    this.messageHandlers = new Map();
    this.connectionHandlers = new Set();
    this.disconnectionHandlers = new Set();
    this.errorHandlers = new Set();
    this.storyId = null;
    this.userId = null;
    this.connectionAttempts = 0;
    this.maxConnectionAttempts = 3;
  }

  connect(storyId, userId) {
    if (this.isConnected) {
      this.disconnect();
    }

    this.storyId = storyId;
    this.userId = userId;
    this.connectionAttempts = 0;

    return this.attemptConnection();
  }

  attemptConnection() {
    if (this.connectionAttempts >= this.maxConnectionAttempts) {
      console.error("Maximum connection attempts reached");
      this.errorHandlers.forEach((handler) =>
        handler(new Error("Failed to connect after multiple attempts"))
      );
      return this;
    }

    this.connectionAttempts++;

    // Build WebSocket URL with auth token
    const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
    const baseUrl = process.env.NEXT_PUBLIC_STORY_API_URI || "localhost:7777";
    const wsBaseUrl = baseUrl.replace(/^https?:\/\//, "");

    // Debug story ID and user ID
    console.log(
      "Connecting with storyId:",
      this.storyId,
      "userId:",
      this.userId
    );

    // Important: Make sure we're passing unmodified IDs from MongoDB
    const wsUrl = `${protocol}//${wsBaseUrl}/ws/story/${this.storyId}?token=${this.userId}`;

    console.log(
      `WebSocket URL (redacted): ${protocol}//${wsBaseUrl}/ws/story/${this.storyId}?token=***`
    );
    console.log(
      `Story ID type: ${typeof this.storyId}, User ID type: ${typeof this
        .userId}`
    );
    console.log(
      `Connection attempt ${this.connectionAttempts}/${this.maxConnectionAttempts}`
    );

    this.socket = new WebSocket(wsUrl);

    this.socket.onopen = () => {
      console.log("WebSocket connection established");
      this.isConnected = true;
      this.connectionAttempts = 0; // Reset counter on success
      this.connectionHandlers.forEach((handler) => handler());
    };

    this.socket.onclose = (event) => {
      console.log(
        `WebSocket connection closed: ${event.code} - ${event.reason}`
      );
      this.isConnected = false;

      // Only notify on unexpected closures, not intentional disconnects
      if (event.code !== 1000 && event.code !== 1001) {
        this.disconnectionHandlers.forEach((handler) => handler());

        // Try to reconnect if it wasn't a normal closure
        if (this.connectionAttempts < this.maxConnectionAttempts) {
          console.log("Attempting to reconnect...");
          setTimeout(() => this.attemptConnection(), 3000);
        }
      }
    };

    this.socket.onerror = (error) => {
      console.error("WebSocket error:", error);
      this.errorHandlers.forEach((handler) => handler(error));
    };

    this.socket.onmessage = (event) => {
      try {
        const message = JSON.parse(event.data);
        const { type } = message;

        // Call handlers for this message type
        if (this.messageHandlers.has(type)) {
          this.messageHandlers.get(type).forEach((handler) => handler(message));
        }
      } catch (error) {
        console.error("Error processing message:", error);
      }
    };

    return this;
  }

  disconnect() {
    if (
      this.socket &&
      (this.socket.readyState === WebSocket.OPEN ||
        this.socket.readyState === WebSocket.CONNECTING)
    ) {
      this.socket.close();
    }
    this.isConnected = false;
    this.socket = null;
    return this;
  }

  send(message) {
    if (!this.isConnected || !this.socket) {
      console.error("Cannot send message: WebSocket is not connected");
      return false;
    }

    try {
      this.socket.send(JSON.stringify(message));
      return true;
    } catch (error) {
      console.error("Error sending message:", error);
      return false;
    }
  }

  // Send content update to collaborators
  sendContentUpdate(messageData) {
    // Handle both the new format (JSON string) and the old format (content, section)
    try {
      let message;
      if (typeof messageData === 'string') {
        message = JSON.parse(messageData);
      } else {
        // Legacy support for old format
        console.warn('Using deprecated content update format, please update your code');
        message = {
          type: "content_update",
          content: messageData,
          section: arguments[1],
          timestamp: Date.now(),
        };
      }
      
      return this.send(message);
    } catch (error) {
      console.error("Error sending content update:", error);
      return false;
    }
  }

  // Send passage lock notification
  sendPassageLock(messageData) {
    try {
      let message;
      if (typeof messageData === 'string') {
        message = JSON.parse(messageData);
      } else {
        // Legacy support for old format
        console.warn('Using deprecated passage lock format, please update your code');
        message = {
          type: "passage_lock",
          section: messageData,
          username: arguments[1],
          timestamp: Date.now(),
        };
      }
      
      return this.send(message);
    } catch (error) {
      console.error("Error sending passage lock:", error);
      return false;
    }
  }

  // Send passage unlock notification
  sendPassageUnlock(messageData) {
    try {
      let message;
      if (typeof messageData === 'string') {
        message = JSON.parse(messageData);
      } else {
        // Legacy support for old format
        console.warn('Using deprecated passage unlock format, please update your code');
        message = {
          type: "passage_unlock",
          section: messageData,
          username: arguments[1],
          timestamp: Date.now(),
        };
      }

      const { section, username } = message;
      
      console.log(
        `[WebSocket] Sending passage_unlock for ${section} by ${username}`
      );

      const success = this.send(message);

      if (!success) {
        console.warn(
          `[WebSocket] Failed to send passage_unlock message for ${section}, retrying...`
        );
        // Retry after a short delay
        setTimeout(() => {
          console.log(`[WebSocket] Retrying passage_unlock for ${section}`);
          const retrySuccess = this.send(message);
          if (!retrySuccess) {
            console.error(
              `[WebSocket] Failed to send passage_unlock message for ${section} on retry`
            );

            // As a last resort, trigger a custom event to update the UI
            if (typeof window !== "undefined") {
              const unlockEvent = new CustomEvent("passage-unlocked", {
                detail: {
                  passageId: section,
                  username: username,
                  timestamp: Date.now(),
                  source: "local-fallback",
                },
              });
              window.dispatchEvent(unlockEvent);
              console.log(
                `[WebSocket] Dispatched local passage-unlocked event for ${section}`
              );
            }
          }
        }, 1000);
      }

      return success;
    } catch (error) {
      console.error("Error sending passage unlock:", error);
      return false;
    }
  }

  // Send cursor position to collaborators
  sendCursorPosition(position, section) {
    return this.send({
      type: "cursor_position",
      position,
      section,
      timestamp: Date.now(),
    });
  }

  // Register a message handler
  onMessage(type, handler) {
    if (!this.messageHandlers.has(type)) {
      this.messageHandlers.set(type, new Set());
    }
    this.messageHandlers.get(type).add(handler);
    return this;
  }

  // Remove a message handler
  offMessage(type, handler) {
    if (this.messageHandlers.has(type)) {
      this.messageHandlers.get(type).delete(handler);
    }
    return this;
  }

  // Register a connection handler
  onConnect(handler) {
    this.connectionHandlers.add(handler);
    return this;
  }

  // Remove a connection handler
  offConnect(handler) {
    this.connectionHandlers.delete(handler);
    return this;
  }

  // Register a disconnection handler
  onDisconnect(handler) {
    this.disconnectionHandlers.add(handler);
    return this;
  }

  // Remove a disconnection handler
  offDisconnect(handler) {
    this.disconnectionHandlers.delete(handler);
    return this;
  }

  // Register an error handler
  onError(handler) {
    this.errorHandlers.add(handler);
    return this;
  }

  // Remove an error handler
  offError(handler) {
    this.errorHandlers.delete(handler);
    return this;
  }

  // Clear all handlers
  clearHandlers() {
    this.messageHandlers.clear();
    this.connectionHandlers.clear();
    this.disconnectionHandlers.clear();
    this.errorHandlers.clear();
    return this;
  }
}

// Create a singleton instance
const websocketManager = new WebSocketManager();

// Make it available globally for troubleshooting and direct access
if (typeof window !== 'undefined') {
  window.websocketManager = websocketManager;
  
  // Also expose the register message handler function globally
  window.registerMessageHandler = (type, handler) => {
    return websocketManager.onMessage(type, handler);
  };
}

export default websocketManager;
