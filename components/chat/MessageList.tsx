
import React, { useRef, useEffect } from 'react';
import { useAppContext } from '../../context/AppContext';
import { MessageBubble } from './MessageBubble';
import type { ChatMessage } from '../../types';

interface MessageListProps {
    onReply: (message: ChatMessage) => void;
    typingMap?: Record<string, { name: string; ts: number }>;
}

export const MessageList: React.FC<MessageListProps> = ({ onReply, typingMap }) => {
    const { chatMessages, deleteChatMessage } = useAppContext();
    const messagesEndRef = useRef<HTMLDivElement>(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    useEffect(() => {
        scrollToBottom();
    }, [chatMessages]);

    const tsToComparable = (timestamp: string | undefined): number => {
        if (!timestamp) return 0;
        if (timestamp.includes('T')) {
            const t = Date.parse(timestamp);
            return isNaN(t) ? 0 : t;
        }
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
              const ta = tsToComparable(a.timestamp);
              const tb = tsToComparable(b.timestamp);
              if (ta !== tb) return ta - tb;
              const aId = Number(a.id);
              const bId = Number(b.id);
              if (!isNaN(aId) && !isNaN(bId)) return aId - bId;
              return String(a.id).localeCompare(String(b.id));
          })
        : [];

    // Determine the last message id per user to anchor typing indicator on their latest bubble
    const lastMsgIdByUser: Record<string, string> = (() => {
        const map: Record<string, string> = {};
        for (const m of sortedMessages) {
            if (!m || !m.userId) continue;
            map[m.userId] = String(m.id);
        }
        return map;
    })();

    const isTypingActive = (userId?: string): boolean => {
        if (!userId || !typingMap) return false;
        const t = typingMap[userId];
        if (!t) return false;
        return Date.now() - (t.ts || 0) < 3000;
    };

    return (
        <div className="flex-1 p-4 overflow-y-auto space-y-3">
            {sortedMessages.map((msg) => {
                const showTyping = isTypingActive(msg.userId) && String(lastMsgIdByUser[msg.userId || '']) === String(msg.id);
                return (
                  <MessageBubble key={msg.id} message={msg} onReply={onReply} onDelete={deleteChatMessage} showTyping={showTyping} />
                );
            })}
            {!Array.isArray(chatMessages) && (
                <div className="text-center text-gray-500">No messages yet</div>
            )}
            <div ref={messagesEndRef} />
        </div>
    );
};