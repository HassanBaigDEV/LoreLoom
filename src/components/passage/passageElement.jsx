import { useState } from "react";
import {
  TextField,
  Button,
  Typography,
  IconButton,
  Card,
  CardContent,
  Collapse,
  Chip,
  Tooltip,
  Divider,
} from "@mui/material";
import AutoFixHighIcon from "@mui/icons-material/AutoFixHigh";
import { motion } from "framer-motion";
import EditIcon from "@mui/icons-material/Edit";
import RefreshIcon from "@mui/icons-material/Refresh";
import SaveIcon from "@mui/icons-material/Save";
import DeleteIcon from "@mui/icons-material/Delete";
import AddCircleOutlineIcon from "@mui/icons-material/AddCircleOutline";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import ConfirmDialog from "@/components/common/ConfirmDialog";
import { useAtom } from "jotai";
import { storyDataAtom, storyLoadingAtom, storyErrorAtom } from "@/store/atoms";

export default function PassageElement({
  title,
  content,
  storyId,
  isWriting = false, // For controlling whether we're in the writing phase
  isExpanded = true,
}) {
  const [isEditing, setIsEditing] = useState(false);
  const [editedContent, setEditedContent] = useState(content);
  const [isExpandedState, setIsExpandedS] = useState(true);
  const [loading, setLoading] = useAtom(storyLoadingAtom);
  const [loadingId, setLoadingId] = useState("");
  const [manualInput, setManualInput] = useState("");
  

  const renderContent = () => {
    // Loading state
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

    // Editing state
    if (isEditing) {
      return (
        <div className="space-y-4">
          {content && renderRegenerateButton()}
          <OutlineForm
            initialData={editedContent}
            onSubmit={handleSave}
            onCancel={handleCancel}
          />
        </div>
      );
    }

    // Display content if available
    if (content.length > 0) {
      return (
        <div className="space-y-4">
          {content.map((point, index) => (
            <Card
              key={index}
              className="p-4 transition-shadow duration-300 hover:shadow-lg"
            >
              {/* Title and Actions (Edit/Delete) */}
              <div className="flex items-start justify-between mt-2">
                <Typography
                  variant="h6"
                  className="font-semibold text-gray-800"
                >
                  Content Point ID: {point.outline_point_id}
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

              {/* Content description */}
              <Typography variant="body2" className="mt-2 text-gray-600">
                {point.content}
              </Typography>

              {/* Horizontal Line */}
              <Divider className="my-2" />

              {/* Characters Involved */}
              <div className="mt-2">
                <Typography variant="subtitle2" className="text-gray-700">
                  Characters Involved
                </Typography>
                <div className="flex flex-wrap gap-1 mt-1">
                  {point.mentioned_entities.map((character, i) => (
                    <Chip
                      key={i}
                      label={character}
                      size="small"
                      className="bg-blue-50"
                    />
                  ))}
                </div>
              </div>
            </Card>
          ))}
          <div className="flex justify-center mt-4">
            <Button
              variant="outlined"
              startIcon={<AddCircleOutlineIcon />}
              onClick={() => {
                // Logic to add a new passage, possibly opening a form or modal
              }}
              className="text-green-500 border-green-500 hover:border-green-600"
            >
              Add New Passage
            </Button>
          </div>
        </div>
      );
    }

    // Default case: No content and no loading
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
  };

  const handleEdit = (content) => {
    setEditedContent(content);
    setIsEditing(true);
  };

  const handleSave = async () => {};

  const handleGenerate = async () => {};

  const handleRegenerate = async () => {};

  const handleManualSave = async () => {};

  const handleSaveClick = () => {
    setIsEditing(false);
  };

  return (
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
              <Typography variant="h6" className="font-semibold text-gray-800">
                Passages
              </Typography>
              <Typography variant="body2" className="mt-1 text-gray-600">
                Write your story
              </Typography>
            </div>
            <IconButton
              onClick={() => setIsExpandedS(!isExpandedState)}
              className={`transform transition-transform ${
                isExpanded ? "rotate-180" : ""
              }`}
            >
              <ExpandMoreIcon />
            </IconButton>
          </div>

          <Collapse in={isExpandedState}>{renderContent()}</Collapse>

          <Divider className="my-4" />
        </CardContent>
      </Card>

      {/* Add New Passage Button */}
      {isWriting && (
        <div className="flex justify-center mt-4">
          <Button
            variant="outlined"
            startIcon={<AddCircleOutlineIcon />}
            onClick={() => {
              // Logic to add a new passage, possibly opening a form or modal
            }}
            className="text-green-500 border-green-500 hover:border-green-600"
          >
            Add New Passage
          </Button>
        </div>
      )}
    </motion.div>
  );
}
