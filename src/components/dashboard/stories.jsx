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
import { useRouter } from 'next/navigation';
import { Tooltip } from '@mui/material';

export default function Stories() {
  const [user] = useAtom(userAtom);
  const { stories, fetchStories } = useStories();
  const router = useRouter();

  const [anchorEl, setAnchorEl] = useState(null);
  const [selectedStory, setSelectedStory] = useState(null);

  const handleMenuClick = (event, story) => {
    event.stopPropagation();
    setAnchorEl(event.currentTarget);
    setSelectedStory(story);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
    setSelectedStory(null);
  };

  const handleEditStory = (story) => {
    if (!story?.story_id) {
      console.log('Invalid story data',story);
      return;
    }
    handleMenuClose();
    router.push(`/create/plan/${story.story_id}`);
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
            <div key={story.id || index} className="relative block w-full">
              <Image
                src={cover}
                className="w-full h-auto mx-auto rounded-3xl brightness-50"
                alt={story.title}
              />
              <div className="absolute p-2 bg-blue-900 bg-opacity-50 top-2 left-4 rounded-xl">
                <p className="text-xs">{story.genre}</p>
              </div>
              <div className="absolute p-2 bg-blue-900 bg-opacity-50 top-2 right-4 rounded-xl">
                <IconButton
                  size="small"
                  onClick={(event) => handleMenuClick(event, story)}
                  sx={{ color: "primary.main"}}
                >
                  <MoreVertIcon sx={{ color: "#fff", padding: '2px' }}/>
                </IconButton>
                <Menu
                  anchorEl={anchorEl}
                  open={Boolean(anchorEl) && selectedStory?.id === story.id}
                  onClose={handleMenuClose}
                  className="bg-opacity-50"
                >
                  <MenuItem
                    onClick={() => {
                      if (selectedStory) {
                        handleEditStory(selectedStory);
                      }
                    }}
                  >
                    <ListItemIcon>
                      <EditIcon fontSize="small" />
                    </ListItemIcon>
                    <ListItemText>Edit</ListItemText>
                  </MenuItem>
                  <MenuItem
                    onClick={() => {
                      if (selectedStory) {
                        handleDelete(selectedStory.id);
                      }
                      handleMenuClose();
                    }}
                  >
                    <ListItemIcon>
                      <DeleteIcon fontSize="small" sx={{ color: "error.main" }} />
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
