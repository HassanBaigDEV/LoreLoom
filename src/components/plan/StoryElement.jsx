import { useState } from "react";
import {
  TextField,
  Button,
  Typography,
  CircularProgress,
  IconButton,
  Card,
  CardContent,
  Collapse,
  Tooltip,
  Divider,
  Chip,
  ButtonGroup,
  SplitButton,
  MenuItem,
} from "@mui/material";
import { motion, AnimatePresence } from "framer-motion";
import AutoFixHighIcon from "@mui/icons-material/AutoFixHigh";
import EditIcon from "@mui/icons-material/Edit";
import SaveIcon from "@mui/icons-material/Save";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import toast from "react-hot-toast";
import TypewriterText from "@/components/common/TypewriterText";
import CharacterForm from "./CharacterForm";
import OutlineForm from "./OutlineForm";
import AddCircleOutlineIcon from "@mui/icons-material/AddCircleOutline";
import RefreshIcon from "@mui/icons-material/Refresh";
import DeleteIcon from "@mui/icons-material/Delete";
import ConfirmDialog from "@/components/common/ConfirmDialog";
import storyApiClient from "@/lib/storyApi";
import { useAtom } from "jotai";
import { storyDataAtom, storyLoadingAtom, storyErrorAtom } from "@/store/atoms";

export default function StoryElement({
  title,
  description,
  content,
  isFirst = false,
  isCharacters = false,
  isOutline = false,
  storyId,
}) {
  const [storyData, setStoryData] = useAtom(storyDataAtom);
  const [loading, setLoading] = useAtom(storyLoadingAtom);
  const [error, setError] = useAtom(storyErrorAtom);

  const [isEditing, setIsEditing] = useState(false);
  const [editedContent, setEditedContent] = useState(content);
  const [isExpanded, setIsExpanded] = useState(true);
  const [manualInput, setManualInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [loadingId, setLoadingId] = useState("");
  const [deleteConfirm, setDeleteConfirm] = useState({
    open: false,
    itemType: null,
    itemId: null,
    itemName: null,
  });

  const handleEdit = (content) => {
    setEditedContent(content);
    setIsEditing(true);
  };

  const handleSave = async () => {
    try {
      const user = JSON.parse(localStorage.getItem("user"));
      if (!user?.id) throw new Error("User not found");

      const params = { user_id: user.id };
      let response;

      if (isCharacters) {
        response = await storyApiClient.put(
          `/plan/edit-character/${storyId}`,
          {
            character_name: editedContent.name,
            updated_character: editedContent,
          },
          { params }
        );
      } else if (isOutline) {
        response = await storyApiClient.put(
          `/plan/edit-outline-point/${storyId}`,
          {
            point_number: editedContent.number,
            updated_point: editedContent,
          },
          { params }
        );
      } else {
        // For title, premise, and setting
        const fieldName = title.toLowerCase();
        response = await storyApiClient.put(
          `/plan/edit-${fieldName}/${storyId}`,
          {
            [`new_${fieldName}`]: editedContent,
          },
          { params }
        );
      }

      setStoryData((prev) => ({
        ...prev,
        [title.toLowerCase()]: isCharacters
          ? prev.characters.map((char) =>
              char.name === editedContent.name ? response.data.character : char
            )
          : isOutline
          ? prev.outline.map((point) =>
              point.number === editedContent.number
                ? response.data.outline_point
                : point
            )
          : response.data[title.toLowerCase()],
      }));

      setIsEditing(false);
      toast.success(`${title} updated successfully!`);
    } catch (error) {
      console.log(`Error updating ${title}:`, error);
      toast.error(`Failed to update ${title.toLowerCase()}`);
    }
  };

  const handleCancel = () => {
    setIsEditing(false);
    setEditedContent(content);
  };

  const handleGenerate = async () => {
    try {
      setLoadingId(title.toLowerCase());
      const user = JSON.parse(localStorage.getItem("user"));
      if (!user?.id) throw new Error("User not found");

      const response = await storyApiClient.get(
        `/plan/generate-${title.toLowerCase()}/${storyId}`,
        {
          params: { user_id: user.id },
        }
      );

      setStoryData((prev) => ({
        ...prev,
        [title.toLowerCase()]: response.data,
      }));

      setIsTyping(true);
      toast.success(`${title} generated successfully!`);
    } catch (error) {
      toast.error(error.message || `Failed to generate ${title.toLowerCase()}`);
    } finally {
      setLoadingId("");
    }
  };

  const handleRegenerate = async () => {
    try {
      setLoadingId(title.toLowerCase());
      await handleGenerate();
      toast.success(`${title} regenerated successfully!`);
    } catch (error) {
      toast.error(`Failed to regenerate ${title.toLowerCase()}`);
    } finally {
      setLoadingId("");
    }
  };

  const handleAddNew = async () => {
    try {
      const user = JSON.parse(localStorage.getItem("user"));
      if (!user?.id) throw new Error("User not found");

      const params = { user_id: user.id };

      if (isCharacters) {
        const newCharacter = {
          name: "",
          type: "character",
          role: "",
          physicalAppearance: "",
          behavioralPatterns: "",
          genderAndSexualOrientation: "",
          relationships: {},
          likesAndDislikes: { Likes: [], Dislikes: [] },
        };

        const response = await storyApiClient.post(
          `/plan/add-character/${storyId}`,
          {
            params,
            data: { new_character: newCharacter },
          }
        );

        setStoryData((prev) => ({
          ...prev,
          characters: [...prev.characters, response.data.character],
        }));
      } else if (isOutline) {
        const newPoint = {
          number: (content?.length || 0) + 1,
          title: "",
          description: "",
          purpose: "",
          setting: "",
          characters_involved: [],
          estimated_duration: "",
        };

        const response = await storyApiClient.post(
          `/plan/add-outline-point/${storyId}`,
          {
            params,
            data: {
              new_point: newPoint,
              position: content?.length || 0,
            },
          }
        );

        setStoryData((prev) => ({
          ...prev,
          outline: [...prev.outline, response.data.outline_point],
        }));
      }
    } catch (error) {
      console.error("Error adding new item:", error);
      toast.error("Failed to add new item");
    }
  };

  const handleDeleteClick = (itemType, itemId, itemName) => {
    setDeleteConfirm({
      open: true,
      itemType,
      itemId,
      itemName,
    });
  };

  const handleDeleteConfirm = async () => {
    const { itemType, itemId } = deleteConfirm;
    try {
      const user = JSON.parse(localStorage.getItem("user"));
      if (!user?.id) throw new Error("User not found");

      const params = { user_id: user.id };
      const data =
        itemType === "character"
          ? { character_name: itemId }
          : { point_number: itemId };

      await storyApiClient.delete(`/plan/delete-${itemType}/${storyId}`, {
        params,
        data,
      });

      setStoryData((prev) => ({
        ...prev,
        [itemType === "character" ? "characters" : "outline"]: prev[
          itemType === "character" ? "characters" : "outline"
        ].filter((item) =>
          itemType === "character"
            ? item.name !== itemId
            : item.number !== itemId
        ),
      }));

      toast.success(`${itemType} deleted successfully!`);
    } catch (error) {
      toast.error(`Failed to delete ${itemType}`);
      console.error(`Error deleting ${itemType}:`, error);
    } finally {
      setDeleteConfirm({
        open: false,
        itemType: null,
        itemId: null,
        itemName: null,
      });
    }
  };

  const handleManualSave = async () => {
    try {
      const user = JSON.parse(localStorage.getItem("user"));
      if (!user?.id) throw new Error("User not found");

      const fieldName = title.toLowerCase();
      const response = await storyApiClient.put(
        `/plan/edit-${fieldName}/${storyId}`,
        {
          [`new_${fieldName}`]: manualInput,
        },
        {
          params: { user_id: user.id },
        }
      );

      setStoryData((prev) => ({
        ...prev,
        [fieldName]: response.data[fieldName],
      }));

      setManualInput("");
      toast.success(`${title} saved successfully!`);
    } catch (error) {
      console.error(`Error saving ${title}:`, error);
      toast.error(`Failed to save ${title.toLowerCase()}`);
    }
  };

  const renderCharacterContent = () => {
    if (isEditing) {
      return (
        <CharacterForm
          initialData={editedContent}
          onSubmit={(updatedCharacter) => {
            handleSave(updatedCharacter);
          }}
        />
      );
    }

    return (
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {Array.isArray(content) ? (
          content.map((character, index) => (
            <Card
              key={index}
              className="p-4 hover:shadow-lg transition-shadow duration-300"
            >
              <div className="flex justify-between items-start">
                <Typography variant="h6" className="mb-2 text-gray-800">
                  {character.name}
                </Typography>
                <div className="flex space-x-1">
                  <IconButton
                    size="small"
                    onClick={() => handleEdit(character)}
                    className="text-gray-600"
                  >
                    <EditIcon fontSize="small" />
                  </IconButton>
                  <IconButton
                    size="small"
                    onClick={() =>
                      handleDeleteClick(
                        "character",
                        character.name,
                        character.name
                      )
                    }
                    className="text-red-500"
                  >
                    <DeleteIcon fontSize="small" />
                  </IconButton>
                </div>
              </div>

              <Typography
                variant="body2"
                color="textSecondary"
                className="mb-2"
              >
                {character.type} • {character.role}
              </Typography>

              <Divider className="my-2" />

              <Typography variant="subtitle2" className="mt-2 text-gray-700">
                Physical Appearance
              </Typography>
              <Typography variant="body2" className="mb-2 text-gray-600">
                {character.physicalAppearance}
              </Typography>

              <Typography variant="subtitle2" className="mt-2 text-gray-700">
                Behavioral Patterns
              </Typography>
              <Typography variant="body2" className="mb-2 text-gray-600">
                {character.behavioralPatterns}
              </Typography>

              <Typography variant="subtitle2" className="mt-2 text-gray-700">
                Gender & Orientation
              </Typography>
              <Typography variant="body2" className="mb-2 text-gray-600">
                {character.genderAndSexualOrientation}
              </Typography>

              <Divider className="my-2" />

              <Typography
                variant="subtitle2"
                className="mt-2 mb-1 text-gray-700"
              >
                Likes
              </Typography>
              <div className="flex flex-wrap gap-1 mb-2">
                {character.likesAndDislikes.Likes.map((like, i) => (
                  <Chip
                    key={i}
                    label={like}
                    size="small"
                    className="bg-green-50"
                  />
                ))}
              </div>

              <Typography
                variant="subtitle2"
                className="mt-2 mb-1 text-gray-700"
              >
                Dislikes
              </Typography>
              <div className="flex flex-wrap gap-1 mb-2">
                {character.likesAndDislikes.Dislikes.map((dislike, i) => (
                  <Chip
                    key={i}
                    label={dislike}
                    size="small"
                    className="bg-red-50"
                  />
                ))}
              </div>

              <Typography
                variant="subtitle2"
                className="mt-2 mb-1 text-gray-700"
              >
                Relationships
              </Typography>
              <div className="space-y-1">
                {Object.entries(character.relationships).map(
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
            </Card>
          ))
        ) : (
          <Typography color="error">No characters available</Typography>
        )}
      </div>
    );
  };

  const renderOutlineContent = () => {
    if (!Array.isArray(content)) return null;

    return (
      <div className="space-y-4">
        {content.map((point, index) => (
          <Card
            key={index}
            className="p-4 hover:shadow-lg transition-shadow duration-300"
          >
            <div className="flex justify-between items-start">
              <Typography variant="h6" className="text-gray-800">
                {point.number}. {point.title}
              </Typography>
              <div className="flex space-x-1">
                <IconButton
                  size="small"
                  onClick={() => handleEdit(point)}
                  className="text-gray-600"
                >
                  <EditIcon fontSize="small" />
                </IconButton>
                <IconButton
                  size="small"
                  onClick={() =>
                    handleDeleteClick(
                      "outline",
                      point.number,
                      `Point ${point.number}`
                    )
                  }
                  className="text-red-500"
                >
                  <DeleteIcon fontSize="small" />
                </IconButton>
              </div>
            </div>

            <Typography variant="body2" className="mt-2 text-gray-600">
              {point.description}
            </Typography>

            <Divider className="my-2" />

            <div className="grid grid-cols-2 gap-4 mt-2">
              <div>
                <Typography variant="subtitle2" className="text-gray-700">
                  Purpose
                </Typography>
                <Typography variant="body2" className="text-gray-600">
                  {point.purpose}
                </Typography>
              </div>

              <div>
                <Typography variant="subtitle2" className="text-gray-700">
                  Setting
                </Typography>
                <Typography variant="body2" className="text-gray-600">
                  {point.setting}
                </Typography>
              </div>
            </div>

            <div className="mt-2">
              <Typography variant="subtitle2" className="text-gray-700">
                Characters Involved
              </Typography>
              <div className="flex flex-wrap gap-1 mt-1">
                {point.characters_involved.map((character, i) => (
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
              Estimated Duration: {point.estimated_duration}
            </Typography>
          </Card>
        ))}
      </div>
    );
  };

  const renderGenerateOptions = () => {
    const options = [
      { label: "Generate with AI", handler: handleGenerate },
      { label: "Add Manually", handler: () => setIsEditing(true) },
    ];

    return (
      <div className="flex justify-between items-center">
        <ButtonGroup variant="contained" className="shadow-lg">
          <Button
            onClick={options[0].handler}
            className="bg-green-500 hover:bg-green-600"
            startIcon={<AutoFixHighIcon />}
          >
            {options[0].label}
          </Button>
          <Button
            className="bg-green-500 hover:bg-green-600 px-2"
            onClick={() => setIsEditing(true)}
          >
            {options[1].label}
          </Button>
        </ButtonGroup>
      </div>
    );
  };

  const renderRegenerateButton = () => (
    <Button
      variant="outlined"
      onClick={handleRegenerate}
      startIcon={<RefreshIcon />}
      className="mb-4 border-green-500 text-green-500 hover:border-green-600 hover:bg-green-50"
    >
      Regenerate {title}
    </Button>
  );

  const renderContent = () => {
    if (loading && loadingId === title.toLowerCase()) {
      return (
        <div className="flex flex-col items-center justify-center py-8">
          <CircularProgress size={40} className="text-green-500" />
          <Typography className="mt-4 text-gray-600">
            Generating {title}...
          </Typography>
        </div>
      );
    }

    if (!content) {
      return (
        <div className="space-y-4">
          {isCharacters || isOutline ? (
            renderGenerateOptions()
          ) : (
            <div className="space-y-4">
              <TextField
                fullWidth
                multiline
                rows={4}
                value={manualInput}
                onChange={(e) => setManualInput(e.target.value)}
                variant="outlined"
                placeholder={`Enter your ${title.toLowerCase()} or use AI to generate one`}
                className="bg-gray-50"
              />
              <div className="flex justify-between items-center">
                <Button
                  variant="outlined"
                  onClick={handleManualSave}
                  disabled={!manualInput}
                  className="px-6"
                >
                  Save Manual Input
                </Button>
                <Tooltip title={`Generate ${title} using AI`}>
                  <IconButton
                    onClick={handleGenerate}
                    className="bg-green-500 hover:bg-green-600 p-3 shadow-lg transform hover:scale-105 transition-all duration-200"
                    size="large"
                  >
                    <AutoFixHighIcon className="text-white" />
                  </IconButton>
                </Tooltip>
              </div>
            </div>
          )}
        </div>
      );
    }

    if (isCharacters) {
      if (isEditing) {
        return (
          <>
            {content && renderRegenerateButton()}
            <CharacterForm
              initialData={editedContent}
              onSubmit={handleSave}
              onCancel={handleCancel}
            />
          </>
        );
      }
      return renderCharacterContent();
    }

    if (isOutline) {
      if (isEditing) {
        return (
          <>
            {content && renderRegenerateButton()}
            <OutlineForm
              initialData={editedContent}
              onSubmit={handleSave}
              onCancel={handleCancel}
            />
          </>
        );
      }
      return renderOutlineContent();
    }

    // For title, premise, and setting
    if (isEditing) {
      return (
        <div className="space-y-4">
          {content && renderRegenerateButton()}
          <TextField
            fullWidth
            multiline
            rows={4}
            value={editedContent}
            onChange={(e) => setEditedContent(e.target.value)}
            variant="outlined"
            className="bg-gray-50"
          />
          <div className="flex justify-end space-x-2">
            <Button onClick={handleCancel} variant="outlined" color="secondary">
              Cancel
            </Button>
            <Button
              onClick={handleSave}
              variant="contained"
              className="bg-green-500 hover:bg-green-600"
              startIcon={<SaveIcon />}
            >
              Save
            </Button>
          </div>
        </div>
      );
    }

    return (
      <div className="relative bg-gray-50 p-4 rounded-lg">
        {isTyping ? (
          <TypewriterText
            text={
              typeof content === "string"
                ? content
                : JSON.stringify(content, null, 2)
            }
            onComplete={() => setIsTyping(false)}
          />
        ) : (
          <>
            <Typography variant="body1" className="whitespace-pre-line">
              {typeof content === "string"
                ? content
                : JSON.stringify(content, null, 2)}
            </Typography>
            <div className="absolute top-2 right-2 flex space-x-1">
              <IconButton
                onClick={handleRegenerate}
                size="small"
                className="text-green-500"
              >
                <RefreshIcon />
              </IconButton>
              <IconButton onClick={() => handleEdit(content)} size="small">
                <EditIcon />
              </IconButton>
            </div>
          </>
        )}
      </div>
    );
  };

  return (
    <>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -20 }}
        transition={{ duration: 0.5 }}
      >
        <Card className="border border-gray-200 hover:shadow-lg transition-shadow duration-300">
          <CardContent className="p-6">
            <div className="flex justify-between items-center mb-4">
              <div>
                <Typography
                  variant="h6"
                  className="text-gray-800 font-semibold"
                >
                  {title}
                </Typography>
                <Typography variant="body2" className="text-gray-600 mt-1">
                  {description}
                </Typography>
              </div>
              <IconButton
                onClick={() => setIsExpanded(!isExpanded)}
                className={`transform transition-transform ${
                  isExpanded ? "rotate-180" : ""
                }`}
              >
                <ExpandMoreIcon />
              </IconButton>
            </div>

            <Collapse in={isExpanded}>{renderContent()}</Collapse>
          </CardContent>
        </Card>

        {(isCharacters || isOutline) && content && !isEditing && (
          <div className="mt-4 flex justify-center">
            <Button
              variant="outlined"
              startIcon={<AddCircleOutlineIcon />}
              onClick={handleAddNew}
              className="text-green-500 border-green-500 hover:border-green-600"
            >
              Add New {isCharacters ? "Character" : "Outline Point"}
            </Button>
          </div>
        )}
      </motion.div>

      <ConfirmDialog
        open={deleteConfirm.open}
        title={`Delete ${deleteConfirm.itemType}`}
        content={`Are you sure you want to delete ${deleteConfirm.itemName}? This action cannot be undone.`}
        onConfirm={handleDeleteConfirm}
        onCancel={() =>
          setDeleteConfirm({
            open: false,
            itemType: null,
            itemId: null,
            itemName: null,
          })
        }
        confirmText="Delete"
        isDestructive={true}
      />
    </>
  );
}
