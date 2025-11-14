import React, { useState, useEffect } from 'react';
import { useTaskPolling } from './hooks/useTaskPolling';
import { apiClient } from './services/apiClient';
import './App.css'; // You can add styles here

// Define the overall state of the application
type AppStep = 'idle' | 'analyzing' | 'editing' | 'generating' | 'done' | 'error';

// --- Placeholder Components (as planned) ---
// You can move these into their own files in src/components/ later

// [cite: 23]
interface ImageUploaderProps {
  onSubmit: (file: File) => void;
  disabled: boolean;
}
const ImageUploader: React.FC<ImageUploaderProps> = ({ onSubmit, disabled }) => {
  const [file, setFile] = useState<File | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (file) {
      onSubmit(file);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      // Here you would add the mandatory client-side compression [cite: 24]
      // For now, we'll just use the file directly.
      setFile(e.target.files[0]);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <input type="file" accept="image/*" onChange={handleChange} disabled={disabled} />
      <button type="submit" disabled={!file || disabled}>Analyze Image</button>
    </form>
  );
};

// [cite: 27]
const StatusIndicator: React.FC<{ status: string | null }> = ({ status }) => {
  return (
    <div className="status-indicator">
      <div className="spinner" />
      <p>Status: {status}...</p>
    </div>
  );
};

// [cite: 31]
const AudioPlayer: React.FC<{ base64Audio: string }> = ({ base64Audio }) => {
  // Your backend will return base64 audio [cite: 83]
  // We need to format it so the <audio> tag can play it.
  // const audioSrc = `data:audio/mpeg;base64,${base64Audio}`;
  // return <audio controls src={audioSrc} />;
  return <audio controls src={base64Audio} />;
};

// --- Main Application Component ---

export const App = () => {
  const [appStep, setAppStep] = useState<AppStep>('idle');
  
  // This is the "Step 2" editable text [cite: 28]
  const [prompt, setPrompt] = useState(''); 
  const [additionalInstructions, setAdditionalInstructions] = useState('');
  
  const [audioResult, setAudioResult] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Use our custom polling hook
  const { status, result, error, startPolling, stopPolling } = useTaskPolling();

  // This effect "listens" to the polling hook and updates the app state
  useEffect(() => {
    if (status === 'complete') {
      if (appStep === 'analyzing') {
        // Step 1 is done, move to Step 2 [cite: 11]
        setPrompt(result); // The description from your mock backend
        setAppStep('editing');
      } else if (appStep === 'generating') {
        // Step 2 is done, move to 'done'
        setAudioResult(result); // The base64 audio from your mock backend
        setAppStep('done');
      }
    } else if (status === 'failed') {
      setErrorMessage(error || 'An unknown error occurred.');
      setAppStep('error');
    }
  }, [status, result, error, appStep]);


  const handleImageSubmit = async (file: File) => {
    setAppStep('analyzing');
    setErrorMessage(null);
    const formData = new FormData();
    formData.append('file', file); // Input name must match your FastAPI endpoint [cite: 49]

    try {
      // Call Endpoint 1 [cite: 48]
      const res = await apiClient.post('/analyze-image', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      startPolling(res.data.task_id); // Start polling the returned task_id [cite: 55]
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to start analysis.');
      setAppStep('error');
    }
  };

  const handleMusicSubmit = async () => {
    setAppStep('generating');
    setErrorMessage(null);
    const finalPrompt = `${prompt} ${additionalInstructions}`; // Combine prompts

    try {
      // Call Endpoint 2 [cite: 57, 58]
      const res = await apiClient.post('/generate-music-from-text', { prompt: finalPrompt });
      startPolling(res.data.task_id); // Start polling the returned task_id [cite: 64]
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to start music generation.');
      setAppStep('error');
    }
  };

  // Resets the app to the beginning
  const handleReset = () => {
    stopPolling();
    setAppStep('idle');
    setPrompt('');
    setAdditionalInstructions('');
    setAudioResult(null);
    setErrorMessage(null);
  };

  // --- Render logic based on the current app step ---
  const renderStep = () => {
    if (appStep === 'idle') {
      return (
        <>
          <h2>1. Upload an Image</h2>
          <ImageUploader onSubmit={handleImageSubmit} disabled={false} />
        </>
      );
    }

    if (appStep === 'analyzing' || appStep === 'generating') {
      return (
        <StatusIndicator status={status} />
      );
    }

    if (appStep === 'editing') {
      return (
        <>
          <h2>2. Edit Your Prompt</h2>
          <p>Analysis complete. You can now edit the description or add instructions.</p>
          <textarea 
            value={prompt} 
            onChange={(e) => setPrompt(e.target.value)}
            rows={5}
            style={{ width: '100%' }}
          />
          <input
            type="text"
            placeholder="Add instructions (e.g., 'make it more orchestral')"
            value={additionalInstructions}
            onChange={(e) => setAdditionalInstructions(e.target.value)}
            style={{ width: '100%', marginTop: '10px' }}
          />
          <button onClick={handleMusicSubmit} style={{ marginTop: '10px' }}>
            Generate Music
          </button>
        </>
      );
    }
    
    if (appStep === 'done') {
      return (
        <>
          <h2>Generation Complete!</h2>
          <AudioPlayer base64Audio={audioResult!} /> {/* [cite: 31] */}
          <button onClick={handleReset} style={{ marginTop: '10px' }}>
            Start Over
          </button>
        </>
      );
    }

    if (appStep === 'error') {
      return (
        <>
          <h2>An Error Occurred</h2>
          <p style={{ color: 'red' }}>{errorMessage}</p>
          <button onClick={handleReset} style={{ marginTop: '10px' }}>
            Try Again
          </button>
        </>
      );
    }
    
    return null;
  };

  return (
    <div className="App">
      <header className="App-header">
        <h1>[Under Construction]</h1>
        {renderStep()}
      </header>
    </div>
  );
};

// We export 'App' as default, but you can change this if needed
export default App;