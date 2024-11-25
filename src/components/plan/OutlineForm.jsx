import { useState } from 'react';
import {
  TextField,
  Box,
  Typography,
  Chip,
  IconButton,
  Button,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/Delete';

export default function OutlineForm({ initialData, onSubmit, onCancel }) {
  const defaultOutline = {
    number: '',
    title: '',
    description: '',
    purpose: '',
    setting: '',
    characters_involved: [],
    estimated_duration: ''
  };

  const [outline, setOutline] = useState(initialData || defaultOutline);
  const [newCharacter, setNewCharacter] = useState('');

  const handleChange = (field) => (event) => {
    setOutline(prev => ({
      ...prev,
      [field]: event.target.value
    }));
  };

  const handleAddCharacter = () => {
    if (newCharacter.trim()) {
      setOutline(prev => ({
        ...prev,
        characters_involved: [...(prev.characters_involved || []), newCharacter.trim()]
      }));
      setNewCharacter('');
    }
  };

  return (
    <Box className="space-y-4">
      <TextField
        fullWidth
        label="Title"
        value={outline.title}
        onChange={handleChange('title')}
      />

      <TextField
        fullWidth
        multiline
        rows={3}
        label="Description"
        value={outline.description}
        onChange={handleChange('description')}
      />

      <TextField
        fullWidth
        label="Purpose"
        value={outline.purpose}
        onChange={handleChange('purpose')}
      />

      <TextField
        fullWidth
        label="Setting"
        value={outline.setting}
        onChange={handleChange('setting')}
      />

      <Box className="space-y-2">
        <Typography variant="subtitle2">Characters Involved</Typography>
        <div className="flex gap-2 flex-wrap">
          {(outline.characters_involved || []).map((char, index) => (
            <Chip
              key={index}
              label={char}
              onDelete={() => {
                const newChars = outline.characters_involved.filter((_, i) => i !== index);
                setOutline(prev => ({
                  ...prev,
                  characters_involved: newChars
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
        onChange={handleChange('estimated_duration')}
      />

      <div className="flex justify-end space-x-2">
        <Button
          variant="outlined"
          onClick={onCancel}
          color="secondary"
        >
          Cancel
        </Button>
        <Button
          variant="contained"
          onClick={() => onSubmit(outline)}
          className="bg-green-500 hover:bg-green-600"
        >
          {initialData ? 'Update' : 'Add'} Outline Point
        </Button>
      </div>
    </Box>
  );
} 