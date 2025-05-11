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
  Menu,
  Chip,
  Tooltip,
  Snackbar,
  Alert as MuiAlert,
} from '@mui/material';
import { 
  MoreVert as MoreVertIcon,
  Visibility as VisibilityIcon,
  Delete as DeleteIcon,
} from '@mui/icons-material';
import { useRouter } from 'next/navigation';
import { adminService } from '@/lib/adminService';

const getStatusColor = (status) => {
  switch (status?.toLowerCase()) {
    case 'pending':
      return { color: 'warning', label: 'Pending' };
    case 'resolved':
      return { color: 'success', label: 'Resolved' };
    case 'in_progress':
      return { color: 'info', label: 'In Progress' };
    default:
      return { color: 'default', label: status };
  }
};

const getFeedbackTypeLabel = (type) => {
  const types = {
    bug: 'Bug Report',
    feature: 'Feature Request',
    support: 'Support Request',
    general: 'General Feedback',
    other: 'Other',
  };
  return types[type?.toLowerCase()] || type;
};

export default function FeedbackList({ feedback = [], onUpdateFeedback, onDeleteFeedback }) {
  const router = useRouter();
  const [statusFilter, setStatusFilter] = useState('all');
  const [anchorEl, setAnchorEl] = useState(null);
  const [selectedFeedback, setSelectedFeedback] = useState(null);
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMsg, setSnackbarMsg] = useState('');

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

  const handleStatusUpdate = async (feedbackId, newStatus) => {
    try {
      const updatedFeedback = await adminService.statusUP(feedbackId, { status: newStatus });
      onUpdateFeedback(updatedFeedback);
      setSnackbarMsg('Feedback status updated successfully!');
      setSnackbarOpen(true);
    } catch (error) {
      console.error('Error updating feedback status:', error);
      setSnackbarMsg('Failed to update status');
      setSnackbarOpen(true);
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
            <MenuItem value="pending">Pending</MenuItem>
            <MenuItem value="in_progress">In Progress</MenuItem>
            <MenuItem value="resolved">Resolved</MenuItem>
          </Select>
        </FormControl>
      </Box>

      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Title</TableCell>
              <TableCell>Type</TableCell>
              <TableCell>Status</TableCell>
              <TableCell>Created At</TableCell>
              <TableCell>Response</TableCell>
              <TableCell>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {filteredFeedback.map((item) => (
              <TableRow key={item.id} hover>
                <TableCell>
                  <Tooltip title={item.description} arrow>
                    <span>{item.title}</span>
                  </Tooltip>
                </TableCell>
                <TableCell>{getFeedbackTypeLabel(item.type)}</TableCell>
                <TableCell>
                  <Chip
                    label={getStatusColor(item.status).label}
                    color={getStatusColor(item.status).color}
                    size="small"
                  />
                </TableCell>
                <TableCell>
                  {new Date(item.created_at).toLocaleDateString()}
                </TableCell>
                <TableCell>
                  {item.admin_response ? (
                    <Tooltip title={item.admin_response} arrow>
                      <Chip
                        label="Responded"
                        color="success"
                        size="small"
                      />
                    </Tooltip>
                  ) : (
                    <Chip
                      label="No Response"
                      color="default"
                      size="small"
                    />
                  )}
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
        {selectedFeedback?.status !== 'resolved' && (
          <MenuItem onClick={() => handleStatusUpdate(selectedFeedback?.id, 'resolved')}>
            Mark as Resolved
          </MenuItem>
        )}
        <MenuItem 
          onClick={() => handleDeleteFeedback(selectedFeedback?.id)}
          sx={{ color: 'error.main' }}
        >
          <DeleteIcon sx={{ mr: 1 }} /> Delete
        </MenuItem>
      </Menu>

      <Snackbar
        open={snackbarOpen}
        autoHideDuration={3000}
        onClose={() => setSnackbarOpen(false)}
        anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
      >
        <MuiAlert onClose={() => setSnackbarOpen(false)} severity={snackbarMsg.includes('Failed') ? 'error' : 'success'} sx={{ width: '100%' }}>
          {snackbarMsg}
        </MuiAlert>
      </Snackbar>
    </Box>
  );
} 