import React, { useState, useEffect, useCallback, useRef } from 'react';

// Types for the professional streaming system
interface CameraDevice {
  id: string;
  label: string;
}

interface CameraSlot {
  id: number;
  name: string;
  device: CameraDevice | null;
  stream: MediaStream | null;
  status: 'disconnected' | 'connected' | 'active';
}

type TransitionType = 'cut' | 'fade' | 'dissolve';

interface LowerThirdConfig {
  isVisible: boolean;
  topText: string;
  mainText: string;
  logoIcon: string;
  accentColor: string;
  mainBarColor: string;
}

type GraphicAnimationStyle = 'fade' | 'slideUp' | 'slideDown' | 'scroll';
type GraphicPosition = 'top' | 'middle' | 'bottom';

interface AnnouncementConfig {
  isVisible: boolean;
  text: string;
  fontSize: string;
  fontFamily: string;
  textColor: string;
  textAlign: 'left' | 'center' | 'right';
  backgroundColor: string;
  backgroundOpacity: number;
  animationStyle: GraphicAnimationStyle;
  position: GraphicPosition;
}

interface Song {
  title: string;
  verses: string[];
}

interface LyricsConfig {
  isVisible: boolean;
  song: Song | null;
  verseIndex: number;
  fontSize: string;
  fontFamily: string;
  textColor: string;
  textAlign: 'left' | 'center' | 'right';
  backgroundColor: string;
  backgroundOpacity: number;
  animationStyle: GraphicAnimationStyle;
  position: GraphicPosition;
}

interface BibleVerseConfig {
  isVisible: boolean;
  text: string;
  reference: string;
  fontSize: string;
  fontFamily: string;
  textColor: string;
  textAlign: 'left' | 'center' | 'right';
  backgroundColor: string;
  backgroundOpacity: number;
  animationStyle: GraphicAnimationStyle;
  position: GraphicPosition;
}

const GoLivePage: React.FC = () => {
  const [cameraSlots, setCameraSlots] = useState<CameraSlot[]>([
    { id: 1, name: 'Camera 1', device: null, stream: null, status: 'disconnected' },
    { id: 2, name: 'Camera 2', device: null, stream: null, status: 'disconnected' },
    { id: 3, name: 'Camera 3', device: null, stream: null, status: 'disconnected' },
  ]);
  const [availableDevices, setAvailableDevices] = useState<CameraDevice[]>([]);
  const [activeCameraId, setActiveCameraId] = useState<number | null>(null);
  const [transition, setTransition] = useState<TransitionType>('cut');
  const [isLive, setIsLive] = useState<boolean>(false);
  const [lowerThirdConfig, setLowerThirdConfig] = useState<LowerThirdConfig>({
    isVisible: false,
    topText: 'GRACE FELLOWSHIP',
    mainText: 'SUNDAY SERVICE',
    logoIcon: '✝',
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

  const refreshDevices = useCallback(async () => {
    try {
      // Ensure permissions are granted before enumerating
      await navigator.mediaDevices.getUserMedia({ video: true });
      const devices = await navigator.mediaDevices.enumerateDevices();
      const videoDevices = devices
        .filter(device => device.kind === 'videoinput')
        .map(device => ({ id: device.deviceId, label: device.label || `Camera ${device.deviceId.substring(0, 5)}` }));
      setAvailableDevices(videoDevices);
    } catch (error) {
      console.error("Error enumerating devices:", error);
    }
  }, []);

  useEffect(() => {
    // Initial device load and permission request
    refreshDevices();

    // Listen for device changes
    navigator.mediaDevices.addEventListener('devicechange', refreshDevices);

    return () => {
      navigator.mediaDevices.removeEventListener('devicechange', refreshDevices);
      // Clean up streams
      cameraSlots.forEach(slot => {
        if (slot.stream) {
          slot.stream.getTracks().forEach(track => track.stop());
        }
      });
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [refreshDevices]);

  const activeStream = cameraSlots.find(slot => slot.id === activeCameraId)?.stream || null;

  const replayLowerThirdAnimation = () => {
    setLowerThirdConfig(prev => ({...prev, isVisible: false}));
    setTimeout(() => {
        setLowerThirdAnimationKey(k => k + 1);
        setLowerThirdConfig(prev => ({...prev, isVisible: true}));
    }, 100)
  }

  return (
    <div className="flex flex-col md:flex-row h-screen w-screen bg-[#1a1a1a] text-white font-sans overflow-hidden">
      <main className="w-full h-1/2 md:w-3/4 md:h-full p-2 md:p-4">
        <VideoPreview 
            stream={activeStream} 
            isLive={isLive} 
            lowerThirdConfig={lowerThirdConfig} 
            lowerThirdAnimationKey={lowerThirdAnimationKey}
            announcementConfig={announcementConfig}
            lyricsConfig={lyricsConfig}
            bibleVerseConfig={bibleVerseConfig}
        />
      </main>
      <aside className="w-full h-1/2 md:w-1/4 md:h-full bg-[#1e1e1e] md:bg-gray-900/50">
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
        />
      </aside>
    </div>
  );
};

// Professional Lower Third Component
const ProfessionalLowerThird: React.FC<{ config: LowerThirdConfig }> = ({ config }) => {
  const darken = (color: string, percent: number): string => {
    try {
      let num = parseInt(color.replace('#', ''), 16);
      let amt = Math.round(2.55 * percent);
      let R = (num >> 16) - amt;
      let G = ((num >> 8) & 0x00ff) - amt;
      let B = (num & 0x0000ff) - amt;
      const newColor =
        '#' +
        (
          0x1000000 +
          (R < 255 ? (R < 1 ? 0 : R) : 255) * 0x10000 +
          (G < 255 ? (G < 1 ? 0 : G) : 255) * 0x100 +
          (B < 255 ? (B < 1 ? 0 : B) : 255)
        )
          .toString(16)
          .slice(1);
      return newColor;
    } catch (e) {
      return color;
    }
  };

  const topBarStyle = {
    background: `linear-gradient(135deg, ${config.accentColor} 0%, ${darken(config.accentColor, 20)} 50%, ${config.accentColor} 100%)`,
  };

  const diamondStyle = {
    background: `linear-gradient(135deg, ${config.accentColor} 0%, ${darken(config.accentColor, 10)} 30%, ${darken(config.accentColor, 20)} 70%, ${darken(config.accentColor, 40)} 100%)`,
  };

  const mainBarStyle = {
    background: `linear-gradient(135deg, ${config.mainBarColor} 0%, ${darken(config.mainBarColor, 5)} 30%, ${darken(config.mainBarColor, 10)} 70%, ${darken(config.mainBarColor, 15)} 100%)`,
  };

  const mainTextStyle = {
    color: Math.abs(parseInt(darken(config.mainBarColor, 90).replace('#', ''), 16) - parseInt(config.mainBarColor.replace('#', ''), 16)) > 0x555555 
        ? darken(config.mainBarColor, 90)
        : darken(config.mainBarColor, 10)
  };

  return (
    <>
      <style>{`
        .lower-third-wrapper {
            position: absolute;
            bottom: 10%;
            left: 5%;
            width: 80%;
            max-width: 1200px;
            perspective: 1000px;
            transform: scale(0.6);
            transform-origin: bottom left;
        }
        .lower-third {
            position: relative;
            width: 1200px;
            height: 160px;
            transform-style: preserve-3d;
            animation: slideInLeft 1.2s cubic-bezier(0.22, 1, 0.36, 1);
        }
        .top-bar {
            position: absolute;
            top: 0;
            left: 0;
            width: 100%;
            height: 65px;
            clip-path: polygon(0 0, 97% 0, 100% 100%, 0 100%);
            box-shadow: 0 4px 20px rgba(211, 47, 47, 0.5), inset 0 1px 0 rgba(255,255,255,0.2);
            z-index: 5;
            overflow: hidden;
        }
        .top-bar::before {
            content: '';
            position: absolute;
            top: -50%;
            left: -100%;
            width: 50%;
            height: 200%;
            background: linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.3) 50%, transparent 100%);
            animation: shine 3s infinite;
        }
        .top-text {
            position: absolute;
            top: 50%;
            left: 180px;
            transform: translateY(-50%);
            color: #ffffff;
            font-size: 24px;
            font-weight: 900;
            letter-spacing: 8px;
            text-transform: uppercase;
            text-shadow: 0 2px 10px rgba(0,0,0,0.5), 0 0 20px rgba(255,255,255,0.3);
            animation: fadeIn 0.8s 0.5s both;
        }
        .main-bar {
            position: absolute;
            top: 65px;
            left: 0;
            width: 100%;
            height: 95px;
            clip-path: polygon(0 0, 97% 0, 100% 100%, 0 100%);
            box-shadow: 0 8px 32px rgba(0,0,0,0.3), inset 0 1px 0 rgba(255,255,255,0.8), inset 0 -1px 0 rgba(0,0,0,0.1);
            z-index: 4;
            overflow: hidden;
        }
        .main-text {
            position: absolute;
            top: 50%;
            left: 180px;
            transform: translateY(-50%);
            font-size: 38px;
            font-weight: 900;
            letter-spacing: 3px;
            text-transform: uppercase;
            text-shadow: 1px 1px 0 rgba(255,255,255,0.8), 2px 2px 4px rgba(0,0,0,0.2);
            animation: fadeIn 0.8s 0.7s both;
        }
        .side-tab {
            position: absolute;
            top: 65px;
            left: -40px;
            width: 120px;
            height: 95px;
            background: linear-gradient(135deg, #ffffff 0%, #f0f0f0 50%, #e0e0e0 100%);
            clip-path: polygon(35% 0, 100% 0, 100% 100%, 0 100%);
            box-shadow: -5px 5px 15px rgba(0,0,0,0.3), inset 1px 0 0 rgba(255,255,255,0.5);
            z-index: 3;
        }
        .logo-wrapper {
            position: absolute;
            top: 50%;
            left: 40px;
            transform: translateY(-50%);
            width: 110px;
            height: 110px;
            z-index: 10;
            animation: logoZoom 0.6s cubic-bezier(0.34, 1.56, 0.64, 1) 0.3s both;
        }
        .diamond-outer {
            position: absolute;
            width: 110px;
            height: 110px;
            transform: rotate(45deg);
            box-shadow: 0 12px 40px rgba(211, 47, 47, 0.6), inset -3px -3px 8px rgba(0,0,0,0.4), inset 3px 3px 8px rgba(255,255,255,0.2);
            border: 2px solid rgba(255,255,255,0.1);
        }
        .diamond-inner {
            position: absolute;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            width: 90px;
            height: 90px;
            background: linear-gradient(135deg, rgba(255,255,255,0.1) 0%, transparent 100%);
        }
        .logo-icon {
            position: absolute;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            font-size: 56px;
            color: white;
            z-index: 11;
            filter: drop-shadow(0 4px 8px rgba(0,0,0,0.5));
            animation: pulse 2s ease-in-out infinite;
        }
        @keyframes slideInLeft {
            0% { transform: translateX(-120%) rotateY(20deg); opacity: 0; }
            100% { transform: translateX(0) rotateY(0deg); opacity: 1; }
        }
        @keyframes fadeIn {
            from { opacity: 0; transform: translateY(-50%) translateX(-20px); }
            to { opacity: 1; transform: translateY(-50%) translateX(0); }
        }
        @keyframes logoZoom {
            0% { transform: translateY(-50%) scale(0) rotate(180deg); opacity: 0; }
            100% { transform: translateY(-50%) scale(1) rotate(0deg); opacity: 1; }
        }
        @keyframes shine {
            0% { left: -100%; }
            100% { left: 200%; }
        }
        @keyframes pulse {
            0%, 100% { transform: translate(-50%, -50%) scale(1); }
            50% { transform: translate(-50%, -50%) scale(1.05); }
        }
        @media (min-width: 768px) {
           .lower-third-wrapper { transform: scale(0.8); }
        }
        @media (min-width: 1280px) {
           .lower-third-wrapper { transform: scale(1); }
        }
      `}</style>
      <div className="lower-third-wrapper">
        <div className="lower-third">
          <div className="top-bar" style={topBarStyle}>
            <div className="top-text">{config.topText}</div>
          </div>
          <div className="main-bar" style={mainBarStyle}>
            <div className="main-text" style={mainTextStyle}>{config.mainText}</div>
          </div>
          <div className="side-tab" style={{ background: `linear-gradient(135deg, ${config.mainBarColor} 0%, ${darken(config.mainBarColor, 5)} 50%, ${darken(config.mainBarColor, 10)} 100%)`}}></div>
          <div className="logo-wrapper">
            <div className="diamond-outer" style={diamondStyle}>
              <div className="diamond-inner"></div>
            </div>
            <div className="logo-icon">{config.logoIcon}</div>
          </div>
        </div>
      </div>
    </>
  );
};

// VideoPreview Component
const VideoPreview: React.FC<{
  stream: MediaStream | null;
  isLive: boolean;
  lowerThirdConfig: LowerThirdConfig;
  lowerThirdAnimationKey: number;
  announcementConfig: AnnouncementConfig;
  lyricsConfig: LyricsConfig;
  bibleVerseConfig: BibleVerseConfig;
}> = ({ stream, isLive, lowerThirdConfig, lowerThirdAnimationKey, announcementConfig, lyricsConfig, bibleVerseConfig }) => {
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    if (videoRef.current && stream) {
      videoRef.current.srcObject = stream;
    } else if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
  }, [stream]);

  return (
    <div className="relative w-full h-full bg-black aspect-video rounded-lg overflow-hidden shadow-2xl">
      <video ref={videoRef} autoPlay playsInline muted className="w-full h-full object-cover" />
      
      {isLive && (
        <div className="absolute top-4 right-4 bg-black/50 backdrop-blur-sm px-4 py-2 rounded-full flex items-center space-x-2 border border-white/10 z-20">
          <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse"></div>
          <span className="text-sm font-bold tracking-wider uppercase">LIVE</span>
          <span className="text-sm text-gray-400">|</span>
          <span className="text-sm text-gray-300">Kitale</span>
        </div>
      )}

      {!stream && (
        <div className="absolute inset-0 flex items-center justify-center bg-black">
          <div className="text-center text-gray-500">
            <p className="text-2xl font-semibold">OFF AIR</p>
            <p className="text-sm mt-1">Select a camera to begin preview</p>
          </div>
        </div>
      )}
      
      {announcementConfig.isVisible && (
        <div className="absolute inset-0 p-8 flex flex-col justify-end z-10">
          <div className="p-4 rounded-lg shadow-2xl w-full max-w-4xl mx-auto" style={{backgroundColor: `rgba(0,0,0,${announcementConfig.backgroundOpacity})`}}>
            <p className={`${announcementConfig.fontSize} ${announcementConfig.fontFamily} whitespace-pre-wrap`} style={{ color: announcementConfig.textColor, textAlign: announcementConfig.textAlign }}>
              {announcementConfig.text}
            </p>
          </div>
        </div>
      )}
      
      {lyricsConfig.isVisible && lyricsConfig.song && (
        <div className="absolute inset-0 p-8 flex flex-col justify-end z-10">
          <div className="py-6 px-8 rounded-lg shadow-2xl w-full max-w-5xl mx-auto" style={{backgroundColor: `rgba(0,0,0,${lyricsConfig.backgroundOpacity})`}}>
            <p className={`${lyricsConfig.fontSize} ${lyricsConfig.fontFamily} leading-tight whitespace-pre-wrap`} style={{ color: lyricsConfig.textColor, textAlign: lyricsConfig.textAlign }}>
              {lyricsConfig.song.verses[lyricsConfig.verseIndex] || ''}
            </p>
          </div>
        </div>
      )}

      {bibleVerseConfig.isVisible && (
        <div className="absolute inset-0 p-8 flex flex-col justify-end z-10">
          <div className="py-6 px-8 rounded-lg shadow-2xl w-full max-w-5xl mx-auto" style={{backgroundColor: `rgba(0,0,0,${bibleVerseConfig.backgroundOpacity})`}}>
            <div>
              <span className={`${bibleVerseConfig.fontSize} ${bibleVerseConfig.fontFamily} italic`} style={{ color: bibleVerseConfig.textColor }}>
                "{bibleVerseConfig.text}"
              </span>
              <span className={`ml-4 ${bibleVerseConfig.fontFamily} text-xl`} style={{ color: bibleVerseConfig.textColor, opacity: 0.8 }}>
                - {bibleVerseConfig.reference}
              </span>
            </div>
          </div>
        </div>
      )}

      {lowerThirdConfig.isVisible && (
        <ProfessionalLowerThird key={lowerThirdAnimationKey} config={lowerThirdConfig} />
      )}
    </div>
  );
};

// Sidebar Component
const Sidebar: React.FC<{
  cameraSlots: CameraSlot[];
  setCameraSlots: React.Dispatch<React.SetStateAction<CameraSlot[]>>;
  availableDevices: CameraDevice[];
  activeCameraId: number | null;
  setActiveCameraId: (id: number | null) => void;
  transition: TransitionType;
  setTransition: (type: TransitionType) => void;
  isLive: boolean;
  setIsLive: (isLive: boolean) => void;
  lowerThirdConfig: LowerThirdConfig;
  setLowerThirdConfig: React.Dispatch<React.SetStateAction<LowerThirdConfig>>;
  replayLowerThirdAnimation: () => void;
  announcementConfig: AnnouncementConfig;
  setAnnouncementConfig: React.Dispatch<React.SetStateAction<AnnouncementConfig>>;
  lyricsConfig: LyricsConfig;
  setLyricsConfig: React.Dispatch<React.SetStateAction<LyricsConfig>>;
  bibleVerseConfig: BibleVerseConfig;
  setBibleVerseConfig: React.Dispatch<React.SetStateAction<BibleVerseConfig>>;
}> = (props) => {
  return (
    <div className="h-full w-full bg-[#1e1e1e] flex flex-col">
      <div className="p-4 border-b border-gray-700">
        <h1 className="text-xl font-bold">Church Stream Dashboard</h1>
      </div>
      <div className="flex-grow overflow-y-auto p-4 space-y-4">
        {/* Stream Controls */}
        <div className="bg-gray-800 rounded-lg p-4">
          <h3 className="font-semibold mb-3">Stream Controls</h3>
          <button
            onClick={() => props.setIsLive(!props.isLive)}
            className={`w-full px-4 py-2 rounded font-semibold ${
              props.isLive ? 'bg-red-600 hover:bg-red-700' : 'bg-green-600 hover:bg-green-700'
            }`}
          >
            {props.isLive ? 'Stop Stream' : 'Go Live'}
          </button>
        </div>

        {/* Camera Controls */}
        <div className="bg-gray-800 rounded-lg p-4">
          <h3 className="font-semibold mb-3">Camera Controls</h3>
          <div className="space-y-2">
            {props.cameraSlots.map(slot => (
              <button
                key={slot.id}
                onClick={() => props.setActiveCameraId(slot.id)}
                className={`w-full px-3 py-2 rounded text-sm ${
                  props.activeCameraId === slot.id
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-700 hover:bg-gray-600'
                }`}
              >
                {slot.name} - {slot.status}
              </button>
            ))}
          </div>
        </div>

        {/* Lower Third */}
        <div className="bg-gray-800 rounded-lg p-4">
          <h3 className="font-semibold mb-3">Lower Third</h3>
          <div className="space-y-2">
            <input
              type="text"
              value={props.lowerThirdConfig.topText}
              onChange={(e) => props.setLowerThirdConfig(prev => ({...prev, topText: e.target.value}))}
              className="w-full px-3 py-2 bg-gray-700 rounded text-sm"
              placeholder="Top Text"
            />
            <input
              type="text"
              value={props.lowerThirdConfig.mainText}
              onChange={(e) => props.setLowerThirdConfig(prev => ({...prev, mainText: e.target.value}))}
              className="w-full px-3 py-2 bg-gray-700 rounded text-sm"
              placeholder="Main Text"
            />
            <button
              onClick={() => props.setLowerThirdConfig(prev => ({...prev, isVisible: !prev.isVisible}))}
              className={`w-full px-4 py-2 rounded font-semibold ${
                props.lowerThirdConfig.isVisible ? 'bg-red-600 hover:bg-red-700' : 'bg-green-600 hover:bg-green-700'
              }`}
            >
              {props.lowerThirdConfig.isVisible ? 'Hide' : 'Show'} Lower Third
            </button>
          </div>
        </div>

        {/* Announcements */}
        <div className="bg-gray-800 rounded-lg p-4">
          <h3 className="font-semibold mb-3">Announcements</h3>
          <div className="space-y-2">
            <textarea
              value={props.announcementConfig.text}
              onChange={(e) => props.setAnnouncementConfig(prev => ({...prev, text: e.target.value}))}
              className="w-full px-3 py-2 bg-gray-700 rounded text-sm h-20"
              placeholder="Announcement text"
            />
            <button
              onClick={() => props.setAnnouncementConfig(prev => ({...prev, isVisible: !prev.isVisible}))}
              className={`w-full px-4 py-2 rounded font-semibold ${
                props.announcementConfig.isVisible ? 'bg-red-600 hover:bg-red-700' : 'bg-green-600 hover:bg-green-700'
              }`}
            >
              {props.announcementConfig.isVisible ? 'Hide' : 'Show'} Announcement
            </button>
          </div>
        </div>

        {/* Bible Verses */}
        <div className="bg-gray-800 rounded-lg p-4">
          <h3 className="font-semibold mb-3">Bible Verses</h3>
          <div className="space-y-2">
            <textarea
              value={props.bibleVerseConfig.text}
              onChange={(e) => props.setBibleVerseConfig(prev => ({...prev, text: e.target.value}))}
              className="w-full px-3 py-2 bg-gray-700 rounded text-sm h-20"
              placeholder="Bible verse text"
            />
            <input
              type="text"
              value={props.bibleVerseConfig.reference}
              onChange={(e) => props.setBibleVerseConfig(prev => ({...prev, reference: e.target.value}))}
              className="w-full px-3 py-2 bg-gray-700 rounded text-sm"
              placeholder="Reference (e.g., John 3:16)"
            />
            <button
              onClick={() => props.setBibleVerseConfig(prev => ({...prev, isVisible: !prev.isVisible}))}
              className={`w-full px-4 py-2 rounded font-semibold ${
                props.bibleVerseConfig.isVisible ? 'bg-red-600 hover:bg-red-700' : 'bg-green-600 hover:bg-green-700'
              }`}
            >
              {props.bibleVerseConfig.isVisible ? 'Hide' : 'Show'} Bible Verse
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default GoLivePage;