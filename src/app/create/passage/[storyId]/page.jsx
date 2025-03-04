"use client";
import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  Box,
  Container,
  Typography,
  Paper,
  Drawer,
  IconButton,
  Fab,
  Pagination,
  Stack,
  Collapse,
  Divider,
  Tooltip,
  CircularProgress,
  Button,
  useTheme,
  useMediaQuery,
} from "@mui/material";
import {
  ChevronRight as ChevronRightIcon,
  ChevronLeft as ChevronLeftIcon,
  Edit as EditIcon,
  ExpandMore as ExpandMoreIcon,
  ExpandLess as ExpandLessIcon,
  MenuBook as MenuBookIcon,
  Add as AddIcon,
} from "@mui/icons-material";
import storyApiClient from "@/lib/storyApi";
import PassageEditor from "@/components/passage/PassageEditor";
import StoryElementsPanel from "@/components/passage/StoryElementsPanel";
import ProtectedRoute from "@/components/auth/ProtectedRoute";
import { Toaster, toast } from "react-hot-toast";

const ITEMS_PER_PAGE = 10;

const LoadingOverlay = () => (
  <Box
    sx={{
      position: "absolute",
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      bgcolor: "rgba(255, 255, 255, 0.8)",
      zIndex: 1000,
    }}
  >
    <CircularProgress sx={{ color: "rgb(34 197 94)" }} />
  </Box>
);

export default function PassagePage({ params }) {
  const router = useRouter();
  const { storyId } = params;
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));
  const [loading, setLoading] = useState(true);
  const [passages, setPassages] = useState([]);
  const [storyElements, setStoryElements] = useState(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [expandedPassage, setExpandedPassage] = useState(null);

  const fetchPassages = useCallback(async () => {
    setLoading(true);
    try {
      const user = JSON.parse(localStorage.getItem("user"));
      if (!user?.id) throw new Error("User not found");

      const [passagesResponse, countResponse] = await Promise.all([
        storyApiClient.get(`/draft/passages/${storyId}`, {
          params: {
            user_id: user.id,
            limit: ITEMS_PER_PAGE,
            skip: (page - 1) * ITEMS_PER_PAGE,
          },
        }),
        storyApiClient.get(`/draft/passages/${storyId}/count`, {
          params: { user_id: user.id },
        }),
      ]);

      setPassages(passagesResponse.data);
      setTotalPages(Math.ceil(countResponse.data.total / ITEMS_PER_PAGE));
    } catch (error) {
      console.error("Error fetching passages:", error);
      toast.error("Failed to load passages");
    } finally {
      setLoading(false);
    }
  }, [storyId, page]);

  const fetchStoryElements = useCallback(async () => {
    try {
      const user = JSON.parse(localStorage.getItem("user"));
      if (!user?.id) throw new Error("User not found");

      const response = await storyApiClient.get(
        `/plan/story-elements/${storyId}`,
        {
          params: { user_id: user.id },
        }
      );
      setStoryElements(response.data);
    } catch (error) {
      console.error("Error fetching story elements:", error);
    }
  }, [storyId]);

  useEffect(() => {
    fetchPassages();
    fetchStoryElements();
  }, [fetchPassages, fetchStoryElements]);

  const handlePageChange = (event, value) => {
    setPage(value);
  };

  const handleCreatePassage = async () => {
    setLoading(true);
    try {
      const user = JSON.parse(localStorage.getItem("user"));
      if (!user?.id) throw new Error("User not found");

      // Get the last outline point if none selected
      const outlinePoint =
        storyElements?.outline?.[storyElements?.outline?.length - 1]?.number;
      if (!outlinePoint) {
        toast.error("Please create an outline first");
        return;
      }

      const response = await storyApiClient.post(
        `/draft/generate-passage/${storyId}`,
        null,
        {
          params: {
            user_id: user.id,
            outline_point_id: outlinePoint,
          },
        }
      );

      toast.success("New passage created!");
      fetchPassages(); // Refresh the list
    } catch (error) {
      console.error("Error creating passage:", error);
      toast.error("Failed to create passage");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Box
        sx={{
          display: "flex",
          minHeight: "100vh",
          bgcolor: "grey.50",
          flexDirection: { xs: "column", lg: "row" }, // Stack vertically on mobile
        }}
      >
        <Toaster position="top-right" />

        {/* Main Content */}
        <Box
          sx={{
            flexGrow: 1,
            p: { xs: 2, sm: 3 }, // Reduced padding on mobile
            pt: { xs: 8, sm: 10, md: 12 }, // Adjusted top padding for header
            pr: { xs: 2, sm: 3, lg: "360px" }, // Right padding only on desktop
            width: "100%", // Full width on mobile
          }}
        >
          <Container
            maxWidth="lg"
            sx={{
              mx: "auto",
              width: "100%",
            }}
          >
            {/* Header */}
            <Box
              sx={{
                mb: { xs: 2, sm: 4 },
                display: "flex",
                flexDirection: { xs: "column", sm: "row" }, // Stack vertically on mobile
                gap: { xs: 2, sm: 0 },
                justifyContent: "space-between",
                alignItems: { xs: "stretch", sm: "center" },
              }}
            >
              <Typography
                variant="h4"
                sx={{
                  fontWeight: 700,
                  fontSize: { xs: "1.5rem", sm: "2rem", md: "2.25rem" },
                  background: "linear-gradient(45deg, #22c55e, #16a34a)",
                  backgroundClip: "text",
                  WebkitBackgroundClip: "text",
                  color: "transparent",
                }}
              >
                Write Your Story
              </Typography>
              <Button
                variant="contained"
                startIcon={<AddIcon />}
                onClick={handleCreatePassage}
                disabled={loading}
                fullWidth={false}
                sx={{
                  bgcolor: "rgb(34 197 94)",
                  "&:hover": { bgcolor: "rgb(22 163 74)" },
                  width: { xs: "100%", sm: "auto" }, // Full width on mobile
                }}
              >
                New Passage
              </Button>
            </Box>

            {/* Passages List */}
            <AnimatePresence mode="wait">
              {loading ? (
                <LoadingOverlay />
              ) : (
                <Stack spacing={2}>
                  {passages.map((passage, index) => (
                    <motion.div
                      key={passage.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0 }}
                      transition={{ delay: index * 0.1 }}
                    >
                      <Paper
                        elevation={expandedPassage === passage.id ? 3 : 1}
                        sx={{
                          p: { xs: 2, sm: 3 }, // Reduced padding on mobile
                          transition: "all 0.3s ease",
                          "&:hover": {
                            boxShadow: 3,
                            transform: "translateY(-2px)",
                          },
                        }}
                      >
                        {/* Passage content here */}
                        <PassageEditor
                          passage={passage}
                          onUpdate={fetchPassages}
                        />
                      </Paper>
                    </motion.div>
                  ))}
                </Stack>
              )}
            </AnimatePresence>

            {/* Pagination */}
            <Box
              sx={{
                mt: 4,
                display: "flex",
                justifyContent: "center",
                "& .MuiPagination-ul": {
                  flexWrap: "nowrap", // Prevent pagination buttons from wrapping
                },
              }}
            >
              <Pagination
                count={totalPages}
                page={page}
                onChange={handlePageChange}
                color="primary"
                size={isMobile ? "small" : "large"}
                siblingCount={isMobile ? 0 : 1}
                boundaryCount={isMobile ? 1 : 2}
                sx={{
                  "& .MuiPaginationItem-root": {
                    color: "rgb(34 197 94)",
                  },
                  "& .Mui-selected": {
                    bgcolor: "rgb(34 197 94) !important",
                    color: "white !important",
                  },
                }}
              />
            </Box>
          </Container>
        </Box>

        {/* Story Elements Panel */}
        <Drawer
          variant="permanent"
          anchor="right"
          sx={{
            width: { xs: 300, lg: 340 },
            flexShrink: 0,
            position: "fixed",
            height: "100%",
            "& .MuiDrawer-paper": {
              width: { xs: 300, lg: 340 },
              boxSizing: "border-box",
              bgcolor: "rgb(17 24 39)",
              color: "white",
              borderLeft: "1px solid rgba(255, 255, 255, 0.1)",
              height: "100%",
              pt: { xs: "64px", sm: "70px" },
              zIndex: 1,
            },
            display: { xs: "none", lg: "block" },
          }}
        >
          <StoryElementsPanel
            storyElements={storyElements}
            onUpdate={fetchStoryElements}
            storyId={storyId}
          />
        </Drawer>

        {/* Mobile Story Elements Toggle */}
        <Box
          sx={{
            position: "fixed",
            bottom: 16,
            right: 16,
            display: { xs: "block", lg: "none" },
            zIndex: 2,
          }}
        >
          <Fab
            color="primary"
            onClick={() => setDrawerOpen(!drawerOpen)}
            sx={{
              bgcolor: "rgb(34 197 94)",
              "&:hover": { bgcolor: "rgb(22 163 74)" },
            }}
          >
            <MenuBookIcon />
          </Fab>
        </Box>

        {/* Mobile Story Elements Drawer */}
        <Drawer
          anchor="right"
          open={drawerOpen}
          onClose={() => setDrawerOpen(false)}
          sx={{
            display: { xs: "block", lg: "none" },
            "& .MuiDrawer-paper": {
              width: { xs: "100%", sm: 340 }, // Full width on mobile phones
              bgcolor: "rgb(17 24 39)",
              color: "white",
              pt: { xs: "64px", sm: "70px" },
            },
          }}
        >
          <StoryElementsPanel
            storyElements={storyElements}
            onUpdate={fetchStoryElements}
            storyId={storyId}
          />
        </Drawer>
      </Box>
    </>
  );
}
