import axios from "axios";
import { toast } from 'react-hot-toast';

const storyApiClient = axios.create({
  baseURL: process.env.NEXT_PUBLIC_STORY_API_URI || "http://localhost:7777",
  headers: {
    "Content-Type": "application/json",
  },
  timeout: 300000, // 5 minutes timeout
});

// Add request interceptor for logging and error handling
storyApiClient.interceptors.request.use(
  (config) => {
    if (process.env.NODE_ENV === 'development') {
      console.log('Story API Request:', {
        url: config.url,
        method: config.method,
        params: config.params,
        data: config.data,
      });
    }
    return config;
  },
  (error) => {
    toast.error('Failed to make request to server');
    console.error('Story API Request Error:', error);
    return Promise.reject(error);
  }
);

// Add response interceptor for error handling
storyApiClient.interceptors.response.use(
  (response) => {
    if (response.data && response.data.status_code >= 400) {
      toast.error(response.data.detail || 'API Error');
      return Promise.reject(new Error(response.data.detail || 'API Error'));
    }
    return response;
  },
  (error) => {
    if (error.code === 'ECONNABORTED') {
      toast.error('Request is taking longer than usual. Please wait...');
      return Promise.reject(new Error('Request timeout - please wait'));
    }

    if (!error.response) {
      toast.error('Network error - please check your connection');
      return Promise.reject(new Error('Network error - please check your connection'));
    }

    // Handle specific HTTP error codes
    switch (error.response.status) {
      case 400:
        toast.error(error.response.data.detail || 'Invalid request');
        break;
      case 404:
        toast.error('Resource not found');
        break;
      case 500:
        toast.error('Server error - please try again later');
        break;
      default:
        toast.error('An unexpected error occurred');
    }
    return Promise.reject(error);
  }
);

export default storyApiClient; 