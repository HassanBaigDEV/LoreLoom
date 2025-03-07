import { useState } from "react";
import {
  TextField,
  Box,
  Typography,
  Chip,
  IconButton,
  Button,
  FormHelperText,
} from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import DeleteIcon from "@mui/icons-material/Delete";

export default function OutlineForm({ initialData, onSubmit, onCancel }) {
  const defaultOutline = {
    number: "",
    title: "",
    description: "",
    purpose: "",
    setting: "",
    characters_involved: [],
    estimated_duration: "",
  };

  const [outline, setOutline] = useState(initialData || defaultOutline);
  const [newCharacter, setNewCharacter] = useState("");
  const [errors, setErrors] = useState({});

  const handleChange = (field) => (event) => {
    const value = event.target.value;
    setOutline((prev) => ({
      ...prev,
      [field]: value,
    }));

    // Clear error for this field if it was previously set
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: null }));
    }
  };

  const handleAddCharacter = () => {
    if (newCharacter.trim()) {
      setOutline((prev) => ({
        ...prev,
        characters_involved: [
          ...(prev.characters_involved || []),
          newCharacter.trim(),
        ],
      }));
      setNewCharacter("");
    }
  };

  const validateForm = () => {
    const newErrors = {};

    // Required fields validation with whitespace check
    if (!outline.title?.trim()) {
      newErrors.title = "Title is required";
    }

    if (!outline.description?.trim()) {
      newErrors.description = "Description is required";
    }

    // Additional validation for number field
    if (isNaN(Number(outline.number)) || Number(outline.number) <= 0) {
      newErrors.number = "Valid point number is required";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = () => {
    if (validateForm()) {
      // Form is valid, submit the data
      onSubmit(outline);
    }
  };

  return (
    <Box className="space-y-4">
      <TextField
        fullWidth
        label="Point Number"
        value={outline.number}
        onChange={handleChange("number")}
        type="number"
        error={!!errors.number}
        helperText={errors.number}
        required
        disabled={!!initialData} // Disable editing for existing points
      />

      <TextField
        fullWidth
        label="Title"
        value={outline.title}
        onChange={handleChange("title")}
        error={!!errors.title}
        helperText={errors.title}
        required
      />

      <TextField
        fullWidth
        multiline
        rows={3}
        label="Description"
        value={outline.description}
        onChange={handleChange("description")}
        error={!!errors.description}
        helperText={errors.description}
        required
      />

      <TextField
        fullWidth
        label="Purpose"
        value={outline.purpose}
        onChange={handleChange("purpose")}
      />

      <TextField
        fullWidth
        label="Setting"
        value={outline.setting}
        onChange={handleChange("setting")}
      />

      <Box className="space-y-2">
        <Typography variant="subtitle2">Characters Involved</Typography>
        <div className="flex gap-2 flex-wrap">
          {(outline.characters_involved || []).map((char, index) => (
            <Chip
              key={index}
              label={char}
              onDelete={() => {
                const newChars = outline.characters_involved.filter(
                  (_, i) => i !== index
                );
                setOutline((prev) => ({
                  ...prev,
                  characters_involved: newChars,
                }));
              }}
            />
          ))}
        </div>
        <div className="flex gap-2">
          <TextField
            size="small"
            value={newCharacter}
            onChange={(e) => setNewCharacter(e.target.value)}
            placeholder="Add a character"
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                handleAddCharacter();
              }
            }}
          />
          <IconButton onClick={handleAddCharacter} color="primary">
            <AddIcon />
          </IconButton>
        </div>
      </Box>

      <TextField
        fullWidth
        label="Estimated Duration"
        value={outline.estimated_duration}
        onChange={handleChange("estimated_duration")}
      />

      <div className="flex justify-end space-x-2">
        <Button variant="outlined" onClick={onCancel} color="secondary">
          Cancel
        </Button>
        <Button
          variant="contained"
          onClick={handleSubmit}
          className="bg-green-500 hover:bg-green-600"
        >
          {initialData ? "Update" : "Add"} Outline Point
        </Button>
      </div>
    </Box>
  );
}
