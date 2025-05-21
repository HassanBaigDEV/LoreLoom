import React, { useState } from 'react';
import {
  Box,
  TextField,
  Button,
  Paper,
  Typography,
  Alert,
  MenuItem,
  Stack,
  InputAdornment,
  Tooltip,
  Zoom,
} from '@mui/material';
import {
  BugReport,
  Lightbulb,
  Help,
  Support,
  Comment,
  Link as LinkIcon,
  Send as SendIcon,
} from '@mui/icons-material';
import { feedbackService } from '@/lib/feedbackService';

const feedbackTypes = [
  { value: 'general', label: 'General Feedback', icon: Comment, description: 'Share your general thoughts about the platform' },
  { value: 'bug', label: 'Bug Report', icon: BugReport, description: 'Report technical issues or bugs' },
  { value: 'feature', label: 'Feature Request', icon: Lightbulb, description: 'Suggest new features or improvements' },
  { value: 'support', label: 'Support Request', icon: Support, description: 'Get help with using the platform' },
  { value: 'other', label: 'Other', icon: Help, description: 'Other types of feedback' },
];

export default function FeedbackForm({ onSubmitSuccess }) {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    type: '',
    screenshot_url: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess(false);

    try {
      const submitData = { ...formData, screenshot_url: formData.screenshot_url || '' };
      await feedbackService.createFeedback(submitData);
      setSuccess(true);
      setFormData({ title: '', description: '', type: '', screenshot_url: '' });
      if (onSubmitSuccess) {
        onSubmitSuccess();
      }
    } catch (err) {
      console.error('Feedback submission error:', err);
      setError(err.response?.data?.detail || 'Failed to submit feedback');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Paper 
      elevation={0}
      sx={{ 
        p: { xs: 2, sm: 3 },
        borderRadius: 2,
        bgcolor: 'white',
        border: '1px solid',
        borderColor: 'divider',
      }}
    >
      <Typography 
        variant="h6" 
        component="h2" 
        gutterBottom
        sx={{ 
          fontWeight: 600,
          color: 'text.primary',
          mb: 3
        }}
      >
        Submit New Feedback
      </Typography>

      {error && (
        <Alert 
          severity="error" 
          sx={{ mb: 3, borderRadius: 1 }}
          onClose={() => setError('')}
        >
          {error}
        </Alert>
      )}

      {success && (
        <Alert 
          severity="success" 
          sx={{ mb: 3, borderRadius: 1 }}
          onClose={() => setSuccess(false)}
        >
          Thank you for your feedback! We'll review it shortly.
        </Alert>
      )}

      <form onSubmit={handleSubmit}>
        <Stack spacing={3}>
          <TextField
            select
            label="Feedback Type"
            name="type"
            value={formData.type}
            onChange={handleChange}
            required
            SelectProps={{
              MenuProps: {
                PaperProps: {
                  sx: { maxHeight: 300 }
                }
              }
            }}
          >
            {feedbackTypes.map((option) => {
              const Icon = option.icon;
              return (
                <MenuItem key={option.value} value={option.value}>
                  <Stack direction="row" alignItems="center" spacing={1}>
                    <Icon fontSize="small" />
                    <Box>
                      <Typography variant="body1">{option.label}</Typography>
                      <Typography variant="caption" color="text.secondary">
                        {option.description}
                      </Typography>
                    </Box>
                  </Stack>
                </MenuItem>
              );
            })}
          </TextField>

          <TextField
            label="Title"
            name="title"
            value={formData.title}
            onChange={handleChange}
            required
            placeholder="Brief summary of your feedback"
            InputProps={{
              sx: { borderRadius: 1 }
            }}
          />

          <TextField
            label="Description"
            name="description"
            value={formData.description}
            onChange={handleChange}
            multiline
            rows={4}
            required
            placeholder="Provide detailed information about your feedback..."
            InputProps={{
              sx: { borderRadius: 1 }
            }}
          />

          {/* <TextField
            label="Screenshot URL (Optional)"
            name="screenshot_url"
            value={formData.screenshot_url}
            onChange={handleChange}
            placeholder="https://..."
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <LinkIcon fontSize="small" />
                </InputAdornment>
              ),
              sx: { borderRadius: 1 }
            }}
          /> */}

          <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
            <Tooltip 
              title={!formData.type || !formData.title || !formData.description ? 
                "Please fill in all required fields" : ""}
              TransitionComponent={Zoom}
            >
              <span>
                <Button
                  type="submit"
                  variant="contained"
                  disabled={loading || !formData.type || !formData.title || !formData.description}
                  sx={{
                    px: 4,
                    py: 1,
                    borderRadius: 2,
                    bgcolor: 'primary.main',
                    '&:hover': {
                      bgcolor: 'primary.dark',
                    },
                  }}
                  endIcon={<SendIcon />}
                >
                  {loading ? 'Submitting...' : 'Submit Feedback'}
                </Button>
              </span>
            </Tooltip>
          </Box>
        </Stack>
      </form>
    </Paper>
  );
} 