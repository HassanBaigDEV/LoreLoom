"use client";
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { 
  Stepper, 
  Step, 
  StepLabel, 
  Button, 
  Typography,
  Box,
  Paper,
  CircularProgress
} from '@mui/material';
import storyApiClient from '@/lib/storyApi';

const steps = ['Title', 'Premise', 'Setting', 'Characters', 'Outline'];

export default function PlanStory({ params }) {
  const router = useRouter();
  const { storyId } = params;
  const [activeStep, setActiveStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [storyData, setStoryData] = useState({
    title: '',
    premise: '',
    setting: '',
    characters: [],
    outline: []
  });

  const generateContent = async () => {
    setLoading(true);
    setError('');
    
    try {
      const user = JSON.parse(localStorage.getItem('user'));
      if (!user?.id) throw new Error('User not found');

      let response;
      switch (activeStep) {
        case 0:
          response = await storyApiClient.get(`/plan/generate-title/${storyId}`, {
            params: { user_id: user.id }
          });
          setStoryData(prev => ({ ...prev, title: response.data }));
          break;
        case 1:
          response = await storyApiClient.get(`/plan/generate-premise/${storyId}`, {
            params: { user_id: user.id }
          });
          setStoryData(prev => ({ ...prev, premise: response.data }));
          break;
        case 2:
          response = await storyApiClient.get(`/plan/generate-setting/${storyId}`, {
            params: { user_id: user.id }
          });
          setStoryData(prev => ({ ...prev, setting: response.data }));
          break;
        case 3:
          response = await storyApiClient.get(`/plan/generate-characters/${storyId}`, {
            params: { user_id: user.id }
          });
          setStoryData(prev => ({ ...prev, characters: response.data }));
          break;
        case 4:
          response = await storyApiClient.get(`/plan/generate-full-outline/${storyId}`, {
            params: { 
              user_id: user.id,
              max_depth: 3
            }
          });
          setStoryData(prev => ({ ...prev, outline: response.data }));
          break;
      }
    } catch (err) {
      console.error('Error generating content:', err);
      setError('Failed to generate content. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleNext = () => {
    setActiveStep((prevStep) => prevStep + 1);
  };

  const handleBack = () => {
    setActiveStep((prevStep) => prevStep - 1);
  };

  const renderStepContent = () => {
    const content = storyData[Object.keys(storyData)[activeStep]];
    
    return (
      <Paper elevation={3} className="p-6 mt-8">
        {loading ? (
          <div className="flex justify-center items-center h-40">
            <CircularProgress />
          </div>
        ) : content ? (
          <Typography variant="body1" className="whitespace-pre-line">
            {typeof content === 'string' ? content : JSON.stringify(content, null, 2)}
          </Typography>
        ) : (
          <Button
            variant="contained"
            color="primary"
            onClick={generateContent}
            className="bg-green-500 hover:bg-green-600"
          >
            Generate {steps[activeStep]}
          </Button>
        )}
      </Paper>
    );
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8"
    >
      <div className="max-w-4xl mx-auto">
        <Box className="bg-white rounded-lg shadow-lg p-8">
          <Stepper activeStep={activeStep} alternativeLabel>
            {steps.map((label) => (
              <Step key={label}>
                <StepLabel>{label}</StepLabel>
              </Step>
            ))}
          </Stepper>

          {renderStepContent()}

          {error && (
            <Typography color="error" className="mt-4">
              {error}
            </Typography>
          )}

          <Box className="mt-8 flex justify-between">
            <Button
              variant="outlined"
              disabled={activeStep === 0}
              onClick={handleBack}
            >
              Back
            </Button>
            <Button
              variant="contained"
              onClick={activeStep === steps.length - 1 ? () => router.push('/dashboard') : handleNext}
              disabled={!storyData[Object.keys(storyData)[activeStep]]}
              className="bg-green-500 hover:bg-green-600"
            >
              {activeStep === steps.length - 1 ? 'Finish' : 'Next'}
            </Button>
          </Box>
        </Box>
      </div>
    </motion.div>
  );
} 