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
} from "@mui/material";
import {
  Edit as EditIcon,
  Save as SaveIcon,
  Delete as DeleteIcon,
  MoreVert as MoreVertIcon,
  ExpandMore as ExpandMoreIcon,
  ExpandLess as ExpandLessIcon,
} from "@mui/icons-material";
import { toast } from "react-hot-toast";
import storyApiClient from "@/lib/storyApi";
import { useWebSocketCollaboration } from "@/hooks/useWebSocketCollaboration";

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
  const [lastSaved, setLastSaved] = useState(
    new Date(passage.updated_at || passage.created_at)
  );

  // Get the collaboration tools
  const { sendContentUpdate, registerMessageHandler } =
    useWebSocketCollaboration();

  useEffect(() => {
    console.log(passage);
  }, [passage]);

  // Listen for content updates from other collaborators
  useEffect(() => {
    if (isReadOnly) return;

    const handleContentUpdate = (message) => {
      // Only update if we're not in edit mode and the update is for this passage
      if (!isEditing && message.section === passage.passage_id) {
        setContent(message.content);
        setLastSaved(new Date());
        toast.success("Content updated by collaborator");
      }
    };

    // Register handler for content updates
    const unregister = registerMessageHandler(
      "content_update",
      handleContentUpdate
    );

    // Cleanup on unmount
    return () => unregister();
  }, [passage.passage_id, isEditing, registerMessageHandler, isReadOnly]);

  // Update content when passage changes
  useEffect(() => {
    setContent(passage.content);
    setTitle(passage.title);
    setLastSaved(new Date(passage.updated_at || passage.created_at));
  }, [passage]);

  const handleMenuOpen = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  const handleSave = async () => {
    setLoading(true);
    try {
      const user = JSON.parse(localStorage.getItem("user"));
      if (!user?.id) throw new Error("User not found");

      await storyApiClient.put(`/draft/passage/${passage.passage_id}`, {
        user_id: user?.id,
        content,
      });

      // Broadcast the content update to other collaborators
      sendContentUpdate(content, passage.passage_id);

      toast.success("Passage saved successfully!");
      setIsEditing(false);
      setLastSaved(new Date());
      if (onUpdate) onUpdate();
    } catch (error) {
      console.error("Error saving passage:", error);
      toast.error("Failed to save passage");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!window.confirm("Are you sure you want to delete this passage?"))
      return;

    setLoading(true);
    try {
      const user = JSON.parse(localStorage.getItem("user"));
      if (!user?.id) throw new Error("User not found");
      console.log(passage.passage_id);

      await storyApiClient.delete(
        `/draft/passage/${passage.passage_id}`,

        {
          params: { user_id: user?.id },
        }
      );

      toast.success("Passage deleted successfully!");
      if (onUpdate) onUpdate();
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

  return (
    <Box>
      <Box
        sx={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          mb: 2,
        }}
      >
        {title && (
          <Typography variant="h6" gutterBottom>
            {title}
          </Typography>
        )}

        <Stack direction="row" spacing={1} alignItems="center">
          <Typography variant="caption" color="text.secondary">
            Last updated: {formatDate(lastSaved)}
          </Typography>

          {!isReadOnly && (
            <>
              <IconButton
                size="small"
                onClick={() => setIsExpanded(!isExpanded)}
                sx={{ color: "text.secondary" }}
              >
                {isExpanded ? <ExpandLessIcon /> : <ExpandMoreIcon />}
              </IconButton>

              <IconButton
                size="small"
                onClick={handleMenuOpen}
                sx={{ color: "text.secondary" }}
              >
                <MoreVertIcon />
              </IconButton>
            </>
          )}
        </Stack>
      </Box>

      <Collapse in={!isExpanded}>
        {isEditing ? (
          <Box>
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
                },
              }}
            />
            <Box sx={{ mt: 2, display: "flex", justifyContent: "flex-end" }}>
              <Button
                variant="outlined"
                onClick={() => {
                  setIsEditing(false);
                  setContent(passage.content);
                }}
                sx={{ mr: 1 }}
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
          </Box>
        ) : (
          <Box>
            <Typography
              variant="body1"
              sx={{
                whiteSpace: "pre-wrap",
                backgroundColor: "rgba(255, 255, 255, 0.9)",
                p: 2,
                borderRadius: 1,
                minHeight: "100px",
                lineHeight: 1.8,
              }}
            >
              {content || "No content yet."}
            </Typography>
            {!isReadOnly && (
              <Box sx={{ mt: 2, display: "flex", justifyContent: "flex-end" }}>
                <Button
                  variant="contained"
                  startIcon={<EditIcon />}
                  onClick={() => setIsEditing(true)}
                  sx={{
                    bgcolor: "rgb(34 197 94)",
                    "&:hover": { bgcolor: "rgb(22 163 74)" },
                  }}
                >
                  Edit
                </Button>
              </Box>
            )}
          </Box>
        )}
      </Collapse>

      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleMenuClose}
      >
        <MenuItem
          onClick={() => {
            handleMenuClose();
            setIsEditing(true);
          }}
        >
          <EditIcon fontSize="small" sx={{ mr: 1 }} /> Edit
        </MenuItem>
        <MenuItem
          onClick={() => {
            handleMenuClose();
            handleDelete();
          }}
        >
          <DeleteIcon fontSize="small" sx={{ mr: 1 }} /> Delete
        </MenuItem>
      </Menu>
    </Box>
  );
}
