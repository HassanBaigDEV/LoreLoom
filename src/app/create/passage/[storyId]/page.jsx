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
  Divider,
  Tooltip,
  CircularProgress,
  Button,
  useTheme,
  useMediaQuery,
} from "@mui/material";
import {
  Add as AddIcon,
  PictureAsPdf as PdfIcon,
  MenuBook as MenuBookIcon,
} from "@mui/icons-material";
import storyApiClient from "@/lib/storyApi";
import PassageEditor from "@/components/passage/PassageEditor";
import StoryElementsPanel from "@/components/passage/StoryElementsPanel";
import ProtectedRoute from "@/components/auth/ProtectedRoute";
import { Toaster, toast } from "react-hot-toast";
import PassageCreationWizard from "@/components/generation/wizard";
import NewPassageResult from "@/components/passage/NewPassageResult";
import ComparisonPassageResults from "@/components/passage/ComparisonPassageResults";

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
  const [story, setStory] = useState(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  
  // New state for wizard modal and generated passages
  const [wizardOpen, setWizardOpen] = useState(false);
  const [newPassages, setNewPassages] = useState([]);
  const [selectedOutline, setSelectedOutline] = useState(null);
  const [dismissedPassages, setDismissedPassages] = useState(new Set());

  const fetchPassages = useCallback(async () => {
    setLoading(true);
    try {
      const user = JSON.parse(localStorage.getItem("user"));
      if (!user?.id) throw new Error("User not found");

      const [passagesResponse, countResponse] = await Promise.all([
        storyApiClient.get(`/draft/passages/${storyId}`, {
          params: {
            user_id: user?.id,
            limit: ITEMS_PER_PAGE,
            skip: (page - 1) * ITEMS_PER_PAGE,
          },
        }),
        storyApiClient.get(`/draft/passages/${storyId}/count`, {
          params: { user_id: user?.id },
        }),
      ]);

      const sortedPassages = [...passagesResponse.data]
        .sort((a, b) => {
          const outlineDiff =
            parseInt(a.outline_number) - parseInt(b.outline_number);
          if (outlineDiff !== 0) return outlineDiff;
          return (
            new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
          );
        })
        .reverse();

      setPassages(sortedPassages);
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
          params: { user_id: user?.id },
        }
      );
      setStoryElements(response.data);
    } catch (error) {
      console.error("Error fetching story elements:", error);
    }
  }, [storyId]);

  useEffect(() => {
    fetchStoryElements();
    fetchPassages();
  }, [fetchPassages, fetchStoryElements]);

  const handlePageChange = (event, value) => {
    setPage(value);
  };

  // Open the wizard modal
  const handleOpenWizard = () => {
    if (!storyElements?.outline?.length) {
      toast.error("Please create an outline first");
      return;
    }
    setWizardOpen(true);
  };

  // Handle passage created from wizard
  const handlePassageCreated = (newPassages, outline) => {
    if (newPassages && Array.isArray(newPassages)) {
      // Sort passages by score (highest first)
      const sortedPassages = [...newPassages].sort((a, b) => b.score - a.score);
      
      // Store the newly created passages and outline
      setNewPassages(sortedPassages);
      setSelectedOutline(outline);
      setDismissedPassages(new Set()); // Reset dismissed passages
      
      // Refresh the passages list to include the new ones
      fetchPassages();
    } else {
      // No passage data returned, just refresh the list
      fetchPassages();
    }
  };

  // Handle dismissing a passage
  const handleDismissPassage = (passageId) => {
    setDismissedPassages(prev => {
      const updated = new Set(prev);
      updated.add(passageId);
      return updated;
    });
    
    // If all passages are dismissed, clear the state
    if (dismissedPassages.size + 1 >= newPassages.length) {
      setTimeout(() => {
        setNewPassages([]);
        setSelectedOutline(null);
        setDismissedPassages(new Set());
      }, 300);
    }
  };

  // Filter out dismissed passages
  const visibleNewPassages = newPassages.filter(
    passage => !dismissedPassages.has(passage.passage_id)
  );

  // Find highest scoring passage
  const highestScorePassage = visibleNewPassages.length > 0 ? visibleNewPassages[0] : null;

  return (
    <>
      <Box
        sx={{
          display: "flex",
          minHeight: "100vh",
          bgcolor: "grey.50",
          flexDirection: { xs: "column", lg: "row" },
        }}
      >
        <Toaster position="top-right" />

        {/* Main Content */}
        <Box
          sx={{
            flexGrow: 1,
            p: { xs: 2, sm: 3 },
            pt: { xs: 8, sm: 10, md: 12 },
            pr: { xs: 2, sm: 3, lg: "360px" },
            width: "100%",
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
                flexDirection: { xs: "column", sm: "row" },
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
              <Stack direction="row" spacing={2}>
                <Button
                  variant="outlined"
                  startIcon={<PdfIcon />}
                  onClick={() => router.push(`/create/passage/${storyId}/view`)}
                  sx={{
                    borderColor: "rgb(34 197 94)",
                    color: "rgb(34 197 94)",
                    "&:hover": {
                      borderColor: "rgb(22 163 74)",
                      bgcolor: "rgba(34, 197, 94, 0.04)",
                    },
                  }}
                >
                  View Story
                </Button>
                <Button
                  variant="contained"
                  startIcon={<AddIcon />}
                  onClick={handleOpenWizard}
                  disabled={loading}
                  sx={{
                    bgcolor: "rgb(34 197 94)",
                    "&:hover": { bgcolor: "rgb(22 163 74)" },
                  }}
                >
                  New Passage
                </Button>
              </Stack>
            </Box>

            {/* Display newly generated passages if they exist */}
            {visibleNewPassages.length > 0 && (
              <>
                {visibleNewPassages.length === 1 ? (
                  <Box sx={{ mb: 3 }}>
                    <Typography variant="h6" gutterBottom>
                      Generated Passage
                    </Typography>
                    <NewPassageResult 
                      passage={visibleNewPassages[0]}
                      outline={selectedOutline}
                      onUpdate={fetchPassages}
                      onClose={handleDismissPassage}
                      isHighestScore={true}
                    />
                  </Box>
                ) : (
                  <ComparisonPassageResults
                    passages={visibleNewPassages}
                    outline={selectedOutline}
                    onUpdate={fetchPassages}
                    onClose={handleDismissPassage}
                  />
                )}
              </>
            )}

            {/* Passages List */}
            <AnimatePresence mode="wait">
              {loading ? (
                <LoadingOverlay />
              ) : (
                <Stack spacing={2}>
                  {passages.length > 0 ? (
                    passages.map((passage, index) => {
                      return (
                        <motion.div
                          key={passage.id || passage.passage_id}
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0 }}
                          transition={{ delay: index * 0.1 }}
                        >
                          <Paper
                            elevation={3}
                            sx={{
                              p: { xs: 2, sm: 3 },
                              transition: "all 0.3s ease",
                              "&:hover": {
                                boxShadow: 3,
                                transform: "translateY(-2px)",
                              },
                            }}
                          >
                            <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                              Outline {passage.outline_point_id}:{" "}
                              {storyElements?.outline?.find((o) => o.number === passage.outline_point_id)?.title || "Untitled"}
                                <span style={{ marginLeft: "10px", fontSize: "0.8em" }}>
                                  ({new Date(passage.created_at).toLocaleDateString()})
                                </span>
                            </Typography>

                            <PassageEditor
                              passage={passage}
                              onUpdate={fetchPassages}
                            />
                          </Paper>
                        </motion.div>
                      );
                    })
                  ) : (
                    <Box sx={{ p: 4, textAlign: "center" }}>
                      <Typography variant="body1" color="text.secondary">
                        No passages yet. Click "New Passage" to create one!
                      </Typography>
                    </Box>
                  )}
                </Stack>
              )}
            </AnimatePresence>

            {/* Pagination */}
            {passages.length > 0 && (
              <Box
                sx={{
                  mt: 4,
                  display: "flex",
                  justifyContent: "center",
                  "& .MuiPagination-ul": {
                    flexWrap: "nowrap",
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
                  disabled={page===1}
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
            )}
          </Container>
        </Box>

        {/* Story Elements Panel (desktop) */}
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
              width: { xs: "100%", sm: 340 },
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

        {/* Passage Creation Wizard Modal */}
        <PassageCreationWizard
          open={wizardOpen}
          onClose={() => setWizardOpen(false)}
          storyId={storyId}
          storyElements={storyElements}
          onPassageCreated={handlePassageCreated}
        />
      </Box>
    </>
  );
}
