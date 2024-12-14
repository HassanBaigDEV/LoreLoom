// app/page.js
"use client";
import React from "react";
import MainContent from "@/components/discover/main";

import { Box } from "@mui/material";

function Page() {
  return (
    <Box
      sx={{
        backgroundColor: "rgb(243 244 246)",
        minHeight: "100%",
        position: "relative",
      }}
    >
      <MainContent />
    </Box>
  );
}

export default Page;
