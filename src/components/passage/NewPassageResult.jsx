// components/passage/NewPassageResult.jsx
"use client";
import { useState, useEffect } from "react";
import {
  Paper,
  Typography,
  Box,
  CircularProgress,
  Alert,
  Collapse,
  IconButton
} from "@mui/material";
import { motion } from "framer-motion";
import { Close as CloseIcon } from "@mui/icons-material";
import PassageEditor from "@/components/passage/PassageEditor";

export default function NewPassageResult({ 
  passage, 
  outline,
  onUpdate,
  onClose
}) {
  const [showResult, setShowResult] = useState(true);

  // Handle close
  const handleClose = () => {
    setShowResult(false);
    setTimeout(() => {
      if (onClose) onClose();
    }, 300); // Match animation duration
  };

  if (!passage) return null;

  return (
    <Collapse in={showResult}>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.3 }}
      >
        <Paper
          elevation={5}
          sx={{
            p: { xs: 2, sm: 3 },
            my: 3,
            border: '2px solid rgb(34 197 94)',
            position: 'relative',
            boxShadow: '0 4px 20px rgba(34, 197, 94, 0.15)'
          }}
        >
          <Box 
            sx={{ 
              display: 'flex', 
              justifyContent: 'space-between',
              alignItems: 'center',
              mb: 2 
            }}
          >
            <Alert 
              severity="success" 
              sx={{ 
                mb: 2,
                flex: 1,
                '& .MuiAlert-message': {
                  fontWeight: 500
                }
              }}
            >
              New passage successfully generated
            </Alert>
            <IconButton 
              size="small" 
              onClick={handleClose}
              sx={{ ml: 1 }}
            >
              <CloseIcon fontSize="small" />
            </IconButton>
          </Box>

          <Typography variant="subtitle2" color="text.secondary" gutterBottom>
            Outline {passage.outline_point_id}: {outline?.title || "Untitled"}
            <span style={{ marginLeft: "10px", fontSize: "0.8em" }}>
              (Just now)
            </span>
          </Typography>

          <PassageEditor
            passage={passage}
            onUpdate={onUpdate}
            autoFocus
          />
        </Paper>
      </motion.div>
    </Collapse>
  );
}