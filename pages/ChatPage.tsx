
import React, { useState, useRef, useEffect } from 'react';
import { MessageList } from '../components/chat/MessageList';
import { MessageInput } from '../components/chat/MessageInput';
import { ChatBubbleIcon, CloseIcon, ArrowLeftIcon } from '../constants/icons';
import { useAppContext } from '../context/AppContext';
import { useAuth } from '../hooks/useAuth';
import type { ChatMessage } from '../types';
import { useNavigate } from 'react-router-dom';

const CHAT_BG_PATTERN_LIGHT = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAADAAAAAwBAMAAAClLOS0AAAAAXNSR0IArs4c6QAAAARnQU1BAACxjwv8YQUAAAAGUExURQAAAN3d3d+M5S8AAAAJcEhZcwAADsMAAA7DAcdvqGQAAAAqSURBVDjLY2AYBaNgFIyCUTAKRsEooDMAUoKQTEBILAFITATimEA8AQCQ5QZt4QlHewAAAABJRU5ErkJggg==";
const CHAT_BG_PATTERN_DARK = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAADAAAAAwBAMAAAClLOS0AAAAAXNSR0IArs4c6QAAAARnQU1BAACxjwv8YQUAAAAGUExURQAAACQkJP///+CVXjgAAAAJcEhZcwAADsMAAA7DAcdvqGQAAAAqSURBVDjLY2AYBaNgFIyCUTAKRsEooDMAUoKQTEBILAFITATimEA8AQCQ5QZt4QlHewAAAABJRU5ErkJggg==";

const ReplyPreview: React.FC<{ message: ChatMessage, onCancel: () => void }> = ({ message, onCancel }) => (
    <div className="p-3 border-b border-gray-200 dark:border-gray-700 bg-gray-100/50 dark:bg-gray-800/50 flex justify-between items-center">
        <div className="border-l-4 border-secondary pl-3 overflow-hidden">
            <p className="font-bold text-secondary text-sm">{message.senderName}</p>
            <p className="text-sm text-text-main dark:text-gray-300 truncate max-w-xs sm:max-w-md">
                {message.content || (message.media?.type === 'image' ? 'Photo' : message.media?.type === 'video' ? 'Video' : 'Voice note')}
            </p>
        </div>
        <button onClick={onCancel} className="p-1 rounded-full hover:bg-gray-300 dark:hover:bg-gray-600">
            <CloseIcon className="w-5 h-5" />
        </button>
    </div>
);


const ChatPage: React.FC = () => {
    const { addChatMessage } = useAppContext();
    const navigate = useNavigate();
    const { user, users } = useAuth();
    
    const onlineUsers = Array.isArray(users) ? users.filter(u => u.isOnline) : [];
    const onlineCount = onlineUsers.length;

    const [text, setText] = useState('');
    const [media, setMedia] = useState<{ file: File, previewUrl: string, type: 'image' | 'video' } | null>(null);
    const [replyingTo, setReplyingTo] = useState<ChatMessage | null>(null);
    const [isRecording, setIsRecording] = useState(false);

    const mediaRecorderRef = useRef<MediaRecorder | null>(null);
    const audioChunksRef = useRef<Blob[]>([]);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const resetComposition = () => {
        setText('');
        setReplyingTo(null);
        setMedia(null);
        if (fileInputRef.current) {
            fileInputRef.current.value = "";
        }
    };
    
    const handleSend = () => {
        if ((!text.trim() && !media) || !user) return;
        addChatMessage({
            content: text.trim() || undefined,
            media: media ? { url: media.previewUrl, type: media.type } : undefined,
            replyTo: replyingTo || undefined,
        }, user);
        resetComposition();
    };

    const handleAttachClick = () => {
        fileInputRef.current?.click();
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = (event) => {
                if (event.target?.result) {
                    const type = file.type.startsWith('image/') ? 'image' : 'video';
                    setMedia({ file, previewUrl: event.target.result as string, type });
                }
            };
            reader.readAsDataURL(file);
        }
    };

    const handleRemoveMedia = () => {
        setMedia(null);
        if (fileInputRef.current) fileInputRef.current.value = "";
    };

    const handleStartRecording = async () => {
        if (isRecording || media || text.trim()) return;
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            setIsRecording(true);
            const recorder = new MediaRecorder(stream);
            mediaRecorderRef.current = recorder;
            audioChunksRef.current = [];
            recorder.ondataavailable = event => audioChunksRef.current.push(event.data);
            recorder.onstop = () => {
                const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
                const reader = new FileReader();
                reader.onload = (event) => {
                    if (event.target?.result && user) {
                        addChatMessage({
                            media: { url: event.target.result as string, type: 'audio' },
                            replyTo: replyingTo || undefined,
                        }, user);
                    }
                    resetComposition();
                    stream.getTracks().forEach(track => track.stop());
                };
                reader.readAsDataURL(audioBlob);
            };
            recorder.start();
        } catch (err) {
            console.error("Microphone access denied:", err);
            alert("Microphone access is required to send voice notes. Please enable it in your browser settings.");
            setIsRecording(false);
        }
    };

    const handleStopRecording = () => {
        if (mediaRecorderRef.current && isRecording) {
            mediaRecorderRef.current.stop();
            setIsRecording(false);
        }
    };

    const handleStartVideoCall = () => {
        // Navigate to our built-in video call page
        navigate('/video-call');
    };


    return (
        <div 
            className="flex flex-col h-screen bg-gray-200 dark:bg-slate-800"
            style={{ 
                backgroundImage: `url('${document.documentElement.classList.contains('dark') ? CHAT_BG_PATTERN_DARK : CHAT_BG_PATTERN_LIGHT}')`,
                backgroundRepeat: 'repeat',
            }}
        >
            <header className="flex-shrink-0 bg-primary dark:bg-gray-900 text-white shadow-md p-4 flex items-center justify-between gap-4" style={{ paddingTop: 'calc(env(safe-area-inset-top) + 1rem)' }}>
                <div className="flex items-center gap-4">
                    <button onClick={() => navigate('/chat')} className="p-2 rounded-full hover:bg-white/10">
                        <ArrowLeftIcon className="w-6 h-6" />
                    </button>
                    <ChatBubbleIcon className="h-8 w-8 text-secondary" />
                    <div>
                        <h1 className="text-xl font-bold font-serif">Community Chat</h1>
                        <p className="text-sm text-gray-300">
                            {onlineCount > 0 ? `${onlineCount} online now` : 'No one online right now'}
                        </p>
                    </div>
                </div>
                <button 
                    onClick={handleStartVideoCall}
                    className="p-2.5 rounded-full bg-secondary hover:bg-gold-light transition-colors"
                    aria-label="Start video call"
                >
                    <svg className="w-6 h-6 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                    </svg>
                </button>
            </header>

            <MessageList onReply={setReplyingTo} />

            <div className="flex-shrink-0 bg-gray-100 dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700">
                {replyingTo && <ReplyPreview message={replyingTo} onCancel={() => setReplyingTo(null)} />}
                {media && (
                    <div className="p-3">
                        <div className="relative w-24 h-24 bg-gray-200 dark:bg-gray-700 rounded-md p-1">
                            {media.type === 'image' ? (
                                <img src={media.previewUrl} alt="Preview" className="w-full h-full object-cover rounded" />
                            ) : (
                                <video src={media.previewUrl} className="w-full h-full object-cover rounded bg-black" />
                            )}
                            <button onClick={handleRemoveMedia} className="absolute -top-2 -right-2 bg-gray-800 text-white rounded-full p-0.5 hover:bg-red-600 transition-colors">
                                <CloseIcon className="w-4 h-4" />
                            </button>
                        </div>
                    </div>
                )}
                <MessageInput 
                    text={text}
                    media={media}
                    setText={setText}
                    onSend={handleSend}
                    onAttach={handleAttachClick}
                    isRecording={isRecording}
                    onStartRecording={handleStartRecording}
                    onStopRecording={handleStopRecording}
                />
                <input 
                    type="file" 
                    ref={fileInputRef} 
                    onChange={handleFileChange} 
                    className="hidden" 
                    accept="image/*,video/*"
                />
            </div>
        </div>
    );
};

export default ChatPage;