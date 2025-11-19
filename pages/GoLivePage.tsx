import React, { useState, useEffect, useCallback } from 'react';
import VideoPreview from './components/VideoPreview';
import Sidebar from './components/Sidebar';
import MobileCamera from './components/MobileCamera';
import { CameraSlot, CameraDevice, TransitionType, LowerThirdConfig, AnnouncementConfig, LyricsConfig, BibleVerseConfig } from './types';
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
        <div className="absolute top-0 inset-x-0 z-50 flex items-center justify-between gap-4 px-4 py-2">
          {/* Session and Back buttons on the left */}
          <div className="flex items-center gap-2">
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

          {/* Live, Kitale bubble on the opposite corner (top-right) */}
          <div className="flex-1 flex justify-end">
            <span className="inline-flex items-center px-4 py-1 rounded-full bg-red-700 text-white text-xs font-semibold uppercase tracking-wide">
              Live, Kitale
            </span>
          </div>
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
  const [cameraSlots, setCameraSlots] = useState<CameraSlot[]>([
    { id: 1, name: 'Camera 1', device: null, stream: null, status: 'disconnected', mobileConnections: [], activeConnectionId: null },
    { id: 2, name: 'Camera 2', device: null, stream: null, status: 'disconnected', mobileConnections: [], activeConnectionId: null },
    { id: 3, name: 'Camera 3', device: null, stream: null, status: 'disconnected', mobileConnections: [], activeConnectionId: null },
  ]);
  const [availableDevices, setAvailableDevices] = useState<CameraDevice[]>([]);
  const [activeCameraId, setActiveCameraId] = useState<number | null>(1);
  const [transition, setTransition] = useState<TransitionType>('cut');
  const [isLive, setIsLive] = useState<boolean>(false);
  const [lowerThirdConfig, setLowerThirdConfig] = useState<LowerThirdConfig>({
    isVisible: false,
    topText: 'GRACE FELLOWSHIP',
    mainText: 'SUNDAY SERVICE',
    logoIcon: '',
    accentColor: '#d32f2f',
    mainBarColor: '#ffffff',
  });
  const [lowerThirdAnimationKey, setLowerThirdAnimationKey] = useState(0);
  const [announcementConfig, setAnnouncementConfig] = useState<AnnouncementConfig>({
    isVisible: false,
    text: 'Welcome to our service! We are glad you are here.',
    fontSize: 'text-3xl',
    fontFamily: 'font-sans',
    textColor: '#ffffff',
    textAlign: 'center',
    backgroundColor: '#000000',
    backgroundOpacity: 0.5,
    animationStyle: 'fade',
    position: 'bottom',
  });
  const [lyricsConfig, setLyricsConfig] = useState<LyricsConfig>({
    isVisible: false,
    song: null,
    verseIndex: 0,
    fontSize: 'text-5xl',
    fontFamily: 'font-serif',
    textColor: '#ffffff',
    textAlign: 'center',
    backgroundColor: '#000000',
    backgroundOpacity: 0.6,
    animationStyle: 'fade',
    position: 'bottom',
  });
  const [bibleVerseConfig, setBibleVerseConfig] = useState<BibleVerseConfig>({
    isVisible: false,
    text: "For God so loved the world, that he gave his only Son, that whoever believes in him should not perish but have eternal life.",
    reference: "John 3:16",
    fontSize: 'text-4xl',
    fontFamily: 'font-serif',
    textColor: '#ffffff',
    textAlign: 'center',
    backgroundColor: '#000000',
    backgroundOpacity: 0.6,
    animationStyle: 'fade',
    position: 'bottom',
  });
  const [isSidebarMinimized, setIsSidebarMinimized] = useState<boolean>(false);



  const refreshDevices = useCallback(async () => {
    try {
      console.log('Requesting camera permissions and enumerating devices...');
      
      // Request permissions first to get device labels
      const permissionStream = await navigator.mediaDevices.getUserMedia({ 
        video: true, 
        audio: false 
      });
      
      // Stop the permission stream immediately
      permissionStream.getTracks().forEach(track => track.stop());
      
      // Now enumerate devices with proper labels
      const devices = await navigator.mediaDevices.enumerateDevices();
      const videoDevices = devices
        .filter(device => device.kind === 'videoinput')
        .map((device, index) => ({ 
          id: device.deviceId, 
          label: device.label || `Camera ${index + 1}` 
        }));
      
      console.log('Found video devices:', videoDevices);
      setAvailableDevices(videoDevices);
      
      // Auto-connect the first available camera to Camera 1 if no cameras are connected
      if (videoDevices.length > 0 && !cameraSlots.some(slot => slot.stream)) {
        console.log('Auto-connecting first camera to Camera 1...');
        await connectCameraToSlot(1, videoDevices[0].id);
      }
      
    } catch (error) {
      console.error("Error accessing camera devices:", error);
      alert('Camera access denied. Please allow camera permissions and refresh the page.');
    }
  }, [cameraSlots]);

  const connectCameraToSlot = useCallback(async (slotId: number, deviceId: string) => {
    try {
      console.log(`Connecting camera ${deviceId} to slot ${slotId}...`);
      
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          deviceId: { exact: deviceId },
          width: { ideal: 1920, min: 640 },
          height: { ideal: 1080, min: 480 },
          frameRate: { ideal: 30, min: 15 }
        }
      });
      
      console.log('Camera stream created:', stream);
      
      // Update camera slot with new stream
      setCameraSlots(prevSlots => {
        const newSlots = [...prevSlots];
        const slotIndex = newSlots.findIndex(s => s.id === slotId);
        
        if (slotIndex !== -1) {
          // Stop previous stream if exists
          if (newSlots[slotIndex].stream) {
            newSlots[slotIndex].stream?.getTracks().forEach(track => track.stop());
          }
          
          const device = availableDevices.find(d => d.id === deviceId) || null;
          newSlots[slotIndex] = {
            ...newSlots[slotIndex],
            device,
            stream,
            status: 'connected'
          };
        }
        
        return newSlots;
      });
      
      // Set as active camera if it's Camera 1 or no camera is active
      if (slotId === 1 || activeCameraId === null) {
        setActiveCameraId(slotId);
        console.log(`Camera ${slotId} set as active`);
      }
      
      return true;
    } catch (error) {
      console.error(`Failed to connect camera to slot ${slotId}:`, error);
      
      // Update slot status to show connection failed
      setCameraSlots(prevSlots => {
        const newSlots = [...prevSlots];
        const slotIndex = newSlots.findIndex(s => s.id === slotId);
        if (slotIndex !== -1) {
          newSlots[slotIndex] = {
            ...newSlots[slotIndex],
            device: null,
            stream: null,
            status: 'disconnected'
          };
        }
        return newSlots;
      });
      
      return false;
    }
  }, [availableDevices, activeCameraId]);

  useEffect(() => {
    // Initial device load and permission request
    refreshDevices();
    
    // Listen for device changes
    navigator.mediaDevices.addEventListener('devicechange', refreshDevices);
    
    // Demo: Add some mock mobile connections for testing
    setTimeout(() => {
      addDemoMobileConnections();
    }, 2000);
    
    return () => {
      navigator.mediaDevices.removeEventListener('devicechange', refreshDevices);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [refreshDevices]);

  // Demo function to add mock mobile connections for testing
  const addDemoMobileConnections = () => {
    setCameraSlots(prevSlots => {
      const newSlots = [...prevSlots];
      
      // Add demo connections to Camera 1
      newSlots[0].mobileConnections = [
        {
          id: 'phone-001',
          deviceName: 'iPhone 14 Pro',
          connectionTime: new Date(),
          stream: null,
          quality: 'HD',
          batteryLevel: 85,
          signalStrength: 95
        },
        {
          id: 'phone-002', 
          deviceName: 'Samsung Galaxy S23',
          connectionTime: new Date(),
          stream: null,
          quality: 'SD',
          batteryLevel: 67,
          signalStrength: 78
        }
      ];
      newSlots[0].activeConnectionId = 'phone-001';
      
      // Add demo connection to Camera 2
      newSlots[1].mobileConnections = [
        {
          id: 'phone-003',
          deviceName: 'Pixel 7',
          connectionTime: new Date(),
          stream: null,
          quality: 'HD',
          batteryLevel: 92,
          signalStrength: 88
        }
      ];
      newSlots[1].activeConnectionId = 'phone-003';
      
      console.log('Demo mobile connections added');
      return newSlots;
    });
  };


  const activeStream = cameraSlots.find(slot => slot.id === activeCameraId)?.stream || null;
  
  // If display mode, show clean video-only interface
  if (isDisplayMode) {
    return (
      <div className="h-screen w-screen bg-black flex items-center justify-center">
        <div className="w-full h-full max-w-none">
          <VideoPreview 
            stream={activeStream}
            isLive={isLive}
            lowerThirdConfig={lowerThirdConfig}
            lowerThirdAnimationKey={lowerThirdAnimationKey}
            announcementConfig={announcementConfig}
            lyricsConfig={lyricsConfig}
            bibleVerseConfig={bibleVerseConfig}
          />
        </div>
      </div>
    );
  }
  
  // Debug logging for active stream
  const replayLowerThirdAnimation = () => {
    setLowerThirdConfig(prev => ({...prev, isVisible: false}));
    setTimeout(() => {
        setLowerThirdAnimationKey(k => k + 1);
        setLowerThirdConfig(prev => ({...prev, isVisible: true}));
    }, 100)
  }

  const toggleSidebar = () => {
    setIsSidebarMinimized(prev => !prev);
  }


  return (
    <>
      <style>{`
        html, body {
          height: 100%;
          overflow: hidden;
          margin: 0;
          padding: 0;
        }
        #root {
          height: 100vh;
          overflow: hidden;
        }
        
        /* Hide scrollbars but maintain functionality */
        * {
          scrollbar-width: none; /* Firefox */
          -ms-overflow-style: none; /* Internet Explorer 10+ */
        }
        
        *::-webkit-scrollbar {
          width: 0;
          height: 0;
          display: none; /* Chrome, Safari, Opera */
        }
        
        /* Ensure scrolling still works */
        .scroll-container {
          overflow-y: auto;
          overflow-x: hidden;
        }
      `}</style>
      <div className="flex flex-col md:flex-row h-screen w-full max-w-full bg-[#1a1a1a] text-white font-sans overflow-hidden">
      <main className={`w-full h-1/2 transition-all duration-300 min-w-0 min-h-0 flex flex-col ${
        isSidebarMinimized ? 'md:w-full md:h-full' : 'md:w-3/4 md:h-full'
      }`}>
        <div className="w-full h-full max-w-full min-h-0 flex flex-col p-2 md:p-4">
          <VideoPreview 
              stream={activeStream} 
              isLive={isLive} 
              lowerThirdConfig={lowerThirdConfig} 
              lowerThirdAnimationKey={lowerThirdAnimationKey}
              announcementConfig={announcementConfig}
              lyricsConfig={lyricsConfig}
              bibleVerseConfig={bibleVerseConfig}
          />
        </div>
      </main>
      
      {/* Sidebar Toggle Button */}
      <button
        onClick={toggleSidebar}
        className={`fixed top-4 z-50 p-3 bg-[#1e1e1e] hover:bg-gray-700 rounded-lg shadow-lg border border-gray-600 transition-all duration-300 ${
          isSidebarMinimized 
            ? 'right-4' 
            : 'right-4 md:right-[25vw]'
        }`}
        title={isSidebarMinimized ? 'Show Sidebar' : 'Hide Sidebar'}
      >
        {isSidebarMinimized ? (
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        ) : (
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 18l-6-6 6-6" />
          </svg>
        )}
      </button>

      {/* Sidebar */}
      <aside className={`w-full h-1/2 bg-[#1e1e1e] md:bg-gray-900/50 transition-all duration-300 min-w-0 min-h-0 flex flex-col ${
        isSidebarMinimized 
          ? 'md:w-0 md:h-full md:overflow-hidden' 
          : 'md:w-1/4 md:h-full md:max-w-[25vw]'
      }`}>
        {!isSidebarMinimized && (
          <Sidebar
              cameraSlots={cameraSlots}
              setCameraSlots={setCameraSlots}
              availableDevices={availableDevices}
              activeCameraId={activeCameraId}
              setActiveCameraId={setActiveCameraId}
              transition={transition}
              setTransition={setTransition}
              isLive={isLive}
              setIsLive={setIsLive}
              lowerThirdConfig={lowerThirdConfig}
              setLowerThirdConfig={setLowerThirdConfig}
              replayLowerThirdAnimation={replayLowerThirdAnimation}
              announcementConfig={announcementConfig}
              setAnnouncementConfig={setAnnouncementConfig}
              lyricsConfig={lyricsConfig}
              setLyricsConfig={setLyricsConfig}
              bibleVerseConfig={bibleVerseConfig}
              setBibleVerseConfig={setBibleVerseConfig}
              connectCameraToSlot={connectCameraToSlot}
            />
        )}
      </aside>
      </div>
    </>
  );
};


export default GoLivePage;
