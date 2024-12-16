// "use client";
// import React from 'react';
// import { Box, Typography, Grid, Card, CardContent, IconButton } from '@mui/material';
// import { Edit as EditIcon, Delete as DeleteIcon } from '@mui/icons-material';

// const StoriesSection = () => {
//   // Get user stories from localStorage with error handling
//   let userStories = [];
//   try {
//     const user = JSON.parse(localStorage.getItem("user") || '{"stories": []}');
//     userStories = user.stories || [];
//   } catch (error) {
//     console.error('Error parsing user stories:', error);
//   }

//   const handleEdit = (storyId) => {
//     console.log('Edit story:', storyId);
//     // Add edit functionality
//   };

//   const handleDelete = (storyId) => {
//     console.log('Delete story:', storyId);
//     // Add delete functionality
//   };

//   return (
//     <Box sx={{ mt: 4 }}>
//       <Typography variant="h5" sx={{ mb: 3, fontWeight: 600 }}>
//         Your Stories
//       </Typography>

//       {userStories.length === 0 ? (
//         <Card sx={{ bgcolor: 'rgb(243 244 246)' }}>
//           <CardContent>
//             <Typography align="center" color="text.secondary">
//               You haven't created any stories yet.
//             </Typography>
//           </CardContent>
//         </Card>
//       ) : (
//         <Grid container spacing={3}>
//           {userStories.map((story, index) => (
//             <Grid item xs={12} sm={6} md={4} key={index}>
//               <Card
//                 sx={{
//                   height: '100%',
//                   transition: 'transform 0.2s ease-in-out',
//                   '&:hover': {
//                     transform: 'translateY(-4px)',
//                     boxShadow: 3
//                   }
//                 }}
//               >
//                 <CardContent>
//                   <Typography variant="h6" gutterBottom>
//                     {story.title || 'Untitled Story'}
//                   </Typography>
//                   <Typography
//                     color="text.secondary"
//                     sx={{
//                       mb: 2,
//                       display: '-webkit-box',
//                       WebkitLineClamp: 3,
//                       WebkitBoxOrient: 'vertical',
//                       overflow: 'hidden'
//                     }}
//                   >
//                     {story.content || 'No content available'}
//                   </Typography>
//                   <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 1 }}>
//                     <IconButton
//                       size="small"
//                       onClick={() => handleEdit(story.id)}
//                       sx={{ color: 'primary.main' }}
//                     >
//                       <EditIcon />
//                     </IconButton>
//                     <IconButton
//                       size="small"
//                       onClick={() => handleDelete(story.id)}
//                       sx={{ color: 'error.main' }}
//                     >
//                       <DeleteIcon />
//                     </IconButton>
//                   </Box>
//                 </CardContent>
//               </Card>
//             </Grid>
//           ))}
//         </Grid>
//       )}
//     </Box>
//   );
// };

// export default StoriesSection;
"use client";
import React, { useState, useEffect } from "react";
import { Box, Typography, Grid, Card, CardContent } from "@mui/material";
import { useStories } from "@/hooks/useStories";
import { useAtom } from "jotai";
import { userAtom } from "@/store/atoms";
import Image from "next/image";
import cover from "@/assets/images/seilala-cover.webp";
import StoriesIcon from "@/assets/images/story.svg";
import { BookOpen as StoryIcon } from "lucide-react";
import { Edit as EditIcon, Delete as DeleteIcon } from "@mui/icons-material";
import {
  IconButton,
  Menu,
  MenuItem,
  ListItemIcon,
  ListItemText,
} from "@mui/material";
import { MoreVert as MoreVertIcon } from "@mui/icons-material";

export default function Stories() {
  const [user] = useAtom(userAtom);
  const { stories, fetchStories } = useStories();

  const [anchorEl, setAnchorEl] = useState(null);
  const [selectedId, setSelectedId] = useState(null);

  const handleMenuClick = (event, id) => {
    setAnchorEl(event.currentTarget);
    setSelectedId(id);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
    setSelectedId(null);
  };

  useEffect(() => {
    if (user?.id) {
      fetchStories(user.id);
    }
  }, [user]);

  if (!stories?.length) {
    return (
      <div className="mt-8 mb-48">
        <div className="flex items-center text-lg font-medium leading-6 text-gray-900">
          <StoryIcon
            className="w-8 h-8 mb-4 mr-2 text-green-500"
            strokeWidth={1.5}
          />
          <Typography variant="h5" sx={{ mb: 2, fontWeight: 600 }}>
            Your Stories
          </Typography>
        </div>
        <div className="flex items-center justify-center w-full h-64">
          <p className="text-gray-500">No stories found</p>
        </div>
      </div>
    );
  }
  return (
    <main className="flex flex-col min-h-screen">
      <div className="flex items-center text-lg font-medium leading-6 text-gray-900">
        <StoryIcon
          className="w-8 h-8 mb-4 mr-2 text-blue-950"
          strokeWidth={1.5}
        />
        <Typography variant="h5" sx={{ mb: 2, fontWeight: 600 }}>
          Your Stories
        </Typography>
      </div>
      <section className="m-8">
        <div className="grid grid-cols-1 gap-8 mx-auto sm:grid-cols-2 lg:grid-cols-3">
          {stories.map((story, index) => (
            <div key={index} className="relative block w-full">
              <Image
                src={cover}
                className="w-full h-auto mx-auto rounded-3xl brightness-50"
              />
              <div className="absolute p-2 bg-blue-900 bg-opacity-50 top-2 left-4 rounded-xl">
                <p className="text-xs">{story.genre}</p>
              </div>
              <div className="absolute p-2 bg-blue-900 bg-opacity-50 top-2 right-4 rounded-xl">
                <IconButton
                  size="small"
                  onClick={(event) => handleMenuClick(event, story.id)}
                  sx={{ color: "primary.main"}}
                >
                  <MoreVertIcon sx={{ color: "#fff", padding: '2px' }}/>
                </IconButton>
                <Menu
                  anchorEl={anchorEl}
                  open={Boolean(anchorEl) && selectedId === story.id}
                  onClose={handleMenuClose}
                  className="bg-opacity-50"
                >
                  <MenuItem
                    onClick={() => {
                      handleEdit(selectedId);
                      handleMenuClose();
                    }}
                  >
                    <ListItemIcon>
                      <EditIcon fontSize="small" />
                    </ListItemIcon>
                    <ListItemText>Edit</ListItemText>
                  </MenuItem>
                  <MenuItem
                    onClick={() => {
                      handleDelete(selectedId);
                      handleMenuClose();
                    }}
                  >
                    <ListItemIcon>
                      <DeleteIcon
                        fontSize="small"
                        sx={{ color: "error.main" }}
                      />
                    </ListItemIcon>
                    <ListItemText>Delete</ListItemText>
                  </MenuItem>
                </Menu>
              </div>
              <div className="absolute flex justify-between p-2 text-white bg-opacity-50 rounded-xl bottom-2 left-2 right-2">
                <button className="px-3 py-1 text-sm text-white bg-opacity-50 bg-blue-950 rounded-xl">
                  <h1 className="font-bold">
                    {story.title.split(":")[0].replace(/^"|"$/g, "")}
                  </h1>
                  <p className="text-xs">Read story by {user.last_name}</p>
                </button>
              </div>
            </div>
          ))}
        </div>
      </section>
    </main>
  );
}
