"use client";
import React from "react";
import {
  Box,
  Container,
  Typography,
  Button,
  Grid,
  Card,
  CardContent,
  useTheme,
  useMediaQuery,
  Divider,
} from "@mui/material";
import Image from "next/image";
import Link from "next/link";
import AutoStoriesIcon from "@mui/icons-material/AutoStories";
import SpeedIcon from "@mui/icons-material/Speed";
import CloudDoneIcon from "@mui/icons-material/CloudDone";
import BrushIcon from "@mui/icons-material/Brush";
import GroupsIcon from "@mui/icons-material/Groups";
import TrendingUpIcon from "@mui/icons-material/TrendingUp";
import HeroImage from "@/assets/images/seilala-cover.webp";
import DashboardImage from "@/assets/images/seilala-cover.webp";

const themeColors = {
  primary: "rgb(34 197 94)", // Green theme color
  primaryHover: "rgb(22 163 74)",
  dark: "rgb(31 41 55)",
};

export default function Page() {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));

  const features = [
    {
      icon: <SpeedIcon sx={{ fontSize: 48, color: "rgb(31 41 55)" }} />,
      title: "Lightning Fast",
      description:
        "Generate unique stories within 60 seconds using our advanced AI technology.",
    },
    {
      icon: <AutoStoriesIcon sx={{ fontSize: 48, color: "rgb(31 41 55)" }} />,
      title: "Rich Content",
      description:
        "Create engaging narratives with dynamic characters and compelling plots.",
    },
    {
      icon: <CloudDoneIcon sx={{ fontSize: 48, color: "rgb(31 41 55)" }} />,
      title: "Easy Export",
      description:
        "Download your stories in multiple formats or share them instantly.",
    },
  ];

  const benefits = [
    {
      icon: <BrushIcon sx={{ fontSize: 30 }} />,
      title: "Creative Freedom",
      desc: "Unleash your creativity with AI assistance",
    },
    {
      icon: <GroupsIcon sx={{ fontSize: 30 }} />,
      title: "Community Support",
      desc: "Join a thriving community of storytellers",
    },
    {
      icon: <TrendingUpIcon sx={{ fontSize: 30 }} />,
      title: "Continuous Growth",
      desc: "Regular updates and new features",
    },
  ];

  return (
    <Box>
      {/* Hero Section */}
      <Box
        sx={{
          position: "relative",
          height: { xs: "80vh", md: "90vh" },
          overflow: "hidden",
        }}
      >
        <Image
          src={HeroImage}
          alt="Hero"
          fill
          style={{
            objectFit: "cover",
            filter: "brightness(0.7)",
          }}
          priority
          quality={100}
        />
        <Box
          sx={{
            position: "absolute",
            top: "50%",
            left: "50%",
            transform: "translate(-50%, -50%)",
            textAlign: "center",
            width: "100%",
            px: 2,
          }}
        >
        <div className="mt-56">
          <Typography
            variant="h1"
            sx={{
              color: "white",
              fontSize: { xs: "2.5rem", sm: "4rem", md: "5rem" },
              fontWeight: 700,
              mb: 4,
              textShadow: "2px 2px 4px rgba(0,0,0,0.3)",
            }}
          >
            A New Era of Storytelling
          </Typography>
          <Typography
            variant="h5"
            sx={{
              color: "white",
              mb: 4,
              opacity: 0.9,
              maxWidth: "800px",
              mx: "auto",
              textShadow: "1px 1px 2px rgba(0,0,0,0.3)",
            }}
          >
            Transform your ideas into captivating stories with AI-powered
            creativity
          </Typography>
          <Button
            component={Link}
            href="/register"
            variant="contained"
            size="large"
            sx={{
              bgcolor: "rgb(31 41 55)",
              px: 4,
              py: 2,
              fontSize: "1.1rem",
              "&:hover": {
                bgcolor: "rgb(55 65 81)",
              },
            }}
          >
            Get Started For Free
          </Button>
          </div>
        </Box>
      </Box>

      {/* Features Section */}
      <Box sx={{ py: { xs: 8, md: 12 }, bgcolor: "white" }}>
        <Container maxWidth="lg">
          <Typography
            variant="h2"
            align="center"
            sx={{
              fontSize: { xs: "2rem", md: "3rem" },
              fontWeight: 700,
              mb: 2,
            }}
          >
            Welcome to StoryWeaver
          </Typography>
          <Typography
            variant="h5"
            align="center"
            color="text.secondary"
            sx={{ mb: 8, maxWidth: "800px", mx: "auto" }}
          >
            Our AI-powered story generator can take that spark and turn it into
            an incredible tale in just one minute.
          </Typography>

          <Grid container spacing={4}>
            {features.map((feature, index) => (
              <Grid item xs={12} md={4} key={index}>
                <Card
                  elevation={0}
                  sx={{
                    height: "100%",
                    bgcolor: "transparent",
                    transition: "transform 0.3s ease-in-out",
                    "&:hover": {
                      transform: "translateY(-8px)",
                    },
                  }}
                >
                  <CardContent sx={{ textAlign: "center", p: 4 }}>
                    {feature.icon}
                    <Typography
                      variant="h5"
                      component="h3"
                      gutterBottom
                      fontWeight={600}
                    >
                      {feature.title}
                    </Typography>
                    <Typography color="text.secondary">
                      {feature.description}
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>
        </Container>
      </Box>

      {/* How It Works Section */}
      <Box sx={{ py: { xs: 8, md: 12 }, bgcolor: "rgb(243 244 246)" }}>
        <Container maxWidth="lg">
          <Typography
            variant="h2"
            align="center"
            sx={{
              fontSize: { xs: "2rem", md: "3rem" },
              fontWeight: 700,
              mb: 2,
              color: themeColors.primary,
            }}
          >
            How It Works
          </Typography>
          <Typography
            align="center"
            color="text.secondary"
            sx={{ mb: 8, maxWidth: "800px", mx: "auto" }}
          >
            Create amazing stories in three simple steps
          </Typography>

          <Grid container spacing={4} alignItems="center">
            {[
              {
                number: "01",
                title: "Choose Your Genre",
                description:
                  "Select from various genres or mix them for unique combinations.",
              },
              {
                number: "02",
                title: "Describe Your Idea",
                description:
                  "Share your story concept or let our AI suggest creative directions.",
              },
              {
                number: "03",
                title: "Generate & Customize",
                description:
                  "Get your story in seconds and refine it to perfection.",
              },
            ].map((step, index) => (
              <Grid item xs={12} md={4} key={index}>
                <Box
                  sx={{
                    textAlign: "center",
                    p: 3,
                    position: "relative",
                    "&::after": {
                      content: '""',
                      position: "absolute",
                      top: "50%",
                      right: { xs: "auto", md: "-50%" },
                      width: { xs: 0, md: "100%" },
                      height: "2px",
                      background: `linear-gradient(to right, ${themeColors.primary}, transparent)`,
                      display: index === 2 ? "none" : "block",
                    },
                  }}
                >
                  <Typography
                    variant="h1"
                    sx={{
                      fontSize: "4rem",
                      fontWeight: 700,
                      color: themeColors.primary,
                      opacity: 0.2,
                      mb: 2,
                    }}
                  >
                    {step.number}
                  </Typography>
                  <Typography
                    variant="h5"
                    gutterBottom
                    fontWeight={600}
                    sx={{
                      color: themeColors.primary,
                      mb: 2,
                    }}
                  >
                    {step.title}
                  </Typography>
                  <Typography color="text.secondary">
                    {step.description}
                  </Typography>
                </Box>
              </Grid>
            ))}
          </Grid>
        </Container>
      </Box>

      {/* Benefits Section */}
      <Box sx={{ py: { xs: 8, md: 12 }, bgcolor: "white" }}>
        <Container maxWidth="lg">
          <Grid container spacing={6} alignItems="center">
            <Grid item xs={12} md={6}>
              <Typography
                variant="h2"
                sx={{
                  fontSize: { xs: "2rem", md: "2.5rem" },
                  fontWeight: 700,
                  mb: 4,
                }}
              >
                Why Choose StoryWeaver?
              </Typography>
              <Grid container spacing={3}>
                {benefits.map((item, index) => (
                  <Grid item xs={12} key={index}>
                    <Box
                      sx={{
                        display: "flex",
                        gap: 2,
                        alignItems: "flex-start",
                        transition: "transform 0.3s ease",
                        "&:hover": {
                          transform: "translateX(10px)",
                        },
                      }}
                    >
                      <Box
                        sx={{
                          p: 1,
                          bgcolor: "rgb(31 41 55)",
                          borderRadius: 1,
                          color: "white",
                        }}
                      >
                        {item.icon}
                      </Box>
                      <Box>
                        <Typography variant="h6" gutterBottom fontWeight={600}>
                          {item.title}
                        </Typography>
                        <Typography color="text.secondary">
                          {item.desc}
                        </Typography>
                      </Box>
                    </Box>
                  </Grid>
                ))}
              </Grid>
            </Grid>
            <Grid item xs={12} md={6}>
              <Box
                sx={{
                  position: "relative",
                  height: { xs: "300px", md: "400px" },
                  borderRadius: 4,
                  overflow: "hidden",
                  boxShadow: "0 20px 40px rgba(0,0,0,0.1)",
                }}
              >
                <Image
                  src={DashboardImage}
                  alt="Dashboard Preview"
                  fill
                  style={{
                    objectFit: "cover",
                    borderRadius: "16px",
                  }}
                />
              </Box>
            </Grid>
          </Grid>
        </Container>
      </Box>

      {/* CTA Section */}
      <Box
        sx={{
          py: { xs: 8, md: 12 },
          bgcolor: "rgb(31 41 55)",
          color: "white",
        }}
      >
        <Container maxWidth="md">
          <Typography
            variant="h3"
            align="center"
            sx={{
              fontSize: { xs: "2rem", md: "2.75rem" },
              fontWeight: 700,
              mb: 3,
            }}
          >
            Ready to Start Your Story?
          </Typography>
          <Typography
            align="center"
            sx={{ mb: 4, fontSize: "1.1rem", opacity: 0.9 }}
          >
            Join thousands of storytellers who are already creating amazing
            content with StoryWeaver.
          </Typography>
          <Box sx={{ textAlign: "center" }}>
            <Button
              component={Link}
              href="/register"
              variant="contained"
              size="large"
              sx={{
                bgcolor: "white",
                color: "rgb(31 41 55)",
                px: 4,
                py: 2,
                fontSize: "1.1rem",
                "&:hover": {
                  bgcolor: "rgba(255,255,255,0.9)",
                },
              }}
            >
              Get Started For Free
            </Button>
          </Box>
        </Container>
      </Box>

      {/* Footer Separator */}
      <Divider
        sx={{
          borderColor: "rgba(0, 0, 0, 0.1)",
          borderWidth: 1,
        }}
      />
    </Box>
  );
}
