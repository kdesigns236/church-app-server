
import React from 'react';
import { SendIcon, PaperclipIcon, MicrophoneIcon } from '../../constants/icons';

interface MessageInputProps {
  text: string;
  media: { file: File, previewUrl: string, type: 'image' | 'video' } | null;
  isRecording: boolean;
  setText: (value: string) => void;
  onSend: () => void;
  onAttach: () => void;
  onStartRecording: () => void;
  onStopRecording: () => void;
}

export const MessageInput: React.FC<MessageInputProps> = ({ text, media, isRecording, setText, onSend, onAttach, onStartRecording, onStopRecording }) => {
    const hasContent = text.trim() !== '' || media !== null;

    const handleFormSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if(hasContent || media) {
            onSend();
        }
    };
    
    const handleKeyPress = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            if(hasContent || media){
                onSend();
            }
        }
    };

    return (
        <div className="p-2 sm:p-3">
            <form onSubmit={handleFormSubmit} className="flex items-end gap-2">
                 <button
                    type="button"
                    onClick={onAttach}
                    className="w-11 h-11 flex-shrink-0 flex items-center justify-center rounded-full text-gray-500 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
                    aria-label="Attach file"
                >
                    <PaperclipIcon className="w-6 h-6" />
                </button>
                <textarea
                    value={text}
                    onChange={(e) => setText(e.target.value)}
                    onKeyPress={handleKeyPress}
                    placeholder={isRecording ? "Recording..." : "Type a message..."}
                    className="flex-1 px-4 py-2.5 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-2xl focus:outline-none focus:ring-2 focus:ring-secondary resize-none"
                    aria-label="Chat message input"
                    rows={1}
                    style={{ lineHeight: '1.5rem', maxHeight: '8rem' }}
                    onInput={(e) => {
                        const target = e.currentTarget;
                        target.style.height = 'auto';
                        target.style.height = `${target.scrollHeight}px`;
                    }}
                    disabled={isRecording}
                />
                 {hasContent ? (
                    <button
                        type="submit"
                        className="w-11 h-11 flex-shrink-0 flex items-center justify-center rounded-full bg-secondary text-primary hover:bg-gold-light transition-all"
                        aria-label="Send message"
                    >
                        <SendIcon className="w-5 h-5" />
                    </button>
                 ) : (
                    <button
                        type="button"
                        onClick={isRecording ? onStopRecording : onStartRecording}
                        className={`w-11 h-11 flex-shrink-0 flex items-center justify-center rounded-full text-white transition-all ${isRecording ? 'bg-red-600 animate-pulse' : 'bg-secondary hover:bg-gold-light'}`}
                        aria-label={isRecording ? "Stop recording" : "Start recording"}
                    >
                        {isRecording ? (
                            <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                                <rect x="6" y="6" width="12" height="12" rx="2" />
                            </svg>
                        ) : (
                            <MicrophoneIcon className="w-6 h-6" />
                        )}
                    </button>
                 )}
            </form>
        </div>
    );
};