import { useState, useEffect } from "react";
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
  Switch,
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import AddIcon from "@mui/icons-material/Add";
import CheckIcon from "@mui/icons-material/Check";

export default function StoryElement({
  title,
  description,
  content,
  isFirst = false,
  isCharacters = false,
  isOutline = false,
  storyId,
  onUpdate,
}) {
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
  const [loadingMessage, setLoadingMessage] = useState("");
  const [showOptions, setShowOptions] = useState(false);
  const [pointCount, setPointCount] = useState(1);
  const [selectedOption, setSelectedOption] = useState(null);
  const [count, setCount] = useState(1);
  const [localLoading, setLocalLoading] = useState(false);

  useEffect(() => {
    setEditedContent(content);
  }, [content]);

  const handleEdit = (content) => {
    setEditedContent(content);
    setIsEditing(true);
  };

  const handleSave = async (formData) => {
    try {
      setLocalLoading(true);
      const user = JSON.parse(localStorage.getItem("user"));
      if (!user?.id) throw new Error("User not found");

      if (title === "Title") {
        const response = await storyApiClient.put(
          `/plan/update-title/${storyId}`,
          {
            title: formData,
          },
          { params: { user_id: user?.id } }
        );

        setEditedContent(formData);
        onUpdate("title", formData);
        toast.success("Title updated successfully!");
      } else if (isCharacters) {
        const isNewCharacter = !content.some(
          (char) => char.name === formData.name
        );

        if (!formData.name?.trim() || !formData.role?.trim()) {
          toast.error("Name and Role are required fields");
          return;
        }

          const response = await (isNewCharacter
            ? storyApiClient.post(`/plan/add-character/${storyId}`, {
                new_character: formData
              }, { params: { user_id: user?.id } })
            : storyApiClient.put(`/plan/update-character/${storyId}`, {
                character_name: formData.name,
                updated_character: formData
              }, { params: { user_id: user?.id } })
          );

          const updatedItem = response.data.character;

        const updatedCharacters = isNewCharacter
          ? [...(content || []), updatedItem]
          : (content || []).map((c) =>
              c.name === updatedItem.name ? updatedItem : c
            );
        
        onUpdate("characters", updatedCharacters);
        toast.success(
          `Character ${isNewCharacter ? "added" : "updated"} successfully!`
        );

      } else if (isOutline) {
        const isNewPoint = !content.some(
          (point) => point.number === formData.number
        );

        if (!formData.title?.trim() || !formData.description?.trim()) {
          toast.error("Title and Description are required fields");
          return;
        }

          const response = await (isNewPoint
            ? storyApiClient.post(`/plan/add-outline-point/${storyId}`, {
                new_point: { ...formData, number: String(formData.number) },
                position: content?.length || 0,
              }, { params: { user_id: user?.id } })
            : storyApiClient.put(`/plan/update-outline-point/${storyId}`, {
                point_number: String(formData.number),
                updated_point: { ...formData, number: String(formData.number) },
              }, { params: { user_id: user?.id } })
          );

          const updatedItem = response.data.outline_point;

        const updatedOutline = isNewPoint
          ? [...(content || []), updatedItem]
          : (content || []).map((p) =>
              p.number === updatedItem.number ? updatedItem : p
            );
        
        onUpdate("outline", updatedOutline);
        toast.success(
          `Outline point ${isNewPoint ? "added" : "updated"} successfully!`
        );

      } else {
        const field = title.toLowerCase();
        const response = await storyApiClient.put(
          `/plan/update-${field}/${storyId}`,
          {
            [`new_${field}`]: formData,
          },
          { params: { user_id: user?.id } }
        );

        // Update the local state with the new content
        setEditedContent(formData);
        // Call onUpdate with the field name and the new content
        onUpdate(field, formData);
        toast.success(`${title} updated successfully!`);
      }

      setIsEditing(false);
    } catch (error) {
      console.error("Error saving changes:", error);
      toast.error("Failed to save changes");
    } finally {
      setLocalLoading(false);
      setLoadingId("");
    }
  };

  const handleCancel = () => {
    setIsEditing(false);
    setEditedContent(null);
  };

  const handleGenerate = async () => {
    try {
      setLoadingId(title.toLowerCase());
      const user = JSON.parse(localStorage.getItem("user"));
      if (!user?.id) throw new Error("User not found");

      const response = await storyApiClient.get(
        `/plan/generate-${title.toLowerCase()}/${storyId}`,
        {
          params: { user_id: user?.id },
        }
      );

      onUpdate(title.toLowerCase(), response.data);
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
      if (isOutline) {
        const newPoint = {
          number: content.length + 1,
          title: "",
          description: "",
          purpose: "",
          setting: "",
          characters_involved: [],
          estimated_duration: "",
        };
        setEditedContent(newPoint);
        setIsEditing(true);
      } else if (isCharacters) {
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
        setEditedContent(newCharacter);
      }

      setIsEditing(true);
    } catch (error) {
      console.error("Error adding new character:", error);
      toast.error("Failed to add new character");
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

      const params = { user_id: user?.id };
      const data =
        itemType === "character"
          ? { character_name: itemId }
          : { point_number: itemId };

      await storyApiClient.delete(`/plan/delete-${itemType}/${storyId}`, {
        params,
        data,
      });

      onUpdate(itemType, (prev => prev.filter((item) =>
          itemType === "character"
            ? item.name !== itemId
            : item.number !== itemId
      )));

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
        `/plan/update-${fieldName}/${storyId}`,
        {
          [`new_${fieldName}`]: manualInput,
        },
        {
          params: { user_id: user?.id },
        }
      );

      setEditedContent(manualInput);
      onUpdate(fieldName, manualInput);
      setManualInput("");
      toast.success(`${title} saved successfully!`);
    } catch (error) {
      console.error(`Error saving ${title}:`, error);
      toast.error(`Failed to save ${title.toLowerCase()}`);
    }
  };

  const handleCharacterRegenerate = async (characterName) => {
    try {
      setLoadingId(`character-${characterName}`);
      const user = JSON.parse(localStorage.getItem("user"));
      if (!user?.id) throw new Error("User not found");

      const response = await storyApiClient.post(
        `/plan/regenerate-character/${storyId}`,
        {
          character_name: characterName,
        },
        { params: { user_id: user?.id } }
      );

      onUpdate("characters", (prev => prev.map((char) =>
          char.name === characterName ? response.data.character : char
      )));
      toast.success(`Character ${characterName} regenerated successfully!`);
    } catch (error) {
      console.error(`Error regenerating character ${characterName}:`, error);
      toast.error(`Failed to regenerate character ${characterName}`);
    } finally {
      setLoadingId("");
    }
  };

  const handleOptionSelect = (option) => {
    setSelectedOption(option);
    if (option === "manual") {
      handleAddNew();
      setShowOptions(false);
    } else if (option === "generateOne") {
      if (isCharacters) {
        handleGenerateMultipleCharacters(1);
      } else if (isOutline) {
        handleGenerateMultiplePoints(1, true);
      }
      setShowOptions(false);
    }
  };

  const handleGenerateMany = () => {
    if (isCharacters) handleGenerateMultipleCharacters(count);
    else if (isOutline) handleGenerateMultiplePoints(pointCount, true);
    setCount(1);
    setPointCount(1);
    setShowOptions(false);
    setSelectedOption(null);
  };

  const renderCharacterContent = () => {
    if (isEditing) {
      isCharacters ? (
        <CharacterForm
          initialData={editedContent}
          onSubmit={(updatedCharacter) => {
            handleSave(updatedCharacter);
          }}
        />
      ) : (
        <OutlineForm
          initialData={editedContent}
          onSubmit={(formData) => {
            handleSave(formData);
          }}
          onCancel={() => {
            setIsEditing(false);
            setEditedContent(null);
            setShowOptions(false);
          }}
        />
      );
    }

    return (
      <div className="space-y-4">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          {Array.isArray(content) ? (
            content.map((character, index) => (
              <Card
                key={index}
                className="p-4 transition-shadow duration-300 hover:shadow-lg"
              >
                <div className="flex items-start justify-between">
                  <Typography variant="h6" className="mb-2 text-gray-800">
                    {character?.name}
                  </Typography>
                  <div className="flex space-x-1">
                    <IconButton
                      size="small"
                      onClick={() => handleCharacterRegenerate(character?.name)}
                      className="text-gray-600"
                      disabled={loadingId === `character-${character?.name}`}
                    >
                      {loadingId === `character-${character?.name}` ? (
                        <CircularProgress size={20} />
                      ) : (
                        <RefreshIcon fontSize="small" />
                      )}
                    </IconButton>
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
                          character?.name,
                          character?.name
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
                  {character?.type} • {character?.role}
                </Typography>

                <Divider className="my-2" />

                <Typography variant="subtitle2" className="mt-2 text-gray-700">
                  Physical Appearance
                </Typography>
                <Typography variant="body2" className="mb-2 text-gray-600">
                  {character?.physicalAppearance}
                </Typography>

                <Typography variant="subtitle2" className="mt-2 text-gray-700">
                  Behavioral Patterns
                </Typography>
                <Typography variant="body2" className="mb-2 text-gray-600">
                  {character?.behavioralPatterns}
                </Typography>

                <Typography variant="subtitle2" className="mt-2 text-gray-700">
                  Gender & Orientation
                </Typography>
                <Typography variant="body2" className="mb-2 text-gray-600">
                  {character?.genderAndSexualOrientation}
                </Typography>

                <Divider className="my-2" />

                <Typography
                  variant="subtitle2"
                  className="mt-2 mb-1 text-gray-700"
                >
                  Likes
                </Typography>
                <div className="flex flex-wrap gap-1 mb-2">
                  {character?.likesAndDislikes?.Likes?.map((like, i) => (
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
                  {character?.likesAndDislikes?.Dislikes?.map((dislike, i) => (
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
                  {Object.entries(character?.relationships).map(
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

        <div className="flex flex-col items-center space-y-4">
          {!showOptions ? (
            <Button
              variant="outlined"
              className="px-6 py-2 text-green-600 border-2 border-green-500 hover:bg-green-50"
              onClick={() => {
                setShowOptions(true);
              }}
              startIcon={<AddIcon />}
            >
              ADD NEW CHARACTER
            </Button>
          ) : (
            <div className="flex flex-col items-center w-full max-w-md space-y-4">
              {selectedOption === "generateMany" && (
                <div className="flex items-center justify-center mb-2 space-x-2">
                  <IconButton
                    size="small"
                    onClick={() => setCount(Math.max(1, count - 1))}
                    disabled={count <= 1}
                  >
                    -
                  </IconButton>
                  <Typography
                    variant="body1"
                    className="mx-2 min-w-[20px] text-center"
                  >
                    {count}
                  </Typography>
                  <IconButton
                    size="small"
                    onClick={() => setCount(Math.min(5, count + 1))}
                    disabled={count >= 5}
                  >
                    +
                  </IconButton>
                  {selectedOption === "generateMany" && (
                    <IconButton
                      color="primary"
                      onClick={handleGenerateMany}
                      className="ml-2"
                    >
                      <CheckIcon />
                    </IconButton>
                  )}
                </div>
              )}

              <div className="flex justify-center space-x-2">
                <Button
                  variant={
                    selectedOption === "manual" ? "contained" : "outlined"
                  }
                  onClick={() => handleOptionSelect("manual")}
                  startIcon={<EditIcon />}
                  className={
                    selectedOption === "manual"
                      ? "bg-green-500 hover:bg-green-600"
                      : ""
                  }
                >
                  Manual
                </Button>
                <Button
                  variant={
                    selectedOption === "generateOne" ? "contained" : "outlined"
                  }
                  onClick={() => handleOptionSelect("generateOne")}
                  startIcon={<AutoFixHighIcon />}
                  className={
                    selectedOption === "generateOne"
                      ? "bg-green-500 hover:bg-green-600"
                      : ""
                  }
                >
                  Generate One
                </Button>
                <Button
                  variant={
                    selectedOption === "generateMany" ? "contained" : "outlined"
                  }
                  onClick={() => handleOptionSelect("generateMany")}
                  startIcon={<AutoFixHighIcon />}
                  className={
                    selectedOption === "generateMany"
                      ? "bg-green-500 hover:bg-green-600"
                      : ""
                  }
                >
                  Generate Many
                </Button>
              </div>

              <Button
                variant="text"
                color="error"
                onClick={() => {
                  setShowOptions(false);
                  setSelectedOption(null);
                }}
                className="mt-2"
              >
                CANCEL
              </Button>
            </div>
          )}
        </div>
      </div>
    );
  };

  const renderOutlineContent = () => {
    if (!Array.isArray(content)) return null;

    const handlePointRegenerate = async (pointNumber) => {
      try {
        setLoadingId(`outline-${pointNumber}`);
        const user = JSON.parse(localStorage.getItem("user"));
        if (!user?.id) throw new Error("User not found");

        const response = await storyApiClient.post(
          `/plan/regenerate-outline-point/${storyId}`,
          {
            point_number: pointNumber,
          },
          {
            params: { user_id: user?.id },
          }
        );

        onUpdate("outline", (prev => prev.map((point) =>
            point.number === pointNumber ? response.data.outline_point : point
        )));

        toast.success(`Point ${pointNumber} regenerated successfully!`);
      } catch (error) {
        console.error(`Error regenerating point ${pointNumber}:`, error);
        toast.error(`Failed to regenerate point ${pointNumber}`);
      } finally {
        setLoadingId("");
      }
    };

    const handleGenerateMany = () => {
      if (isOutline) {
        handleGenerateMultiplePoints(pointCount, true);
      } else if (isCharacters) {
        handleGenerateMultipleCharacters(count);
      }
      setShowOptions(false);
      setSelectedOption(null);
    };

    if (isEditing) {
      return (
        <OutlineForm
          initialData={editedContent}
          onSubmit={(formData) => {
            handleSave(formData);
          }}
          onCancel={() => {
            setIsEditing(false);
            setEditedContent(null);
            setShowOptions(false);
          }}
        />
      );
    }

    return (
      <div className="space-y-4">
        {content.map((point, index) => (
          <Card
            key={index}
            className="p-4 transition-shadow duration-300 hover:shadow-lg"
          >
            <div className="flex flex-wrap items-start justify-between gap-2">
              <Typography variant="h6" className="text-gray-800">
                {point.number}. {point.title}
              </Typography>
              <div className="flex space-x-1">
                <IconButton
                  size="small"
                  onClick={() => handlePointRegenerate(point.number)}
                  className="text-gray-600"
                  disabled={loadingId === `outline-${point.number}`}
                >
                  {loadingId === `outline-${point.number}` ? (
                    <CircularProgress size={20} />
                  ) : (
                    <Tooltip title="Regenerate this point">
                      <RefreshIcon fontSize="small" />
                    </Tooltip>
                  )}
                </IconButton>
                <IconButton
                  size="small"
                  onClick={() => handleEdit(point)}
                  className="text-gray-600"
                >
                  <Tooltip title="Edit this point">
                    <EditIcon fontSize="small" />
                  </Tooltip>
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
                  <Tooltip title="Delete this point">
                    <DeleteIcon fontSize="small" />
                  </Tooltip>
                </IconButton>
              </div>
            </div>

            <Typography variant="body2" className="mt-2 text-gray-600">
              {point.description}
            </Typography>

            <Divider className="my-2" />

            <div className="grid grid-cols-1 gap-4 mt-2 md:grid-cols-2">
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
                {point?.characters_involved?.map((character, i) => (
                  <Chip
                    key={i}
                    label={character}
                    size="small"
                    className="bg-blue-50"
                  />
                ))}
                {point?.characters_involved?.length === 0 && (
                  <Typography variant="body2" className="italic text-gray-500">
                    No characters specified
                  </Typography>
                )}
              </div>
            </div>

            <Typography variant="body2" className="mt-2 text-gray-500">
              Estimated Duration: {point?.estimated_duration || "Not specified"}
            </Typography>
          </Card>
        ))}

        <div className="flex flex-col items-center space-y-4">
          {!showOptions ? (
            <Button
              variant="outlined"
              className="px-6 py-2 text-green-600 border-2 border-green-500 hover:bg-green-50"
              onClick={() => {
                setShowOptions(true);
              }}
              startIcon={<AddIcon />}
            >
              ADD NEW OUTLINE POINT
            </Button>
          ) : (
            <div className="flex flex-col items-center w-full max-w-md space-y-4">
              {selectedOption === "generateMany" && (
                <div className="flex items-center justify-center mb-2 space-x-2">
                  <IconButton
                    size="small"
                    onClick={() => setPointCount(Math.max(1, pointCount - 1))}
                    disabled={pointCount <= 1}
                  >
                    -
                  </IconButton>
                  <Typography
                    variant="body1"
                    className="mx-2 min-w-[20px] text-center"
                  >
                    {pointCount}
                  </Typography>
                  <IconButton
                    size="small"
                    onClick={() => setPointCount(Math.min(5, pointCount + 1))}
                    disabled={pointCount >= 5}
                  >
                    +
                  </IconButton>
                  {selectedOption === "generateMany" && (
                    <IconButton
                      color="success"
                      onClick={handleGenerateMany}
                      className="ml-2"
                    >
                      <CheckIcon />
                    </IconButton>
                  )}
                </div>
              )}

              <div className="flex justify-center space-x-2">
                <Button
                  variant={
                    selectedOption === "manual" ? "contained" : "outlined"
                  }
                  onClick={() => handleOptionSelect("manual")}
                  startIcon={<EditIcon />}
                  className={
                    selectedOption === "manual"
                      ? "bg-green-500 hover:bg-green-600"
                      : ""
                  }
                >
                  Manual
                </Button>
                <Button
                  variant={
                    selectedOption === "generateOne" ? "contained" : "outlined"
                  }
                  onClick={() => handleOptionSelect("generateOne")}
                  startIcon={<AutoFixHighIcon />}
                  className={
                    selectedOption === "generateOne"
                      ? "bg-green-500 hover:bg-green-600"
                      : ""
                  }
                >
                  Generate One
                </Button>
                <Button
                  variant={
                    selectedOption === "generateMany" ? "contained" : "outlined"
                  }
                  onClick={() => handleOptionSelect("generateMany")}
                  startIcon={<AutoFixHighIcon />}
                  className={
                    selectedOption === "generateMany"
                      ? "bg-green-500 hover:bg-green-600"
                      : ""
                  }
                >
                  Generate Many
                </Button>
              </div>

              <Button
                variant="text"
                color="error"
                onClick={() => {
                  setShowOptions(false);
                  setSelectedOption(null);
                }}
                className="mt-2"
              >
                CANCEL
              </Button>
            </div>
          )}
        </div>
      </div>
    );
  };

  const renderCharacterGenerateOptions = () => {
    const [count, setCount] = useState(1);
    const hasExistingCharacters = Array.isArray(content) && content.length > 0;

    const handleCountChange = (e) => {
      const value = parseInt(e.target.value, 10);
      if (!isNaN(value) && value >= 1 && value <= 5) {
        setCount(value);
      }
      else {
        toast.error("Please enter a number between 1 and 5");
      }
    };
    const options = [
      {
        label: "Generate with AI",
        handler: () => handleGenerateMultipleCharacters(count),
      },
      { label: "Add Manually", handler: () => setIsEditing(true) },
    ];
    return (
      <div className="space-y-4">
        <div className="flex flex-col p-5 space-y-4 rounded-lg shadow-sm bg-gray-50">
          <Typography variant="subtitle1" className="font-medium text-gray-800">
            Generate Character Points
          </Typography>

          <div className="flex flex-col space-y-3">
            <div>
              <Typography variant="body2" className="mb-2 text-gray-600">
                Number of characters to generate:
              </Typography>

              <div className="flex items-center">
                <Button
                  size="small"
                  variant="outlined"
                  className="h-8 min-w-8"
                  disabled={count <= 1}
                  onClick={() => setCount(Math.max(1, count - 1))}
                >
                  -
                </Button>
                <TextField
                  type="number"
                  size="small"
                  value={count}
                  onChange={handleCountChange}
                  inputProps={{
                    min: 1,
                    max: 5,
                    style: { textAlign: "center" },
                  }}
                  className="w-16 mx-2"
                  InputProps={{
                    sx: { height: "32px" },
                  }}
                />
                <Button
                  size="small"
                  variant="outlined"
                  className="h-8 min-w-8"
                  disabled={count >= 5}
                  onClick={() => setCount(Math.min(5, count + 1))}
                >
                  +
                </Button>
                <Typography variant="caption" className="ml-3 text-gray-500">
                  (Max: 5)
                </Typography>
              </div>
            </div>
          </div>

          <Button
            variant="contained"
            onClick={options[0].handler}
            className="self-end h-10 mt-2 bg-green-500 hover:bg-green-600"
            startIcon={<AutoFixHighIcon />}
          >
            Generate
          </Button>
        </div>
        <div className="flex items-center justify-between">
          <Typography variant="body2" className="text-gray-600">
            Or add a single character manually:
          </Typography>
          <Button
            variant="outlined"
            onClick={options[1].handler}
            className="text-green-500 border-green-500 hover:bg-green-50"
            startIcon={<AddIcon />}
          >
            Add Manually
          </Button>
        </div>
      </div>
    );
  };

  const renderOutlineGenerateOptions = () => {
    const [pointCount, setPointCount] = useState(1);
    const [continueFromExisting, setContinueFromExisting] = useState(true);
    const hasExistingPoints = Array.isArray(content) && content.length > 0;

    const handlePointCountChange = (e) => {
      const value = parseInt(e.target.value, 10);
      if (!isNaN(value) && value >= 1 && value <= 5) {
        setPointCount(value);
      }
    };

    const options = [
      {
        label: "Generate with AI",
        handler: () =>
          handleGenerateMultiplePoints(pointCount, continueFromExisting),
      },
      { label: "Add Manually", handler: () => setIsEditing(true) },
    ];

    return (
      <div className="space-y-4">
        <div className="flex flex-col p-5 space-y-4 rounded-lg shadow-sm bg-gray-50">
          <Typography variant="subtitle1" className="font-medium text-gray-800">
            Generate Story Outline Points
          </Typography>

          <div className="flex flex-col space-y-3">
            <div>
              <Typography variant="body2" className="mb-2 text-gray-600">
                Number of points to generate:
              </Typography>
              <div className="flex items-center">
                <Button
                  size="small"
                  variant="outlined"
                  className="h-8 min-w-8"
                  disabled={pointCount <= 1}
                  onClick={() => setPointCount(Math.max(1, pointCount - 1))}
                >
                  -
                </Button>
                <TextField
                  type="number"
                  size="small"
                  value={pointCount}
                  onChange={handlePointCountChange}
                  inputProps={{
                    min: 1,
                    max: 5,
                    style: { textAlign: "center" },
                  }}
                  className="w-16 mx-2"
                  InputProps={{
                    sx: { height: "32px" },
                  }}
                />
                <Button
                  size="small"
                  variant="outlined"
                  className="h-8 min-w-8"
                  disabled={pointCount >= 5}
                  onClick={() => setPointCount(Math.min(5, pointCount + 1))}
                >
                  +
                </Button>
                <Typography variant="caption" className="ml-3 text-gray-500">
                  (Max: 5)
                </Typography>
              </div>
            </div>

            {hasExistingPoints && (
              <div>
                <div className="flex items-center space-x-2">
                  <Switch
                    checked={continueFromExisting}
                    onChange={(e) => setContinueFromExisting(e.target.checked)}
                    color="success"
                    size="small"
                  />
                  <Typography variant="body2" className="text-gray-700">
                    Continue from existing outline
                    {content?.length > 0 && (
                      <span className="text-gray-500">
                        {" "}
                        (currently {content.length} point
                        {content.length !== 1 ? "s" : ""})
                      </span>
                    )}
                  </Typography>
                </div>

                <div className="p-3 mt-2 border border-blue-100 rounded-md bg-blue-50">
                  <Typography variant="body2" className="text-blue-700">
                    {continueFromExisting ? (
                      <>
                        <span className="font-semibold">
                          Continuing from existing outline:
                        </span>{" "}
                        Points will be added after point #
                        {content[content.length - 1].number}.
                      </>
                    ) : (
                      <>
                        <span className="font-semibold">
                          Starting a new outline:
                        </span>{" "}
                        This will replace your existing outline points.
                      </>
                    )}
                  </Typography>
                </div>
              </div>
            )}
          </div>

          <Button
            variant="contained"
            onClick={options[0].handler}
            className="self-end h-10 mt-2 bg-green-500 hover:bg-green-600"
            startIcon={<AutoFixHighIcon />}
          >
            {hasExistingPoints && !continueFromExisting
              ? "Replace & Generate"
              : "Generate"}
          </Button>
        </div>

        <div className="flex items-center justify-between">
          <Typography variant="body2" className="text-gray-600">
            Or add a single point manually:
          </Typography>
          <Button
            variant="outlined"
            onClick={options[1].handler}
            className="text-green-500 border-green-500 hover:bg-green-50"
            startIcon={<AddIcon />}
          >
            Add Manually
          </Button>
        </div>
      </div>
    );
  };
  const renderGenerateOptions = () => {
    if (isCharacters) return renderCharacterGenerateOptions();
    else if (isOutline) return renderOutlineGenerateOptions();
  };

  const renderRegenerateButton = () => (
    <Button
      variant="outlined"
      onClick={handleRegenerate}
      startIcon={<RefreshIcon />}
      className="mb-4 text-green-500 border-green-500 hover:border-green-600 hover:bg-green-50"
    >
      Regenerate {title}
    </Button>
  );

  const renderTextContent = (contentToRender) => {
    if (!contentToRender) return "";

    if (typeof contentToRender === "string") return contentToRender;

    if (contentToRender?.description) return contentToRender.description;

    if (contentToRender?.type) {
      return (
        contentToRender.description ||
        contentToRender.title ||
        JSON.stringify(contentToRender)
      );
    }

    if (Array.isArray(contentToRender)) {
      return contentToRender.join(", ");
    }

    try {
      return JSON.stringify(contentToRender);
    } catch (e) {
      return "";
    }
  };

  const renderContent = () => {
    if (title === "Genre") {
      const availableGenres = [
                "Fantasy",
                "Science Fiction",
                "Mystery",
                "Romance",
                "Horror",
                "Adventure",
                "Historical Fiction",
                "Contemporary",
                "Thriller",
                "Other",
      ];

      // Use editedContent if available, otherwise fall back to content
      const displayGenre = editedContent || content;
      const validGenre = availableGenres.includes(displayGenre) ? displayGenre : "";

      return (
        <div className="space-y-4">
          <Select
            value={validGenre}
            onValueChange={async (value) => {
              try {
                setLocalLoading(true);
                const user = JSON.parse(localStorage.getItem("user"));
                if (!user?.id) throw new Error("User not found");

                const response = await storyApiClient.put(
                  `/plan/update-genre/${storyId}`,
                  {
                    genre: value
                  },
                  { params: { user_id: user?.id } }
                );

                // Update editedContent first
                setEditedContent(value);
                // Then update parent state
                onUpdate("genre", value);
                
                toast.success("Genre updated successfully!");
              } catch (error) {
                console.error("Error saving genre:", error);
                toast.error("Failed to save genre");
                // Reset editedContent on error
                setEditedContent(null);
              } finally {
                setLocalLoading(false);
              }
            }}
          >
            <SelectTrigger className="w-[300px] bg-gray-100 border-gray-300">
              <SelectValue placeholder="Select genre">
                {validGenre || "Select genre"}
              </SelectValue>
            </SelectTrigger>
            <SelectContent>
              {availableGenres.map((genre) => (
                <SelectItem key={genre} value={genre}>
                  {genre}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {localLoading && (
            <div className="flex justify-center mt-2">
              <CircularProgress size={20} />
            </div>
          )}
        </div>
      );
    }

    if (localLoading && loadingId === title.toLowerCase()) {
      return (
        <div className="flex flex-col items-center justify-center py-8">
          <CircularProgress size={40} className="text-green-500" />
          <Typography className="mt-4 text-gray-600">
            {loadingId === "outline" && loadingMessage
              ? loadingMessage
              : `Generating ${title}...`}
          </Typography>
        </div>
      );
    }

    if (!content) {
      return (
        <div className="space-y-4">
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
            <div className="flex items-center justify-between">
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
                  className="p-3 transition-all duration-200 transform bg-green-500 shadow-lg hover:bg-green-600 hover:scale-105"
                  size="large"
                >
                  <AutoFixHighIcon className="text-white" />
                </IconButton>
              </Tooltip>
            </div>
          </div>
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
              onSubmit={(formData) => {
                handleSave(formData);
              }}
              onCancel={() => {
                setIsEditing(false);
                setEditedContent(null);
                setShowOptions(false);
              }}
            />
          </>
        );
      }
      return renderOutlineContent();
    }

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
              onClick={() => handleSave(editedContent)}
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
      <div className="relative p-4 rounded-lg bg-gray-50">
        {isTyping ? (
          <TypewriterText
            text={editedContent || content}
            onComplete={() => setIsTyping(false)}
          />
        ) : (
          <>
            <Typography variant="body1" className="whitespace-pre-line">
              {editedContent || content}
            </Typography>
            <div className="absolute flex space-x-1 top-2 right-2">
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

  const handleGenerateMultiplePoints = async (
    count,
    continueFromExisting = true
  ) => {
    try {
      setLoadingId(title.toLowerCase());
        setLoadingMessage(
          `Generating ${count} outline point${count > 1 ? "s" : ""}...`
        );

      const user = JSON.parse(localStorage.getItem("user"));
      if (!user?.id) throw new Error("User not found");

      const continueFromPrevious =
        continueFromExisting && Array.isArray(content) && content.length > 0;

      const response = await storyApiClient.post(
        `/plan/generate-outline/${storyId}`,
        {
          max_depth: count,
          continue_from_previous: continueFromPrevious,
        },
        { params: { user_id: user?.id } }
      );

      if (response.data) {
        const newOutline = continueFromPrevious
          ? [...(content || []), ...response.data]
          : response.data;

        onUpdate("outline", newOutline);
          toast.success(
          `${count} outline point${count > 1 ? "s" : ""} generated successfully!`
        );
      }
    } catch (error) {
      console.error("Error generating outline points:", error);
      toast.error("Failed to generate outline points");
    } finally {
      setLoadingId("");
      setLoadingMessage("");
    }
  };

  const handleGenerateMultipleCharacters = async (count) => {
    try {
      setLoadingId("characters");
      const user = JSON.parse(localStorage.getItem("user"));
      if (!user?.id) throw new Error("User not found");

      const response = await storyApiClient.post(
        `/plan/generate-characters/${storyId}`,
        {
          num_characters: count,
        },
        { params: { user_id: user?.id } }
      );

      onUpdate("characters", [...(content || []), ...response.data.characters]);
      toast.success(
        `${count} character${count > 1 ? "s" : ""} generated successfully!`
      );
    } catch (error) {
      console.error("Error generating characters:", error);
      toast.error("Failed to generate characters");
    } finally {
      setLoadingId("");
    }
  };

  return (
    <>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -20 }}
        transition={{ duration: 0.5 }}
      >
        <Card className="transition-shadow duration-300 border border-gray-200 hover:shadow-lg">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <Typography
                  variant="h6"
                  className="font-semibold text-gray-800"
                >
                  {title}
                </Typography>
                <Typography variant="body2" className="mt-1 text-gray-600">
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
            {localLoading && <CircularProgress size={24} className="absolute top-4 right-4" />}
          </CardContent>
        </Card>
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
