"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  Box,
  Container,
  Typography,
  Button,
  Paper,
  Stepper,
  Step,
  StepLabel,
  CircularProgress,
  useTheme,
  useMediaQuery,
  Fade,
} from "@mui/material";
import {
  Create as CreateIcon,
  AutoStories as StoryIcon,
  Brush as BrushIcon,
} from "@mui/icons-material";
import storyApiClient from "@/lib/storyApi";
import ProtectedRoute from "@/components/auth/ProtectedRoute";
import GenerationOptions from "@/components/generation/GenerationOptions";

const steps = [
  { label: "Choose Creation Method", icon: CreateIcon },
  { label: "Set Story Parameters", icon: BrushIcon },
  { label: "Begin Writing", icon: StoryIcon },
];

export default function CreatePage() {
  const router = useRouter();
  const [activeStep, setActiveStep] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [generationMode, setGenerationMode] = useState(null);
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));

  const handleCreateStory = async (generatedContent = null) => {
    setIsLoading(true);
    setError("");

    try {
      const user = JSON.parse(localStorage.getItem("user"));
      if (!user?.id) {
        throw new Error("User not found");
      }

      const response = await storyApiClient.post("/stories", null, {
        params: {
          user_id: user.id,
          title: generatedContent?.title || "Untitled Story",
          genre: generatedContent?.genre || "Other",
          privacy: "private",
        },
      });

      const { story_id } = response.data;
      localStorage.setItem("current_story_id", story_id);
      router.push(`/create/plan/${story_id}`);
    } catch (err) {
      console.error("Error creating story:", err);
      setError("Failed to create story. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const renderStepContent = () => {
    switch (activeStep) {
      case 0:
        return (
          <Fade in timeout={500}>
            <Box
              sx={{
                display: "grid",
                gridTemplateColumns: { xs: "1fr", md: "1fr 1fr" },
                gap: 3,
                mt: 4,
              }}
            >
              <Paper
                elevation={0}
                sx={{
                  p: 4,
                  border: "1px solid",
                  borderColor: "divider",
                  borderRadius: 2,
                  cursor: "pointer",
                  transition: "all 0.3s ease",
                  "&:hover": {
                    borderColor: "primary.main",
                    transform: "translateY(-4px)",
                    boxShadow: theme.shadows[4],
                  },
                }}
                onClick={() => {
                  setGenerationMode("manual");
                  setActiveStep(2);
                }}
              >
                <Box sx={{ textAlign: "center" }}>
                  <CreateIcon
                    sx={{ fontSize: 48, color: "primary.main", mb: 2 }}
                  />
                  <Typography variant="h5" gutterBottom>
                    Start from Scratch
                  </Typography>
                  <Typography color="text.secondary">
                    Begin with a blank canvas and craft your story step by step
                  </Typography>
                </Box>
              </Paper>

              <Paper
                elevation={0}
                sx={{
                  p: 4,
                  border: "1px solid",
                  borderColor: "divider",
                  borderRadius: 2,
                  cursor: "pointer",
                  transition: "all 0.3s ease",
                  "&:hover": {
                    borderColor: "primary.main",
                    transform: "translateY(-4px)",
                    boxShadow: theme.shadows[4],
                  },
                }}
                onClick={() => {
                  setGenerationMode("ai");
                  setActiveStep(1);
                }}
              >
                <Box sx={{ textAlign: "center" }}>
                  <BrushIcon
                    sx={{ fontSize: 48, color: "primary.main", mb: 2 }}
                  />
                  <Typography variant="h5" gutterBottom>
                    AI-Assisted Creation
                  </Typography>
                  <Typography color="text.secondary">
                    Let our AI help you generate story ideas and content
                  </Typography>
                </Box>
              </Paper>
            </Box>
          </Fade>
        );

      case 1:
        return (
          <Fade in timeout={500}>
            <Box sx={{ mt: 4 }}>
              <GenerationOptions
                onGenerate={handleCreateStory}
                onBack={() => setActiveStep(0)}
              />
            </Box>
          </Fade>
        );

      case 2:
        return (
          <Fade in timeout={500}>
            <Box sx={{ mt: 4, textAlign: "center" }}>
              <Button
                variant="contained"
                size="large"
                onClick={() => handleCreateStory()}
                disabled={isLoading}
                sx={{
                  px: 6,
                  py: 2,
                  borderRadius: 2,
                  bgcolor: "primary.main",
                  "&:hover": {
                    bgcolor: "primary.dark",
                  },
                }}
              >
                {isLoading ? (
                  <CircularProgress size={24} color="inherit" />
                ) : (
                  "Begin Writing"
                )}
              </Button>
            </Box>
          </Fade>
        );
    }
  };

  return (
    <ProtectedRoute>
      <Box
        sx={{
          minHeight: "100vh",
          pt: { xs: 8, sm: 12 },
          pb: { xs: 6, sm: 8 },
          bgcolor: "white",
        }}
      >
        <Container maxWidth="lg">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
          >
            <Box sx={{ textAlign: "center", mb: 6 }}>
              <Typography
                variant="h3"
                component="h1"
                gutterBottom
                sx={{
                  fontWeight: 700,
                  fontSize: { xs: "2rem", sm: "3rem" },
                  background: "linear-gradient(45deg, #22c55e, #16a34a)",
                  backgroundClip: "text",
                  WebkitBackgroundClip: "text",
                  color: "transparent",
                }}
              >
                Create Your Story
              </Typography>
              <Typography
                variant="subtitle1"
                sx={{ maxWidth: "600px", mx: "auto", color: "grey.300" }}
              >
                Choose your preferred method to begin crafting your next
                masterpiece
              </Typography>
            </Box>

            <Stepper
              activeStep={activeStep}
              alternativeLabel={!isMobile}
              orientation={isMobile ? "vertical" : "horizontal"}
              sx={{
                mb: 6,
                "& .MuiStepLabel-label": {
                  color: "grey.400",
                },
                "& .Mui-active": {
                  color: "#22c55e !important",
                },
                "& .Mui-completed": {
                  color: "#16a34a !important",
                },
              }}
            >
              {steps.map((step) => (
                <Step key={step.label}>
                  <StepLabel
                    StepIconComponent={() => (
                      <step.icon
                        sx={{
                          color:
                            activeStep >= steps.indexOf(step)
                              ? "primary.main"
                              : "grey.400",
                        }}
                      />
                    )}
                  >
                    {step.label}
                  </StepLabel>
                </Step>
              ))}
            </Stepper>

            {error && (
              <Typography color="error" textAlign="center" sx={{ mb: 3 }}>
                {error}
              </Typography>
            )}

            <Box
              sx={{
                "& .MuiPaper-root": {
                  bgcolor: "rgb(17, 24, 39)",
                  borderColor: "rgba(255, 255, 255, 0.1)",
                  color: "white",
                  transition: "all 0.3s ease",
                  "&:hover": {
                    borderColor: "#22c55e",
                    bgcolor: "rgb(24, 31, 46)",
                  },
                },
                "& .MuiTypography-root": {
                  color: "white",
                },
                "& .MuiTypography-colorTextSecondary": {
                  color: "grey.400",
                },
                "& .MuiButton-contained": {
                  bgcolor: "#22c55e",
                  "&:hover": {
                    bgcolor: "#16a34a",
                  },
                },
                "& .MuiSvgIcon-root": {
                  color: "#22c55e",
                },
                "& .MuiSlider-root": {
                  color: "#22c55e",
                  "& .MuiSlider-thumb": {
                    "&:hover, &.Mui-focusVisible": {
                      boxShadow: "0 0 0 8px rgba(34, 197, 94, 0.16)",
                    },
                  },
                  "& .MuiSlider-track": {
                    backgroundColor: "#22c55e",
                  },
                  "& .MuiSlider-rail": {
                    backgroundColor: "rgba(34, 197, 94, 0.2)",
                  },
                  "& .MuiSlider-mark": {
                    backgroundColor: "#22c55e",
                  },
                },
                "& .MuiInputBase-root": {
                  color: "white",
                  "& fieldset": {
                    borderColor: "rgba(255, 255, 255, 0.23)",
                  },
                  "&:hover fieldset": {
                    borderColor: "rgba(255, 255, 255, 0.4)",
                  },
                  "&.Mui-focused fieldset": {
                    borderColor: "#22c55e",
                  },
                },
                "& .MuiInputLabel-root": {
                  color: "rgba(255, 255, 255, 0.7)",
                  "&.Mui-focused": {
                    color: "#22c55e",
                  },
                },
                "& .MuiSelect-icon": {
                  color: "rgba(255, 255, 255, 0.7)",
                },
                "& .MuiChip-root": {
                  borderColor: "#22c55e",
                  color: "white",
                },
              }}
            >
              {renderStepContent()}
            </Box>
          </motion.div>
        </Container>
      </Box>
    </ProtectedRoute>
  );
}
