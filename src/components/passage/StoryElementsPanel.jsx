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
  Grid,
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
import { useRouter } from "next/navigation";

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
  const router = useRouter();
  const [expanded, setExpanded] = useState({});
  const [characterDialog, setCharacterDialog] = useState(null);
  const [selectedOutlinePoint, setSelectedOutlinePoint] = useState(null);
  const [outlineDialog, setOutlineDialog] = useState(null);

  const handleExpandToggle = (field) => {
    setExpanded((prev) => ({ ...prev, [field]: !prev[field] }));
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
                  setOutlineDialog(item);
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

  const CharacterForm = ({ initialData, onSubmit, onCancel }) => {
    // This function is no longer used
    return null;
  };

  const OutlineForm = ({ initialData, onSubmit, onCancel }) => {
    // This function is no longer used
    return null;
  };

  const renderEditDialog = () => {
    // This function is no longer used
    return null;
  };

  const renderCharacterDialog = () => (
    <Dialog
      open={characterDialog !== null}
      onClose={() => setCharacterDialog(null)}
      maxWidth="md"
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: 2,
          bgcolor: "background.paper",
        },
      }}
    >
      <DialogContent sx={{ p: 0 }}>
        <Card elevation={0}>
          <CardContent sx={{ p: 3 }}>
            <Typography variant="h5" className="mb-2 text-gray-800">
              {characterDialog?.name}
            </Typography>
            <Typography variant="body2" color="textSecondary" className="mb-2">
              {characterDialog?.type} • {characterDialog?.role}
            </Typography>

            <Divider className="my-2" />

            <Grid container spacing={2}>
              <Grid item xs={12} md={6}>
                <Typography variant="subtitle2" className="text-gray-700">
                  Physical Appearance
                </Typography>
                <Typography variant="body2" className="mb-2 text-gray-600">
                  {characterDialog?.physicalAppearance}
                </Typography>

                <Typography variant="subtitle2" className="text-gray-700">
                  Behavioral Patterns
                </Typography>
                <Typography variant="body2" className="mb-2 text-gray-600">
                  {characterDialog?.behavioralPatterns}
                </Typography>

                <Typography variant="subtitle2" className="text-gray-700">
                  Gender & Orientation
                </Typography>
                <Typography variant="body2" className="text-gray-600">
                  {characterDialog?.genderAndSexualOrientation}
                </Typography>
              </Grid>

              <Grid item xs={12} md={6}>
                <Typography variant="subtitle2" className="text-gray-700">
                  Likes
                </Typography>
                <div className="flex flex-wrap gap-1 mb-2">
                  {characterDialog?.likesAndDislikes?.Likes?.map((like, i) => (
                    <Chip
                      key={i}
                      label={like}
                      size="small"
                      className="bg-green-50"
                    />
                  ))}
                </div>

                <Typography variant="subtitle2" className="text-gray-700">
                  Dislikes
                </Typography>
                <div className="flex flex-wrap gap-1 mb-2">
                  {characterDialog?.likesAndDislikes?.Dislikes?.map(
                    (dislike, i) => (
                      <Chip
                        key={i}
                        label={dislike}
                        size="small"
                        className="bg-red-50"
                      />
                    )
                  )}
                </div>

                <Typography variant="subtitle2" className="text-gray-700">
                  Relationships
                </Typography>
                <div className="space-y-1">
                  {Object.entries(characterDialog?.relationships || {}).map(
                    ([name, relation]) => (
                      <Typography
                        key={name}
                        variant="body2"
                        className="text-gray-600"
                      >
                        <span className="font-medium">{name}</span>: {relation}
                      </Typography>
                    )
                  )}
                </div>
              </Grid>
            </Grid>

            {characterDialog?.background && (
              <>
                <Divider className="my-2" />
                <Typography variant="subtitle2" className="text-gray-700">
                  Background
                </Typography>
                <Typography variant="body2" className="text-gray-600">
                  {characterDialog.background}
                </Typography>
              </>
            )}
          </CardContent>
        </Card>
      </DialogContent>
    </Dialog>
  );

  const renderOutlineDialog = () => (
    <Dialog
      open={outlineDialog !== null}
      onClose={() => setOutlineDialog(null)}
      maxWidth="md"
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: 2,
          bgcolor: "background.paper",
        },
      }}
    >
      <DialogContent sx={{ p: 0 }}>
        <Card elevation={0}>
          <CardContent sx={{ p: 3 }}>
            <Typography variant="h5" className="mb-2 text-gray-800">
              {outlineDialog?.number}. {outlineDialog?.title}
            </Typography>
            <Typography variant="body2" className="mt-2 text-gray-600">
              {outlineDialog?.description}
            </Typography>

            <Divider className="my-2" />

            <Grid container spacing={2}>
              <Grid item xs={12} md={6}>
                <Typography variant="subtitle2" className="text-gray-700">
                  Purpose
                </Typography>
                <Typography variant="body2" className="text-gray-600">
                  {outlineDialog?.purpose}
                </Typography>
              </Grid>

              <Grid item xs={12} md={6}>
                <Typography variant="subtitle2" className="text-gray-700">
                  Setting
                </Typography>
                <Typography variant="body2" className="text-gray-600">
                  {outlineDialog?.setting}
                </Typography>
              </Grid>
            </Grid>

            <div className="mt-2">
              <Typography variant="subtitle2" className="text-gray-700">
                Characters Involved
              </Typography>
              <div className="flex flex-wrap gap-1 mt-1">
                {outlineDialog?.characters_involved?.map((character, i) => (
                  <Chip
                    key={i}
                    label={character}
                    size="small"
                    className="bg-blue-50"
                  />
                ))}
              </div>
            </div>

            <Typography variant="body2" className="mt-2 text-gray-500">
              Estimated Duration: {outlineDialog?.estimated_duration}
            </Typography>
          </CardContent>
        </Card>
      </DialogContent>
    </Dialog>
  );

  const renderHeader = () => (
    <Box
      component="a"
      href={`/create/plan/${storyId}`}
      target="_blank"
      rel="noopener noreferrer"
      sx={{
        p: 3,
        borderBottom: "1px solid rgba(255, 255, 255, 0.1)",
        cursor: "pointer",
        textDecoration: "none",
        "&:hover": {
          backgroundColor: "rgba(255, 255, 255, 0.05)",
        },
      }}
    >
      <Typography variant="h6" sx={{ color: "white", fontWeight: 600 }}>
        Story Elements
      </Typography>
      <Typography variant="body2" sx={{ color: "grey.400", mt: 1 }}>
        Click to manage story elements (opens in new tab)
      </Typography>
    </Box>
  );

  return (
    <Box sx={{ height: "100%", display: "flex", flexDirection: "column" }}>
      {renderHeader()}

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
              {renderContent(id)}
            </AccordionDetails>
          </Accordion>
        ))}
      </Box>

      {renderCharacterDialog()}
      {renderOutlineDialog()}
    </Box>
  );
}
