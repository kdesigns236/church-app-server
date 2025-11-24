import React, { useEffect, useState } from 'react';
import { oauthService } from '../../services/oauthService';

const YouTubeCallback: React.FC = () => {
  const [message, setMessage] = useState('Finishing YouTube connection');

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const error = params.get('error');
    const code = params.get('code');
    const state = params.get('state') || '';

    const notify = (type: 'YOUTUBE_AUTH_SUCCESS' | 'YOUTUBE_AUTH_ERROR', payload: any) => {
      try {
        if (window.opener) {
          window.opener.postMessage({ type, ...payload }, window.location.origin);
        }
      } catch (err) {
        console.error('[YouTubeCallback] postMessage failed', err);
      }
    };

    const finish = () => {
      setTimeout(() => {
        try {
          window.close();
        } catch {
          // Ignore
        }
      }, 1500);
    };

    (async () => {
      if (error) {
        setMessage('YouTube connection was denied.');
        notify('YOUTUBE_AUTH_ERROR', { error });
        finish();
        return;
      }

      if (!code) {
        setMessage('Missing authorization code from YouTube.');
        notify('YOUTUBE_AUTH_ERROR', { error: 'Missing authorization code' });
        finish();
        return;
      }

      try {
        const token = await oauthService.exchangeYouTubeCode(code, state);
        setMessage('YouTube connected. You can close this window.');
        notify('YOUTUBE_AUTH_SUCCESS', { token });
      } catch (err) {
        console.error('[YouTubeCallback] Failed to complete YouTube auth', err);
        setMessage('Failed to complete YouTube connection.');
        notify('YOUTUBE_AUTH_ERROR', { error: 'Failed to complete YouTube auth' });
      } finally {
        finish();
      }
    })();
  }, []);

  return (
    <div
      style={{
        height: '100vh',
        width: '100vw',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#000000',
        color: '#f9fafb',
        fontFamily: 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
      }}
    >
      <div
        style={{
          backgroundColor: '#111827',
          padding: '1.5rem 2rem',
          borderRadius: '0.75rem',
          border: '1px solid #374151',
          maxWidth: '420px',
          textAlign: 'center',
        }}
      >
        <h1 style={{ fontSize: '1.25rem', fontWeight: 600, marginBottom: '0.75rem' }}>Finishing YouTube connection</h1>
        <p style={{ fontSize: '0.875rem', color: '#d1d5db' }}>{message}</p>
      </div>
    </div>
  );
};

export default YouTubeCallback;
