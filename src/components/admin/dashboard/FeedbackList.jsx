import React, { useState } from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  IconButton,
  MenuItem,
  Select,
  FormControl,
  InputLabel,
  Box,
  Button,
  Menu,
} from '@mui/material';
import { 
  MoreVert as MoreVertIcon,
  Visibility as VisibilityIcon,
  Delete as DeleteIcon,
} from '@mui/icons-material';
import { useRouter } from 'next/navigation';

export default function FeedbackList({ feedback = [], onUpdateFeedback, onDeleteFeedback }) {
  console.log("Feedback data:", feedback);
  const router = useRouter();
  const [statusFilter, setStatusFilter] = useState('all');
  const [anchorEl, setAnchorEl] = useState(null);
  const [selectedFeedback, setSelectedFeedback] = useState(null);

  const handleMenuClick = (event, feedback) => {
    setAnchorEl(event.currentTarget);
    setSelectedFeedback(feedback);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
    setSelectedFeedback(null);
  };

  const handleViewFeedback = (feedbackId) => {
    handleMenuClose();
    router.push(`/admin/feedback/${feedbackId}`);
  };

  const handleDeleteFeedback = async (feedbackId) => {
    handleMenuClose();
    if (window.confirm('Are you sure you want to delete this feedback?')) {
      await onDeleteFeedback(feedbackId);
    }
  };

  const filteredFeedback = feedback.filter(item => 
    statusFilter === 'all' ? true : item.status === statusFilter
  );

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ mb: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <FormControl sx={{ minWidth: 200 }}>
          <InputLabel>Status Filter</InputLabel>
          <Select
            value={statusFilter}
            label="Status Filter"
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <MenuItem value="all">All</MenuItem>
            <MenuItem value="unread">Unread</MenuItem>
            <MenuItem value="read">Read</MenuItem>
            <MenuItem value="responded">Responded</MenuItem>
          </Select>
        </FormControl>
      </Box>

      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Subject</TableCell>
              <TableCell>User</TableCell>
              <TableCell>Status</TableCell>
              <TableCell>Created At</TableCell>
              <TableCell>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {filteredFeedback.map((item) => (
              <TableRow key={item.id} hover>
                <TableCell>{item.subject}</TableCell>
                <TableCell>{item.user_email}</TableCell>
                <TableCell>
                  <Box
                    sx={{
                      px: 2,
                      py: 0.5,
                      borderRadius: 1,
                      display: 'inline-block',
                      bgcolor: 
                        item.status === 'unread' ? 'error.light' :
                        item.status === 'read' ? 'warning.light' :
                        'success.light',
                      color: 'white',
                    }}
                  >
                    {item.status}
                  </Box>
                </TableCell>
                <TableCell>
                  {new Date(item.created_at).toLocaleDateString()}
                </TableCell>
                <TableCell>
                  <IconButton onClick={(e) => handleMenuClick(e, item)}>
                    <MoreVertIcon />
                  </IconButton>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleMenuClose}
      >
        <MenuItem onClick={() => handleViewFeedback(selectedFeedback?.id)}>
          <VisibilityIcon sx={{ mr: 1 }} /> View Details
        </MenuItem>
        <MenuItem 
          onClick={() => handleDeleteFeedback(selectedFeedback?.id)}
          sx={{ color: 'error.main' }}
        >
          <DeleteIcon sx={{ mr: 1 }} /> Delete
        </MenuItem>
      </Menu>
    </Box>
  );
} 