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
} from '@mui/material';

const getStatusColor = (status) => {
  switch (status?.toUpperCase()) {
    case 'PENDING':
      return 'warning';
    case 'RESOLVED':
      return 'success';
    case 'IN_PROGRESS':
      return 'info';
    default:
      return 'default';
  }
};

export default function FeedbackHistory({ feedback = [] }) {
  return (
    <Paper elevation={2} sx={{ p: 3, mt: 4, maxWidth: 600, mx: 'auto' }}>
      <Typography variant="h5" component="h2" gutterBottom>
        My Feedback History
      </Typography>

      {feedback.length === 0 ? (
        <Typography color="text.secondary">No feedback submitted yet.</Typography>
      ) : (
        <List>
          {feedback.map((item, index) => (
            <React.Fragment key={item.id}>
              {index > 0 && <Divider />}
              <ListItem alignItems="flex-start">
                <ListItemText
                  primary={
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <Typography variant="subtitle1">{item.title}</Typography>
                      <Chip
                        label={item.status}
                        color={getStatusColor(item.status)}
                        size="small"
                      />
                    </Box>
                  }
                  secondary={
                    <>
                      <Typography
                        component="span"
                        variant="body2"
                        color="text.primary"
                        sx={{ display: 'block', mt: 1 }}
                      >
                        {item.description}
                      </Typography>
                      
                      {item.screenshot_url && (
                        <Link 
                          href={item.screenshot_url} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          sx={{ display: 'block', mt: 1 }}
                        >
                          View Screenshot
                        </Link>
                      )}

                      {item.admin_response && (
                        <Box sx={{ mt: 1, bgcolor: 'grey.100', p: 1, borderRadius: 1 }}>
                          <Typography variant="body2" color="text.secondary">
                            Response: {item.admin_response}
                          </Typography>
                        </Box>
                      )}

                      <Box sx={{ mt: 1, display: 'flex', gap: 2 }}>
                        <Typography variant="caption" color="text.secondary">
                          Type: {item.type}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          Submitted: {new Date(item.created_at).toLocaleDateString()}
                        </Typography>
                      </Box>
                    </>
                  }
                />
              </ListItem>
            </React.Fragment>
          ))}
        </List>
      )}
    </Paper>
  );
} 