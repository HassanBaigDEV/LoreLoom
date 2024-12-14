import React from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  IconButton,
} from "@mui/material";
import { Visibility as VisibilityIcon } from "@mui/icons-material";

export default function StoriesTable({ stories = [] }) {
  console.log("Stories data:", stories);

  return (
    <TableContainer component={Paper}>
      <Table>
        <TableHead>
          <TableRow>
            <TableCell>Title</TableCell>
            <TableCell>Author</TableCell>
            <TableCell>Genre</TableCell>
            <TableCell>Status</TableCell>
            <TableCell>Created At</TableCell>
            <TableCell>Actions</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {stories.map((story) => (
            <TableRow key={story.id} hover>
              <TableCell>{story.title}</TableCell>
              <TableCell>{story.author_name}</TableCell>
              <TableCell>{story.genre}</TableCell>
              <TableCell>
                <span
                  className={`px-2 py-1 rounded-full text-xs ${
                    story.status === 'published'
                      ? 'bg-green-100 text-green-800'
                      : 'bg-yellow-100 text-yellow-800'
                  }`}
                >
                  {story.status}
                </span>
              </TableCell>
              <TableCell>
                {new Date(story.created_at).toLocaleDateString()}
              </TableCell>
              <TableCell>
                <IconButton>
                  <VisibilityIcon />
                </IconButton>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  );
}
