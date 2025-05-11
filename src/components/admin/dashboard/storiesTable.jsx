import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { IconButton, Menu, MenuItem } from "@mui/material";
import { ExpandMore, ExpandLess, MoreVert, CheckCircle, Cancel } from "@mui/icons-material";
import apiClient from "@/lib/axios";
import { adminService } from "@/lib/adminService";
import ConfirmDialog from "@/components/common/ConfirmDialog";

function StoryDetails({ story }) {
  const author = story.author_details?.username || story.author_name || 'Unknown';
  const hasPremise = Boolean(story.premise && story.premise.trim());
  const hasSetting = Boolean(story.setting && story.setting.trim());
  const collaborators = Array.isArray(story.collaborators) && story.collaborators.length > 0
    ? story.collaborators.map(c => c.username || 'Unknown').join(', ')
    : 'None';
  const charactersCount = Array.isArray(story.characters) ? story.characters.length : 0;
  const outlineCount = Array.isArray(story.outline) ? story.outline.length : 0;

  return (
    <div className="grid grid-cols-1 gap-4 text-sm text-gray-800 md:grid-cols-2">
      <div><span className="font-semibold">Author:</span> {author}</div>
      <div><span className="font-semibold">Genre:</span> {story.genre || '-'}</div>
      <div className="flex items-center gap-2">
        <span className="font-semibold">Premise:</span>
        {hasPremise ? <CheckCircle className="text-green-500" titleAccess="Premise present" /> : <Cancel className="text-red-400" titleAccess="No premise" />}
      </div>
      <div className="flex items-center gap-2">
        <span className="font-semibold">Setting:</span>
        {hasSetting ? <CheckCircle className="text-green-500" titleAccess="Setting present" /> : <Cancel className="text-red-400" titleAccess="No setting" />}
      </div>
      <div><span className="font-semibold">Collaborators:</span> {collaborators}</div>
      <div><span className="font-semibold">Characters:</span> {charactersCount}</div>
      <div><span className="font-semibold">Outline:</span> {outlineCount}</div>
      <div><span className="font-semibold">Privacy:</span> {story.privacy || '-'}</div>
    </div>
  );
}

export default function StoriesTable({ stories = [] }) {
  const [expandedRows, setExpandedRows] = useState([]);
  const [anchorEls, setAnchorEls] = useState({});
  const [authorNames, setAuthorNames] = useState({});
  const [confirmDialog, setConfirmDialog] = useState({ open: false, story: null });
  const router = useRouter();

  useEffect(() => {
    const fetchAuthors = async () => {
      const names = {};
      await Promise.all(
        stories.map(async (story) => {
          const authorId = story.author_details?.id || story.author_id || story.author;
          const storyKey = story._id || story.id;
          if (!authorId) {
            names[storyKey] = "Unknown Author";
            return;
          }
          try {
            const response = await apiClient.get(`/user/author/${authorId}`);
            const authorData = response.data;
            let authorName = `${authorData.first_name || ""} ${authorData.last_name || ""}`.trim();
            if (!authorName) {
              authorName = authorData.username || "Unknown Author";
            }
            names[storyKey] = authorName;
            story.author_name = authorName;
          } catch (error) {
            names[storyKey] = "Unknown Author";
          }
        })
      );
      setAuthorNames(names);
    };
    if (stories.length) fetchAuthors();
  }, [stories]);

  const handleExpandClick = (storyId) => {
    setExpandedRows((prev) =>
      prev.includes(storyId)
        ? prev.filter((id) => id !== storyId)
        : [...prev, storyId]
    );
  };

  const handleMenuOpen = (event, storyId) => {
    event.stopPropagation();
    setAnchorEls((prev) => ({ ...prev, [storyId]: event.currentTarget }));
  };

  const handleMenuClose = (storyId) => {
    setAnchorEls((prev) => ({ ...prev, [storyId]: null }));
  };

  // View navigates to /create/passage/{story.story_id}/view
  const handleView = (story) => {
    if (story.story_id) {
      router.push(`/create/passage/${story.story_id}/view`);
    } else if (story._id) {
      router.push(`/create/passage/${story._id}/view`);
    }
  };
  const handleDelete = (story) => {
    setConfirmDialog({ open: true, story });
  };

  const handleConfirmDelete = async () => {
    try {
      // Get the story ID, ensuring we use the correct field
      const storyId = confirmDialog.story._id || confirmDialog.story.id || confirmDialog.story.story_id;
      if (!storyId) {
        throw new Error('No valid story ID found');
      }
      
      const response = await adminService.deleteStory(storyId);
      
      // Show success message with number of deleted passages
      const message = response.deleted_passages > 0 
        ? `Story and ${response.deleted_passages} passages deleted successfully`
        : 'Story deleted successfully';
      
      alert(message);
      setConfirmDialog({ open: false, story: null });
      
      // Refresh the page to update the stories list
      if (typeof window !== 'undefined') window.location.reload();
    } catch (error) {
      console.error('Error deleting story:', error);
      alert(error.response?.data?.detail || 'Failed to delete story');
      setConfirmDialog({ open: false, story: null });
    }
  };

  const handleCancelDelete = () => {
    setConfirmDialog({ open: false, story: null });
  };

  console.log("Stories data:", stories);

  return (
    <div className="overflow-x-auto bg-white shadow rounded-xl">
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50">
          <tr>
            <th className="px-6 py-3 text-xs font-bold tracking-wider text-left text-gray-600 uppercase">Title</th>
            <th className="px-6 py-3 text-xs font-bold tracking-wider text-left text-gray-600 uppercase">Author</th>
            <th className="px-6 py-3 text-xs font-bold tracking-wider text-left text-gray-600 uppercase">Genre</th>
            <th className="px-6 py-3 text-xs font-bold tracking-wider text-left text-gray-600 uppercase">Status</th>
            <th className="px-6 py-3 text-xs font-bold tracking-wider text-left text-gray-600 uppercase">Created At</th>
            <th className="px-6 py-3 text-xs font-bold tracking-wider text-left text-gray-600 uppercase">Actions</th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-100">
          {stories.map((story, idx) => {
            const storyId = story._id || story.id;
            const isExpanded = expandedRows.includes(storyId);
            const author = authorNames[storyId] || 'Loading...';
            const genre = story.genre || '-';
            const createdAt = story.created_at ? new Date(story.created_at).toLocaleDateString() : '-';
            return (
              <React.Fragment key={storyId}>
                <tr
                  className={idx % 2 === 0 ? 'bg-gray-50 cursor-pointer' : 'bg-white cursor-pointer'}
                  onClick={() => handleExpandClick(storyId)}
                >
                  <td className="px-6 py-4 text-sm font-medium text-gray-900 whitespace-nowrap">{story.title || '-'}</td>
                  <td className="px-6 py-4 text-sm text-gray-700 whitespace-nowrap">{author}</td>
                  <td className="px-6 py-4 text-sm text-gray-700 whitespace-nowrap">{genre}</td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="inline-block px-3 py-1 text-xs font-semibold text-blue-700 bg-blue-100 rounded-full">In Progress</span>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-500 whitespace-nowrap">{createdAt}</td>
                  <td className="px-6 py-4 whitespace-nowrap" onClick={e => e.stopPropagation()}>
                    <IconButton onClick={e => handleMenuOpen(e, storyId)}>
                      <MoreVert className="text-gray-500 transition-colors hover:text-purple-600" />
                </IconButton>
                    <Menu
                      anchorEl={anchorEls[storyId]}
                      open={Boolean(anchorEls[storyId])}
                      onClose={() => handleMenuClose(storyId)}
                    >
                      <MenuItem onClick={() => { handleView(story); handleMenuClose(storyId); }}>View</MenuItem>
                      <MenuItem onClick={() => { handleDelete(story); handleMenuClose(storyId); }} sx={{ color: 'red' }}>Delete</MenuItem>
                    </Menu>
                  </td>
                </tr>
                {isExpanded && (
                  <tr>
                    <td colSpan={6} className="px-6 py-4 border-t bg-gray-50">
                      <StoryDetails story={story} />
                    </td>
                  </tr>
                )}
              </React.Fragment>
            );
          })}
        </tbody>
      </table>
      <ConfirmDialog
        open={confirmDialog.open}
        title="Delete Story"
        content={`Are you sure you want to delete the story '${confirmDialog.story?.title || ''}'? This action cannot be undone.`}
        onConfirm={handleConfirmDelete}
        onCancel={handleCancelDelete}
        confirmText="Delete"
        cancelText="Cancel"
        isDestructive={true}
      />
    </div>
  );
}
