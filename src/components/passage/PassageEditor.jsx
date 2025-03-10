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

export default function PassageEditor({ passage, onUpdate }) {
  const [isEditing, setIsEditing] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [content, setContent] = useState(passage.content);
  const [title, setTitle] = useState(passage.title);
  const [anchorEl, setAnchorEl] = useState(null);
  const [loading, setLoading] = useState(false);
  useEffect(() => {
    console.log(passage);
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
        user_id: user.id,
        content,
      });

      toast.success("Passage saved successfully!");
      setIsEditing(false);
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
          params: { user_id: user.id },
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
      {/* Header */}
      <Box
        sx={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          mb: 2,
        }}
      >
        <Stack spacing={1}>
          {isEditing ? (
            <TextField
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              variant="standard"
              fullWidth
              sx={{
                "& .MuiInputBase-input": {
                  fontSize: "1.25rem",
                  fontWeight: 600,
                },
              }}
            />
          ) : (
            <Typography variant="h6" sx={{ fontWeight: 600 }}>
              {passage.title}
            </Typography>
          )}
          {/* <Typography variant="caption" color="text.secondary">
            Last updated: {formatDate(passage.updated_at)}
          </Typography> */}
        </Stack>

        <Stack direction="row" spacing={1}>
          <IconButton onClick={() => setIsExpanded(!isExpanded)} size="small">
            {isExpanded ? <ExpandLessIcon /> : <ExpandMoreIcon />}
          </IconButton>
          <IconButton onClick={handleMenuOpen} size="small">
            <MoreVertIcon />
          </IconButton>
        </Stack>

        <Menu
          anchorEl={anchorEl}
          open={Boolean(anchorEl)}
          onClose={handleMenuClose}
        >
          <MenuItem
            onClick={() => {
              handleMenuClose();
              setIsEditing(!isEditing);
            }}
          >
            <EditIcon sx={{ mr: 1 }} fontSize="small" />
            {isEditing ? "Cancel Edit" : "Edit"}
          </MenuItem>
          {isEditing && (
            <MenuItem
              onClick={() => {
                handleMenuClose();
                handleSave();
              }}
            >
              <SaveIcon sx={{ mr: 1 }} fontSize="small" />
              Save
            </MenuItem>
          )}
          <MenuItem
            onClick={() => {
              handleMenuClose();
              handleDelete();
            }}
            sx={{ color: "error.main" }}
          >
            <DeleteIcon sx={{ mr: 1 }} fontSize="small" />
            Delete
          </MenuItem>
        </Menu>
      </Box>

      {/* Content */}
      <Collapse in={isExpanded} collapsedSize={100}>
        {isEditing ? (
          <TextField
            value={content}
            onChange={(e) => setContent(e.target.value)}
            multiline
            fullWidth
            minRows={4}
            maxRows={20}
            variant="outlined"
            sx={{
              "& .MuiOutlinedInput-root": {
                backgroundColor: "rgba(0, 0, 0, 0.02)",
              },
            }}
          />
        ) : (
          <Typography
            variant="body1"
            sx={{
              whiteSpace: "pre-wrap",
              color: "text.secondary",
              lineHeight: 1.7,
            }}
          >
            {passage.content}
          </Typography>
        )}
      </Collapse>

      {/* Save Button */}
      {isEditing && (
        <Box
          sx={{ mt: 2, display: "flex", justifyContent: "flex-end", gap: 1 }}
        >
          <Button
            variant="outlined"
            onClick={() => setIsEditing(false)}
            disabled={loading}
          >
            Cancel
          </Button>
          <Button
            variant="contained"
            onClick={handleSave}
            disabled={loading}
            sx={{
              bgcolor: "rgb(34 197 94)",
              "&:hover": { bgcolor: "rgb(22 163 74)" },
            }}
          >
            {loading ? "Saving..." : "Save Changes"}
          </Button>
        </Box>
      )}
    </Box>
  );
}
