"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Container, Typography, Paper, Button } from "@mui/material";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import Header from "@/components/common/header";
import Footer from "@/components/common/footer";
import { subscriptionService } from "@/lib/subscriptionService";

export default function ConfirmationPage() {
  const [subscription, setSubscription] = useState(null);
  const router = useRouter();

  useEffect(() => {
    const getSubscriptionDetails = async () => {
      try {
        const data = await subscriptionService.getCurrentSubscription();
        setSubscription(data);
      } catch (error) {
        console.error("Error fetching subscription:", error);
      }
    };

    getSubscriptionDetails();
  }, []);

  return (
    <div className="min-h-screen bg-gray-50">
      <Container maxWidth="md" className="py-16">
        <Paper className="p-8 text-center">
          <CheckCircleIcon className="text-emerald-500 text-6xl mb-4" />
          <Typography variant="h4" className="mb-4">
            Welcome to {subscription?.tier || "Premium"} Plan!
          </Typography>
          <Typography className="text-gray-600 mb-8">
            Your subscription has been successfully activated. You now have
            access to all the premium features.
          </Typography>
          <div className="space-x-4">
            <Button
              variant="contained"
              onClick={() => router.push("/dashboard")}
              className="bg-emerald-500 hover:bg-emerald-600"
            >
              Go to Dashboard
            </Button>
            <Button
              variant="outlined"
              onClick={() => router.push("/stories/new")}
              className="border-emerald-500 text-emerald-500 hover:border-emerald-600"
            >
              Create Your First Story
            </Button>
          </div>
        </Paper>
      </Container>
      <Footer />
    </div>
  );
}
