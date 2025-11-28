"use client";
import React, { useState, useRef, useEffect } from 'react';
import { PageView, SongTrack } from '../types';

interface GalleryProps {
  onNavigate: (view: PageView) => void;
}

// --- MOCK DATA ---
const GALLERY_TRACKS: SongTrack[] = [
  {
    id: '1',
    title: 'Puppy',
    genre: 'Pop',
    imageUrl: 'https://storage.cloud.google.com/imalody_temp_image/Puppy.webp', // Moody beach/rocks
    audioUrl: 'https://storage.cloud.google.com/imalody_temp_image/Puppy.mp3', // Soft ambient
    lyrics: "In eyes so dark,\nA tale is told.\nA longing in love,\nthat's grown old.",
    duration: 60
  },
  {
    id: '2',
    title: 'The Observer',
    genre: 'Pop',
    imageUrl: 'https://storage.cloud.google.com/imalody_temp_image/boy.png', // Forest
    audioUrl: 'https://storage.cloud.google.com/imalody_temp_image/boy.mp3', // Nature vibe
    lyrics: "I stand on the edge,\nWith the city below.\nA young heart beating,\nWith a view to know.",
    duration: 60
  },
  {
    id: '3',
    title: 'A Day in the Zoo',
    genre: 'Pop',
    imageUrl: 'https://storage.cloud.google.com/imalody_temp_image/zoo.png', // City
    audioUrl: 'https://storage.cloud.google.com/imalody_temp_image/zoo.mp3', // Relaxed
    lyrics: "I'm excited to be here today,\nAt the zoo I'm on my way.\nMom pushes me and my stroller too,\nI'm wearing my hat,\nIt's red and new.",
    duration: 60
  },
  {
    id: '4',
    title: 'Mountain Echos',
    genre: 'Pop',
    imageUrl: 'https://storage.cloud.google.com/imalody_temp_image/lake_in_the_mountain.jpg', // Water/Abstract
    audioUrl: 'https://storage.cloud.google.com/imalody_temp_image/lake_in_the_mountain.mp3', // Rhythmic
    lyrics: "In the heart of the mountains,\nWith the snow meets the sky. \nThe lake's calm, so serene, \nA sight to catch the eye.",
    duration: 60
  },
  {
    id: '5',
    title: 'Exodus',
    genre: 'Classic',
    imageUrl: 'https://storage.cloud.google.com/imalody_temp_image/Exodus.jpeg', // Texture
    audioUrl: 'https://storage.cloud.google.com/imalody_temp_image/Exodus.mp3', // Gritty
    lyrics: "In the depth of darkness,\nA light shines through,\nA path unfolding,\nFor me and you.",
    duration: 60
  },
  {
    id: '6',
    title: 'Venus',
    genre: 'Classic',
    imageUrl: 'https://storage.cloud.google.com/imalody_temp_image/Venus.jpg', // Warm tone
    audioUrl: 'https://storage.cloud.google.com/imalody_temp_image/Venus.mp3', // Gentle
    lyrics: "In the Garden of Eden's delight,\nTwo figures dance under the story light.\nTheir bodies entwined -- a world so free, \nAs flowers fall like tears from the sea.",
    duration: 60
  }
];

// --- ICONS (Reused) ---
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

const EqualizerIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="currentColor" className="animate-pulse">
    <rect x="4" y="10" width="4" height="10" />
    <rect x="10" y="6" width="4" height="14" />
    <rect x="16" y="12" width="4" height="8" />
  </svg>
);

export default function Gallery({ onNavigate }: GalleryProps) {
  const [currentTrack, setCurrentTrack] = useState<SongTrack>(GALLERY_TRACKS[0]);
  const [isPlaying, setIsPlaying] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  
  // Player state
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(1);

  // Switch track handler
  const handleTrackSelect = (track: SongTrack) => {
    if (track.id === currentTrack.id) {
        // Toggle play if same track
        togglePlay();
    } else {
        setCurrentTrack(track);
        setIsPlaying(true); // Auto play new track
    }
  };

  useEffect(() => {
    if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.load();
        if (isPlaying) {
            audioRef.current.play().catch(e => console.warn("Autoplay blocked", e));
        }
    }
  }, [currentTrack]);

  useEffect(() => {
    if (audioRef.current) {
        if (isPlaying) audioRef.current.play().catch(() => setIsPlaying(false));
        else audioRef.current.pause();
    }
  }, [isPlaying]);

  useEffect(() => {
      if (audioRef.current) {
          audioRef.current.volume = volume;
      }
  }, [volume]);

  const togglePlay = () => setIsPlaying(!isPlaying);

  const handleTimeUpdate = () => {
    if (audioRef.current) {
        setCurrentTime(audioRef.current.currentTime);
        setDuration(audioRef.current.duration || 0);
    }
  };

  const Waveform = () => (
    <div className="flex items-center justify-center gap-1 h-12 w-full">
      {[...Array(24)].map((_, i) => (
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
       {/* Background (Consistent with Create) */}
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
          <button onClick={() => onNavigate('create')} className="hover:text-white transition-colors">Create</button>
          <button onClick={() => onNavigate('gallery')} className="text-white relative after:content-[''] after:absolute after:-bottom-2 after:left-0 after:w-full after:h-0.5 after:bg-cyan-400">Gallery</button>
        </div>
      </nav>

      {/* Main Content */}
      <main className="flex-1 max-w-7xl mx-auto p-4 md:p-8 w-full flex flex-col lg:flex-row gap-8">
        
        {/* LEFT COLUMN: The Gallery Grid */}
        <div className="lg:w-2/3 grid grid-cols-2 md:grid-cols-3 gap-4 auto-rows-min">
            {GALLERY_TRACKS.map((track) => {
                const isActive = currentTrack.id === track.id;
                return (
                    <div 
                        key={track.id}
                        onClick={() => handleTrackSelect(track)}
                        className={`
                            relative group cursor-pointer rounded-2xl overflow-hidden aspect-square border transition-all duration-300
                            ${isActive ? 'border-cyan-400 ring-2 ring-cyan-400/20 scale-[1.02] shadow-2xl shadow-cyan-900/50' : 'border-white/10 hover:border-white/30 hover:scale-[1.01]'}
                        `}
                    >
                        <img 
                            src={track.imageUrl} 
                            alt={track.title} 
                            className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" 
                        />
                        <div className={`absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-60 group-hover:opacity-80 transition-opacity`} />
                        
                        {/* Status Icon */}
                        <div className="absolute top-3 right-3">
                             {isActive && isPlaying ? (
                                <div className="bg-cyan-500/90 p-2 rounded-full text-white shadow-lg backdrop-blur-md">
                                    <div className="w-4 h-4 flex items-center justify-center">
                                        <div className="w-1 h-full bg-white animate-[bounce_1s_infinite] mx-[1px]" />
                                        <div className="w-1 h-3/4 bg-white animate-[bounce_1.2s_infinite] mx-[1px]" />
                                        <div className="w-1 h-1/2 bg-white animate-[bounce_0.8s_infinite] mx-[1px]" />
                                    </div>
                                </div>
                             ) : null}
                        </div>

                        {/* Text Overlay */}
                        <div className="absolute bottom-0 left-0 w-full p-4 transform translate-y-2 group-hover:translate-y-0 transition-transform">
                            <h3 className={`font-bold text-lg leading-tight ${isActive ? 'text-cyan-300' : 'text-white'}`}>{track.title}</h3>
                            <p className="text-xs text-white/60 uppercase tracking-wider mt-1">{track.genre}</p>
                        </div>
                    </div>
                );
            })}
        </div>

        {/* RIGHT COLUMN: The Sticky Player */}
        <div className="lg:w-1/3">
            <div className="sticky top-28 bg-white/5 backdrop-blur-2xl border border-white/10 rounded-3xl p-6 shadow-2xl flex flex-col h-[calc(100vh-140px)]">
                
                {/* Header */}
                <h2 className="text-xs font-bold text-white/40 tracking-[0.2em] uppercase mb-4 flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse"></span>
                    Now Playing
                </h2>

                {/* Album Art (Active) */}
                <div className="relative aspect-square w-full rounded-2xl overflow-hidden shadow-lg border border-white/10 mb-6 group">
                    <img 
                        src={currentTrack.imageUrl} 
                        alt={currentTrack.title} 
                        className={`w-full h-full object-cover transition-transform duration-[10s] ease-linear ${isPlaying ? 'scale-110' : 'scale-100'}`}
                    />
                     <div className="absolute inset-0 bg-black/10 group-hover:bg-black/0 transition-colors" />
                </div>

                {/* Track Info */}
                <div className="mb-6">
                    <h1 className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-white via-cyan-100 to-white/80 mb-1">{currentTrack.title}</h1>
                    <p className="text-cyan-400/80 font-medium tracking-wide">{currentTrack.genre}</p>
                </div>

                {/* Waveform */}
                <div className="mb-6">
                    <Waveform />
                </div>

                {/* Controls */}
                <div className="flex flex-col gap-4">
                     {/* Scrubber */}
                     <div className="w-full h-1 bg-white/10 rounded-full overflow-hidden">
                        <div 
                            className="h-full bg-gradient-to-r from-cyan-400 to-purple-500 transition-all duration-100 ease-linear"
                            style={{ width: duration ? `${(currentTime / duration) * 100}%` : '0%' }} 
                        />
                     </div>
                     <div className="flex justify-between text-xs text-white/30 font-mono">
                        <span>{Math.floor(currentTime)}s</span>
                        <span>{Math.floor(duration)}s</span>
                     </div>

                    {/* Buttons */}
                    <div className="flex items-center justify-between mt-2">
                         <div className="flex items-center gap-4">
                            <button 
                                onClick={togglePlay}
                                className="w-14 h-14 flex items-center justify-center rounded-full bg-gradient-to-r from-cyan-500 to-blue-600 text-white shadow-lg shadow-cyan-500/30 hover:scale-105 transition-transform"
                            >
                                {isPlaying ? <PauseIcon /> : <PlayIcon />}
                            </button>
                            <div className="flex flex-col">
                                <span className="text-xs font-bold text-white/80 uppercase tracking-widest">{isPlaying ? 'Playing' : 'Paused'}</span>
                            </div>
                         </div>
                         
                         {/* Simple Volume */}
                         <div className="flex items-center gap-2 text-white/40 hover:text-white transition-colors">
                            <VolumeIcon />
                            <input 
                                type="range" 
                                min="0" max="1" step="0.05"
                                value={volume}
                                onChange={(e) => setVolume(parseFloat(e.target.value))}
                                className="w-20 h-1 bg-white/20 rounded-lg appearance-none cursor-pointer accent-cyan-400"
                            />
                         </div>
                    </div>
                </div>

                {/* Lyrics / Story */}
                <div className="mt-8 flex-1 overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-white/10 hover:scrollbar-thumb-white/20">
                    <h3 className="text-xs font-bold text-white/30 uppercase mb-3">Generated Lyrics</h3>
                    <p className="text-white/70 whitespace-pre-line leading-relaxed font-light text-sm italic">
                        "{currentTrack.lyrics}"
                    </p>
                </div>
            </div>
        </div>
      </main>

      {/* Hidden Audio Element */}
      <audio 
        ref={audioRef}
        src={currentTrack.audioUrl}
        onTimeUpdate={handleTimeUpdate}
        onEnded={() => setIsPlaying(false)}
      />

    </div>
  );
}