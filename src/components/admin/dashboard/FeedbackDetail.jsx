import React, { useState } from 'react';
import {
  Box,
  Paper,
  Typography,
  TextField,
  Button,
  Divider,
  IconButton,
} from '@mui/material';
import { ArrowBack as ArrowBackIcon, Delete as DeleteIcon } from '@mui/icons-material';
import { useRouter } from 'next/navigation';

export default function FeedbackDetail({ 
  feedback, 
  onRespond, 
  onDelete,
  onMarkRead,
}) {
  const router = useRouter();
  const [response, setResponse] = useState('');

  const handleSubmitResponse = async () => {
    await onRespond(feedback.id, {
      response,
      status: 'responded'
    });
    setResponse('');
  };

  const handleDelete = async () => {
    if (window.confirm('Are you sure you want to delete this feedback?')) {
      await onDelete(feedback.id);
      router.push('/admin/feedback');
    }
  };

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ mb: 3, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          <IconButton onClick={() => router.push('/admin/feedback')} sx={{ mr: 2 }}>
            <ArrowBackIcon />
          </IconButton>
          <Typography variant="h5">Feedback Details</Typography>
        </Box>
        <IconButton color="error" onClick={handleDelete}>
          <DeleteIcon />
        </IconButton>
      </Box>

      <Paper sx={{ p: 3 }}>
        <Box sx={{ mb: 3 }}>
          <Typography variant="subtitle2" color="text.secondary">Subject</Typography>
          <Typography variant="h6">{feedback.subject}</Typography>
        </Box>

        <Box sx={{ mb: 3 }}>
          <Typography variant="subtitle2" color="text.secondary">Message</Typography>
          <Typography>{feedback.message}</Typography>
        </Box>

        <Box sx={{ mb: 3 }}>
          <Typography variant="subtitle2" color="text.secondary">From</Typography>
          <Typography>{feedback.user_email}</Typography>
        </Box>

        <Box sx={{ mb: 3 }}>
          <Typography variant="subtitle2" color="text.secondary">Status</Typography>
          <Typography>{feedback.status}</Typography>
        </Box>

        <Divider sx={{ my: 3 }} />

        {feedback.admin_response && (
          <Box sx={{ mb: 3 }}>
            <Typography variant="subtitle2" color="text.secondary">Admin Response</Typography>
            <Typography>{feedback.admin_response}</Typography>
          </Box>
        )}

        <Box sx={{ mt: 3 }}>
          <TextField
            fullWidth
            multiline
            rows={4}
            label="Response"
            value={response}
            onChange={(e) => setResponse(e.target.value)}
            sx={{ mb: 2 }}
          />
          <Button 
            variant="contained" 
            onClick={handleSubmitResponse}
            disabled={!response.trim()}
          >
            Send Response
          </Button>
        </Box>
      </Paper>
    </Box>
  );
} 