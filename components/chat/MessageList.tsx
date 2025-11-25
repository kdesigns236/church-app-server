
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

    const parseTimeToMinutes = (timestamp: string | undefined): number => {
        if (!timestamp) return 0;
        const match = timestamp.match(/(\d{1,2}):(\d{2})\s*(AM|PM)?/i);
        if (!match) return 0;
        let hour = parseInt(match[1], 10);
        const minute = parseInt(match[2], 10);
        const ampm = match[3]?.toUpperCase();

        if (ampm === 'PM' && hour < 12) hour += 12;
        if (ampm === 'AM' && hour === 12) hour = 0;

        return hour * 60 + minute;
    };

    const sortedMessages: ChatMessage[] = Array.isArray(chatMessages)
        ? [...chatMessages].sort((a, b) => {
              const ta = parseTimeToMinutes(a.timestamp);
              const tb = parseTimeToMinutes(b.timestamp);
              if (ta !== tb) return ta - tb;

              const aId = Number(a.id);
              const bId = Number(b.id);
              if (!isNaN(aId) && !isNaN(bId)) {
                  return aId - bId;
              }
              return 0;
          })
        : [];

    return (
        <div className="flex-1 p-4 overflow-y-auto space-y-3">
            {sortedMessages.map((msg) => (
                <MessageBubble key={msg.id} message={msg} onReply={onReply} onDelete={deleteChatMessage} />
            ))}
            {!Array.isArray(chatMessages) && (
                <div className="text-center text-gray-500">No messages yet</div>
            )}
            <div ref={messagesEndRef} />
        </div>
    );
};