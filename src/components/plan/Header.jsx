import { AppBar, Toolbar, Typography, IconButton } from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import { useRouter } from 'next/navigation';

export default function PlanHeader() {
  const router = useRouter();

  return (
    <AppBar position="fixed" className="bg-white shadow-md">
      <Toolbar>
        <IconButton edge="start" onClick={() => router.back()} className="text-gray-800">
          <ArrowBackIcon />
        </IconButton>
        <Typography variant="h6" className="text-gray-800 ml-4">
          Story Planning
        </Typography>
      </Toolbar>
    </AppBar>
  );
} 