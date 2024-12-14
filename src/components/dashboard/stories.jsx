"use client";
import React from 'react';
import { Box, Typography, Grid, Card, CardContent, IconButton } from '@mui/material';
import { Edit as EditIcon, Delete as DeleteIcon } from '@mui/icons-material';

const StoriesSection = () => {
  // Get user stories from localStorage with error handling
  let userStories = [];
  try {
    const user = JSON.parse(localStorage.getItem("user") || '{"stories": []}');
    userStories = user.stories || [];
  } catch (error) {
    console.error('Error parsing user stories:', error);
  }

  const handleEdit = (storyId) => {
    console.log('Edit story:', storyId);
    // Add edit functionality
  };

  const handleDelete = (storyId) => {
    console.log('Delete story:', storyId);
    // Add delete functionality
  };

  return (
    <Box sx={{ mt: 4 }}>
      <Typography variant="h5" sx={{ mb: 3, fontWeight: 600 }}>
        Your Stories
      </Typography>

      {userStories.length === 0 ? (
        <Card sx={{ bgcolor: 'rgb(243 244 246)' }}>
          <CardContent>
            <Typography align="center" color="text.secondary">
              You haven't created any stories yet.
            </Typography>
          </CardContent>
        </Card>
      ) : (
        <Grid container spacing={3}>
          {userStories.map((story, index) => (
            <Grid item xs={12} sm={6} md={4} key={index}>
              <Card 
                sx={{ 
                  height: '100%',
                  transition: 'transform 0.2s ease-in-out',
                  '&:hover': {
                    transform: 'translateY(-4px)',
                    boxShadow: 3
                  }
                }}
              >
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    {story.title || 'Untitled Story'}
                  </Typography>
                  <Typography 
                    color="text.secondary" 
                    sx={{ 
                      mb: 2,
                      display: '-webkit-box',
                      WebkitLineClamp: 3,
                      WebkitBoxOrient: 'vertical',
                      overflow: 'hidden'
                    }}
                  >
                    {story.content || 'No content available'}
                  </Typography>
                  <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 1 }}>
                    <IconButton 
                      size="small" 
                      onClick={() => handleEdit(story.id)}
                      sx={{ color: 'primary.main' }}
                    >
                      <EditIcon />
                    </IconButton>
                    <IconButton 
                      size="small" 
                      onClick={() => handleDelete(story.id)}
                      sx={{ color: 'error.main' }}
                    >
                      <DeleteIcon />
                    </IconButton>
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      )}
    </Box>
  );
};

export default StoriesSection;
