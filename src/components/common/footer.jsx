"use client";
import { Box, Container, Grid, Typography, Link as MuiLink, Stack } from '@mui/material';
import Link from 'next/link';

const sections = [
  {
    title: 'Company',
    links: [
      { name: 'About', href: '/about' },
      { name: 'Contact', href: '/contact' },
      { name: 'Pricing', href: '/pricing' },
      { name: 'Feedback', href: '/feedback' },
    ],
  },
  {
    title: 'Resources',
    links: [
      { name: 'Blog', href: '/blog' },
      { name: 'Documentation', href: '/docs' },
      { name: 'Help Center', href: '/help' },
    ],
  },
  {
    title: 'Legal',
    links: [
      { name: 'Privacy Policy', href: '/privacy' },
      { name: 'Terms of Service', href: '/terms' },
      { name: 'Cookie Policy', href: '/cookies' },
    ],
  },
];

export default function Footer() {
  return (
    <Box 
      component="footer" 
      sx={{ 
        bgcolor: 'rgb(17 24 39)',
        color: 'white',
        py: 6,
        mt: 'auto',
      }}
    >
      <Container maxWidth="lg">
        <Grid container spacing={4} justifyContent="space-between">
          {sections.map((section) => (
            <Grid item xs={12} sm={6} md={3} key={section.title}>
              <Typography
                variant="subtitle1"
                sx={{
                  fontWeight: 600,
                  mb: 2,
                }}
              >
                {section.title}
              </Typography>
              <Stack spacing={1}>
                {section.links.map((link) => (
                  <MuiLink
                    key={link.name}
                    component={Link}
                    href={link.href}
                    sx={{
                      color: 'grey.400',
                      textDecoration: 'none',
                      '&:hover': {
                        color: 'rgb(34 197 94)',
                      },
                    }}
                  >
                    {link.name}
                  </MuiLink>
                ))}
              </Stack>
            </Grid>
          ))}
        </Grid>

        <Box sx={{ mt: 6, pt: 3, borderTop: '1px solid', borderColor: 'grey.800' }}>
          <Typography
            variant="body2"
            align="center"
            sx={{ color: 'grey.500' }}
          >
            © {new Date().getFullYear()} StoryWeaver. All rights reserved.
          </Typography>
        </Box>
      </Container>
    </Box>
  );
} 