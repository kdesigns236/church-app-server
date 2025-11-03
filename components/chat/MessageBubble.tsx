
import React, { useState } from 'react';
import { ChatMessage } from '../../types';
import { useAuth } from '../../hooks/useAuth';
import { ReplyIcon, CloseIcon } from '../../constants/icons';
import { AudioPlayer } from './AudioPlayer';

interface MessageBubbleProps {
    message: ChatMessage;
    onReply: (message: ChatMessage) => void;
    onDelete: (messageId: string) => void;
}

const QuotedMessage: React.FC<{ message: ChatMessage }> = ({ message }) => (
    <div className="border-l-2 border-green-500 dark:border-green-400 pl-2 ml-1 mr-2 mb-1.5 opacity-80">
        <p className="text-xs font-semibold text-primary dark:text-secondary">{message.senderName}</p>
        <p className="text-xs text-text-main dark:text-gray-300 truncate">
            {message.content || (message.media?.type === 'image' ? 'Photo' : message.media?.type === 'video' ? 'Video' : 'Voice note')}
        </p>
    </div>
);


export const MessageBubble: React.FC<MessageBubbleProps> = ({ message, onReply, onDelete }) => {
    const { user } = useAuth();
    const [isHovered, setIsHovered] = useState(false);
    const [showMenu, setShowMenu] = useState(false);
    const isCurrentUser = user ? message.userId === user.id : false;

    return (
        <div 
            className={`flex items-end gap-2 group animate-fade-in ${isCurrentUser ? 'justify-end' : 'justify-start'}`}
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
        >
             {!isCurrentUser && (
                <button
                    onClick={() => onReply(message)}
                    className={`self-center transition-opacity duration-200 ${isHovered ? 'opacity-100' : 'opacity-0'} group-hover:opacity-100`}
                >
                    <ReplyIcon className="w-5 h-5 text-gray-500 hover:text-primary dark:hover:text-secondary" />
                </button>
            )}

            <div
                className={`max-w-[80%] md:max-w-[60%] flex flex-col shadow-sm ${
                    isCurrentUser 
                        ? 'bg-green-100 dark:bg-green-900/60 text-text-main dark:text-gray-200 rounded-xl rounded-br-none' 
                        : 'bg-white dark:bg-gray-700 text-text-main dark:text-gray-200 rounded-xl rounded-bl-none'
                }`}
            >
                {!isCurrentUser && (
                    <p className="text-sm font-bold text-primary dark:text-secondary px-3 pt-3">{message.senderName}</p>
                )}

                {message.replyTo && (
                    <div className="pt-2 px-2">
                        <QuotedMessage message={message.replyTo} />
                    </div>
                )}
                
                {message.media && message.media.type !== 'audio' && (
                    <div className="p-1.5">
                        {message.media.type === 'image' ? (
                            <img src={message.media.url} alt="Shared content" className="rounded-lg w-full max-w-sm max-h-80 object-cover" />
                        ) : (
                            <video src={message.media.url} controls className="rounded-lg w-full max-w-sm max-h-80 bg-black" />
                        )}
                    </div>
                )}

                {message.media && message.media.type === 'audio' && (
                     <div className="pt-1 px-1">
                        <AudioPlayer src={message.media.url} />
                     </div>
                )}
                
                {message.content && (
                    <p className="text-sm leading-relaxed px-3 pb-1 pt-2" style={{ whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
                        {message.content}
                    </p>
                )}
                
                <p className="text-xs text-right text-gray-500 dark:text-gray-400/80 mt-auto px-3 pb-2">{message.timestamp}</p>
            </div>

            {isCurrentUser && (
                <div className="relative self-center">
                    <button onClick={() => setShowMenu(prev => !prev)} className={`transition-opacity duration-200 ${isHovered || showMenu ? 'opacity-100' : 'opacity-0'} group-hover:opacity-100 p-1`}>
                        <svg className="w-5 h-5 text-gray-500" fill="currentColor" viewBox="0 0 20 20"><path d="M10 6a2 2 0 110-4 2 2 0 010 4zM10 12a2 2 0 110-4 2 2 0 010 4zM10 18a2 2 0 110-4 2 2 0 010 4z"></path></svg>
                    </button>
                    {showMenu && (
                        <div 
                            className="absolute right-0 bottom-full mb-2 w-40 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-md shadow-lg z-10 animate-fade-in-up"
                            onMouseLeave={() => setShowMenu(false)}
                        >
                            <button onClick={() => { onReply(message); setShowMenu(false); }} className="w-full text-left px-4 py-2 text-sm text-text-main dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-2">
                                <ReplyIcon className="w-4 h-4" /> Reply
                            </button>
                            <button onClick={() => { onDelete(message.id); setShowMenu(false); }} className="w-full text-left px-4 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-2">
                                <CloseIcon className="w-4 h-4" /> Delete
                            </button>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};