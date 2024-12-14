"use client";
import React, { useState } from 'react';
import {
  AppBar,
  Box,
  Toolbar,
  IconButton,
  Typography,
  Menu,
  MenuItem,
  Button,
  Container,
  Avatar,
  Tooltip,
  Stack,
  useScrollTrigger,
  Fade,
  Drawer,
  List,
  ListItem,
  ListItemText,
  Divider,
} from '@mui/material';
import {
  Menu as MenuIcon,
  Close as CloseIcon,
  KeyboardArrowDown as ArrowDownIcon,
} from '@mui/icons-material';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import Logo from './logo';

const publicPages = [
  { name: 'Discover', href: '/discover' },
  { name: 'About', href: '/about' },
  { name: 'Pricing', href: '/subscription' },
  { name: 'Contact', href: '/contact' },
];

const userPages = [
  { name: 'Dashboard', href: '/dashboard' },
  { name: 'Create Story', href: '/create' },
];

function Header() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [anchorElUser, setAnchorElUser] = useState(null);
  const { user, logout } = useAuth();
  const router = useRouter();
  const trigger = useScrollTrigger({
    disableHysteresis: true,
    threshold: 0,
  });

  const handleOpenUserMenu = (event) => setAnchorElUser(event.currentTarget);
  const handleCloseUserMenu = () => setAnchorElUser(null);

  const handleLogout = async () => {
    await logout();
    handleCloseUserMenu();
    router.push('/');
  };

  const toggleMobileMenu = () => setMobileMenuOpen(!mobileMenuOpen);

  return (
    <AppBar 
      position="fixed" 
      elevation={trigger ? 4 : 0}
      sx={{
        bgcolor: 'rgb(17 24 39)',
        borderBottom: trigger ? 'none' : '1px solid rgba(255, 255, 255, 0.1)',
        transition: 'all 0.3s ease-in-out',
      }}
    >
      <Container maxWidth="xl">
        <Toolbar disableGutters sx={{ height: 70 }}>
          {/* Desktop Logo */}
          <Box sx={{ display: { xs: 'none', md: 'flex' }, mr: 4 }}>
            <Link href="/" style={{ textDecoration: 'none', display: 'flex', alignItems: 'center' }}>
              <Logo />
            </Link>
          </Box>

          {/* Mobile Menu Button */}
          <Box sx={{ display: { xs: 'flex', md: 'none' } }}>
            <IconButton
              size="large"
              onClick={toggleMobileMenu}
              color="inherit"
            >
              {mobileMenuOpen ? <CloseIcon /> : <MenuIcon />}
            </IconButton>
          </Box>

          {/* Mobile Logo */}
          <Box sx={{ flexGrow: 1, display: { xs: 'flex', md: 'none' }, justifyContent: 'center' }}>
            <Link href="/" style={{ textDecoration: 'none', display: 'flex', alignItems: 'center' }}>
              <Logo />
            </Link>
          </Box>

          {/* Desktop Navigation - Centered */}
          <Box sx={{ 
            flexGrow: 1, 
            display: { xs: 'none', md: 'flex' }, 
            justifyContent: 'center',
            gap: 4
          }}>
            {publicPages.map((page) => (
              <Button
                key={page.name}
                component={Link}
                href={page.href}
                sx={{
                  color: 'white',
                  '&:hover': {
                    color: 'rgb(34 197 94)',
                  },
                }}
              >
                {page.name}
              </Button>
            ))}
            {user && userPages.map((page) => (
              <Button
                key={page.name}
                component={Link}
                href={page.href}
                sx={{
                  color: 'white',
                  '&:hover': {
                    color: 'rgb(34 197 94)',
                  },
                }}
              >
                {page.name}
              </Button>
            ))}
          </Box>

          {/* Auth Buttons / User Menu */}
          <Box sx={{ flexShrink: 0 }}>
            {user ? (
              <>
                <Tooltip title="Account settings">
                  <IconButton onClick={handleOpenUserMenu} sx={{ p: 0 }}>
                    <Avatar 
                      alt={user.username}
                      src={user?.photo}
                      sx={{
                        bgcolor: 'rgb(34 197 94)',
                        border: '2px solid',
                        borderColor: 'rgba(255, 255, 255, 0.3)',
                        width: 40,
                        height: 40,
                      }}
                    >
                      {!user.photo && user.username?.[0]?.toUpperCase()}
                    </Avatar>
                  </IconButton>
                </Tooltip>
                <Menu
                  anchorEl={anchorElUser}
                  open={Boolean(anchorElUser)}
                  onClose={handleCloseUserMenu}
                  sx={{
                    '& .MuiPaper-root': {
                      borderRadius: 2,
                      mt: 1.5,
                      minWidth: 180,
                    }
                  }}
                >
                  <MenuItem onClick={() => router.push('/profile')}>
                    Profile
                  </MenuItem>
                  <MenuItem onClick={() => router.push('/subscription')}>
                    Subscription
                  </MenuItem>
                  <Divider />
                  <MenuItem onClick={handleLogout} sx={{ color: 'error.main' }}>
                    Logout
                  </MenuItem>
                </Menu>
              </>
            ) : (
              <Stack direction="row" spacing={1}>
                <Button
                  component={Link}
                  href="/login"
                  variant="text"
                  sx={{
                    color: 'white',
                    '&:hover': {
                      color: 'rgb(34 197 94)',
                    },
                  }}
                >
                  Login
                </Button>
                <Button
                  component={Link}
                  href="/register"
                  variant="contained"
                  sx={{
                    bgcolor: 'rgb(34 197 94)',
                    '&:hover': {
                      bgcolor: 'rgb(22 163 74)',
                    },
                  }}
                >
                  Get Started
                </Button>
              </Stack>
            )}
          </Box>
        </Toolbar>
      </Container>

      {/* Mobile Menu Drawer */}
      <Drawer
        anchor="left"
        open={mobileMenuOpen}
        onClose={toggleMobileMenu}
        sx={{
          '& .MuiDrawer-paper': {
            width: '80%',
            maxWidth: 300,
            bgcolor: 'rgb(17 24 39)',
            color: 'white',
          },
        }}
      >
        <Box sx={{ p: 2 }}>
          <Logo />
        </Box>
        <Divider sx={{ borderColor: 'rgba(255, 255, 255, 0.1)' }} />
        <List>
          {publicPages.map((page) => (
            <ListItem 
              key={page.name}
              component={Link}
              href={page.href}
              onClick={toggleMobileMenu}
              sx={{
                '&:hover': {
                  color: 'rgb(34 197 94)',
                },
              }}
            >
              <ListItemText primary={page.name} />
            </ListItem>
          ))}
          {user && (
            <>
              <Divider sx={{ borderColor: 'rgba(255, 255, 255, 0.1)', my: 1 }} />
              {userPages.map((page) => (
                <ListItem 
                  key={page.name}
                  component={Link}
                  href={page.href}
                  onClick={toggleMobileMenu}
                  sx={{
                    '&:hover': {
                      color: 'rgb(34 197 94)',
                    },
                  }}
                >
                  <ListItemText primary={page.name} />
                </ListItem>
              ))}
            </>
          )}
        </List>
        {!user && (
          <Box sx={{ p: 2, mt: 'auto' }}>
            <Button
              fullWidth
              variant="contained"
              component={Link}
              href="/register"
              sx={{
                bgcolor: 'rgb(34 197 94)',
                mb: 1,
                '&:hover': {
                  bgcolor: 'rgb(22 163 74)',
                },
              }}
            >
              Get Started
            </Button>
            <Button
              fullWidth
              variant="outlined"
              component={Link}
              href="/login"
              sx={{
                color: 'white',
                borderColor: 'white',
                '&:hover': {
                  borderColor: 'rgb(34 197 94)',
                  color: 'rgb(34 197 94)',
                },
              }}
            >
              Login
            </Button>
          </Box>
        )}
      </Drawer>
    </AppBar>
  );
}

export default Header; 