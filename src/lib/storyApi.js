import axios from "axios";

const storyApiClient = axios.create({
  baseURL: process.env.NEXT_PUBLIC_STORY_API_URI || "http://localhost:7777",
  headers: {
    "Content-Type": "application/json",
  },
  timeout: 30000, // 30 second timeout
});

// Add request interceptor for logging and error handling
storyApiClient.interceptors.request.use(
  (config) => {
    // Log the request (only in development)
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
    console.error('Story API Request Error:', error);
    return Promise.reject(error);
  }
);

// Add response interceptor for error handling
storyApiClient.interceptors.response.use(
  (response) => {
    // Check if response contains an error property (your API specific)
    if (response.data && response.data.status_code >= 400) {
      return Promise.reject(new Error(response.data.detail || 'API Error'));
    }
    return response;
  },
  (error) => {
    // Handle specific error cases
    if (error.code === 'ECONNABORTED') {
      throw new Error('Request timeout - please try again');
    }

    if (!error.response) {
      throw new Error('Network error - please check your connection');
    }

    // Handle specific HTTP error codes
    switch (error.response.status) {
      case 400:
        throw new Error(error.response.data.detail || 'Invalid request');
      case 404:
        throw new Error('Resource not found');
      case 500:
        throw new Error('Server error - please try again later');
      default:
        throw new Error('An unexpected error occurred');
    }
  }
);

export default storyApiClient; 