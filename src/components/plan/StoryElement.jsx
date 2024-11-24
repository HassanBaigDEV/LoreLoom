import { useState } from 'react';
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
} from '@mui/material';
import { motion, AnimatePresence } from 'framer-motion';
import AutoFixHighIcon from '@mui/icons-material/AutoFixHigh';
import EditIcon from '@mui/icons-material/Edit';
import SaveIcon from '@mui/icons-material/Save';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import toast from 'react-hot-toast';
import TypewriterText from '@/components/common/TypewriterText';

export default function StoryElement({
  title,
  description,
  content,
  loading,
  onGenerate,
  onEdit,
  isFirst = false,
  isCharacters = false,
  isOutline = false,
}) {
  const [isEditing, setIsEditing] = useState(false);
  const [editedContent, setEditedContent] = useState(content);
  const [isExpanded, setIsExpanded] = useState(true);
  const [manualInput, setManualInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [loadingId, setLoadingId] = useState('');

  const handleSave = async () => {
    try {
      await onEdit(editedContent);
      setIsEditing(false);
      toast.success(`${title} updated successfully!`);
    } catch (error) {
      toast.error(`Failed to update ${title.toLowerCase()}`);
    }
  };

  const handleGenerate = async () => {
    try {
      setLoadingId(title.toLowerCase());
      const result = await onGenerate();
      setIsTyping(true);
      toast.success(`${title} generated successfully!`);
    } catch (error) {
      toast.error(error.message || `Failed to generate ${title.toLowerCase()}`);
    } finally {
      setLoadingId('');
    }
  };

  return (
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
              <Typography variant="h6" className="text-gray-800 font-semibold">
                {title}
              </Typography>
              <Typography variant="body2" className="text-gray-600 mt-1">
                {description}
              </Typography>
            </div>
            <IconButton
              onClick={() => setIsExpanded(!isExpanded)}
              className={`transform transition-transform ${isExpanded ? 'rotate-180' : ''}`}
            >
              <ExpandMoreIcon />
            </IconButton>
          </div>

          <Collapse in={isExpanded}>
            {loading && loadingId === title.toLowerCase() ? (
              <div className="flex flex-col items-center justify-center py-8">
                <CircularProgress size={40} className="text-green-500" />
                <Typography className="mt-4 text-gray-600">
                  Generating {title}...
                </Typography>
              </div>
            ) : content ? (
              <div className="relative">
                {isEditing ? (
                  <div className="space-y-4">
                    {isCharacters || isOutline ? (
                      <TextField
                        fullWidth
                        multiline
                        rows={8}
                        value={JSON.stringify(editedContent, null, 2)}
                        onChange={(e) => setEditedContent(JSON.parse(e.target.value))}
                        variant="outlined"
                        className="bg-gray-50"
                      />
                    ) : (
                      <TextField
                        fullWidth
                        multiline
                        rows={4}
                        value={editedContent}
                        onChange={(e) => setEditedContent(e.target.value)}
                        variant="outlined"
                        className="bg-gray-50"
                      />
                    )}
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
                  <div className="relative bg-gray-50 p-4 rounded-lg">
                    {isTyping ? (
                      <TypewriterText 
                        text={isCharacters || isOutline 
                          ? JSON.stringify(content, null, 2)
                          : content
                        }
                        onComplete={() => setIsTyping(false)}
                      />
                    ) : (
                      <Typography variant="body1" className="whitespace-pre-line">
                        {isCharacters || isOutline 
                          ? JSON.stringify(content, null, 2)
                          : content}
                      </Typography>
                    )}
                    <IconButton
                      onClick={() => setIsEditing(true)}
                      className="absolute top-2 right-2"
                      size="small"
                    >
                      <EditIcon />
                    </IconButton>
                  </div>
                )}
              </div>
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
                    onClick={() => onEdit(manualInput)}
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
          </Collapse>
        </CardContent>
      </Card>
    </motion.div>
  );
} 