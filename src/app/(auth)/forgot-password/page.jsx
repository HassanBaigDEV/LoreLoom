"use client";
import React, { useState } from 'react';
import { Box, Container, TextField, Button, Typography, Alert } from '@mui/material';
import { useRouter } from 'next/navigation';
import apiClient from '@/lib/axios';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');
    setSuccess('');

    try {
      await apiClient.post('/auth/request-password-reset', { email });
      setSuccess('Password reset instructions have been sent to your email.');
      setTimeout(() => router.push('/login'), 3000);
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to send reset instructions');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Container maxWidth="sm">
      <Box
        sx={{
          marginTop: 8,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: 2,
          p: 3,
          borderRadius: 2,
          boxShadow: 3,
          bgcolor: 'background.paper',
        }}
      >
        <Typography component="h1" variant="h5">
          Reset Password
        </Typography>
        
        {error && <Alert severity="error">{error}</Alert>}
        {success && <Alert severity="success">{success}</Alert>}

        <Box component="form" onSubmit={handleSubmit} sx={{ mt: 1, width: '100%' }}>
          <TextField
            margin="normal"
            required
            fullWidth
            id="email"
            label="Email Address"
            name="email"
            autoComplete="email"
            autoFocus
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
          <Button
            type="submit"
            fullWidth
            variant="contained"
            sx={{ 
              mt: 3, 
              mb: 2,
              bgcolor: 'rgb(34 197 94)',
              '&:hover': {
                bgcolor: 'rgb(22 163 74)',
              }
            }}
            disabled={isLoading}
          >
            {isLoading ? 'Sending...' : 'Send Reset Instructions'}
          </Button>
          <Button
            fullWidth
            onClick={() => router.push('/login')}
            sx={{ textTransform: 'none' }}
          >
            Back to Login
          </Button>
        </Box>
      </Box>
    </Container>
  );
} 