import { AppBar, Toolbar, Typography, IconButton } from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import MenuIcon from '@mui/icons-material/Menu'; // For sidebar toggle
import { useRouter } from 'next/navigation';

export default function PlanHeader({ toggleSidebar, stage }) {
  const router = useRouter();

  return (
    <AppBar position="fixed" className="bg-white shadow-md">
      <Toolbar className="flex items-center justify-between">
        {/* Back Button */}
        <IconButton edge="start" onClick={() => router.back()} className="text-gray-800">
          <ArrowBackIcon />
        </IconButton>
        
        {/* Title based on the stage */}
        <Typography variant="h6" className="text-gray-800">
          {stage === 'writing' ? 'Story Writing' : 'Story Planning'}
        </Typography>

        {/* Sidebar Toggle Button */}
        <IconButton edge="end" onClick={toggleSidebar} className="text-gray-800">
          <MenuIcon />
        </IconButton>
      </Toolbar>
    </AppBar>
  );
}
