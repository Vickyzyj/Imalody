"use client";
import React, { useState } from 'react';
import Create from './create';
import Gallery from './gallery';
import { PageView } from '../types';

export default function App() {
  const [currentView, setCurrentView] = useState<PageView>('create');

  return (
    <>
      {currentView === 'create' ? (
        <Create onNavigate={setCurrentView} />
      ) : (
        <Gallery onNavigate={setCurrentView} />
      )}
    </>
  );
}