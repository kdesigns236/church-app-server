import React from 'react';
import ReactDOM from 'react-dom/client';
import './src/index.css';
import App from './App';
import { ThemeProvider } from './context/ThemeContext';
import { AppProvider } from './context/AppContext';
import { AuthProvider } from './context/AuthContext';
import { storageService } from './services/storageService';
import { videoStorageService } from './services/videoStorageService';
import * as serviceWorkerRegistration from './serviceWorkerRegistration';
import ErrorBoundary from './components/ErrorBoundary';

// Add global error handler
window.onerror = function(message, source, lineno, colno, error) {
  console.error('Global error:', { message, source, lineno, colno, error });
  alert(`App Error: ${message}\nFile: ${source}\nLine: ${lineno}`);
  return false;
};

console.log('[App] Starting Church of God Evening Light App...');
console.log('[App] API URL:', (import.meta as any).env?.VITE_API_URL || 'https://church-app-server.onrender.com/api');

const rootElement = document.getElementById('root');
if (!rootElement) {
  console.error('[App] Root element not found!');
  throw new Error("Could not find root element to mount to");
}

console.log('[App] Root element found, rendering app...');

const root = ReactDOM.createRoot(rootElement);
root.render(
  <React.StrictMode>
    <ErrorBoundary>
      <ThemeProvider>
        <AuthProvider>
          <AppProvider>
            <App />
          </AppProvider>
        </AuthProvider>
      </ThemeProvider>
    </ErrorBoundary>
  </React.StrictMode>
);

// Initialize storage services
storageService.initialize().then(() => {
  console.log('[Storage] Storage service initialized');
});

// Initialize video storage service
videoStorageService.initialize().then(() => {
  console.log('[VideoStorage] Video storage service initialized');
}).catch((error) => {
  console.error('[VideoStorage] Failed to initialize:', error);
});

serviceWorkerRegistration.unregister();