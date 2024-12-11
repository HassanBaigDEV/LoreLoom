"use client";

import { useEffect, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { Container, Typography, Paper, Button, CircularProgress } from '@mui/material';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import Header from '@/components/common/header';
import Footer from '@/components/common/footer';
import { useSubscription } from '@/hooks/useSubscription';
import { subscriptionService } from '@/lib/subscriptionService';

export default function SuccessPage() {
  const [verifying, setVerifying] = useState(true);
  const [error, setError] = useState(null);
  const searchParams = useSearchParams();
  const router = useRouter();
  const { refresh } = useSubscription();
  const sessionId = searchParams.get('session_id');

  useEffect(() => {
    const verifySession = async () => {
      if (!sessionId) {
        router.push('/subscription');
        return;
      }

      try {
        // Verify the session with your backend
        await subscriptionService.verifySession(sessionId);
        // Refresh subscription data
        await refresh();
      } catch (error) {
        setError(error.message);
        console.error('Error verifying session:', error);
      } finally {
        setVerifying(false);
      }
    };

    verifySession();
  }, [sessionId]);

  if (verifying) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <Container maxWidth="md" className="py-16">
          <Paper className="p-8 text-center">
            <CircularProgress className="text-emerald-500 mb-4" />
            <Typography>
              Verifying your subscription...
            </Typography>
          </Paper>
        </Container>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <Container maxWidth="md" className="py-16">
        <div className="text-center bg-white rounded-lg shadow-lg p-8">
          <CheckCircleIcon className="text-green-500 text-6xl mb-4" />
          <Typography variant="h4" className="mb-4">
            Subscription Successful!
          </Typography>
          <Typography variant="body1" className="text-gray-600 mb-8">
            Thank you for upgrading your subscription. Your account has been updated with the new features.
          </Typography>
          <div className="space-x-4">
            <Button
              variant="contained"
              color="primary"
              onClick={() => router.push('/dashboard')}
              className="bg-green-500 hover:bg-green-600"
            >
              Go to Dashboard
            </Button>
            <Button
              variant="outlined"
              onClick={() => router.push('/subscription')}
              className="border-green-500 text-green-500 hover:border-green-600"
            >
              View Subscription Details
            </Button>
          </div>
        </div>
      </Container>
      <Footer />
    </div>
  );
} 