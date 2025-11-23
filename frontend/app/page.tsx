"use client";
import { useState, useRef, ChangeEvent, DragEvent, useEffect } from 'react';

// --- ICONS ---
const CameraIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-cyan-400 mb-4">
    <path d="M14.5 4h-5L7 7H4a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-3l-2.5-3z"/>
    <circle cx="12" cy="13" r="3"/>
  </svg>
);

const MusicIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M9 18V5l12-2v13"/>
    <circle cx="6" cy="18" r="3"/>
    <circle cx="18" cy="16" r="3"/>
  </svg>
);

const PlayIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="currentColor" stroke="none">
    <polygon points="5 3 19 12 5 21 5 3"/>
  </svg>
);

const PauseIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="currentColor" stroke="none">
    <rect x="6" y="4" width="4" height="16"/>
    <rect x="14" y="4" width="4" height="16"/>
  </svg>
);

const VolumeIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/>
    <path d="M19.07 4.93a10 10 0 0 1 0 14.14M15.54 8.46a5 5 0 0 1 0 7.07"/>
  </svg>
);

const SparkleIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="currentColor" className="text-white/80">
    <path d="M12 2L14.4 9.6L22 12L14.4 14.4L12 22L9.6 14.4L2 12L9.6 9.6L12 2Z" />
  </svg>
);

export default function Home() {
  // --- CONFIGURATION START ---
  const IS_LOCAL_DEV = true;
  const API_URL = IS_LOCAL_DEV
    ? "http://127.0.0.1:8080/upload"
    : "https://imalody-backend-147110456749.us-west3.run.app/upload";
  // --- CONFIGURATION END ---

  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [lyrics, setLyrics] = useState<string>("");
  const [audioUrl, setAudioUrl] = useState<string>("");
  const [isError, setIsError] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(false);
  const [isDragging, setIsDragging] = useState(false);
  const [progress, setProgress] = useState(0);

  // Audio Player State
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [duration, setDuration] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    if (!loading) return;

    setProgress(0);
    const startTime = Date.now();

    const interval = setInterval(() => {
      setProgress(() => {
        const elapsedSeconds = Math.floor((Date.now() - startTime) / 1000);

        return elapsedSeconds; // 1 second = +1
      });
    }, 1000); // now it ticks every second

    return () => clearInterval(interval);
  }, [loading]);

  const processFile = (file: File) => {
    setSelectedImage(file);
    setPreviewUrl(URL.createObjectURL(file));
    setLyrics("");
    setAudioUrl("");
    setIsError(false);
    setIsPlaying(false);
  };

  const handleImageChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) processFile(file);
  };

  // Drag and Drop Handlers
  const handleDragOver = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0];
      if (file.type.startsWith('image/')) {
        processFile(file);
      }
    }
  };

  const handleUpload = async () => {
    if (!selectedImage) return;

    setLoading(true);
    setLyrics("");
    setAudioUrl("");
    setIsError(false);
    setIsPlaying(false);

    const formData = new FormData();
    formData.append("file", selectedImage);

    try {
      const response = await fetch(API_URL, {
        method: "POST",
        body: formData,
        mode: "cors",
      });

      const contentType = response.headers.get("content-type");
      if (!contentType || !contentType.includes("application/json")) {
        throw new Error("Backend did not return JSON.");
      }

      const data = await response.json();

      if (response.ok) {
        setLyrics(data.lyrics);
        if (data.song) {
          const url = `data:audio/mp3;base64,${data.song}`;
          setAudioUrl(url);
        }
        setIsError(false);
      } else {
        setLyrics("Error: " + (data.error || "Unknown error"));
        setIsError(true);
        setProgress(100);
        setLoading(false);
      }
    } catch (error) {
      console.error("Upload failed", error);
      setIsError(true);
      const isHttps = typeof window !== "undefined" && window.location.protocol === "https:";
      const isTargetHttp = API_URL.startsWith("http://");

      if (isHttps && isTargetHttp) {
        setLyrics("⚠️ SECURITY ERROR: HTTPS frontend cannot call HTTP backend. Run `npm run dev` locally.");
      } else {
        setLyrics(`Failed to connect to backend. Check logic.`);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setSelectedImage(null);
    setPreviewUrl(null);
    setLyrics("");
    setAudioUrl("");
    setIsError(false);
    setIsPlaying(false);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const togglePlay = () => {
    if (!audioRef.current || !audioUrl) return;
    if (audioRef.current.paused) {
      audioRef.current.play();
    } else {
      audioRef.current.pause();
    }
  };

  const handleTimeUpdate = () => {
    if (audioRef.current) {
      setCurrentTime(audioRef.current.currentTime);
      setDuration(audioRef.current.duration || 0);
    }
  };

  const handleDownload = () => {
    if (!audioUrl) return;
    const link = document.createElement("a");
    link.href = audioUrl;
    link.download = "imalody_song.mp3";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Auto-play when audio is ready
  useEffect(() => {
    if (audioUrl && audioRef.current) {
      audioRef.current.play().catch(err => console.log("Auto-play prevented", err));
    }
  }, [audioUrl]);

  // --- VISUAL HELPERS ---

  const Waveform = () => (
    <div className="flex items-center justify-center gap-1 h-12 w-full">
      {[...Array(20)].map((_, i) => (
        <div
          key={i}
          className={`w-1 bg-gradient-to-t from-cyan-400 to-purple-500 rounded-full transition-all duration-150 ease-in-out`}
          style={{
            height: isPlaying ? `${Math.max(15, Math.random() * 100)}%` : "4px",
            opacity: isPlaying ? 1 : 0.5
          }}
        />
      ))}
    </div>
  );

  return (
    <div className="min-h-screen text-white font-sans selection:bg-cyan-500 selection:text-white relative overflow-hidden flex flex-col">
      
      {/* Background Image / Gradient */}
      <div className="fixed inset-0 -z-10">
         <div className="absolute inset-0 bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900" />
         <div className="absolute top-0 left-0 w-[500px] h-[500px] bg-purple-600/20 rounded-full blur-[100px] pointer-events-none" />
         <div className="absolute bottom-0 right-0 w-[600px] h-[600px] bg-cyan-600/10 rounded-full blur-[120px] pointer-events-none" />
      </div>

      {/* Navbar */}
      <nav className="flex items-center justify-between px-8 py-6 backdrop-blur-sm sticky top-0 z-50 border-b border-white/5">
        <div className="flex items-center gap-3 cursor-pointer" onClick={() => window.location.reload()}>
          <div className="p-2 bg-gradient-to-br from-cyan-500 to-purple-600 rounded-lg shadow-lg shadow-cyan-500/20">
             <MusicIcon />
          </div>
          <span className="text-2xl font-bold tracking-wide bg-clip-text text-transparent bg-gradient-to-r from-cyan-300 to-purple-300">
            Imalody Studio
          </span>
        </div>
        <div className="hidden md:flex gap-8 text-sm font-medium text-white/70">
          {/* <a href="#" className="hover:text-white transition-colors">Home</a> */}
          <a href="#" className="text-white relative after:content-[''] after:absolute after:-bottom-2 after:left-0 after:w-full after:h-0.5 after:bg-cyan-400">Create</a>
          <a href="#" className="hover:text-white transition-colors">Gallery</a>
          {/* <a href="#" className="hover:text-white transition-colors">About</a> */}
        </div>
      </nav>

      {/* Main Content Grid */}
      <main className="flex-1 max-w-7xl mx-auto p-4 md:p-8 grid grid-cols-1 lg:grid-cols-2 gap-8 items-stretch w-full">
        
        {/* LEFT PANEL: INPUT & ANALYSIS */}
        <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl p-8 flex flex-col relative overflow-hidden shadow-2xl transition-all hover:border-white/20">
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-white/20 to-transparent" />
          
          <h2 className="text-sm font-bold text-white/60 mb-6 tracking-widest uppercase">Image Input & Analysis</h2>

          {/* Upload / Preview Zone */}
          <div className="flex-1 flex flex-col justify-center items-center relative group">
            
            {!previewUrl ? (
              <div 
                onClick={() => !loading && fileInputRef.current?.click()}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                className={`w-full h-80 border-2 border-dashed rounded-2xl flex flex-col items-center justify-center cursor-pointer transition-all duration-300 
                  ${isDragging 
                    ? 'border-cyan-400 bg-cyan-400/10 scale-[1.02]' 
                    : 'border-white/20 hover:border-cyan-400/50 hover:bg-white/5'
                  }
                  ${loading ? 'opacity-50 cursor-not-allowed' : ''}`}
              >
                <CameraIcon />
                <p className="text-lg text-white/80 font-medium">Drag & Drop Image</p>
                <p className="text-sm text-white/50 mt-2">or Click to Upload</p>
                <input 
                  type="file" 
                  ref={fileInputRef}
                  onChange={handleImageChange}
                  accept="image/*"
                  className="hidden"
                  disabled={loading}
                />
              </div>
            ) : (
              <div className="relative w-full h-full flex flex-col items-center justify-start">
                {/* Image Preview */}
                <div className="relative rounded-2xl overflow-hidden border border-white/10 shadow-2xl max-h-[400px] w-full bg-black/20">
                  <img 
                    src={previewUrl} 
                    alt="Analysis Target" 
                    className="w-full h-full object-contain max-h-[400px]"
                  />
                  {/* Scanning effect */}
                  {(loading) && (
                    <div className="absolute inset-0 z-10 overflow-hidden">
                      <div className="w-full h-[20%] bg-gradient-to-b from-transparent via-cyan-400/30 to-transparent absolute top-0 left-0 animate-[scan_2s_linear_infinite]" />
                    </div>
                  )}
                </div>

                {/* Action Button (if not loading and no lyrics yet) */}
                {!loading && !lyrics && (
                   <button 
                     onClick={handleUpload}
                     className="mt-8 px-10 py-4 bg-gradient-to-r from-cyan-500 to-blue-600 rounded-full font-bold shadow-lg shadow-cyan-500/30 hover:scale-105 transition-transform flex items-center gap-2 text-white"
                   >
                     <SparkleIcon /> Generate Song
                   </button>
                )}
              </div>
            )}
          </div>

          {/* Progress Bar */}
          {loading && (
            <div className="mt-8 w-full">
              <div className="flex justify-between text-sm text-cyan-300 mb-2">
                <span className="font-medium tracking-wide">Analyzing Visual Vibe...</span>
                <span className="animate-pulse">{progress}s</span>
              </div>
              <div className="h-2 bg-white/10 rounded-full overflow-hidden">
                <div className="h-full bg-gradient-to-r from-purple-500 to-cyan-400 w-[75%] animate-[progress_2s_ease-in-out_infinite]" />
              </div>
            </div>
          )}
        </div>

        {/* RIGHT PANEL: GENERATION & PLAYBACK */}
        <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl p-8 flex flex-col shadow-2xl relative overflow-hidden">
           <h2 className="text-sm font-bold text-white/60 mb-6 tracking-widest uppercase">Song Generation & Playback</h2>

           {/* Lyrics Area */}
           <div className="flex-1 bg-black/20 rounded-2xl p-6 mb-6 border border-white/5 overflow-y-auto scrollbar-thin scrollbar-thumb-white/20 scrollbar-track-transparent min-h-[200px]">
              {lyrics ? (
                <div className={`whitespace-pre-wrap leading-relaxed font-light tracking-wide ${isError ? 'text-red-400' : 'text-white/90'}`}>
                   {isError && <strong className="block mb-2">Error:</strong>}
                   {lyrics}
                </div>
              ) : (
                <div className="h-full flex flex-col items-center justify-center text-white/20 text-center space-y-3">
                  <div className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center">
                    <MusicIcon />
                  </div>
                  <div>
                    <p className="text-lg font-medium">Awaiting Input</p>
                    <p className="text-sm">Upload an image to generate lyrics and melody.</p>
                  </div>
                </div>
              )}
           </div>

           {/* Player Section */}
           <div className={`bg-white/10 rounded-2xl p-6 border border-white/10 backdrop-blur-md transition-opacity duration-500 ${audioUrl ? 'opacity-100' : 'opacity-50 pointer-events-none grayscale'}`}>
              
              {/* Hidden Real Audio Element */}
              {audioUrl && (
                <audio 
                ref={audioRef} 
                src={audioUrl} 
                onTimeUpdate={handleTimeUpdate} 
                onEnded={() => setIsPlaying(false)}
                onPlay={() => setIsPlaying(true)}
                onPause={() => setIsPlaying(false)}
                className="hidden"
              />
              )}

              {/* Waveform Vis */}
              <div className="mb-6 h-16 flex items-center justify-center">
                {audioUrl ? <Waveform /> : <div className="w-full h-[2px] bg-white/10"/>}
              </div>

              {/* Controls */}
              <div className="flex items-center justify-between gap-4">
                 {/* Play/Pause */}
                 <div className="flex items-center gap-4">
                   <button 
                      onClick={togglePlay}
                      disabled={!audioUrl}
                      className={`w-12 h-12 rounded-full flex items-center justify-center transition-all ${
                        audioUrl 
                        ? 'bg-gradient-to-r from-cyan-500 to-purple-600 shadow-lg shadow-purple-500/30 hover:scale-110 text-white' 
                        : 'bg-white/10 text-white/30 cursor-not-allowed'
                      }`}
                   >
                      {isPlaying ? <PauseIcon /> : <PlayIcon />}
                   </button>
                   <div className="text-xs font-bold text-cyan-400 tracking-widest w-16">
                      {isPlaying ? "PLAYING" : "PAUSED"}
                   </div>
                 </div>

                 {/* Progress Scrubber */}
                 <div className="flex-1 mx-4 h-1.5 bg-black/30 rounded-full relative overflow-hidden">
                    <div 
                      className="absolute left-0 top-0 h-full bg-gradient-to-r from-cyan-400 to-purple-500" 
                      style={{ width: duration ? `${(currentTime / duration) * 100}%` : '0%' }}
                    />
                 </div>

                 {/* Volume / Placeholder */}
                 <div className="text-white/50 hover:text-white cursor-pointer transition-colors">
                   <VolumeIcon />
                 </div>
              </div>

              <div className="mt-4 flex justify-between text-xs text-white/40 uppercase tracking-wider border-t border-white/5 pt-4">
                <span>Track: <span className="text-white/70">{lyrics ? "Generated Vibe" : "..."}</span></span>
                <span>Genre: <span className="text-white/70">{lyrics ? "Ambient Electronic" : "..."}</span></span>
              </div>
           </div>

           {/* Footer Buttons */}
           <div className="flex gap-4 mt-6 justify-end">
              <button 
                onClick={handleDownload}
                disabled={!audioUrl}
                className={`px-6 py-2.5 rounded-xl border border-white/20 text-sm font-medium transition-colors ${
                  audioUrl ? 'hover:bg-white/10 text-white shadow-lg' : 'text-white/30 cursor-not-allowed'
                }`}
              >
                Download
              </button>
              <button 
                onClick={handleReset}
                className="px-6 py-2.5 rounded-xl bg-white/10 border border-white/10 text-sm font-medium hover:bg-white/20 transition-all hover:scale-105 text-white shadow-lg backdrop-blur-md"
              >
                Create New
              </button>
           </div>
        </div>
      </main>
      
      <style dangerouslySetInnerHTML={{__html: `
        @keyframes scan {
          0% { top: -20%; }
          100% { top: 120%; }
        }
        @keyframes progress {
          0% { width: 0%; }
          50% { width: 70%; }
          100% { width: 90%; }
        }
      `}} />
    </div>
  );
}