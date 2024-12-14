"use client";

import { useState, useEffect } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import {
  Container,
  Typography,
  Paper,
  CircularProgress,
  Button,
} from "@mui/material";
import Header from "@/components/common/header";
import Footer from "@/components/common/footer";
import { useSubscription } from "@/hooks/useSubscription";
import { useAuth } from "@/hooks/useAuth";

export default function CheckoutPage() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const searchParams = useSearchParams();
  const router = useRouter();
  const { isAuthenticated } = useAuth();
  const { upgrade } = useSubscription();
  const plan = searchParams.get("plan");

  useEffect(() => {
    const initCheckout = async () => {
      if (!isAuthenticated) {
        router.push("/login?redirect=/subscription");
        return;
      }

      if (!plan || !["basic", "premium"].includes(plan)) {
        router.push("/subscription");
        return;
      }

      try {
        await upgrade(plan);
      } catch (error) {
        setError(error.message || "Failed to initialize checkout");
      } finally {
        setLoading(false);
      }
    };

    initCheckout();
  }, [plan, isAuthenticated]);

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Container maxWidth="md" className="py-16">
          <Paper className="p-8 text-center">
            <Typography variant="h5" className="text-red-500 mb-4">
              Checkout Error
            </Typography>
            <Typography className="mb-6">{error}</Typography>
            <Button
              variant="contained"
              onClick={() => router.push("/subscription")}
              className="bg-emerald-500 hover:bg-emerald-600"
            >
              Return to Plans
            </Button>
          </Paper>
        </Container>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Container maxWidth="md" className="py-16">
        <Paper className="p-8 text-center">
          <CircularProgress className="text-emerald-500 mb-4" />
          <Typography>Initializing checkout...</Typography>
        </Paper>
      </Container>
      <Footer />
    </div>
  );
}
