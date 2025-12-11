
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

    const getEpoch = (m: ChatMessage): number => {
        const ts = m?.timestamp;
        if (ts && ts.includes('T')) {
            const t = Date.parse(ts);
            if (!isNaN(t)) return t;
        }
        // Time-only fallback: use numeric id if it looks like a timestamp
        const idNum = Number(m?.id);
        if (!Number.isNaN(idNum)) {
            // Heuristics: 13 digits -> ms, 10 digits -> seconds
            const len = String(Math.floor(Math.abs(idNum))).length;
            if (len >= 13) return idNum;
            if (len === 10) return idNum * 1000;
        }
        // Last resort: convert HH:MM to minutes-of-day but this won't sort across days
        if (ts) {
            const match = ts.match(/(\d{1,2}):(\d{2})\s*(AM|PM)?/i);
            if (match) {
                let hour = parseInt(match[1], 10);
                const minute = parseInt(match[2], 10);
                const ampm = match[3]?.toUpperCase();
                if (ampm === 'PM' && hour < 12) hour += 12;
                if (ampm === 'AM' && hour === 12) hour = 0;
                return hour * 60 * 60 * 1000 + minute * 60 * 1000;
            }
        }
        return 0;
    };

    const sortedMessages: ChatMessage[] = Array.isArray(chatMessages)
        ? [...chatMessages].sort((a, b) => {
              const ta = getEpoch(a);
              const tb = getEpoch(b);
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