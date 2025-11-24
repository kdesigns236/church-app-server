import React, { useState, useEffect } from 'react';
import Scanner from '../components/ProStream/Scanner';
 


const GoLivePage: React.FC = () => {
  // Display-only refactor: connect to external controller session
  const [displaySessionId, setDisplaySessionId] = useState<string | null>(null);
  const [sessionInput, setSessionInput] = useState('');
  const [showConnector, setShowConnector] = useState(false);
  const [showScanner, setShowScanner] = useState(false);
  const isDisplayMode = false;

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

  if (displaySessionId) {
    const short = displaySessionId.split(':')[1] || displaySessionId;
    const proStreamBaseUrl = import.meta.env.VITE_PRO_STREAM_URL || 'http://localhost:5173';
    const displayUrl = `${proStreamBaseUrl}/?role=display&session=${short}`;
    return (
      <div className="h-screen w-screen bg-black relative overflow-hidden">
        <iframe
          src={displayUrl}
          className="absolute inset-0 w-full h-full border-0"
          allow="autoplay; camera; microphone"
        />

        {/* Top Header Bar - moved flush to the very top */}
        <div className="absolute top-0 inset-x-0 z-50 flex items-center justify-start gap-2 px-4 py-2">
          <button
            onClick={openConnector}
            className="px-3 py-2 bg-gray-900/70 text-white border border-gray-700 rounded-md hover:bg-gray-800 text-sm"
            title="Open connector"
          >
            Session
          </button>
          <button
            onClick={() => window.history.back()}
            className="px-3 py-2 bg-gray-900/70 text-white border border-gray-700 rounded-md hover:bg-gray-800 text-sm"
            title="Go back"
          >
            Back
          </button>
        </div>

        {showConnector && (
          <div className="absolute inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
            <div className="bg-[#1e1e1e] p-6 rounded-lg shadow-2xl border border-gray-700 text-white w-full max-w-md">
              <h2 className="text-2xl font-bold mb-2">Connect Display</h2>
              <p className="text-gray-400 text-sm mb-4">Enter the Session ID or paste the full Display link.</p>
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
                <button onClick={handleDisconnect} className="px-4 py-3 bg-red-600 hover:bg-red-500 rounded-lg font-semibold">Disconnect</button>
                <button onClick={() => setShowConnector(false)} className="px-4 py-3 bg-gray-700 hover:bg-gray-600 rounded-lg font-semibold">Close</button>
              </div>
              <p className="text-xs text-gray-500 mt-3">Current session: <code className="bg-black px-1 py-0.5 rounded">{short}</code></p>
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
  }

  // Simple connect UI (only shown when not connected)
  return (
    <div className="h-screen w-screen bg-black flex items-center justify-center overflow-hidden">
      <div className="bg-[#1e1e1e] p-8 rounded-lg shadow-2xl border border-gray-700 text-white w-full max-w-md">
        <h2 className="text-2xl font-bold mb-2">Connect Display</h2>
        <p className="text-gray-400 text-sm mb-4">
          Enter the Session ID from the Controller header or paste the full Display link.
        </p>
        <input
          type="text"
          value={sessionInput}
          onChange={e => setSessionInput(e.target.value)}
          placeholder="e.g. 7h9x2cj or https://... ?session=7h9x2cj"
          className="w-full p-3 bg-gray-900 border border-gray-700 rounded-md mb-3 placeholder-gray-500"
        />
        <button
          onClick={handleConnect}
          className="w-full py-3 bg-blue-600 hover:bg-blue-500 rounded-lg font-semibold mb-2"
        >
          Connect
        </button>
        <button
          onClick={() => setShowScanner(true)}
          className="w-full py-3 bg-gray-800 hover:bg-gray-700 rounded-lg font-semibold"
        >
          Scan QR instead
        </button>
        <p className="text-xs text-gray-500 mt-3">
          Tip: In the Controller, click “Open Display” and use the session shown in the header.
        </p>
      </div>
    </div>
  );
};

export default GoLivePage;
