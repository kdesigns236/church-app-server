
import React, { useState } from 'react';
import { ChatMessage } from '../../types';
import { useAuth } from '../../hooks/useAuth';
import { ReplyIcon, CloseIcon, CheckIcon } from '../../constants/icons';
import { useAppContext } from '../../context/AppContext';
import { AudioPlayer } from './AudioPlayer';
import { linkifyWithLineBreaks } from '../../utils/linkify';

interface MessageBubbleProps {
    message: ChatMessage;
    onReply: (message: ChatMessage) => void;
    onDelete: (messageId: string) => void;
    showTyping?: boolean;
}

const QuotedMessage: React.FC<{ message: ChatMessage }> = ({ message }) => (
    <div className="border-l-2 border-green-500 dark:border-green-400 pl-2 ml-1 mr-2 mb-1.5 opacity-80">
        <p className="text-xs font-semibold text-primary dark:text-secondary">{message.senderName}</p>
        <p className="text-xs text-text-main dark:text-gray-300 truncate">
            {message.content || (message.media?.type === 'image' ? 'Photo' : message.media?.type === 'video' ? 'Video' : 'Voice note')}
        </p>
    </div>
);


export const MessageBubble: React.FC<MessageBubbleProps> = ({ message, onReply, onDelete, showTyping }) => {
    const { user, users } = useAuth();
    const { addChatMessage } = useAppContext();
    const [isHovered, setIsHovered] = useState(false);
    const [showMenu, setShowMenu] = useState(false);
    const isCurrentUser = user ? message.userId === user.id : false;

    const senderUser = (() => {
        const list = Array.isArray(users) ? users : [];
        let found = list.find(u => u.id === message.userId);
        if (!found) found = list.find(u => u.name === message.senderName);
        return found;
    })();

    const isSenderOnline = (() => {
        const now = Date.now();
        const online = !!senderUser?.isOnline;
        const fresh = typeof senderUser?.lastSeen === 'number' ? (now - (senderUser.lastSeen as number) < 120000) : true;
        return online && fresh;
    })();

    const formatAgo = (ts: number): string => {
        const d = Date.now() - ts;
        if (d < 60000) return 'just now';
        if (d < 3600000) return `${Math.floor(d / 60000)}m ago`;
        if (d < 86400000) return `${Math.floor(d / 3600000)}h ago`;
        return `${Math.floor(d / 86400000)}d ago`;
    };

    const lastSeenText = (() => {
        if (isSenderOnline) return 'Online now';
        const ts = typeof senderUser?.lastSeen === 'number' ? senderUser!.lastSeen : undefined;
        if (typeof ts === 'number') return `last seen ${formatAgo(ts)}`;
        return undefined;
    })();

    return (
        <div 
            className={`flex items-end gap-2 group animate-fade-in ${isCurrentUser ? 'justify-end' : 'justify-start'}`}
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
            data-msg-id={message.id}
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
                    <p className="text-sm font-bold text-primary dark:text-secondary px-3 pt-3 flex items-center gap-1">
                        <span className={`inline-block w-2.5 h-2.5 rounded-full ${isSenderOnline ? 'bg-green-500' : 'bg-gray-400'}`} aria-label={isSenderOnline ? 'Online' : 'Offline'} />
                        {message.senderName}
                    </p>
                )}
                {!isCurrentUser && lastSeenText && (
                    <p className="text-[11px] text-gray-500 dark:text-gray-400 px-3 pt-0.5">{lastSeenText}</p>
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
                        {linkifyWithLineBreaks(message.content)}
                    </p>
                )}
                {showTyping && !isCurrentUser && (
                    <div className="px-3 pt-1 pb-1 text-xs italic text-gray-500 dark:text-gray-300">typing…</div>
                )}
                
                <div className="flex items-center justify-end gap-1 text-xs text-gray-500 dark:text-gray-400/80 mt-auto px-3 pb-2">
                  {isCurrentUser && (
                    <>
                      {message.status === 'sending' && (
                        <span className="inline-block align-middle opacity-70">sending…</span>
                      )}
                      {message.status === 'failed' && (
                        <button
                          className="text-red-500 font-semibold hover:underline"
                          onClick={() => {
                            try {
                              onDelete(message.id);
                              addChatMessage({ content: message.content, media: message.media, replyTo: message.replyTo }, user!);
                            } catch {}
                          }}
                        >Failed · Retry</button>
                      )}
                      {(!message.status || message.status === 'sent') && (
                        <CheckIcon className="w-3.5 h-3.5 opacity-70" />
                      )}
                      {message.status === 'delivered' && (
                        <span className="inline-flex -space-x-1">
                          <CheckIcon className="w-3.5 h-3.5 opacity-70" />
                          <CheckIcon className="w-3.5 h-3.5 opacity-70" />
                        </span>
                      )}
                      {message.status === 'read' && (
                        <span className="inline-flex -space-x-1">
                          <CheckIcon className="w-3.5 h-3.5 text-blue-500" />
                          <CheckIcon className="w-3.5 h-3.5 text-blue-500" />
                        </span>
                      )}
                    </>
                  )}
                  <span>{message.timestamp}</span>
                </div>
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