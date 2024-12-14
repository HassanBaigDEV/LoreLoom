import React from 'react';
import {
  Paper,
  Typography,
  List,
  ListItem,
  ListItemText,
  Chip,
  Divider,
  Box,
  Link,
  Stack,
  Card,
  CardContent,
  IconButton,
  Collapse,
  Tooltip,
} from '@mui/material';
import {
  Schedule as ScheduleIcon,
  ExpandMore as ExpandMoreIcon,
  ExpandLess as ExpandLessIcon,
  Link as LinkIcon,
  BugReport,
  Lightbulb,
  Help,
  Support,
  Comment,
} from '@mui/icons-material';
import { useState } from 'react';

const getStatusColor = (status) => {
  switch (status?.toLowerCase()) {
    case 'pending':
      return { color: 'warning', label: 'Pending Review' };
    case 'in_progress':
      return { color: 'info', label: 'In Progress' };
    case 'resolved':
      return { color: 'success', label: 'Resolved' };
    default:
      return { color: 'default', label: status };
  }
};

const getFeedbackTypeIcon = (type) => {
  switch (type?.toLowerCase()) {
    case 'bug':
      return BugReport;
    case 'feature':
      return Lightbulb;
    case 'support':
      return Support;
    case 'general':
      return Comment;
    default:
      return Help;
  }
};

export default function FeedbackHistory({ feedback = [] }) {
  const [expandedId, setExpandedId] = useState(null);

  const handleExpand = (id) => {
    setExpandedId(expandedId === id ? null : id);
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <Paper 
      elevation={0}
      sx={{ 
        p: { xs: 2, sm: 3 },
        borderRadius: 2,
        bgcolor: 'white',
        border: '1px solid',
        borderColor: 'divider',
      }}
    >
      <Typography 
        variant="h6" 
        component="h2" 
        gutterBottom
        sx={{ 
          fontWeight: 600,
          color: 'text.primary',
          mb: 3
        }}
      >
        Feedback History
      </Typography>

      {feedback.length === 0 ? (
        <Box 
          sx={{ 
            textAlign: 'center',
            py: 6,
            color: 'text.secondary'
          }}
        >
          <Help sx={{ fontSize: 48, color: 'action.disabled', mb: 2 }} />
          <Typography>No feedback submitted yet.</Typography>
        </Box>
      ) : (
        <Stack spacing={2}>
          {feedback.map((item) => {
            const TypeIcon = getFeedbackTypeIcon(item.type);
            const { color, label } = getStatusColor(item.status);
            
            return (
              <Card 
                key={item.id}
                variant="outlined"
                sx={{ 
                  '&:hover': {
                    borderColor: 'primary.main',
                    bgcolor: 'grey.50'
                  }
                }}
              >
                <CardContent>
                  <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', mb: 2 }}>
                    <Stack direction="row" spacing={1} alignItems="center">
                      <TypeIcon color="action" fontSize="small" />
                      <Typography variant="subtitle1" sx={{ fontWeight: 500 }}>
                        {item.title}
                      </Typography>
                    </Stack>
                    <Chip
                      label={label}
                      color={color}
                      size="small"
                      sx={{ ml: 2 }}
                    />
                  </Box>

                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 2, color: 'text.secondary' }}>
                    <ScheduleIcon fontSize="small" sx={{ mr: 1 }} />
                    <Typography variant="body2">
                      {formatDate(item.created_at)}
                    </Typography>
                  </Box>

                  <Box>
                    <Typography 
                      variant="body2" 
                      color="text.secondary"
                      sx={{
                        display: '-webkit-box',
                        WebkitLineClamp: expandedId === item.id ? 'unset' : 2,
                        WebkitBoxOrient: 'vertical',
                        overflow: 'hidden',
                        mb: 1
                      }}
                    >
                      {item.description}
                    </Typography>
                    
                    <IconButton 
                      size="small" 
                      onClick={() => handleExpand(item.id)}
                      sx={{ ml: -1 }}
                    >
                      {expandedId === item.id ? <ExpandLessIcon /> : <ExpandMoreIcon />}
                    </IconButton>
                  </Box>

                  <Collapse in={expandedId === item.id}>
                    {item.screenshot_url && (
                      <Box sx={{ mt: 2 }}>
                        <Link
                          href={item.screenshot_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          sx={{ 
                            display: 'flex',
                            alignItems: 'center',
                            color: 'primary.main',
                            textDecoration: 'none',
                            '&:hover': { textDecoration: 'underline' }
                          }}
                        >
                          <LinkIcon fontSize="small" sx={{ mr: 1 }} />
                          View Screenshot
                        </Link>
                      </Box>
                    )}

                    {item.admin_response && (
                      <Box sx={{ mt: 2, p: 2, bgcolor: 'grey.50', borderRadius: 1 }}>
                        <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                          Admin Response
                        </Typography>
                        <Typography variant="body2">
                          {item.admin_response}
                        </Typography>
                      </Box>
                    )}
                  </Collapse>
                </CardContent>
              </Card>
            );
          })}
        </Stack>
      )}
    </Paper>
  );
} 