import React, { useEffect, useState } from 'react';
import { oauthService } from '../../services/oauthService';

const FacebookCallback: React.FC = () => {
  const [message, setMessage] = useState('Finishing Facebook connection');

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const error = params.get('error');
    const code = params.get('code');
    const state = params.get('state') || '';

    const notify = (type: 'FACEBOOK_AUTH_SUCCESS' | 'FACEBOOK_AUTH_ERROR', payload: any) => {
      try {
        if (window.opener) {
          window.opener.postMessage({ type, ...payload }, window.location.origin);
        }
      } catch (err) {
        console.error('[FacebookCallback] postMessage failed', err);
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
        setMessage('Facebook connection was denied.');
        notify('FACEBOOK_AUTH_ERROR', { error });
        finish();
        return;
      }

      if (!code) {
        setMessage('Missing authorization code from Facebook.');
        notify('FACEBOOK_AUTH_ERROR', { error: 'Missing authorization code' });
        finish();
        return;
      }

      try {
        const token = await oauthService.exchangeFacebookCode(code, state);
        setMessage('Facebook connected. You can close this window.');
        notify('FACEBOOK_AUTH_SUCCESS', { token });
      } catch (err) {
        console.error('[FacebookCallback] Failed to complete Facebook auth', err);
        setMessage('Failed to complete Facebook connection.');
        notify('FACEBOOK_AUTH_ERROR', { error: 'Failed to complete Facebook auth' });
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
        <h1 style={{ fontSize: '1.25rem', fontWeight: 600, marginBottom: '0.75rem' }}>Finishing Facebook connection</h1>
        <p style={{ fontSize: '0.875rem', color: '#d1d5db' }}>{message}</p>
      </div>
    </div>
  );
};

export default FacebookCallback;
