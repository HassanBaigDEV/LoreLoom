"use client";
import React, { useEffect, useState } from 'react';
import { Box, Container, Typography, CircularProgress } from '@mui/material';
import { useSearchParams, useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';

export default function SubscriptionSuccess() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const searchParams = useSearchParams();
  const router = useRouter();
  const { checkAuth } = useAuth();

  useEffect(() => {
    const verifySubscription = async () => {
      try {
        const sessionId = searchParams.get('session_id');
        if (!sessionId) {
          setError('Invalid session');
          setLoading(false);
          return;
        }

        // Refresh user data to get updated subscription status
        await checkAuth();
        
        // Redirect to dashboard after short delay
        setTimeout(() => {
          router.push('/dashboard');
        }, 3000);

      } catch (err) {
        setError('Failed to verify subscription. Please contact support.');
        console.error('Subscription verification error:', err);
      } finally {
        setLoading(false);
      }
    };

    if (typeof window !== 'undefined') {
      verifySubscription();
    }
  }, [searchParams, router, checkAuth]);

  // Show loading state
  if (loading) {
    return (
      <Box sx={{ 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center', 
        minHeight: '100vh' 
      }}>
        <CircularProgress />
      </Box>
    );
  }

  // Show error state
  if (error) {
    return (
      <Container maxWidth="sm" sx={{ py: 8 }}>
        <Typography color="error" align="center">
          {error}
        </Typography>
        <Box sx={{ mt: 2, textAlign: 'center' }}>
          <Typography 
            component="button" 
            onClick={() => router.push('/dashboard')}
            sx={{ 
              color: 'primary.main',
              cursor: 'pointer',
              border: 'none',
              background: 'none',
              textDecoration: 'underline'
            }}
          >
            Return to Dashboard
          </Typography>
        </Box>
      </Container>
    );
  }

  // Show success state
  return (
    <Container maxWidth="sm" sx={{ py: 8 }}>
      <Box sx={{ textAlign: 'center' }}>
        <Typography variant="h4" gutterBottom>
          Thank You!
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Your subscription has been successfully activated. 
          You will be redirected to the dashboard shortly...
        </Typography>
      </Box>
    </Container>
  );
} 