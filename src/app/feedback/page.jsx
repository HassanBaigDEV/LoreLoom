"use client";
import { useEffect, useState } from 'react';
import { Container, Typography } from '@mui/material';
import FeedbackForm from '@/components/feedback/FeedbackForm';
import FeedbackHistory from '@/components/feedback/FeedbackHistory';
import { feedbackService } from '@/lib/feedbackService';
import ProtectedRoute from '@/components/auth/ProtectedRoute';

export default function FeedbackPage() {
  const [feedback, setFeedback] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchFeedback = async () => {
    try {
      const data = await feedbackService.getMyFeedback();
      setFeedback(data);
    } catch (error) {
      console.error('Error fetching feedback:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFeedback();
  }, []);

  return (
    <ProtectedRoute>
      <Container maxWidth="md" sx={{ py: 4 }}>
        <Typography variant="h4" component="h1" gutterBottom align="center">
          Feedback
        </Typography>
        
        <FeedbackForm onSubmitSuccess={fetchFeedback} />
        {!loading && <FeedbackHistory feedback={feedback} />}
      </Container>
    </ProtectedRoute>
  );
} 