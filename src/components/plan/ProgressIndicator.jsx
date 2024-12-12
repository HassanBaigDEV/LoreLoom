import { Box, LinearProgress, Typography } from '@mui/material';
import { motion } from 'framer-motion';
import CheckIcon from '@mui/icons-material/Check'; // Import check icon

export default function ProgressIndicator({ progress, phase }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      className="p-6 bg-white rounded-lg shadow-md"
    >
      <Box className="flex justify-between mb-2">
        <Typography variant="h6" className="text-gray-700">
          Story Planning
        </Typography>
        
        {/* Conditional rendering based on phase */}
        {phase === 'writing' && progress === 100 ? (
          <div className="flex items-center justify-center w-8 h-8 text-white bg-green-500 rounded-full">
            <CheckIcon />
          </div>
        ) : (
          <Typography variant="h6" className="font-bold text-green-500">
            {Math.round(progress)}%
          </Typography>
        )}
      </Box>

      {/* Show progress bar during both planning and writing phases, but hide it if writing phase and progress is 100% */}
      {(phase !== 'writing' || progress < 100) && (
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
      )}
    </motion.div>
  );
}
