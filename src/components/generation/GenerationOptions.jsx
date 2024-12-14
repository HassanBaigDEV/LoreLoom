"use client";
import { useState } from 'react';
import {
  Box,
  Paper,
  Typography,
  TextField,
  Button,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Stack,
  Chip,
  IconButton,
  Tooltip,
  Slider,
} from '@mui/material';
import {
  ArrowBack as ArrowBackIcon,
  Add as AddIcon,
  Close as CloseIcon,
  Help as HelpIcon,
} from '@mui/icons-material';

const genres = [
  'Fantasy',
  'Science Fiction',
  'Mystery',
  'Romance',
  'Horror',
  'Adventure',
  'Historical Fiction',
  'Contemporary',
  'Thriller',
  'Other',
];

const tones = [
  'Dramatic',
  'Humorous',
  'Dark',
  'Light-hearted',
  'Mysterious',
  'Inspirational',
  'Suspenseful',
  'Romantic',
];

export default function GenerationOptions({ onGenerate, onBack }) {
  const [formData, setFormData] = useState({
    prompt: '',
    genre: '',
    tone: '',
    keywords: [],
    complexity: 50,
  });
  const [keyword, setKeyword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleAddKeyword = () => {
    if (keyword.trim() && formData.keywords.length < 5) {
      setFormData(prev => ({
        ...prev,
        keywords: [...prev.keywords, keyword.trim()]
      }));
      setKeyword('');
    }
  };

  const handleRemoveKeyword = (indexToRemove) => {
    setFormData(prev => ({
      ...prev,
      keywords: prev.keywords.filter((_, index) => index !== indexToRemove)
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await onGenerate(formData);
    } catch (error) {
      console.error('Generation error:', error);
    } finally {
      setLoading(false);
    }
  };

  const complexityText = (value) => {
    if (value <= 25) return 'Simple';
    if (value <= 50) return 'Moderate';
    if (value <= 75) return 'Complex';
    return 'Very Complex';
  };

  return (
    <Paper
      elevation={0}
      sx={{
        p: { xs: 2, sm: 4 },
        border: '1px solid',
        borderColor: 'divider',
        borderRadius: 2,
      }}
    >
      <Box sx={{ mb: 4, display: 'flex', alignItems: 'center', gap: 2 }}>
        <IconButton onClick={onBack} sx={{ color: 'text.secondary' }}>
          <ArrowBackIcon />
        </IconButton>
        <Typography variant="h5" component="h2">
          Story Parameters
        </Typography>
      </Box>

      <form onSubmit={handleSubmit}>
        <Stack spacing={3}>
          <TextField
            label="Story Prompt"
            multiline
            rows={4}
            value={formData.prompt}
            onChange={(e) => setFormData(prev => ({ ...prev, prompt: e.target.value }))}
            required
            helperText="Describe your story idea or concept"
          />

          <FormControl fullWidth>
            <InputLabel>Genre</InputLabel>
            <Select
              value={formData.genre}
              label="Genre"
              onChange={(e) => setFormData(prev => ({ ...prev, genre: e.target.value }))}
              required
            >
              {genres.map((genre) => (
                <MenuItem key={genre} value={genre}>{genre}</MenuItem>
              ))}
            </Select>
          </FormControl>

          <FormControl fullWidth>
            <InputLabel>Tone</InputLabel>
            <Select
              value={formData.tone}
              label="Tone"
              onChange={(e) => setFormData(prev => ({ ...prev, tone: e.target.value }))}
              required
            >
              {tones.map((tone) => (
                <MenuItem key={tone} value={tone}>{tone}</MenuItem>
              ))}
            </Select>
          </FormControl>

          <Box>
            <Typography gutterBottom>
              Story Complexity
              <Tooltip title="Affects the depth and intricacy of the generated story">
                <HelpIcon sx={{ ml: 1, fontSize: 16, color: 'text.secondary', verticalAlign: 'middle' }} />
              </Tooltip>
            </Typography>
            <Slider
              value={formData.complexity}
              onChange={(_, value) => setFormData(prev => ({ ...prev, complexity: value }))}
              valueLabelDisplay="auto"
              valueLabelFormat={complexityText}
              marks={[
                { value: 0, label: 'Simple' },
                { value: 50, label: 'Moderate' },
                { value: 100, label: 'Complex' },
              ]}
              sx={{
                '& .MuiSlider-markLabel': {
                  color: 'white',
                },
                '& .MuiSlider-mark': {
                  backgroundColor: 'transparent',
                },
                '& .MuiSlider-thumb': {
                  color: 'white',
                },
                '& .MuiSlider-track': {
                  backgroundColor: 'white',
                },
              }}
            />
          </Box>

          <Box>
            <Typography gutterBottom>
              Keywords (Optional)
              <Tooltip title="Add up to 5 keywords to influence the story">
                <HelpIcon sx={{ ml: 1, fontSize: 16, color: 'text.secondary', verticalAlign: 'middle' }} />
              </Tooltip>
            </Typography>
            <Box sx={{ display: 'flex', gap: 1, mb: 1 }}>
              <TextField
                size="small"
                value={keyword}
                onChange={(e) => setKeyword(e.target.value)}
                placeholder="Enter a keyword"
                disabled={formData.keywords.length >= 5}
              />
              <Button
                onClick={handleAddKeyword}
                disabled={!keyword.trim() || formData.keywords.length >= 5}
                variant="outlined"
                sx={{ minWidth: 'auto' }}
              >
                <AddIcon />
              </Button>
            </Box>
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
              {formData.keywords.map((kw, index) => (
                <Chip
                  key={index}
                  label={kw}
                  onDelete={() => handleRemoveKeyword(index)}
                  color="primary"
                  variant="outlined"
                />
              ))}
            </Box>
          </Box>

          <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 2, mt: 4 }}>
            <Button
              type="button"
              variant="outlined"
              onClick={onBack}
              disabled={loading}
            >
              Back
            </Button>
            <Button
              type="submit"
              variant="contained"
              disabled={loading || !formData.prompt || !formData.genre || !formData.tone}
              sx={{
                bgcolor: 'primary.main',
                '&:hover': {
                  bgcolor: 'primary.dark',
                },
              }}
            >
              {loading ? 'Generating...' : 'Generate Story'}
            </Button>
          </Box>
        </Stack>
      </form>
    </Paper>
  );
} 