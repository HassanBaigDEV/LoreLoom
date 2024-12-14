"use client";
import React, { useState } from 'react';
import Link from 'next/link';
import { Box, Container, Grid, Typography, TextField, Button, IconButton } from '@mui/material';
import InstagramIcon from '@mui/icons-material/Instagram';
import TwitterIcon from '@mui/icons-material/Twitter';
import FacebookIcon from '@mui/icons-material/Facebook';

export default function Footer() {
  const [email, setEmail] = useState('');

  const handleSubscribe = (e) => {
    e.preventDefault();
    console.log('Subscribe:', email);
  };

  return (
    <Box 
      component="footer" 
      sx={{ 
        backgroundColor: 'rgb(31 41 55)',
        color: 'white',
        py: { xs: 6, md: 8 },

      }}
    >
      <Container maxWidth="lg">
        <Grid container spacing={4} alignItems="center">
          {/* Newsletter Form */}
          <Grid item xs={12} md={7}>
            <Typography 
              variant="h4" 
              component="h2" 
              sx={{ 
                fontSize: { xs: '1.5rem', md: '2rem' },
                mb: 4,
                fontWeight: 600,
                maxWidth: '600px'
              }}
            >
              GET UPDATES ON FUN STUFF YOU PROBABLY WANT TO KNOW ABOUT IN YOUR INBOX.
            </Typography>
            
            <Box 
              component="form" 
              onSubmit={handleSubscribe}
              sx={{
                display: 'flex',
                flexDirection: { xs: 'column', sm: 'row' },
                gap: 2,
                maxWidth: '500px'
              }}
            >
              <TextField
                fullWidth
                placeholder="Email address"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                variant="standard"
                sx={{
                  '& .MuiInput-root': {
                    color: 'white',
                  },
                  '& .MuiInput-underline:before': {
                    borderBottomColor: 'rgba(255, 255, 255, 0.42)',
                  },
                  '& .MuiInput-underline:hover:not(.Mui-disabled):before': {
                    borderBottomColor: 'rgba(255, 255, 255, 0.87)',
                  },
                  '& .MuiInput-underline:after': {
                    borderBottomColor: 'white',
                  },
                  '& .MuiInputBase-input::placeholder': {
                    color: 'rgba(255, 255, 255, 0.7)',
                    opacity: 1,
                  },
                }}
              />
              <Button 
                type="submit"
                sx={{ 
                  minWidth: { xs: '100%', sm: '48px' },
                  p: 1,
                  color: 'white',
                  borderRadius: '4px',
                  '&:hover': {
                    backgroundColor: 'rgba(255, 255, 255, 0.1)'
                  }
                }}
              >
                →
              </Button>
            </Box>
          </Grid>

          {/* Navigation Links */}
          <Grid item xs={12} md={5}>
            <Box sx={{ 
              display: 'flex',
              flexDirection: { xs: 'column', sm: 'row' },
              justifyContent: 'space-around',
              gap: 4
            }}>
              <Box>
                <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>Menu</Typography>
                <Box sx={{ 
                  display: 'flex', 
                  flexDirection: 'column', 
                  gap: 1.5,
                  '& a': {
                    color: 'rgba(255, 255, 255, 0.7)',
                    textDecoration: 'none',
                    transition: 'color 0.2s',
                    '&:hover': {
                      color: 'white'
                    }
                  }
                }}>
                  <Link href="/features">Features</Link>
                  <Link href="/subscription">Pricing</Link>
                  <Link href="/about">How it works</Link>
                </Box>
              </Box>

              <Box>
                <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>Support</Typography>
                <Box sx={{ 
                  display: 'flex', 
                  flexDirection: 'column', 
                  gap: 1.5,
                  '& a': {
                    color: 'rgba(255, 255, 255, 0.7)',
                    textDecoration: 'none',
                    transition: 'color 0.2s',
                    '&:hover': {
                      color: 'white'
                    }
                  }
                }}>
                  <Link href="/help">Help & FAQ</Link>
                  <Link href="/terms">Terms & Conditions</Link>
                  <Link href="/privacy">Privacy Policy</Link>
                </Box>
              </Box>
            </Box>
          </Grid>
        </Grid>

        {/* Social Links */}
        <Box sx={{ 
          mt: 6,
          pt: 3,
          borderTop: '1px solid rgba(255, 255, 255, 0.1)',
          display: 'flex',
          justifyContent: 'center',
          gap: 2,
          '& .MuiIconButton-root': {
            color: 'rgba(255, 255, 255, 0.7)',
            transition: 'color 0.2s',
            '&:hover': {
              color: 'white',
              backgroundColor: 'rgba(255, 255, 255, 0.1)'
            }
          }
        }}>
          <IconButton href="https://instagram.com" target="_blank">
            <InstagramIcon />
          </IconButton>
          <IconButton href="https://twitter.com" target="_blank">
            <TwitterIcon />
          </IconButton>
          <IconButton href="https://facebook.com" target="_blank">
            <FacebookIcon />
          </IconButton>
        </Box>
      </Container>
    </Box>
  );
}
