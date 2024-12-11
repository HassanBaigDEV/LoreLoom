import { useState, useEffect } from 'react';
import { useAuth } from './useAuth';
import { subscriptionService } from '@/lib/subscriptionService';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';

export function useSubscription() {
  const [subscription, setSubscription] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { isAuthenticated } = useAuth();
  const router = useRouter();

  useEffect(() => {
    fetchSubscription();
  }, [isAuthenticated]);

  const fetchSubscription = async () => {
    if (!isAuthenticated) {
      setLoading(false);
      return;
    }

    try {
      const data = await subscriptionService.getCurrentSubscription();
      setSubscription(data);
    } catch (error) {
      setError(error.message);
      console.error('Error fetching subscription:', error);
    } finally {
      setLoading(false);
    }
  };

  const upgrade = async (tier) => {
    if (!isAuthenticated) {
      sessionStorage.setItem('intended_plan', tier);
      router.push('/login?redirect=/subscription');
      return;
    }

    try {
      setLoading(true);
      if (tier === 'FREE') {
        await subscriptionService.upgrade(tier);
        toast.success('Successfully switched to Free plan');
        await fetchSubscription();
        router.push('/dashboard');
      } else {
        const { checkout_url } = await subscriptionService.createCheckoutSession(tier);
        window.location.href = checkout_url;
      }
    } catch (error) {
      toast.error('Failed to upgrade plan. Please try again.');
      console.error('Error upgrading subscription:', error);
    } finally {
      setLoading(false);
    }
  };

  const checkLimits = async () => {
    try {
      const limits = await subscriptionService.checkLimits();
      return limits;
    } catch (error) {
      console.error('Error checking limits:', error);
      return null;
    }
  };

  return {
    subscription,
    loading,
    error,
    upgrade,
    checkLimits,
    refresh: fetchSubscription
  };
} 