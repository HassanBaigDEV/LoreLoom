"use client";
import React from "react";
import HeroSection from "@/components/about/heroSection";
import StepsSection from "@/components/about/stepSection";
import FAQSection from "@/components/about/faqSection";
import { Box } from '@mui/material';

export default function Page() {
  return (
    <Box sx={{ 
      backgroundColor: 'rgb(239 246 255)',
      minHeight: '100%',
      py: { xs: 4, md: 6 }
    }}>
      <HeroSection />
      <StepsSection />
      <FAQSection />
    </Box>
  );
}
