// app/page.js
"use client";
import React from "react";
import MainContent from "@/components/discover/main";
import HelpButton from "@/components/common/help";
import { Box } from '@mui/material';

function Page() {
  return (
    <Box sx={{ 
      backgroundColor: 'rgb(243 244 246)',
      minHeight: '100%',
      position: 'relative'
    }}>
      <MainContent />
      <HelpButton />
    </Box>
  );
}

export default Page;
