"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { subscriptionService } from "@/lib/subscriptionService";
import PricingTable from "@/components/subscription/PricingTable";
import { Typography, Container, CircularProgress, Box } from "@mui/material";
import { useAuth } from "@/hooks/useAuth";

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
        console.error("Error fetching subscription:", error);
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
      router.push("/login?redirect=/subscription");
      return;
    }

    try {
      setLoading(true);
      const { checkout_url } = await subscriptionService.createCheckoutSession(
        tier
      );
      // use Next router to navigate to the checkout page
      router.push(checkout_url);
    } catch (error) {
      console.error("Error creating checkout session:", error);
    } finally {
      setLoading(false);
    }
  };

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

  return (
    <Container maxWidth="xl">
      <Box sx={{ 
        py: { xs: 4, md: 8 },
        px: { xs: 2, sm: 3, md: 4 }
      }}>
        <Typography
          variant="h3"
          align="center"
          gutterBottom
          sx={{
            fontWeight: 600,
            color: "rgb(55 65 81)",
            fontSize: { xs: '2rem', sm: '2.5rem', md: '3rem' }
          }}
        >
          Choose Your Plan
        </Typography>
        <Typography
          variant="h6"
          align="center"
          color="text.secondary"
          sx={{ 
            mb: { xs: 4, md: 6 },
            fontSize: { xs: '1rem', sm: '1.25rem' }
          }}
        >
          Select the perfect plan for your storytelling journey
        </Typography>
        <PricingTable currentPlan={currentPlan} onUpgrade={handleUpgrade} />
      </Box>
    </Container>
  );
}
