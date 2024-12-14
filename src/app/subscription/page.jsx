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
      window.location.href = checkout_url;
    } catch (error) {
      console.error("Error creating checkout session:", error);
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
    <Container maxWidth="xl">
      <Box sx={{ py: 8 }}>
        <Typography
          variant="h3"
          align="center"
          gutterBottom
          sx={{
            fontWeight: 600,
            color: "rgb(55 65 81)",
          }}
        >
          Choose Your Plan
        </Typography>
        <Typography
          variant="h6"
          align="center"
          color="text.secondary"
          sx={{ mb: 6 }}
        >
          Select the perfect plan for your storytelling journey
        </Typography>
        <PricingTable/>
      </Box>
    </Container>
  );
}
