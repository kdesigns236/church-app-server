import React, { useState, useRef, useEffect } from 'react';
import { PlayIcon, PauseIcon } from '../../constants/icons';

const formatTime = (time: number) => {
    if (isNaN(time) || time === 0) return '0:00';
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
};

export const AudioPlayer: React.FC<{ src: string }> = ({ src }) => {
    const [isPlaying, setIsPlaying] = useState(false);
    const [duration, setDuration] = useState(0);
    const [currentTime, setCurrentTime] = useState(0);
    const audioRef = useRef<HTMLAudioElement>(null);

    const onLoadedMetadata = () => {
       if (audioRef.current) setDuration(audioRef.current.duration);
    };

    const togglePlayPause = () => {
        if (isPlaying) {
            audioRef.current?.pause();
        } else {
            audioRef.current?.play();
        }
        setIsPlaying(!isPlaying);
    };
    
    const onTimeUpdate = () => {
        if(audioRef.current) setCurrentTime(audioRef.current.currentTime);
    };
    
    const onEnded = () => {
        setIsPlaying(false);
        setCurrentTime(0);
    };
    
    const onScrub = (value: string) => {
        if (audioRef.current) {
            audioRef.current.currentTime = Number(value);
            setCurrentTime(Number(value));
        }
    };

    return (
        <div className="flex items-center gap-2 p-2 w-full max-w-xs rounded-full bg-black/5 dark:bg-white/5 backdrop-blur-sm shadow-[0_0_14px_rgba(15,23,42,0.45)]">
            <audio
                ref={audioRef}
                src={src}
                preload="metadata"
                onLoadedMetadata={onLoadedMetadata}
                onTimeUpdate={onTimeUpdate}
                onEnded={onEnded}
            />
            <button
                onClick={togglePlayPause}
                className="flex-shrink-0 w-9 h-9 flex items-center justify-center bg-secondary text-primary rounded-full focus:outline-none shadow-[0_0_18px_rgba(59,130,246,0.6)] hover:shadow-[0_0_26px_rgba(59,130,246,0.9)] hover:scale-110 active:scale-95 transition-all duration-200"
            >
                {isPlaying ? <PauseIcon className="w-4 h-4" /> : <PlayIcon className="w-4 h-4 ml-0.5" />}
            </button>
            <div className="flex-grow flex items-center gap-2">
                <input
                    type="range"
                    min="0"
                    max={duration || 0}
                    step="0.01"
                    value={currentTime}
                    onChange={(e) => onScrub(e.target.value)}
                    className="w-full h-1.5 bg-gray-300 dark:bg-gray-600 rounded-lg appearance-none cursor-pointer accent-secondary"
                />
                <span className="text-xs text-gray-500 dark:text-gray-400 w-10 text-right">{formatTime(duration - currentTime)}</span>
            </div>
        </div>
    );
};