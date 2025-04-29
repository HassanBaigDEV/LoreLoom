"use client";
import { useState, useMemo } from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  Grid,
  Paper,
  IconButton,
  Box,
  CircularProgress,
  Pagination
} from "@mui/material";
import { 
  Close as CloseIcon,
  KeyboardArrowLeft as PrevIcon,
  KeyboardArrowRight as NextIcon
} from "@mui/icons-material";
import storyApiClient from "@/lib/storyApi";
import { toast } from "react-hot-toast";

// Number of outlines per page
const OUTLINES_PER_PAGE = 4;

export default function PassageCreationWizard({ 
  open, 
  onClose, 
  storyId, 
  storyElements, 
  onPassageCreated 
}) {
  const [step, setStep] = useState(1);
  const [selectedOutline, setSelectedOutline] = useState(null);
  const [loading, setLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  
  const outlinePoints = storyElements?.outline || [];
  
  // Calculate total pages for outline pagination
  const totalPages = useMemo(() => {
    return Math.ceil(outlinePoints.length / OUTLINES_PER_PAGE);
  }, [outlinePoints.length]);
  
  // Get current page outlines
  const currentOutlines = useMemo(() => {
    const startIndex = (currentPage - 1) * OUTLINES_PER_PAGE;
    return outlinePoints.slice(startIndex, startIndex + OUTLINES_PER_PAGE);
  }, [outlinePoints, currentPage]);

  const handleSelectOutline = (outlineNumber) => {
    setSelectedOutline(outlineNumber);
  };

  const handleNextStep = () => {
    if (step === 1 && selectedOutline) {
      setStep(2);
    }
  };

  const handlePreviousStep = () => {
    if (step === 2) {
      setStep(1);
    }
  };

  const handlePageChange = (event, value) => {
    setCurrentPage(value);
  };

  const handleCreatePassage = async () => {
    if (!selectedOutline) return;
    
    setLoading(true);
    try {
      const user = JSON.parse(localStorage.getItem("user"));
      if (!user?.id) throw new Error("User not found");

      const response = await storyApiClient.post(`/draft/generate-passages/${storyId}`, null, {
        params: {
          user_id: user.id,
          outline_point_id: selectedOutline,
        },
      });
      
      // Get the selected outline
      const selectedOutlineData = outlinePoints.find(o => o.number === selectedOutline);
      
      // Check if the response contains the expected data format
      if (response.data && response.data.passages && Array.isArray(response.data.passages)) {
        // Pass all generated passages and outline data to the callback
        onPassageCreated(response.data.passages, selectedOutlineData);
        toast.success(response.data.message || "Passages created successfully!");
      } else {
        // Fallback to refresh if no data returned in expected format
        onPassageCreated();
        toast.success("Passage created!");
      }
      
      handleClose();
    } catch (error) {
      console.error("Error creating passage:", error);
      toast.error("Failed to create passage");
    } finally {
      setLoading(false);
    }
  };

  const handleCreatePassageS = async () => {
    if (!selectedOutline) return;
    
    setLoading(true);
    try {
      const user = JSON.parse(localStorage.getItem("user"));
      if (!user?.id) throw new Error("User not found");

      const response = await storyApiClient.post(`/draft/generate-passages-wS/${storyId}`, null, {
        params: {
          user_id: user.id,
          outline_point_id: selectedOutline,
        },
      });
      
      // Get the selected outline
      const selectedOutlineData = outlinePoints.find(o => o.number === selectedOutline);
      
      // Check if the response contains the expected data format
      if (response.data && response.data.passages && Array.isArray(response.data.passages)) {
        // Pass all generated passages and outline data to the callback
        onPassageCreated(response.data.passages, selectedOutlineData);
        toast.success(response.data.message || "Passages created successfully!");
      } else {
        // Fallback to refresh if no data returned in expected format
        onPassageCreated();
        toast.success("Passage created!");
      }
      
      handleClose();
    } catch (error) {
      console.error("Error creating passage:", error);
      toast.error("Failed to create passage");
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setStep(1);
    setSelectedOutline(null);
    setCurrentPage(1);
    onClose();
  };

  // Dialog content remains the same as in your original component
  return (
    <Dialog 
      open={open} 
      onClose={handleClose}
      fullWidth
      maxWidth="md"
      PaperProps={{
        sx: {
          borderRadius: 2,
          boxShadow: '0 8px 32px rgba(0, 0, 0, 0.12)'
        }
      }}
    >
      <DialogTitle sx={{ 
        pb: 1, 
        display: 'flex', 
        justifyContent: 'space-between',
        alignItems: 'center',
        borderBottom: '1px solid rgba(0, 0, 0, 0.12)'
      }}>
        <Typography variant="h5" sx={{ fontWeight: 600 }}>
          Create New Passage
        </Typography>
        <IconButton edge="end" onClick={handleClose}>
          <CloseIcon />
        </IconButton>
      </DialogTitle>

      <DialogContent sx={{ p: 3, pt: 2 }}>
        {step === 1 && (
          <>
            <Typography variant="subtitle1" color="text.secondary" sx={{ mb: 3 }}>
              Select an outline for your passage
            </Typography>
            
            <Grid container spacing={2}>
              {currentOutlines.map((outline) => (
                <Grid item xs={12} sm={6} key={outline.number}>
                  <Paper
                    elevation={selectedOutline === outline.number ? 4 : 1}
                    onClick={() => handleSelectOutline(outline.number)}
                    sx={{
                      p: 3,
                      cursor: 'pointer',
                      transition: 'all 0.2s ease-in-out',
                      border: selectedOutline === outline.number 
                        ? '2px solid rgb(34 197 94)' 
                        : '1px solid rgba(0, 0, 0, 0.12)',
                      '&:hover': {
                        boxShadow: 3,
                        transform: 'translateY(-2px)',
                      },
                      height: '100%',
                      display: 'flex',
                      flexDirection: 'column',
                    }}
                  >
                    <Typography variant="h6" gutterBottom>
                      {outline.title}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {outline.description || 'No description available'}
                    </Typography>
                  </Paper>
                </Grid>
              ))}
              
              {outlinePoints.length === 0 && (
                <Box sx={{ p: 4, width: '100%', textAlign: 'center' }}>
                  <Typography variant="body1" color="text.secondary">
                    No outline points available. Please create an outline first.
                  </Typography>
                </Box>
              )}
            </Grid>
            
            {/* Pagination controls */}
            {outlinePoints.length > OUTLINES_PER_PAGE && (
              <Box sx={{ 
                display: 'flex', 
                justifyContent: 'center',
                mt: 3,
              }}>
                <Pagination
                  count={totalPages}
                  page={currentPage}
                  onChange={handlePageChange}
                  color="primary"
                  size="medium"
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
          </>
        )}

        {step === 2 && (
          <>
            <Typography variant="subtitle1" color="text.secondary" sx={{ mb: 3 }}>
              Confirm passage creation
            </Typography>
            
            <Paper elevation={1} sx={{ p: 3, mb: 3, bgcolor: 'rgba(34, 197, 94, 0.05)' }}>
              <Typography variant="subtitle2" gutterBottom>
                Selected Outline:
              </Typography>
              <Typography variant="h6" gutterBottom>
                {outlinePoints.find(o => o.number === selectedOutline)?.title || 'Unknown'}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {outlinePoints.find(o => o.number === selectedOutline)?.description || 'No description available'}
              </Typography>
            </Paper>
            
            <Typography variant="body2" color="text.secondary">
              Your passage will be generated based on this outline point. Multiple versions may be created for you to choose from.
            </Typography>
          </>
        )}
      </DialogContent>

      <DialogActions sx={{ px: 3, py: 2, borderTop: '1px solid rgba(0, 0, 0, 0.12)' }}>
        {step === 2 && (
          <Button onClick={handlePreviousStep} disabled={loading} startIcon={<PrevIcon />}>
            Back
          </Button>
        )}
        <Box sx={{ flex: '1 1 auto' }} />
        
        {step === 1 && (
          <Button
            variant="contained"
            onClick={handleNextStep}
            disabled={!selectedOutline || loading}
            endIcon={<NextIcon />}
            sx={{
              bgcolor: 'rgb(34 197 94)',
              '&:hover': { bgcolor: 'rgb(22 163 74)' },
              '&.Mui-disabled': { bgcolor: 'rgba(34, 197, 94, 0.5)' },
            }}
          >
            Next Step
          </Button>
        )}
        
        {step === 2 && (
          <>
          <Button
            variant="contained"
            onClick={handleCreatePassage}
            disabled={loading}
            sx={{
              bgcolor: 'rgb(34 197 94)',
              '&:hover': { bgcolor: 'rgb(22 163 74)' },
              '&.Mui-disabled': { bgcolor: 'rgba(34, 197, 94, 0.5)' },
            }}
          >
            {loading ? (
              <>
                <CircularProgress size={20} color="inherit" sx={{ mr: 1 }} />
                Creating...
              </>
            ) : (
              'Generate Passage'
            )}
          </Button>
          <Button
            variant="contained"
            onClick={handleCreatePassageS}
            disabled={loading}
            sx={{
              bgcolor: 'rgb(34 197 94)',
              '&:hover': { bgcolor: 'rgb(22 163 74)' },
              '&.Mui-disabled': { bgcolor: 'rgba(34, 197, 94, 0.5)' },
            }}
          >
            {loading ? (
              <>
                <CircularProgress size={20} color="inherit" sx={{ mr: 1 }} />
                Creating...
              </>
            ) : (
              'Generate Choice'
            )}
          </Button>
          </>
        )}
      </DialogActions>
    </Dialog>
  );
}