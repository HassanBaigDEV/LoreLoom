// app/email-sent/page.tsx
"use client";

import { Box, Container, Typography, Button } from "@mui/material";
import MailOutlineIcon from "@mui/icons-material/MailOutline";
import { useRouter } from "next/navigation";
import Text from "@/components/common/Text";

export default function EmailSentPage() {
  const router = useRouter();

  return (
    <Container
      maxWidth="sm"
      sx={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        minHeight: "100vh",
        textAlign: "center",
        padding: 4,
        backgroundColor: "#f4f6f8",
        borderRadius: 2,
        boxShadow: "0 4px 12px rgba(0, 0, 0, 0.1)",
      }}
    >
      <MailOutlineIcon
        sx={{ fontSize: 64, color: "rgb(34, 197, 94)", mb: 6 }}
      />
      <Text style={{ fontWeight: 600, margin: "0 0 10px 0", fontSize: 16 }}>
        Verify Your Email Address
      </Text>
      <Text style={{ margin: "10px 0 0px 0" }}>
        A verification email has been sent to your inbox. Please check your
        email and follow the link to verify your account.
      </Text>
      <Button
        variant="contained"
        sx={{
          mt: 10,
          width: "180px",
          backgroundColor: "rgb(34, 197, 94)",
          "&:hover": { backgroundColor: "rgb(30, 170, 80)" },
        }}
        onClick={() => router.push("/")}
      >
        Back to Home
      </Button>
    </Container>
  );
}
