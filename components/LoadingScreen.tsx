import React from 'react';
import { CrossIcon } from '../constants/icons';

export const LoadingScreen: React.FC = () => {
  return (
    <div className="flex items-center justify-center min-h-screen bg-primary dark:bg-gray-900 text-white">
      <div className="text-center animate-fade-in">
        <div className="relative inline-flex">
          <CrossIcon className="h-24 w-24 text-secondary animate-pulse" />
        </div>
        <h1 className="mt-6 text-3xl font-serif font-bold tracking-wider">Church of God Evening Light</h1>
        <p className="mt-2 text-lg text-gold-light">Loading community...</p>
      </div>
    </div>
  );
};