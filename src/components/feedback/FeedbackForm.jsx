import React, { useState } from 'react';
import {
  Box,
  TextField,
  Button,
  Paper,
  Typography,
  Alert,
  MenuItem,
} from '@mui/material';
import { feedbackService } from '@/lib/feedbackService';

const feedbackTypes = [
  { value: 'general', label: 'General Feedback' },
  { value: 'bug', label: 'Bug Report' },
  { value: 'feature', label: 'Feature Request' },
  { value: 'support', label: 'Support Request' },
  { value: 'other', label: 'Other' },
];

export default function FeedbackForm({ onSubmitSuccess }) {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    type: '',
    screenshot_url: '', // Optional
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
      await feedbackService.createFeedback(formData);
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
    <Paper elevation={2} sx={{ p: 3, maxWidth: 600, mx: 'auto' }}>
      <Typography variant="h5" component="h2" gutterBottom>
        Submit Feedback
      </Typography>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      {success && (
        <Alert severity="success" sx={{ mb: 2 }}>
          Feedback submitted successfully!
        </Alert>
      )}

      <form onSubmit={handleSubmit}>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          <TextField
            select
            label="Feedback Type"
            name="type"
            value={formData.type}
            onChange={handleChange}
            required
          >
            {feedbackTypes.map((option) => (
              <MenuItem key={option.value} value={option.value}>
                {option.label}
              </MenuItem>
            ))}
          </TextField>

          <TextField
            label="Title"
            name="title"
            value={formData.title}
            onChange={handleChange}
            required
          />

          <TextField
            label="Description"
            name="description"
            value={formData.description}
            onChange={handleChange}
            multiline
            rows={4}
            required
          />

          <TextField
            label="Screenshot URL (Optional)"
            name="screenshot_url"
            value={formData.screenshot_url}
            onChange={handleChange}
            placeholder="https://..."
          />

          <Button
            type="submit"
            variant="contained"
            disabled={loading}
            sx={{
              bgcolor: 'rgb(34 197 94)',
              '&:hover': {
                bgcolor: 'rgb(22 163 74)',
              },
            }}
          >
            {loading ? 'Submitting...' : 'Submit Feedback'}
          </Button>
        </Box>
      </form>
    </Paper>
  );
} 