export type PageView = 'create' | 'gallery';

export interface SongTrack {
  id: string;
  title: string;
  genre: string;
  imageUrl: string;
  audioUrl: string;
  lyrics: string;
  duration: number; // in seconds (mock)
}