
import React from 'react';
import { CrossIcon } from '../../constants/icons';

interface AuthLayoutProps {
  title: string;
  children: React.ReactNode;
}

export const AuthLayout: React.FC<AuthLayoutProps> = ({ title, children }) => {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-100 dark:bg-gray-900/50 py-12 px-4 sm:px-6 lg:px-8 bg-gradient-to-br from-primary to-navy-light">
      <div className="w-full max-w-md space-y-8">
        <div>
            <div className="flex justify-center">
                <CrossIcon className="h-16 w-16 text-secondary" />
            </div>
          <h2 className="mt-6 text-center text-3xl font-bold font-serif tracking-tight text-white">
            {title}
          </h2>
           <p className="mt-2 text-center text-md text-gold-light">
            Church of God Evening Light
          </p>
        </div>
        <div className="bg-white dark:bg-gray-800 shadow-2xl rounded-xl p-8 space-y-6">
            {children}
        </div>
      </div>
    </div>
  );
};
