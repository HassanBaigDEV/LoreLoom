"use client";
import { useState } from 'react';
import {
  Box,
  Typography,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  List,
  ListItem,
  ListItemText,
  Divider,
  IconButton,
  Tooltip,
  Chip,
  Stack,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Button,
} from '@mui/material';
import {
  ExpandMore as ExpandMoreIcon,
  Edit as EditIcon,
  Title as TitleIcon,
  Description as DescriptionIcon,
  LocationOn as LocationIcon,
  People as PeopleIcon,
  FormatListBulleted as OutlineIcon,
} from '@mui/icons-material';

const sections = [
  { id: 'title', label: 'Title', icon: TitleIcon },
  { id: 'premise', label: 'Premise', icon: DescriptionIcon },
  { id: 'setting', label: 'Setting', icon: LocationIcon },
  { id: 'characters', label: 'Characters', icon: PeopleIcon },
  { id: 'outline', label: 'Outline', icon: OutlineIcon },
];

export default function StoryElementsPanel({ storyElements, onUpdate }) {
  const [expanded, setExpanded] = useState('');
  const [editDialog, setEditDialog] = useState({ open: false, type: '', content: '' });

  const handleChange = (panel) => (event, newExpanded) => {
    setExpanded(newExpanded ? panel : false);
  };

  const handleEdit = async () => {
    try {
      const user = JSON.parse(localStorage.getItem("user"));
      if (!user?.id) throw new Error("User not found");

      await storyApiClient.put(`/plan/edit-${editDialog.type}/${storyId}`, {
        user_id: user.id,
        [`new_${editDialog.type}`]: editDialog.content,
      });

      toast.success("Updated successfully!");
      onUpdate();
      setEditDialog({ open: false, type: '', content: '' });
    } catch (error) {
      console.error("Error updating:", error);
      toast.error("Failed to update");
    }
  };

  const renderContent = (sectionId) => {
    const content = storyElements?.[sectionId];
    if (!content) return null;

    if (Array.isArray(content)) {
      return (
        <List dense disablePadding>
          {content.map((item, index) => (
            <ListItem 
              key={index}
              sx={{
                borderLeft: '2px solid',
                borderColor: 'rgba(255, 255, 255, 0.1)',
                '&:hover': {
                  borderColor: 'rgb(34 197 94)',
                  bgcolor: 'rgba(255, 255, 255, 0.05)',
                },
              }}
            >
              <ListItemText
                primary={item.name || item.title || item}
                secondary={item.description || null}
                primaryTypographyProps={{
                  sx: { color: 'white' }
                }}
                secondaryTypographyProps={{
                  sx: { color: 'grey.400' }
                }}
              />
            </ListItem>
          ))}
        </List>
      );
    }

    return (
      <Typography 
        variant="body2" 
        sx={{ 
          color: 'grey.300',
          whiteSpace: 'pre-wrap',
          lineHeight: 1.6,
        }}
      >
        {content}
      </Typography>
    );
  };

  const renderSectionHeader = (id, label, Icon) => (
    <Stack direction="row" spacing={1} alignItems="center" sx={{ width: '100%' }}>
      <Icon sx={{ color: 'grey.400' }} />
      <Typography sx={{ flex: 1 }}>{label}</Typography>
      {storyElements?.[id] && (
        <>
          <IconButton
            size="small"
            onClick={(e) => {
              e.stopPropagation();
              setEditDialog({
                open: true,
                type: id,
                content: storyElements[id],
              });
            }}
            sx={{ color: 'grey.400' }}
          >
            <EditIcon fontSize="small" />
          </IconButton>
          <Chip
            label={Array.isArray(storyElements[id]) ? 
              `${storyElements[id].length} items` : 
              'Added'
            }
            size="small"
            sx={{
              bgcolor: 'rgba(34, 197, 94, 0.2)',
              color: 'rgb(34 197 94)',
              height: 20,
            }}
          />
        </>
      )}
    </Stack>
  );

  const renderEditDialog = () => (
    <Dialog
      open={editDialog.open}
      onClose={() => setEditDialog({ open: false, type: '', content: '' })}
      maxWidth="sm"
      fullWidth
    >
      <DialogTitle>
        Edit {editDialog.type.charAt(0).toUpperCase() + editDialog.type.slice(1)}
      </DialogTitle>
      <DialogContent>
        <TextField
          fullWidth
          multiline
          rows={4}
          value={editDialog.content}
          onChange={(e) => setEditDialog({ ...editDialog, content: e.target.value })}
          sx={{ mt: 2 }}
        />
      </DialogContent>
      <DialogActions>
        <Button onClick={() => setEditDialog({ open: false, type: '', content: '' })}>
          Cancel
        </Button>
        <Button onClick={handleEdit} variant="contained">
          Save
        </Button>
      </DialogActions>
    </Dialog>
  );

  return (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      {/* Header */}
      <Box sx={{ p: 3, borderBottom: '1px solid rgba(255, 255, 255, 0.1)' }}>
        <Typography variant="h6" sx={{ color: 'white', fontWeight: 600 }}>
          Story Elements
        </Typography>
        <Typography variant="body2" sx={{ color: 'grey.400', mt: 1 }}>
          Reference your story's key elements while writing
        </Typography>
      </Box>

      {/* Elements */}
      <Box sx={{ flex: 1, overflow: 'auto', p: 2 }}>
        {sections.map(({ id, label, icon: Icon }) => (
          <Accordion
            key={id}
            expanded={expanded === id}
            onChange={handleChange(id)}
            sx={{
              bgcolor: 'transparent',
              color: 'white',
              backgroundImage: 'none',
              boxShadow: 'none',
              '&:before': { display: 'none' },
              '& .MuiAccordionSummary-root': {
                borderRadius: 1,
                '&:hover': {
                  bgcolor: 'rgba(255, 255, 255, 0.05)',
                },
              },
              '& .MuiAccordionSummary-expandIconWrapper': {
                color: 'grey.500',
              },
            }}
          >
            <AccordionSummary
              expandIcon={<ExpandMoreIcon />}
              sx={{ minHeight: 56 }}
            >
              {renderSectionHeader(id, label, Icon)}
            </AccordionSummary>
            <AccordionDetails sx={{ pt: 0 }}>
              {renderContent(id)}
            </AccordionDetails>
          </Accordion>
        ))}
      </Box>

      {/* Footer */}
      <Box sx={{ p: 2, borderTop: '1px solid rgba(255, 255, 255, 0.1)' }}>
        <Typography variant="caption" sx={{ color: 'grey.500' }}>
          Tip: Keep these elements in mind to maintain consistency in your story
        </Typography>
      </Box>

      {renderEditDialog()}
    </Box>
  );
} 