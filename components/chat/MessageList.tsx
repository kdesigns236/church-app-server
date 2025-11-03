
import React, { useRef, useEffect } from 'react';
import { useAppContext } from '../../context/AppContext';
import { MessageBubble } from './MessageBubble';
import type { ChatMessage } from '../../types';

interface MessageListProps {
    onReply: (message: ChatMessage) => void;
}

export const MessageList: React.FC<MessageListProps> = ({ onReply }) => {
    const { chatMessages, deleteChatMessage } = useAppContext();
    const messagesEndRef = useRef<HTMLDivElement>(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    useEffect(() => {
        scrollToBottom();
    }, [chatMessages]);

    return (
        <div className="flex-1 p-4 overflow-y-auto space-y-2">
            {Array.isArray(chatMessages) && chatMessages.map((msg) => (
                <MessageBubble key={msg.id} message={msg} onReply={onReply} onDelete={deleteChatMessage} />
            ))}
            {!Array.isArray(chatMessages) && (
                <div className="text-center text-gray-500">No messages yet</div>
            )}
            <div ref={messagesEndRef} />
        </div>
    );
};