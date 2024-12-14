"use client";
import { useEffect, useState } from 'react';
import { 
  Container, 
  Typography, 
  Box, 
  Breadcrumbs,
  Link as MuiLink,
  useTheme,
  useMediaQuery,
  Fade,
} from '@mui/material';
import FeedbackForm from '@/components/feedback/FeedbackForm';
import FeedbackHistory from '@/components/feedback/FeedbackHistory';
import { feedbackService } from '@/lib/feedbackService';
import ProtectedRoute from '@/components/auth/ProtectedRoute';
import Link from 'next/link';
import { Home as HomeIcon } from '@mui/icons-material';

export default function FeedbackPage() {
  const [feedback, setFeedback] = useState([]);
  const [loading, setLoading] = useState(true);
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  const fetchFeedback = async () => {
    try {
      const data = await feedbackService.getMyFeedback();
      setFeedback(data);
    } catch (error) {
      console.error('Error fetching feedback:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFeedback();
  }, []);

  return (
    <ProtectedRoute>
      <Box 
        sx={{ 
          minHeight: '100vh',
          bgcolor: 'grey.50',
          pt: { xs: 2, sm: 4 },
          pb: { xs: 4, sm: 6 },
        }}
      >
        <Container maxWidth="lg">
          {/* Breadcrumbs */}
          <Breadcrumbs 
            sx={{ mb: 4, px: 2 }}
            separator="›"
            aria-label="breadcrumb"
          >
            <MuiLink
              component={Link}
              href="/"
              sx={{ 
                display: 'flex', 
                alignItems: 'center',
                color: 'text.secondary',
                textDecoration: 'none',
                '&:hover': { color: 'primary.main' }
              }}
            >
              <HomeIcon sx={{ mr: 0.5 }} fontSize="small" />
              Home
            </MuiLink>
            <Typography color="text.primary">Feedback</Typography>
          </Breadcrumbs>

          {/* Page Header */}
          <Box 
            sx={{ 
              mb: { xs: 3, sm: 5 },
              px: 2,
              textAlign: { xs: 'left', sm: 'center' }
            }}
          >
            <Typography 
              variant="h3" 
              component="h1" 
              gutterBottom
              sx={{ 
                fontSize: { xs: '2rem', sm: '2.5rem' },
                fontWeight: 700,
                color: 'text.primary'
              }}
            >
              Share Your Feedback
            </Typography>
            <Typography 
              variant="subtitle1" 
              color="text.secondary"
              sx={{ 
                maxWidth: '600px',
                mx: { xs: 0, sm: 'auto' },
                mb: { xs: 3, sm: 5 }
              }}
            >
              Help us improve your experience by sharing your thoughts, reporting issues, or suggesting new features.
            </Typography>
          </Box>

          {/* Content Grid */}
          <Box
            sx={{
              display: 'grid',
              gap: 4,
              gridTemplateColumns: { xs: '1fr', lg: '1fr 1fr' },
              alignItems: 'start',
            }}
          >
            {/* Feedback Form */}
            <Fade in={true} timeout={500}>
              <Box>
                <FeedbackForm onSubmitSuccess={fetchFeedback} />
              </Box>
            </Fade>

            {/* Feedback History */}
            <Fade in={true} timeout={500} style={{ transitionDelay: '250ms' }}>
              <Box>
                {!loading && <FeedbackHistory feedback={feedback} />}
              </Box>
            </Fade>
          </Box>
        </Container>
      </Box>
    </ProtectedRoute>
  );
} 