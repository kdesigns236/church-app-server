
import React from 'react';
import { Sermon } from '../../types';
import { LikeIcon, CommentIcon, ShareIcon, SaveIcon, ExternalLinkIcon } from '../../constants/icons';

interface SermonOverlayProps {
  sermon: Sermon;
  onLike: () => void;
  onComment: () => void;
  onShare: () => void;
  onSave: () => void;
}

const ActionButton: React.FC<{
  icon: React.ElementType,
  label: string | number,
  onClick?: () => void,
  isActive?: boolean
}> = ({ icon: Icon, label, onClick, isActive }) => (
  <button 
    onClick={onClick} 
    className="flex flex-col items-center gap-1.5 group transition-transform active:scale-90"
  >
    <div className={`relative p-3 rounded-full backdrop-blur-md transition-all duration-300 ${
      isActive 
        ? 'bg-red-500 shadow-lg shadow-red-500/50 scale-105' 
        : 'bg-black/40 group-hover:bg-black/60 group-hover:scale-105'
    }`}>
      <Icon className={`w-7 h-7 transition-colors ${
        isActive ? 'text-white' : 'text-white'
      }`} />
      {isActive && (
        <div className="absolute inset-0 rounded-full bg-red-500/30 animate-ping"></div>
      )}
    </div>
    <span className="text-xs font-bold text-white drop-shadow-[0_2px_6px_rgba(0,0,0,0.9)]">
      {label}
    </span>
  </button>
);

export const SermonOverlay: React.FC<SermonOverlayProps> = ({ sermon, onLike, onComment, onShare, onSave }) => {
  return (
    <>
      {/* Bottom Info Section - Red Theme */}
      <div className="absolute bottom-16 left-0 right-20 p-4 bg-gradient-to-t from-black/80 via-black/40 to-transparent pointer-events-none z-10">
        <div className="pointer-events-auto text-white space-y-2.5 max-w-lg">
          {/* Pastor Info */}
          <div className="flex items-center gap-2.5">
            <div className="relative">
              <div className="w-11 h-11 rounded-full bg-gradient-to-br from-red-500 to-pink-600 flex items-center justify-center text-white font-bold text-lg shadow-lg border-2 border-white/90">
                {sermon.pastor.charAt(0)}
              </div>
              <div className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 bg-green-500 rounded-full border-2 border-black"></div>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-bold drop-shadow-[0_2px_8px_rgba(0,0,0,1)] truncate">{sermon.pastor}</p>
              <p className="text-xs text-gray-300 drop-shadow-[0_2px_6px_rgba(0,0,0,1)]">{sermon.date}</p>
            </div>
          </div>
          
          {/* Title */}
          <h3 className="text-lg font-bold line-clamp-1 drop-shadow-[0_3px_10px_rgba(0,0,0,1)] leading-tight">{sermon.title}</h3>
          
          {/* Scripture - Compact */}
          {sermon.scripture && (
            <p className="text-xs text-gray-200 line-clamp-1 drop-shadow-[0_2px_6px_rgba(0,0,0,1)] italic">
              📖 {sermon.scripture}
            </p>
          )}
        </div>
      </div>

      {/* Action Buttons */}
      <div className="absolute right-3 bottom-28 flex flex-col gap-5 pointer-events-auto z-30">
          <ActionButton
            icon={LikeIcon}
            label={sermon.likes}
            onClick={onLike}
            isActive={sermon.isLiked}
          />
          <ActionButton
            icon={CommentIcon}
            label={sermon.comments.length}
            onClick={onComment}
          />
          <ActionButton
            icon={ShareIcon}
            label="Share"
            onClick={onShare}
          />
          <ActionButton
            icon={SaveIcon}
            label="Save"
            onClick={onSave}
            isActive={sermon.isSaved}
          />
        </div>
    </>
  );
};