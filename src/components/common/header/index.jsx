"use client";
import React, { useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/hooks/useAuth';
import {
  AppBar,
  Box,
  Toolbar,
  IconButton,
  Typography,
  Menu,
  MenuItem,
  Button,
  Drawer,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Avatar,
  Divider,
  useMediaQuery,
  useTheme,
  Backdrop,
} from '@mui/material';
import MenuIcon from '@mui/icons-material/Menu';
import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown';
import HomeIcon from '@mui/icons-material/Home';
import FeaturesIcon from '@mui/icons-material/Stars';
import PricingIcon from '@mui/icons-material/Payment';
import InfoIcon from '@mui/icons-material/Info';
import CloseIcon from '@mui/icons-material/Close';

export default function Header() {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const { user, logout } = useAuth();
  
  const [mobileOpen, setMobileOpen] = useState(false);
  const [anchorEl, setAnchorEl] = useState(null);
  const [featuresAnchor, setFeaturesAnchor] = useState(null);
  
  const handleUserMenuClick = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleFeaturesClick = (event) => {
    setFeaturesAnchor(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
    setFeaturesAnchor(null);
  };

  const handleDrawerToggle = () => {
    setMobileOpen(!mobileOpen);
  };

  const navigationItems = [
    { 
      label: 'Features',
      icon: <FeaturesIcon />,
      items: ['AI Story Generation', 'Story Planning', 'Collaboration', 'Export Options'],
      href: '#features'
    },
    { label: 'Pricing', icon: <PricingIcon />, href: '#pricing' },
    { label: 'How it works', icon: <InfoIcon />, href: '/about' },
  ];

  const drawer = (
    <Box 
      sx={{ 
        width: 280,
        height: '100%',
        background: 'rgba(255, 255, 255, 0.9)',
        backdropFilter: 'blur(10px)',
      }} 
      role="presentation"
    >
      <Box sx={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center',
        p: 2,
        borderBottom: '1px solid rgba(0,0,0,0.12)'
      }}>
        <Typography variant="h6" color="primary" sx={{ fontWeight: 700 }}>
          StoryWeaver
        </Typography>
        <IconButton onClick={handleDrawerToggle}>
          <CloseIcon />
        </IconButton>
      </Box>

      <List sx={{ p: 2 }}>
        {navigationItems.map((item) => (
          <React.Fragment key={item.label}>
            {item.items ? (
              <>
                <ListItem sx={{ mb: 1 }}>
                  <ListItemIcon>{item.icon}</ListItemIcon>
                  <ListItemText 
                    primary={item.label}
                    primaryTypographyProps={{ fontWeight: 500 }}
                  />
                </ListItem>
                {item.items.map((subItem) => (
                  <ListItem 
                    key={subItem} 
                    button 
                    sx={{ 
                      pl: 6,
                      mb: 1,
                      borderRadius: 1,
                      '&:hover': {
                        backgroundColor: 'rgba(0,0,0,0.04)'
                      }
                    }}
                    onClick={() => setMobileOpen(false)}
                  >
                    <ListItemText 
                      primary={subItem}
                      primaryTypographyProps={{ fontSize: '0.9rem' }}
                    />
                  </ListItem>
                ))}
              </>
            ) : (
              <ListItem 
                button 
                component={Link} 
                href={item.href}
                onClick={() => setMobileOpen(false)}
                sx={{ 
                  mb: 1,
                  borderRadius: 1,
                  '&:hover': {
                    backgroundColor: 'rgba(0,0,0,0.04)'
                  }
                }}
              >
                <ListItemIcon>{item.icon}</ListItemIcon>
                <ListItemText 
                  primary={item.label}
                  primaryTypographyProps={{ fontWeight: 500 }}
                />
              </ListItem>
            )}
          </React.Fragment>
        ))}
      </List>

      {!user && (
        <Box sx={{ p: 2, mt: 'auto' }}>
          <Button
            component={Link}
            href="/register"
            fullWidth
            variant="contained"
            sx={{ 
              bgcolor: 'rgb(31 41 55)',
              color: 'white',
              py: 1.5,
              '&:hover': {
                bgcolor: 'rgb(55 65 81)',
              }
            }}
          >
            Get Started
          </Button>
        </Box>
      )}
    </Box>
  );

  return (
    <>
      <AppBar position="static" color="transparent" elevation={1}>
        <Toolbar sx={{ justifyContent: 'space-between' }}>
          {/* Logo */}
          <Link href="/" style={{ textDecoration: 'none', color: 'inherit' }}>
            <Typography
              variant="h6"
              noWrap
              sx={{
                fontWeight: 700,
                color: 'rgb(55 65 81)',
              }}
            >
              StoryWeaver
            </Typography>
          </Link>

          {/* Mobile Menu Button */}
          {isMobile ? (
            <IconButton
              color="inherit"
              aria-label="open drawer"
              edge="start"
              onClick={handleDrawerToggle}
              sx={{ 
                display: { md: 'none' },
                color: 'rgb(55 65 81)',
              }}
            >
              <MenuIcon />
            </IconButton>
          ) : (
            <>
              {/* Desktop Navigation */}
              <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
                {navigationItems.map((item) => (
                  <Box key={item.label}>
                    {item.items ? (
                      <>
                        <Button
                          endIcon={<KeyboardArrowDownIcon />}
                          onClick={handleFeaturesClick}
                          sx={{ color: 'rgb(55 65 81)' }}
                        >
                          {item.label}
                        </Button>
                        <Menu
                          anchorEl={featuresAnchor}
                          open={Boolean(featuresAnchor)}
                          onClose={handleClose}
                        >
                          {item.items.map((subItem) => (
                            <MenuItem key={subItem} onClick={handleClose}>
                              {subItem}
                            </MenuItem>
                          ))}
                        </Menu>
                      </>
                    ) : (
                      <Button
                        component={Link}
                        href={item.href}
                        sx={{ color: 'rgb(55 65 81)' }}
                      >
                        {item.label}
                      </Button>
                    )}
                  </Box>
                ))}
              </Box>

              {/* User Menu or Auth Button */}
              <Box>
                {user ? (
                  <>
                    <IconButton onClick={handleUserMenuClick}>
                      <Avatar 
                        src={user.avatar} 
                        alt={user.username}
                        sx={{ width: 32, height: 32 }}
                      >
                        {user.username?.[0]?.toUpperCase()}
                      </Avatar>
                    </IconButton>
                    <Menu
                      anchorEl={anchorEl}
                      open={Boolean(anchorEl)}
                      onClose={handleClose}
                    >
                      <MenuItem 
                        component={Link} 
                        href="/dashboard"
                        onClick={handleClose}
                      >
                        Dashboard
                      </MenuItem>
                      <MenuItem 
                        component={Link} 
                        href="/settings/profile"
                        onClick={handleClose}
                      >
                        Settings
                      </MenuItem>
                      <Divider />
                      <MenuItem onClick={() => {
                        handleClose();
                        logout();
                      }}>
                        Logout
                      </MenuItem>
                    </Menu>
                  </>
                ) : (
                  <Button
                    component={Link}
                    href="/register"
                    variant="contained"
                    sx={{ 
                      bgcolor: 'rgb(31 41 55)',
                      color: 'white',
                      '&:hover': {
                        bgcolor: 'rgb(55 65 81)',
                      }
                    }}
                  >
                    Get Started
                  </Button>
                )}
              </Box>
            </>
          )}
        </Toolbar>
      </AppBar>

      {/* Mobile Drawer with Backdrop */}
      <Drawer
        variant="temporary"
        anchor="right"
        open={mobileOpen}
        onClose={handleDrawerToggle}
        ModalProps={{
          keepMounted: true,
        }}
        PaperProps={{
          sx: {
            width: 280,
            backgroundColor: 'rgba(255, 255, 255, 0.95)',
            backdropFilter: 'blur(10px)',
          }
        }}
        BackdropProps={{
          sx: {
            backgroundColor: 'rgba(0, 0, 0, 0.5)',
            backdropFilter: 'blur(2px)',
          }
        }}
      >
        {drawer}
      </Drawer>
    </>
  );
}
