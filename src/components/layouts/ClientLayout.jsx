"use client";
import Header from "@/components/common/header";
import Footer from "@/components/common/footer";
import { Box } from "@mui/material";

export default function ClientLayout({ children, isAdminRoute }) {
  return (
    <>
      {!isAdminRoute && <Header />}
      <Box sx={{ flex: 1 }}>
        {children}
      </Box>
      {!isAdminRoute && <Footer />}
    </>
  );
} 