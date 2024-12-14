"use client";
import React from 'react';
import { Box, Container, Typography, Button } from '@mui/material';
import { useRouter } from 'next/navigation';

export default function SubscriptionCancelPage() {
  const router = useRouter();

  return (
    <Container maxWidth="sm" sx={{ py: 8 }}>
      <Box sx={{ textAlign: 'center' }}>
        <Typography variant="h4" gutterBottom>
          Subscription Cancelled
        </Typography>
        <Typography variant="body1" color="text.secondary" sx={{ mb: 4 }}>
          Your subscription process was cancelled. 
          You can try again whenever you're ready.
        </Typography>
        <Button 
          variant="contained" 
          onClick={() => router.push('/subscription')}
          sx={{ 
            bgcolor: 'rgb(31 41 55)',
            '&:hover': {
              bgcolor: 'rgb(55 65 81)',
            }
          }}
        >
          Return to Plans
        </Button>
      </Box>
    </Container>
  );
}
