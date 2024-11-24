import { Box, LinearProgress, Typography } from '@mui/material';
import { motion } from 'framer-motion';

export default function ProgressIndicator({ progress }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white rounded-lg shadow-md p-6"
    >
      <Box className="flex justify-between mb-2">
        <Typography variant="h6" className="text-gray-700">
          Story Progress
        </Typography>
        <Typography variant="h6" className="text-green-500 font-bold">
          {Math.round(progress)}%
        </Typography>
      </Box>
      <LinearProgress 
        variant="determinate" 
        value={progress} 
        className="h-2 rounded-full"
        sx={{
          backgroundColor: '#e0e0e0',
          '& .MuiLinearProgress-bar': {
            backgroundColor: '#22c55e'
          }
        }}
      />
    </motion.div>
  );
} 