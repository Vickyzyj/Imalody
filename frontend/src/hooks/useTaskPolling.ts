import { useState, useEffect, useRef } from 'react';
// Import the apiClient we just configured
import { apiClient } from '../services/apiClient';

// Define the possible statuses based on your backend plan
type TaskStatus = 'pending' | 'analyzing' | 'generating_music' | 'complete' | 'failed';

interface TaskState {
  status: TaskStatus | null;
  result: any; // Can be a string (description) or audio data
  error: string | null;
}

/**
 * A custom hook to manage the polling for a long-running backend task.
 */
export const useTaskPolling = () => {
  const [task, setTask] = useState<TaskState>({
    status: null,
    result: null,
    error: null,
  });
  
  // Use a ref to store the interval ID so it can be cleared
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  // This function clears the interval
  const stopPolling = () => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  };

  /**
   * Starts the polling process for a given task ID.
   * @param taskId The ID of the task to poll, received from /analyze-image or /generate-music
   */
  const startPolling = (taskId: string) => {
    // Reset state for a new task
    setTask({ status: 'pending', result: null, error: null });
    
    // Stop any previous polling that might be running
    stopPolling();

    // Start a new polling interval
    intervalRef.current = setInterval(async () => {
      try {
        // As per your plan, call the status endpoint [cite: 67]
        const response = await apiClient.get(`/status/${taskId}`);
        
        const { status, result, error } = response.data;

        // Update our state with the latest from the backend
        setTask({ status, result, error });

        // If the task is finished, stop polling 
        if (status === 'complete' || status === 'failed') {
          stopPolling();
          // As per your plan, the backend deletes the task [cite: 75]
          // so we don't need to do anything else.
        }
      } catch (err: any) {
        console.error('Polling error:', err);
        setTask({
          status: 'failed',
          result: null,
          error: err.message || 'Failed to get task status',
        });
        stopPolling();
      }
    }, 2500); // Polls every 2.5 seconds, as planned [cite: 26]
  };

  // Cleanup effect: ensures polling stops if the component unmounts
  useEffect(() => {
    // This is the cleanup function that runs when the component is unmounted
    return () => stopPolling();
  }, []); // The empty array means this runs only once on mount/unmount

  return { ...task, startPolling, stopPolling };
};