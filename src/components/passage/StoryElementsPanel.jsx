"use client";
import React, { useState, useCallback } from "react";
import {
  Box,
  Typography,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
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
  Collapse,
  Card,
  CardContent,
  CircularProgress,
  Paper,
} from "@mui/material";
import {
  ExpandMore as ExpandMoreIcon,
  Edit as EditIcon,
  Title as TitleIcon,
  Description as DescriptionIcon,
  LocationOn as LocationIcon,
  People as PeopleIcon,
  FormatListBulleted as OutlineIcon,
  Save as SaveIcon,
  ExpandLess as ExpandLessIcon,
  Refresh as RefreshIcon,
  Delete as DeleteIcon,
} from "@mui/icons-material";
import storyApiClient from "@/lib/storyApi";
import { toast } from "react-hot-toast";

const sections = [
  { id: "title", label: "Title", icon: TitleIcon },
  { id: "premise", label: "Premise", icon: DescriptionIcon },
  { id: "setting", label: "Setting", icon: LocationIcon },
  { id: "characters", label: "Characters", icon: PeopleIcon },
  { id: "outline", label: "Outline", icon: OutlineIcon },
];

export default function StoryElementsPanel({
  storyElements,
  onUpdate,
  storyId,
}) {
  const [editing, setEditing] = useState(null);
  const [expanded, setExpanded] = useState({});
  const [formData, setFormData] = useState({
    title: storyElements?.title || "",
    premise: storyElements?.premise || "",
    setting: storyElements?.setting || "",
    characters: storyElements?.characters || [],
    outline: storyElements?.outline || [],
  });
  const [characterDialog, setCharacterDialog] = useState(null);
  const [loadingId, setLoadingId] = useState(null);
  const [selectedOutlinePoint, setSelectedOutlinePoint] = useState(null);

  const handleEditToggle = (field) => {
    setEditing(editing === field ? null : field);
  };

  const handleExpandToggle = (field) => {
    setExpanded((prev) => ({ ...prev, [field]: !prev[field] }));
  };

  const handleInputChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleSave = async (field) => {
    try {
      const user = JSON.parse(localStorage.getItem("user"));
      if (!user?.id) throw new Error("User not found");

      let response;
      switch (field) {
        case "title":
          response = await storyApiClient.put(
            `/plan/edit-title/${storyId}`,
            {
              new_title: formData[field],
            },
            {
              params: { user_id: user.id },
            }
          );
          break;
        case "premise":
          response = await storyApiClient.put(
            `/plan/edit-premise/${storyId}`,
            {
              new_premise: formData[field],
            },
            {
              params: { user_id: user.id },
            }
          );
          break;
        case "setting":
          response = await storyApiClient.put(
            `/plan/edit-setting/${storyId}`,
            {
              new_setting: formData[field],
            },
            {
              params: { user_id: user.id },
            }
          );
          break;
        case "characters":
          if (!characterDialog) return;
          response = await storyApiClient.put(
            `/plan/edit-character/${storyId}`,
            {
              character_name: characterDialog.name,
              updated_character: {
                ...characterDialog,
                ...formData[field],
              },
            },
            {
              params: { user_id: user.id },
            }
          );
          break;
        case "outline":
          if (!selectedOutlinePoint) return;
          response = await storyApiClient.put(
            `/plan/edit-outline-point/${storyId}`,
            {
              point_number: selectedOutlinePoint.number,
              updated_point: {
                ...selectedOutlinePoint,
                ...formData[field],
              },
            },
            {
              params: { user_id: user.id },
            }
          );
          break;
        default:
          throw new Error("Invalid field type");
      }

      toast.success(
        `${field.charAt(0).toUpperCase() + field.slice(1)} updated!`
      );
      onUpdate();
      setEditing(null);
      setCharacterDialog(null);
      setSelectedOutlinePoint(null);
    } catch (error) {
      console.error(`Error updating ${field}:`, error);
      toast.error(`Failed to update ${field}`);
    }
  };

  const handleCharacterRegenerate = async (characterName) => {
    setLoadingId(`character-${characterName}`);
    try {
      const user = JSON.parse(localStorage.getItem("user"));
      if (!user?.id) throw new Error("User not found");

      await storyApiClient.post(`/plan/regenerate-character/${storyId}`, null, {
        params: {
          user_id: user.id,
          character_name: characterName,
        },
      });

      toast.success("Character regenerated!");
      onUpdate();
    } catch (error) {
      console.error("Error regenerating character:", error);
      toast.error("Failed to regenerate character");
    } finally {
      setLoadingId(null);
    }
  };

  const handleDeleteCharacter = async (characterName) => {
    try {
      const user = JSON.parse(localStorage.getItem("user"));
      if (!user?.id) throw new Error("User not found");

      await storyApiClient.delete(`/plan/character/${storyId}`, {
        params: {
          user_id: user.id,
          character_name: characterName,
        },
      });

      toast.success("Character deleted!");
      onUpdate();
      setCharacterDialog(null);
    } catch (error) {
      console.error("Error deleting character:", error);
      toast.error("Failed to delete character");
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
                borderLeft: "2px solid",
                borderColor: "rgba(255, 255, 255, 0.1)",
                "&:hover": {
                  borderColor: "rgb(34 197 94)",
                  bgcolor: "rgba(255, 255, 255, 0.05)",
                },
              }}
              button
              onClick={() => {
                if (sectionId === "characters") {
                  setCharacterDialog(item);
                } else if (sectionId === "outline") {
                  setSelectedOutlinePoint(item);
                  setEditing("outline");
                }
              }}
            >
              <ListItemText
                primary={
                  item.name ||
                  item.title ||
                  `Point ${item.number}: ${item.content}`
                }
                secondary={item.description || null}
                primaryTypographyProps={{
                  sx: { color: "white" },
                }}
                secondaryTypographyProps={{
                  sx: { color: "grey.400" },
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
          color: "grey.300",
          whiteSpace: "pre-wrap",
          lineHeight: 1.6,
        }}
      >
        {content}
      </Typography>
    );
  };

  const renderSectionHeader = (id, label, Icon) => (
    <Stack
      direction="row"
      spacing={1}
      alignItems="center"
      sx={{ width: "100%" }}
    >
      <Icon sx={{ color: "grey.400" }} />
      <Typography sx={{ flex: 1 }}>{label}</Typography>
      {storyElements?.[id] && (
        <>
          <IconButton
            size="small"
            onClick={(e) => {
              e.stopPropagation();
              setEditing(id);
            }}
            sx={{ color: "grey.400" }}
          >
            <EditIcon fontSize="small" />
          </IconButton>
          <Chip
            label={
              Array.isArray(storyElements[id])
                ? `${storyElements[id].length} items`
                : "Added"
            }
            size="small"
            sx={{
              bgcolor: "rgba(34, 197, 94, 0.2)",
              color: "rgb(34 197 94)",
              height: 20,
            }}
          />
        </>
      )}
    </Stack>
  );

  const renderEditDialog = () => {
    if (!editing) return null;

    let dialogContent;
    if (editing === "characters" && characterDialog) {
      dialogContent = (
        <Box sx={{ mt: 2 }}>
          <TextField
            fullWidth
            label="Name"
            value={formData.characters.name || characterDialog.name}
            onChange={(e) =>
              handleInputChange("characters", {
                ...characterDialog,
                name: e.target.value,
              })
            }
            sx={{ mb: 2 }}
          />
          <TextField
            fullWidth
            multiline
            rows={4}
            label="Description"
            value={
              formData.characters.description || characterDialog.description
            }
            onChange={(e) =>
              handleInputChange("characters", {
                ...characterDialog,
                description: e.target.value,
              })
            }
            sx={{ mb: 2 }}
          />
          {/* Add other character fields as needed */}
        </Box>
      );
    } else if (editing === "outline" && selectedOutlinePoint) {
      dialogContent = (
        <TextField
          fullWidth
          multiline
          rows={4}
          label={`Point ${selectedOutlinePoint.number}`}
          value={formData.outline || selectedOutlinePoint.content}
          onChange={(e) =>
            handleInputChange("outline", {
              ...selectedOutlinePoint,
              content: e.target.value,
            })
          }
          sx={{ mt: 2 }}
        />
      );
    } else {
      dialogContent = (
        <TextField
          fullWidth
          multiline
          rows={4}
          value={formData[editing]}
          onChange={(e) => handleInputChange(editing, e.target.value)}
          sx={{ mt: 2 }}
        />
      );
    }

    return (
      <Dialog
        open={editing !== null}
        onClose={() => {
          setEditing(null);
          setSelectedOutlinePoint(null);
        }}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>
          Edit {editing?.charAt(0).toUpperCase() + editing?.slice(1)}
        </DialogTitle>
        <DialogContent>{dialogContent}</DialogContent>
        <DialogActions>
          <Button
            onClick={() => {
              setEditing(null);
              setSelectedOutlinePoint(null);
            }}
          >
            Cancel
          </Button>
          <Button onClick={() => handleSave(editing)} variant="contained">
            Save
          </Button>
        </DialogActions>
      </Dialog>
    );
  };

  const renderCharacterDialog = () => (
    <Dialog
      open={characterDialog !== null}
      onClose={() => setCharacterDialog(null)}
      maxWidth="sm"
      fullWidth
      PaperProps={{
        sx: {
          bgcolor: "white",
          borderRadius: 2,
        },
      }}
    >
      <DialogContent sx={{ p: 0 }}>
        <Card elevation={0}>
          <CardContent>
            <div className="flex items-start justify-between">
              <Typography variant="h6" className="mb-2 text-gray-800">
                {characterDialog?.name}
              </Typography>
              <div className="flex space-x-1">
                <IconButton
                  size="small"
                  onClick={() =>
                    handleCharacterRegenerate(characterDialog?.name)
                  }
                  className="text-gray-600"
                  disabled={loadingId === `character-${characterDialog?.name}`}
                >
                  {loadingId === `character-${characterDialog?.name}` ? (
                    <CircularProgress size={20} />
                  ) : (
                    <RefreshIcon fontSize="small" />
                  )}
                </IconButton>
                <IconButton
                  size="small"
                  onClick={() => setEditing("characters")}
                  className="text-gray-600"
                >
                  <EditIcon fontSize="small" />
                </IconButton>
                <IconButton
                  size="small"
                  onClick={() => handleDeleteCharacter(characterDialog?.name)}
                  className="text-red-500"
                >
                  <DeleteIcon fontSize="small" />
                </IconButton>
              </div>
            </div>
            <Typography
              variant="body2"
              className="mt-2 text-gray-600"
              sx={{ whiteSpace: "pre-wrap" }}
            >
              {characterDialog?.description}
            </Typography>
            {characterDialog?.personality && (
              <>
                <Typography variant="subtitle2" className="mt-4 text-gray-700">
                  Personality
                </Typography>
                <Typography variant="body2" className="text-gray-600">
                  {characterDialog?.personality}
                </Typography>
              </>
            )}
            {characterDialog?.background && (
              <>
                <Typography variant="subtitle2" className="mt-4 text-gray-700">
                  Background
                </Typography>
                <Typography variant="body2" className="text-gray-600">
                  {characterDialog?.background}
                </Typography>
              </>
            )}
            {characterDialog?.goals && (
              <>
                <Typography variant="subtitle2" className="mt-4 text-gray-700">
                  Goals
                </Typography>
                <Typography variant="body2" className="text-gray-600">
                  {characterDialog?.goals}
                </Typography>
              </>
            )}
          </CardContent>
        </Card>
      </DialogContent>
    </Dialog>
  );

  return (
    <Box sx={{ height: "100%", display: "flex", flexDirection: "column" }}>
      {/* Header */}
      <Box sx={{ p: 3, borderBottom: "1px solid rgba(255, 255, 255, 0.1)" }}>
        <Typography variant="h6" sx={{ color: "white", fontWeight: 600 }}>
          Story Elements
        </Typography>
        <Typography variant="body2" sx={{ color: "grey.400", mt: 1 }}>
          Reference your story's key elements while writing
        </Typography>
      </Box>

      {/* Elements */}
      <Box sx={{ flex: 1, overflow: "auto", p: 2 }}>
        {sections.map(({ id, label, icon: Icon }) => (
          <Accordion
            key={id}
            expanded={expanded[id]}
            onChange={() => handleExpandToggle(id)}
            sx={{
              bgcolor: "transparent",
              color: "white",
              backgroundImage: "none",
              boxShadow: "none",
              "&:before": { display: "none" },
              "& .MuiAccordionSummary-root": {
                borderRadius: 1,
                "&:hover": {
                  bgcolor: "rgba(255, 255, 255, 0.05)",
                },
              },
              "& .MuiAccordionSummary-expandIconWrapper": {
                color: "grey.500",
              },
            }}
          >
            <AccordionSummary
              expandIcon={
                expanded[id] ? <ExpandLessIcon /> : <ExpandMoreIcon />
              }
              sx={{ minHeight: 56 }}
            >
              {renderSectionHeader(id, label, Icon)}
            </AccordionSummary>
            <AccordionDetails sx={{ pt: 0 }}>
              {editing === id ? renderContent(id) : renderContent(id)}
            </AccordionDetails>
          </Accordion>
        ))}
      </Box>

      {/* Footer */}
      <Box sx={{ p: 2, borderTop: "1px solid rgba(255, 255, 255, 0.1)" }}>
        <Typography variant="caption" sx={{ color: "grey.500" }}>
          Tip: Keep these elements in mind to maintain consistency in your story
        </Typography>
      </Box>

      {renderEditDialog()}
      {renderCharacterDialog()}
    </Box>
  );
}
