"use client";
import { useState } from "react";
import {
  Paper,
  Typography,
  Box,
  Grid,
  Chip,
  Tooltip,
  Alert,
  Button
} from "@mui/material";
import { motion } from "framer-motion";
import { CheckCircle as CheckIcon } from "@mui/icons-material";
import PassageEditor from "@/components/passage/PassageEditor";
import { toast } from "react-hot-toast";
import storyApiClient from "@/lib/storyApi";

export default function ComparisonPassageResults({ 
  passages = [], // Add default empty array
  outline,
  onUpdate,
  onClose
}) {
  const [preferredPassageId, setPreferredPassageId] = useState(null);
  const [finalized, setFinalized] = useState(false);

  // Check length after ensuring passages is an array
  if (passages.length < 2) return null;

  const sortedPassages = [...passages].sort((a, b) => b.score - a.score);
  const formatScorePercentage = (score) => Math.round(score * 100);

  const handlePrefer = async (passageId) => {
    try {
      const preferredPassage = passages.find(p => p.passage_id === passageId);
      if (!preferredPassage) return;

      setPreferredPassageId(passageId);
      setFinalized(true);
      console.log(preferredPassage);
      await savePassage(preferredPassage);
      if (onUpdate) onUpdate(preferredPassage);

      toast.success("Preferred passage saved successfully!");
    } catch (error) {
      console.error('Failed to prefer passage:', error);
      toast.error("Failed to save preferred passage");
    }
  };

  const handleUndo = () => {
    setPreferredPassageId(null);
    setFinalized(false);
  };

  async function savePassage(passage) {
    try {
      const response = await storyApiClient.post(
        `/draft/prefer-passage/${passage.story_id}`,
        passage
      );
      return response.data;
    } catch (error) {
      console.error("Error saving passage:", error);
      throw error;
    }
  }

  const preferredPassage = passages.find(p => p.passage_id === preferredPassageId);

  if (finalized && preferredPassage) {
    return (
      <Paper elevation={4} sx={{ p: 3, mt: 3 }}>
        {/* <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <Typography variant="h6">Finalized Passage</Typography>
          <Button onClick={handleUndo} color="secondary" size="small" variant="outlined">
            Undo
          </Button>
        </Box> */}

        <Alert severity="info" sx={{ my: 2 }}>
          You've selected this passage as your preferred version.
        </Alert>

        <Typography variant="subtitle2" color="text.secondary" gutterBottom>
          Outline {preferredPassage.outline_point_id}: {outline?.title || "Untitled"}
        </Typography>

        <PassageEditor
          passage={preferredPassage}
          onUpdate={onUpdate}
        />
      </Paper>
    );
  }

  return (
    <Box sx={{ mb: 4 }}>
      <Typography variant="h6" gutterBottom>
        Generated Passages
      </Typography>
      
      <Grid container spacing={2}>
        {sortedPassages.map((passage, index) => {
          const isHighestScore = index === 0;
          const scorePercentage = formatScorePercentage(passage.score);

          return (
            <Grid item xs={12} md={6} key={passage.passage_id}>
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.3, delay: index * 0.1 }}
              >
                <Paper
                  elevation={5}
                  sx={{
                    p: { xs: 2, sm: 3 },
                    height: "100%",
                    display: "flex",
                    flexDirection: "column",
                    border: isHighestScore 
                      ? '2px solid rgb(34 197 94)' 
                      : '1px solid rgba(0, 0, 0, 0.12)',
                    position: 'relative',
                    boxShadow: isHighestScore 
                      ? '0 4px 20px rgba(34, 197, 94, 0.15)' 
                      : 3
                  }}
                >
                  <Box 
                    sx={{ 
                      display: 'flex', 
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      mb: 2,
                      borderBottom: '1px solid rgba(0,0,0,0.1)',
                      pb: 1
                    }}
                  >
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                      <Tooltip title={`Quality score: ${scorePercentage}%`}>
                        <Chip
                          icon={<CheckIcon />}
                          label={`${scorePercentage}%`}
                          size="small"
                          sx={{ 
                            mr: 2, 
                            bgcolor: isHighestScore ? 'rgb(34 197 94)' : '#f59e0b',
                            color: 'white',
                            '& .MuiChip-icon': {
                              color: 'white'
                            }
                          }}
                        />
                      </Tooltip>
                      <Typography variant="subtitle1" sx={{ fontWeight: 500 }}>
                        {isHighestScore ? 'Best Passage' : 'Alternative'}
                      </Typography>
                    </Box>

                    <Button 
                      variant="contained"
                      color="success"
                      size="small"
                      onClick={() => handlePrefer(passage.passage_id)}
                    >
                      Prefer
                    </Button>
                  </Box>

                  {isHighestScore && (
                    <Alert 
                      severity="success" 
                      sx={{ 
                        mb: 2,
                        '& .MuiAlert-message': {
                          fontWeight: 500
                        }
                      }}
                    >
                      Highest quality score
                    </Alert>
                  )}

                  <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                    Outline {passage.outline_point_id}: {outline?.title || "Untitled"}
                    <span style={{ marginLeft: "10px", fontSize: "0.8em" }}>
                      (Just now)
                    </span>
                  </Typography>

                  <Box sx={{ flexGrow: 1 }}>
                    <PassageEditor
                      passage={passage}
                      onUpdate={onUpdate}
                      autoFocus={isHighestScore}
                    />
                  </Box>
                </Paper>
              </motion.div>
            </Grid>
          );
        })}
      </Grid>
    </Box>
  );
}
