import React, { useRef, useEffect } from 'react';
import { LowerThirdConfig, AnnouncementConfig, LyricsConfig, BibleVerseConfig } from '../types';
import ProfessionalLowerThird from './ProfessionalLowerThird';

interface VideoPreviewProps {
  stream: MediaStream | null;
  isLive: boolean;
  lowerThirdConfig: LowerThirdConfig;
  lowerThirdAnimationKey: number;
  announcementConfig: AnnouncementConfig;
  lyricsConfig: LyricsConfig;
  bibleVerseConfig: BibleVerseConfig;
}

const hexToRgbA = (hex: string, opacity: number) => {
    let c: any;
    if(/^#([A-Fa-f0-9]{3}){1,2}$/.test(hex)){
        c= hex.substring(1).split('');
        if(c.length== 3){
            c= [c[0], c[0], c[1], c[1], c[2], c[2]];
        }
        c= '0x'+c.join('');
        return 'rgba('+[(c>>16)&255, (c>>8)&255, c&255].join(',')+',' + opacity + ')';
    }
    return 'rgba(0,0,0,0.5)';
}

const positionClasses = {
    top: 'justify-start',
    middle: 'justify-center',
    bottom: 'justify-end',
};

const animationClasses = {
    fade: 'animate-fade-in',
    slideUp: 'animate-slide-in-up',
    slideDown: 'animate-slide-in-down',
    scroll: '', // scroll is handled separately
}

const AnnouncementOverlay: React.FC<{ config: AnnouncementConfig }> = ({ config }) => {
  const backgroundStyle = {
    backgroundColor: hexToRgbA(config.backgroundColor, config.backgroundOpacity),
  };
  const isScrolling = config.animationStyle === 'scroll';

  return (
    <div className={`absolute inset-0 p-8 flex flex-col pointer-events-none ${positionClasses[config.position]} z-10`}>
      <div 
        key={config.text} // Re-trigger animation on text change
        className={`p-4 rounded-lg shadow-2xl w-full max-w-4xl mx-auto ${animationClasses[config.animationStyle]} ${isScrolling ? 'overflow-hidden' : ''}`}
        style={backgroundStyle}
      >
        <p className={`${config.fontSize} ${config.fontFamily} ${isScrolling ? 'animate-scroll whitespace-nowrap' : 'whitespace-pre-wrap'}`} style={{ color: config.textColor, textAlign: isScrolling ? 'left' : config.textAlign }}>
          {config.text}
        </p>
      </div>
    </div>
  );
};

const LyricsOverlay: React.FC<{ config: LyricsConfig }> = ({ config }) => {
    if (!config.song || config.song.verses.length === 0) return null;

    const backgroundStyle = {
        backgroundColor: hexToRgbA(config.backgroundColor, config.backgroundOpacity),
    };
    const isScrolling = config.animationStyle === 'scroll';
    const currentVerse = config.song.verses[config.verseIndex] || '';

    return (
        <div className={`absolute inset-0 p-8 flex flex-col pointer-events-none ${positionClasses[config.position]} z-10`}>
          <div 
            key={config.song.title + config.verseIndex} // Re-trigger animation on verse change
            className={`py-6 px-8 rounded-lg shadow-2xl w-full max-w-5xl mx-auto ${animationClasses[config.animationStyle]} ${isScrolling ? 'overflow-hidden' : ''}`}
            style={backgroundStyle}
          >
            <p className={`${config.fontSize} ${config.fontFamily} leading-tight ${isScrolling ? 'animate-scroll whitespace-nowrap' : 'whitespace-pre-wrap'}`} style={{ color: config.textColor, textAlign: isScrolling ? 'left' : config.textAlign }}>
              {currentVerse}
            </p>
          </div>
        </div>
    );
}

const BibleVerseOverlay: React.FC<{ config: BibleVerseConfig }> = ({ config }) => {
    const backgroundStyle = {
        backgroundColor: hexToRgbA(config.backgroundColor, config.backgroundOpacity),
    };
    const isScrolling = config.animationStyle === 'scroll';

    return (
        <div className={`absolute inset-0 p-8 flex flex-col pointer-events-none ${positionClasses[config.position]} z-10`}>
          <div 
            key={config.reference} // Re-trigger animation on verse change
            className={`py-6 px-8 rounded-lg shadow-2xl w-full max-w-5xl mx-auto ${animationClasses[config.animationStyle]} ${isScrolling ? 'overflow-hidden' : ''}`}
            style={backgroundStyle}
          >
            <div className={`${isScrolling ? 'animate-scroll whitespace-nowrap' : ''}`}>
                <span className={`${config.fontSize} ${config.fontFamily} italic`} style={{ color: config.textColor, textAlign: isScrolling ? 'left' : config.textAlign }}>
                  "{config.text}"
                </span>
                 <span className={`ml-4 ${config.fontFamily} ${config.fontSize === 'text-5xl' || config.fontSize === 'text-6xl' ? 'text-2xl' : 'text-xl'}`} style={{ color: config.textColor, opacity: 0.8 }}>
                    - {config.reference}
                 </span>
            </div>
          </div>
        </div>
    );
}


const VideoPreview: React.FC<VideoPreviewProps> = ({ stream, isLive, lowerThirdConfig, lowerThirdAnimationKey, announcementConfig, lyricsConfig, bibleVerseConfig }) => {
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    if (stream) {
      console.log('Setting video stream:', stream);
      video.srcObject = stream;
      
      // Ensure video plays
      video.play().catch(error => {
        console.error('Error playing video:', error);
      });
    } else {
      console.log('Clearing video stream');
      video.srcObject = null;
    }

    // Cleanup function
    return () => {
      if (video.srcObject) {
        video.srcObject = null;
      }
    };
  }, [stream]);

  return (
    <div className="relative w-full h-full bg-black rounded-lg overflow-hidden shadow-2xl flex-1 min-h-0">
       <style>{`
        @keyframes fade-in {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        .animate-fade-in { animation: fade-in 1s ease-out forwards; }

        @keyframes slide-in-up {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-slide-in-up { animation: slide-in-up 1s ease-out forwards; }
        
        @keyframes slide-in-down {
          from { opacity: 0; transform: translateY(-20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-slide-in-down { animation: slide-in-down 1s ease-out forwards; }

        @keyframes scroll-left {
          0% { transform: translateX(100%); }
          100% { transform: translateX(-100%); }
        }
        .animate-scroll {
          display: inline-block;
          padding-left: 100%;
          animation: scroll-left 40s linear infinite;
        }
      `}</style>
      <video 
        ref={videoRef} 
        autoPlay 
        playsInline 
        muted 
        controls={false}
        className="w-full h-full object-cover"
        onLoadedMetadata={() => console.log('Video metadata loaded')}
        onCanPlay={() => console.log('Video can play')}
        onError={(e) => console.error('Video error:', e)}
        onLoadStart={() => console.log('Video load started')}
      />
      
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
      
      {announcementConfig.isVisible && <AnnouncementOverlay config={announcementConfig} />}
      
      {lyricsConfig.isVisible && <LyricsOverlay config={lyricsConfig} />}

      {bibleVerseConfig.isVisible && <BibleVerseOverlay config={bibleVerseConfig} />}

      {lowerThirdConfig.isVisible && (
         <ProfessionalLowerThird key={lowerThirdAnimationKey} config={lowerThirdConfig} />
      )}
    </div>
  );
};

export default VideoPreview;
