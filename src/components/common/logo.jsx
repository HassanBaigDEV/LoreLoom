"use client";
import React from 'react';
import { Typography, Box } from '@mui/material';
import { AutoStories } from '@mui/icons-material';

export default function Logo() {
  return (
    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
      <AutoStories 
        sx={{ 
          fontSize: '2rem',
          color: 'white'
        }} 
      />
      <Typography
        variant="h6"
        noWrap
        sx={{
          fontFamily: 'monospace',
          fontWeight: 700,
          letterSpacing: '.2rem',
          color: 'white',
          textDecoration: 'none',
        }}
      >
        STORYWEAVER
      </Typography>
    </Box>
  );
}
