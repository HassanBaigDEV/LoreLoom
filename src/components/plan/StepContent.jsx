import { useState } from "react";
import {
  TextField,
  Button,
  Paper,
  Typography,
  CircularProgress,
  Box,
  IconButton,
} from "@mui/material";
import AutoFixHighIcon from "@mui/icons-material/AutoFixHigh";
import EditIcon from "@mui/icons-material/Edit";
import SaveIcon from "@mui/icons-material/Save";

export default function StepContent({
  step,
  content,
  loading,
  onGenerate,
  onEdit,
  editable = true,
}) {
  const [isEditing, setIsEditing] = useState(false);
  const [editedContent, setEditedContent] = useState(content);

  const handleSave = async () => {
    await onEdit(editedContent);
    setIsEditing(false);
  };

  return (
    <Paper elevation={3} className="p-6 mt-8 relative">
      {loading ? (
        <Box className="flex flex-col items-center justify-center h-40">
          <CircularProgress size={40} className="text-green-500" />
          <Typography className="mt-4 text-gray-600">
            Generating {step}...
          </Typography>
        </Box>
      ) : content ? (
        <div>
          {isEditing ? (
            <div className="space-y-4">
              <TextField
                fullWidth
                multiline
                rows={4}
                value={editedContent}
                onChange={(e) => setEditedContent(e.target.value)}
                variant="outlined"
              />
              <div className="flex justify-end space-x-2">
                <Button
                  onClick={() => setIsEditing(false)}
                  variant="outlined"
                  color="secondary"
                >
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
          ) : (
            <div className="relative">
              <Typography variant="body1" className="whitespace-pre-line">
                {content}
              </Typography>
              {editable && (
                <IconButton
                  onClick={() => setIsEditing(true)}
                  className="absolute top-2 right-2"
                  size="small"
                >
                  <EditIcon />
                </IconButton>
              )}
            </div>
          )}
        </div>
      ) : (
        <Button
          variant="contained"
          onClick={onGenerate}
          className="bg-green-500 hover:bg-green-600"
          startIcon={<AutoFixHighIcon />}
          fullWidth
        >
          Generate {step}
        </Button>
      )}
    </Paper>
  );
}
