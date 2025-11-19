import React, { useRef, useEffect } from 'react';
import { LowerThirdConfig, AnnouncementConfig, LyricsConfig, BibleVerseConfig } from './types';
import ProfessionalLowerThird from './ProfessionalLowerThird';


interface VideoPreviewProps {
  stream: MediaStream | null;
  isLive: boolean;
  lowerThirdConfig: LowerThirdConfig;
  lowerThirdAnimationKey: number;
  announcementConfig: AnnouncementConfig;
  lyricsConfig: LyricsConfig;
  bibleVerseConfig: BibleVerseConfig;
  flipHorizontal?: boolean;
  rotate90?: boolean;
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
    scroll: '',
}


const AnnouncementOverlay: React.FC<{ config: AnnouncementConfig }> = ({ config }) => {
  const backgroundStyle = {
    backgroundColor: hexToRgbA(config.backgroundColor, config.backgroundOpacity),
  };
  const scale = config.scale ?? 1;
  const origin = config.position === 'top'
    ? 'top center'
    : config.position === 'bottom'
      ? 'bottom center'
      : 'center';
  const isScrolling = config.animationStyle === 'scroll';


  return (
    <div
      className={`absolute inset-0 px-0 sm:px-0 py-4 sm:py-6 flex flex-col pointer-events-none ${positionClasses[config.position]} z-10`}
      style={{ transform: `scale(1, ${scale})`, transformOrigin: origin }}
    >
      <div 
        key={config.text}
        className={`p-4 rounded-lg shadow-2xl w-full max-w-none mx-auto ${animationClasses[config.animationStyle]} ${isScrolling ? 'overflow-hidden' : ''}`}
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
    const scale = config.scale ?? 1;
    const origin = config.position === 'top'
      ? 'top center'
      : config.position === 'bottom'
        ? 'bottom center'
        : 'center';
    const isScrolling = config.animationStyle === 'scroll';
    const currentVerse = config.song.verses[config.verseIndex] || '';


    return (
        <div
          className={`absolute inset-0 px-0 sm:px-0 py-4 sm:py-6 flex flex-col pointer-events-none ${positionClasses[config.position]} z-10`}
          style={{ transform: `scale(1, ${scale})`, transformOrigin: origin }}
        >
          <div 
            key={config.song.title + config.verseIndex}
            className={`py-6 px-4 sm:px-8 rounded-lg shadow-2xl w-full max-w-none mx-auto ${animationClasses[config.animationStyle]} ${isScrolling ? 'overflow-hidden' : ''}`}
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
    const scale = config.scale ?? 1;
    const origin = config.position === 'top'
      ? 'top center'
      : config.position === 'bottom'
        ? 'bottom center'
        : 'center';
    const isScrolling = config.animationStyle === 'scroll';
    const verseText = config.text || '';
    const reference = config.reference || '';


    return (
        <div
          className={`absolute inset-0 px-0 sm:px-0 py-4 sm:py-6 flex flex-col pointer-events-none ${positionClasses[config.position]} z-10`}
          style={{ transform: `scale(1, ${scale})`, transformOrigin: origin }}
        >
          <div 
            key={reference || verseText}
            className={`py-6 px-4 sm:px-8 rounded-lg shadow-2xl w-full max-w-none mx-auto ${animationClasses[config.animationStyle]} ${isScrolling ? 'overflow-hidden' : ''}`}
            style={backgroundStyle}
          >
            <div className={isScrolling ? 'animate-scroll whitespace-nowrap' : 'whitespace-pre-wrap'}>
              <p
                className={`${config.fontSize} ${config.fontFamily} leading-tight`}
                style={{ color: config.textColor, textAlign: isScrolling ? 'left' : config.textAlign }}
              >
                <span className="italic">"{verseText}"</span>
              </p>
              {reference && (
                <p
                  className={`${config.fontFamily} mt-3 ${config.fontSize === 'text-5xl' || config.fontSize === 'text-6xl' ? 'text-2xl' : 'text-xl'}`}
                  style={{ color: config.textColor, opacity: 0.85, textAlign: isScrolling ? 'left' : config.textAlign }}
                >
                  {reference}
                </p>
              )}
            </div>
          </div>
        </div>
    );
}



const VideoPreview: React.FC<VideoPreviewProps> = ({ stream, isLive, lowerThirdConfig, lowerThirdAnimationKey, announcementConfig, lyricsConfig, bibleVerseConfig, flipHorizontal, rotate90 }) => {
  const videoRef = useRef<HTMLVideoElement>(null);


  useEffect(() => {
    if (videoRef.current && stream) {
      videoRef.current.srcObject = stream;
    } else if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
  }, [stream]);


  return (
    <div className="relative w-full h-full bg-black overflow-hidden">
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
        className="w-full h-full object-cover"
        style={
          rotate90 || flipHorizontal
            ? {
                transform: `${rotate90 ? 'rotate(90deg)' : ''} ${flipHorizontal ? 'scaleX(-1)' : ''}`.trim(),
              }
            : undefined
        }
      />
      
      {isLive && (
        <div className="absolute top-4 right-4 bg-black/50 backdrop-blur-sm px-4 py-2 rounded-full flex items-center space-x-2 border border-white/10 z-20">
          <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse"></div>
          <span className="text-sm font-bold tracking-wider uppercase">LIVE</span>
          <span className="text-sm text-gray-400">|</span>
          <span className="text-sm text-gray-300">Church Stream</span>
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
