"use client";

import { useRouter } from 'next/navigation';
import { Container, Typography, Button } from '@mui/material';
import CancelIcon from '@mui/icons-material/Cancel';
import Header from '@/components/common/header';
import Footer from '@/components/common/footer';

export default function SubscriptionCancelPage() {
  const router = useRouter();

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <Container maxWidth="md" className="py-16">
        <div className="text-center bg-white rounded-lg shadow-lg p-8">
          <CancelIcon className="text-red-500 text-6xl mb-4" />
          <Typography variant="h4" className="mb-4">
            Subscription Cancelled
          </Typography>
          <Typography variant="body1" className="text-gray-600 mb-8">
            Your subscription process has been cancelled. No charges have been made to your account.
          </Typography>
          <div className="space-x-4">
            <Button
              variant="contained"
              onClick={() => router.push('/subscription')}
              className="bg-green-500 hover:bg-green-600"
            >
              View Plans
            </Button>
            <Button
              variant="outlined"
              onClick={() => router.push('/dashboard')}
              className="border-green-500 text-green-500 hover:border-green-600"
            >
              Back to Dashboard
            </Button>
          </div>
        </div>
      </Container>
      <Footer />
    </div>
  );
} 