import axios from 'axios';

// Get the backend URL from your environment variables
// This is the URL from your Render deployment (Step 3) [cite: 33]
const BACKEND_URL = import.meta.env.VITE_BACKEND_API_URL || 'http://localhost:8000';

export const apiClient = axios.create({
  baseURL: BACKEND_URL,
});

// Optional: You can add interceptors here for logging or error handling
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    // Log errors or handle them globally
    console.error('API call error:', error);
    return Promise.reject(error);
  }
);