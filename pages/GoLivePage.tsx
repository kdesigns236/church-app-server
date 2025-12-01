import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Scanner from '../components/ProStream/Scanner';
import Display from '../components/ProStream/Display';
 


const GoLivePage: React.FC = () => {
  const navigate = useNavigate();
  // Display-only refactor: connect to external controller session
  const [displaySessionId, setDisplaySessionId] = useState<string | null>(null);
  const [sessionInput, setSessionInput] = useState('');
  const [showConnector, setShowConnector] = useState(false);
  const [showScanner, setShowScanner] = useState(false);
  const [isPortrait, setIsPortrait] = useState(false);
  const [showOrientationHint, setShowOrientationHint] = useState(true);

  useEffect(() => {
    // Prevent page scrolling while on GoLive
    const el = document.documentElement;
    const root = document.getElementById('root');
    el.classList.add('no-scroll');
    document.body.classList.add('no-scroll');
    root?.classList.add('no-scroll');

    return () => {
      el.classList.remove('no-scroll');
      document.body.classList.remove('no-scroll');
      root?.classList.remove('no-scroll');
    };
  }, []);

  useEffect(() => {
    const lockOrientation = async () => {
      try {
        const anyScreen: any = window.screen as any;
        if (anyScreen.orientation && anyScreen.orientation.lock) {
          await anyScreen.orientation.lock('landscape');
        }
      } catch (err) {
        console.warn('Orientation lock not supported for GoLive.', err);
      }
    };

    lockOrientation();
  }, []);

  useEffect(() => {
    const updateOrientation = () => {
      if (typeof window === 'undefined') return;
      const portrait = window.innerHeight > window.innerWidth;
      setIsPortrait(portrait);
      if (!portrait) {
        setShowOrientationHint(false);
      }
    };

    updateOrientation();
    window.addEventListener('resize', updateOrientation);
    window.addEventListener('orientationchange', updateOrientation);

    return () => {
      window.removeEventListener('resize', updateOrientation);
      window.removeEventListener('orientationchange', updateOrientation);
    };
  }, []);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const raw = params.get('session') || localStorage.getItem('pro_stream_session') || '';
    if (raw) {
      const full = raw.startsWith('pro-stream-session:') ? raw : `pro-stream-session:${raw}`;
      setDisplaySessionId(full);
    }
  }, []);

  const handleConnect = () => {
    let raw = sessionInput.trim();
    if (!raw) return;
    try {
      const u = new URL(raw);
      const s = u.searchParams.get('session');
      if (s) raw = s;
    } catch {}
    const full = raw.startsWith('pro-stream-session:') ? raw : `pro-stream-session:${raw}`;
    localStorage.setItem('pro_stream_session', full);
    setDisplaySessionId(full);
    setShowConnector(false);
  };


  const handleScanConnect = (data: string) => {
    let raw = data.trim();
    if (!raw) {
      setShowScanner(false);
      return;
    }

    try {
      const u = new URL(raw);
      const s = u.searchParams.get('session');
      if (s) raw = s;
    } catch {}

    const full = raw.startsWith('pro-stream-session:') ? raw : `pro-stream-session:${raw}`;
    localStorage.setItem('pro_stream_session', full);
    setDisplaySessionId(full);
    setSessionInput(raw);
    setShowScanner(false);
    setShowConnector(false);
  };

  const openConnector = () => {
    if (displaySessionId) {
      try {
        setSessionInput(displaySessionId.split(':')[1] || displaySessionId);
      } catch {
        setSessionInput(displaySessionId);
      }
    }
    setShowConnector(true);
  };

  const handleDisconnect = () => {
    localStorage.removeItem('pro_stream_session');
    setDisplaySessionId(null);
    setShowConnector(false);
    try {
      window.history.pushState({}, document.title, window.location.pathname);
    } catch {}
  };

  const effectiveSessionId = displaySessionId ?? 'golive-standalone';
  const shortSession = (effectiveSessionId.split(':')[1] || effectiveSessionId);

  const handleHeaderFlip = () => {
    try {
      (window as any).__goliveDisplayControls?.flipCamera?.();
    } catch {}
  };

  const handleHeaderToggleGoLive = () => {
    try {
      (window as any).__goliveDisplayControls?.togglePanel?.();
    } catch {}
  };

  return (
    <div className="h-screen w-screen bg-black relative overflow-hidden touch-none">
      {/* Main GoLive display - works standalone using local camera, and
          optionally connects to controller when a session is set. */}
      <Display sessionId={effectiveSessionId} />

      {showOrientationHint && isPortrait && (
        <div
          className="absolute inset-0 z-50 flex flex-col items-center justify-center bg-black/75 px-6 text-center text-white"
          onClick={() => setShowOrientationHint(false)}
        >
          <h2 className="text-xl font-semibold mb-2">Rotate your phone</h2>
          <p className="text-sm text-gray-300">
            For the best GoLive view, hold your device in landscape.
          </p>
        </div>
      )}

      {/* Top Header Bar - session connector, back and quick controls */}
      <div className="absolute top-0 inset-x-0 z-50 flex items-center justify-start gap-2 px-4 py-2">
        <button
          onClick={openConnector}
          className="px-3 py-2 bg-gray-900/70 text-white border border-gray-700 rounded-md hover:bg-gray-800 text-sm"
          title="Open connector"
        >
          Session
        </button>
        <button
          onClick={() => navigate('/')}
          className="px-3 py-2 bg-gray-900/70 text-white border border-gray-700 rounded-md hover:bg-gray-800 text-sm"
          title="Go back"
        >
          Back
        </button>
        <button
          onClick={handleHeaderFlip}
          className="px-3 py-2 bg-gray-900/70 text-white border border-gray-700 rounded-md hover:bg-gray-800 text-sm"
          title="Flip camera"
        >
          Flip
        </button>
        <button
          onClick={handleHeaderToggleGoLive}
          className="px-3 py-2 bg-gray-900/70 text-white border border-gray-700 rounded-md hover:bg-gray-800 text-sm"
          title="Show GoLive controls"
        >
          GoLive
        </button>
      </div>

      {showConnector && (
        <div className="absolute inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-[#1e1e1e] p-6 rounded-lg shadow-2xl border border-gray-700 text-white w-full max-w-md">
            <h2 className="text-2xl font-bold mb-2">Connect Controller</h2>
            <p className="text-gray-400 text-sm mb-4">Enter the Session ID or paste the full Display link from the Controller.</p>
            <input
              type="text"
              value={sessionInput}
              onChange={e => setSessionInput(e.target.value)}
              placeholder="e.g. 7h9x2cj or https://... ?session=7h9x2cj"
              className="w-full p-3 bg-gray-900 border border-gray-700 rounded-md mb-3 placeholder-gray-500"
            />
            <div className="flex flex-wrap items-center gap-2">
              <button onClick={handleConnect} className="flex-1 py-3 bg-blue-600 hover:bg-blue-500 rounded-lg font-semibold">Connect</button>
              <button onClick={() => setShowScanner(true)} className="px-4 py-3 bg-gray-800 hover:bg-gray-700 rounded-lg font-semibold">Scan QR</button>
              {displaySessionId && (
                <button onClick={handleDisconnect} className="px-4 py-3 bg-red-600 hover:bg-red-500 rounded-lg font-semibold">Disconnect</button>
              )}
              <button onClick={() => setShowConnector(false)} className="px-4 py-3 bg-gray-700 hover:bg-gray-600 rounded-lg font-semibold">Close</button>
            </div>
            <p className="text-xs text-gray-500 mt-3">
              Current session: <code className="bg-black px-1 py-0.5 rounded">{displaySessionId ? shortSession : 'Local only (no controller)'}</code>
            </p>
          </div>
        </div>
      )}

      {showScanner && (
        <div className="absolute inset-0 z-50">
          <Scanner
            prompt="Scan the display QR from the Controller to connect this GoLive screen."
            onScan={handleScanConnect}
            onCancel={() => setShowScanner(false)}
          />
        </div>
      )}
    </div>
  );
};

export default GoLivePage;
