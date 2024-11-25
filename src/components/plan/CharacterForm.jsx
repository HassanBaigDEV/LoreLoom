import { useState } from 'react';
import {
  TextField,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Box,
  Typography,
  Chip,
  IconButton,
  Button,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/Delete';

export default function CharacterForm({ initialData, onSubmit, onCancel }) {
  const defaultCharacter = {
    name: '',
    type: 'character',
    role: '',
    physicalAppearance: '',
    behavioralPatterns: '',
    genderAndSexualOrientation: '',
    relationships: {},
    likesAndDislikes: { Likes: [], Dislikes: [] }
  };

  const [character, setCharacter] = useState(() => ({
    ...defaultCharacter,
    ...initialData,
    likesAndDislikes: {
      Likes: initialData?.likesAndDislikes?.Likes || [],
      Dislikes: initialData?.likesAndDislikes?.Dislikes || []
    },
    relationships: initialData?.relationships || {}
  }));
  const [newLike, setNewLike] = useState('');
  const [newDislike, setNewDislike] = useState('');
  const [newRelationship, setNewRelationship] = useState({ name: '', relation: '' });

  const safeArray = (arr) => Array.isArray(arr) ? arr : [];

  const handleChange = (field) => (event) => {
    setCharacter(prev => ({
      ...prev,
      [field]: event.target.value
    }));
  };

  const handleAddLike = () => {
    if (newLike.trim()) {
      setCharacter(prev => ({
        ...prev,
        likesAndDislikes: {
          ...prev.likesAndDislikes,
          Likes: [...(prev.likesAndDislikes.Likes || []), newLike.trim()]
        }
      }));
      setNewLike('');
    }
  };

  const handleAddDislike = () => {
    if (newDislike.trim()) {
      setCharacter(prev => ({
        ...prev,
        likesAndDislikes: {
          ...prev.likesAndDislikes,
          Dislikes: [...(prev.likesAndDislikes.Dislikes || []), newDislike.trim()]
        }
      }));
      setNewDislike('');
    }
  };

  const handleAddRelationship = () => {
    if (newRelationship.name && newRelationship.relation) {
      setCharacter(prev => ({
        ...prev,
        relationships: {
          ...(prev.relationships || {}),
          [newRelationship.name]: newRelationship.relation
        }
      }));
      setNewRelationship({ name: '', relation: '' });
    }
  };

  return (
    <Box className="space-y-4">
      <TextField
        fullWidth
        label="Name"
        value={character.name || ''}
        onChange={handleChange('name')}
      />

      <FormControl fullWidth>
        <InputLabel>Type</InputLabel>
        <Select
          value={character.type || 'character'}
          onChange={handleChange('type')}
          label="Type"
        >
          <MenuItem value="character">Character</MenuItem>
          <MenuItem value="entity">Entity</MenuItem>
          <MenuItem value="location">Location</MenuItem>
        </Select>
      </FormControl>

      <TextField
        fullWidth
        label="Role"
        value={character.role || ''}
        onChange={handleChange('role')}
      />

      <TextField
        fullWidth
        multiline
        rows={3}
        label="Physical Appearance"
        value={character.physicalAppearance || ''}
        onChange={handleChange('physicalAppearance')}
      />

      <TextField
        fullWidth
        multiline
        rows={3}
        label="Behavioral Patterns"
        value={character.behavioralPatterns || ''}
        onChange={handleChange('behavioralPatterns')}
      />

      <TextField
        fullWidth
        label="Gender and Sexual Orientation"
        value={character.genderAndSexualOrientation || ''}
        onChange={handleChange('genderAndSexualOrientation')}
      />

      {/* Likes */}
      <Box className="space-y-2">
        <Typography variant="subtitle2">Likes</Typography>
        <div className="flex gap-2 flex-wrap">
          {safeArray(character?.likesAndDislikes?.Likes).map((like, index) => (
            <Chip
              key={index}
              label={like}
              onDelete={() => {
                const newLikes = safeArray(character?.likesAndDislikes?.Likes)
                  .filter((_, i) => i !== index);
                setCharacter(prev => ({
                  ...prev,
                  likesAndDislikes: {
                    ...prev.likesAndDislikes,
                    Likes: newLikes
                  }
                }));
              }}
            />
          ))}
        </div>
        <div className="flex gap-2">
          <TextField
            size="small"
            value={newLike}
            onChange={(e) => setNewLike(e.target.value)}
            placeholder="Add a like"
          />
          <IconButton onClick={handleAddLike} color="primary">
            <AddIcon />
          </IconButton>
        </div>
      </Box>

      {/* Dislikes */}
      <Box className="space-y-2">
        <Typography variant="subtitle2">Dislikes</Typography>
        <div className="flex gap-2 flex-wrap">
          {safeArray(character?.likesAndDislikes?.Dislikes).map((dislike, index) => (
            <Chip
              key={index}
              label={dislike}
              onDelete={() => {
                const newDislikes = safeArray(character?.likesAndDislikes?.Dislikes)
                  .filter((_, i) => i !== index);
                setCharacter(prev => ({
                  ...prev,
                  likesAndDislikes: {
                    ...prev.likesAndDislikes,
                    Dislikes: newDislikes
                  }
                }));
              }}
            />
          ))}
        </div>
        <div className="flex gap-2">
          <TextField
            value={newDislike}
            onChange={(e) => setNewDislike(e.target.value)}
            placeholder="Add a dislike"
          />
          <IconButton onClick={handleAddDislike} color="primary">
            <AddIcon />
          </IconButton>
        </div>
      </Box>

      {/* Relationships */}
      <Box className="space-y-2">
        <Typography variant="subtitle2">Relationships</Typography>
        <div className="space-y-2">
          {Object.entries(character?.relationships || {}).map(([name, relation]) => (
            <div key={name} className="flex items-center gap-2">
              <Typography>{name}: {relation}</Typography>
              <IconButton
                size="small"
                onClick={() => {
                  const { [name]: _, ...rest } = character.relationships || {};
                  setCharacter(prev => ({ ...prev, relationships: rest }));
                }}
              >
                <DeleteIcon />
              </IconButton>
            </div>
          ))}
        </div>
        <div className="flex gap-2">
          <TextField
            size="small"
            value={newRelationship.name}
            onChange={(e) => setNewRelationship({ ...newRelationship, name: e.target.value })}
            placeholder="Character name"
          />
          <TextField
            size="small"
            value={newRelationship.relation}
            onChange={(e) => setNewRelationship({ ...newRelationship, relation: e.target.value })}
            placeholder="Relationship"
          />
          <IconButton onClick={handleAddRelationship} color="primary">
            <AddIcon />
          </IconButton>
        </div>
      </Box>

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
          onClick={() => onSubmit(character)}
          className="bg-green-500 hover:bg-green-600"
        >
          {initialData ? 'Update' : 'Add'} Character
        </Button>
      </div>
    </Box>
  );
} 