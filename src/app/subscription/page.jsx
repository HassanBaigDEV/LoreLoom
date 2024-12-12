"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { subscriptionService } from '@/lib/subscriptionService';
import Header from '@/components/common/header';
import Footer from '@/components/common/footer';
import PricingTable from '@/components/subscription/PricingTable';
import { Typography, Container, CircularProgress } from '@mui/material';
import { useAuth } from '@/hooks/useAuth';

export default function SubscriptionPage() {
  const [currentPlan, setCurrentPlan] = useState(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const { isAuthenticated } = useAuth();

  useEffect(() => {
    const fetchCurrentPlan = async () => {
      try {
        const subscription = await subscriptionService.getCurrentSubscription();
        setCurrentPlan(subscription.tier);
      } catch (error) {
        console.error('Error fetching subscription:', error);
      } finally {
        setLoading(false);
      }
    };

    if (isAuthenticated) {
      fetchCurrentPlan();
    } else {
      setLoading(false);
    }
  }, [isAuthenticated]);

  const handleUpgrade = async (tier) => {
    if (!isAuthenticated) {
      router.push('/login?redirect=/subscription');
      return;
    }

    try {
      setLoading(true);
      const { checkout_url } = await subscriptionService.createCheckoutSession(tier);
      window.location.href = checkout_url;
    } catch (error) {
      console.error('Error creating checkout session:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <CircularProgress />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <Container maxWidth="lg" className="py-16">
        <div className="mb-12 text-center">
          <Typography variant="h2" className="mb-4 text-4xl font-bold text-gray-700 mt-7">
            Choose Your Plan
          </Typography>
          <Typography variant="subtitle1" className="text-gray-600">
            Select the perfect plan for your storytelling journey
          </Typography>
        </div>
        <PricingTable currentPlan={currentPlan} onUpgrade={handleUpgrade} />
      </Container>
      <Footer />
    </div>
  );
} 