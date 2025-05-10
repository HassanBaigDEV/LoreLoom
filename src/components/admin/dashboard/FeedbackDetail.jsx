import React, { useState } from "react";
import {
  Box,
  Paper,
  Typography,
  TextField,
  Button,
  Divider,
  IconButton,
  Chip,
  Stack,
  Card,
  CardContent,
  Link,
  Alert,
} from "@mui/material";
import {
  ArrowBack as ArrowBackIcon,
  Delete as DeleteIcon,
  Schedule as ScheduleIcon,
  Person as PersonIcon,
  Link as LinkIcon,
} from "@mui/icons-material";
import { useRouter } from "next/navigation";

const getStatusColor = (status) => {
  switch (status?.toLowerCase()) {
    case "pending":
      return { color: "warning", label: "Pending" };
    case "resolved":
      return { color: "success", label: "Resolved" };
    case "in_progress":
      return { color: "info", label: "In Progress" };
    default:
      return { color: "default", label: status };
  }
};

const getFeedbackTypeLabel = (type) => {
  const types = {
    bug: "Bug Report",
    feature: "Feature Request",
    support: "Support Request",
    general: "General Feedback",
    other: "Other",
  };
  return types[type?.toLowerCase()] || type;
};

export default function FeedbackDetail({ feedback, onRespond, onDelete }) {
  const router = useRouter();
  const [response, setResponse] = useState("");
  const [status, setStatus] = useState(feedback?.status || "pending");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  const handleSubmitResponse = async () => {
    setLoading(true);
    setError("");
    setSuccess(false);

    try {
      await onRespond(feedback.id, {
        response,
        status,
      });
      setSuccess(true);
      setResponse("");
    } catch (err) {
      setError(err.message || "Failed to submit response");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (window.confirm("Are you sure you want to delete this feedback?")) {
      await onDelete(feedback.id);
      router.push("/admin/dashboard");
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <Box sx={{ p: 3, maxWidth: 800, mx: "auto" }}>
      {/* Header */}
      <Box
        sx={{
          mb: 3,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
          <IconButton
            onClick={() => router.push("/admin/dashboard")}
            sx={{ bgcolor: "grey.100", "&:hover": { bgcolor: "grey.200" } }}
          >
            <ArrowBackIcon />
          </IconButton>
          <Typography variant="h5" component="h1">
            Feedback Details
          </Typography>
        </Box>
        <IconButton
          color="error"
          onClick={handleDelete}
          sx={{
            bgcolor: "error.light",
            color: "white",
            "&:hover": { bgcolor: "error.dark" },
          }}
        >
          <DeleteIcon />
        </IconButton>
      </Box>

      {/* Main Content */}
      <Card elevation={2}>
        <CardContent>
          {/* Status and Type */}
          <Stack direction="row" spacing={2} sx={{ mb: 3 }}>
            <Chip
              label={getStatusColor(feedback.status).label}
              color={getStatusColor(feedback.status).color}
            />
            <Chip
              label={getFeedbackTypeLabel(feedback.type)}
              variant="outlined"
            />
          </Stack>

          {/* Title and Description */}
          <Typography variant="h6" gutterBottom>
            {feedback.title}
          </Typography>
          <Typography variant="body1" sx={{ mb: 3, whiteSpace: "pre-wrap" }}>
            {feedback.description}
          </Typography>

          {/* Screenshot URL */}
          {feedback.screenshot_url && (
            <Box sx={{ mb: 3 }}>
              <Link
                href={feedback.screenshot_url}
                target="_blank"
                rel="noopener noreferrer"
                sx={{ display: "flex", alignItems: "center", gap: 1 }}
              >
                <LinkIcon fontSize="small" />
                View Screenshot
              </Link>
            </Box>
          )}

          {/* Metadata */}
          <Stack spacing={1} sx={{ mb: 3 }}>
            <Box
              sx={{
                display: "flex",
                alignItems: "center",
                gap: 1,
                color: "text.secondary",
              }}
            >
              <PersonIcon fontSize="small" />
              <Typography variant="body2">
                User ID: {feedback.user_id}
              </Typography>
            </Box>
            <Box
              sx={{
                display: "flex",
                alignItems: "center",
                gap: 1,
                color: "text.secondary",
              }}
            >
              <ScheduleIcon fontSize="small" />
              <Typography variant="body2">
                Submitted: {formatDate(feedback.created_at)}
              </Typography>
            </Box>
          </Stack>

          <Divider sx={{ my: 3 }} />

          {/* Admin Response Section */}
          {feedback.admin_response ? (
            <Box sx={{ mb: 3 }}>
              <Typography
                variant="subtitle2"
                color="text.secondary"
                gutterBottom
              >
                Previous Response
              </Typography>
              <Paper variant="outlined" sx={{ p: 2, bgcolor: "grey.50" }}>
                <Typography>{feedback.admin_response}</Typography>
              </Paper>
            </Box>
          ) : null}

          {/* Response Form */}
          <Box sx={{ mt: 3 }}>
            <Typography variant="subtitle1" gutterBottom>
              Respond to Feedback
            </Typography>

            {error && (
              <Alert severity="error" sx={{ mb: 2 }}>
                {error}
              </Alert>
            )}

            {success && (
              <Alert severity="success" sx={{ mb: 2 }}>
                Response submitted successfully!
              </Alert>
            )}

            <TextField
              fullWidth
              multiline
              rows={4}
              label="Your Response"
              value={response}
              onChange={(e) => setResponse(e.target.value)}
              sx={{ mb: 2 }}
            />

            <Stack direction="row" spacing={2}>
              <Button
                variant="contained"
                onClick={handleSubmitResponse}
                disabled={!response.trim() || loading}
                sx={{
                  bgcolor: "primary.main",
                  "&:hover": { bgcolor: "primary.dark" },
                }}
              >
                {loading ? "Sending..." : "Send Response"}
              </Button>

              <Button
                variant="outlined"
                onClick={() => router.push("/admin/dashboard")}
              >
                Cancel
              </Button>
            </Stack>
          </Box>
        </CardContent>
      </Card>
    </Box>
  );
}
