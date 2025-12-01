import React, { useState, useRef, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { CloseIcon, SendIcon, AssistantIcon, MicrophoneIcon, ArrowLeftIcon } from '../constants/icons';
import ReactMarkdown from 'react-markdown';
import { getAssistantResponse } from '../services/geminiService';
import { AssistantMessage, MessageAuthor } from '../types';

declare global {
  interface Window {
    SpeechRecognition: any;
    webkitSpeechRecognition: any;
  }
}

const GREETING_PROMPT: AssistantMessage = {
  author: MessageAuthor.USER,
  content: "Please introduce yourself as Pastor AI, according to your system instructions."
};

const PastorAiPage: React.FC = () => {
  const [messages, setMessages] = useState<AssistantMessage[]>(() => {
    try {
      const storedMessages = localStorage.getItem('pastorAiMessages');
      return storedMessages ? JSON.parse(storedMessages) : [];
    } catch (error) {
      console.error('Error parsing Pastor AI messages from localStorage', error);
      return [];
    }
  });
  const [input, setInput] = useState('');
  const [language, setLanguage] = useState('English');
  const [isLoading, setIsLoading] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const recognitionRef = useRef<any>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };
  
  const initializeChat = useCallback(() => {
    if (messages.length > 0) return;
    setIsLoading(true);

    const greetingPromptWithLang: AssistantMessage = {
        ...GREETING_PROMPT,
        content: `${GREETING_PROMPT.content} Please respond in ${language}.`
    };

    getAssistantResponse([greetingPromptWithLang]).then(response => {
        setMessages([
            GREETING_PROMPT,
            { author: MessageAuthor.ASSISTANT, content: response }
        ]);
    }).catch(() => {
        setMessages([
            GREETING_PROMPT,
            { author: MessageAuthor.ASSISTANT, content: "Sorry, I couldn't connect right now. Please try again later." }
        ]);
    }).finally(() => {
        setIsLoading(false);
    });
  }, [messages.length, language]);

  useEffect(() => {
    initializeChat();
  }, [initializeChat]);

  useEffect(() => {
    localStorage.setItem('pastorAiMessages', JSON.stringify(messages));
    scrollToBottom();
  }, [messages]);

  const handleVoiceInput = () => {
    if (isListening) {
      recognitionRef.current?.stop();
      setIsListening(false);
      return;
    }

    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      alert('Speech recognition is not supported in your browser.');
      return;
    }

    const recognition = new SpeechRecognition();
    recognitionRef.current = recognition;
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = language === 'Swahili' ? 'sw-KE' : 'en-US';

    recognition.onstart = () => setIsListening(true);
    recognition.onend = () => setIsListening(false);
    recognition.onerror = (event) => {
      console.error('Speech recognition error:', event.error);
      if (event.error === 'not-allowed') {
        alert('Microphone access was denied. Please check your browser settings to allow microphone access for this site.');
      } else if (event.error === 'no-speech') {
        alert('No speech was detected. Please try again.');
      } else {
        alert(`An error occurred during speech recognition: ${event.error}`);
      }
      setIsListening(false);
    };

    recognition.onresult = (event) => {
      let interimTranscript = '';
      let finalTranscript = '';

      for (let i = event.resultIndex; i < event.results.length; ++i) {
        if (event.results[i].isFinal) {
          finalTranscript += event.results[i][0].transcript;
        } else {
          interimTranscript += event.results[i][0].transcript;
        }
      }
      setInput(finalTranscript + interimTranscript);
    };

    recognition.start();
  };
  
  const handleSend = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage: AssistantMessage = { author: MessageAuthor.USER, content: input };
    // Use only the most recent part of the history to keep responses fast
    const recentHistory = messages.slice(-8);
    const apiHistory: AssistantMessage[] = [
        ...recentHistory,
        {
            author: MessageAuthor.SYSTEM,
            content: `Please respond in ${language}.`
        },
        userMessage
    ];
    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    try {
      const assistantResponse = await getAssistantResponse(apiHistory);
      setMessages(prev => [...prev, { author: MessageAuthor.ASSISTANT, content: assistantResponse }]);
    } catch (error) {
      setMessages(prev => [...prev, { author: MessageAuthor.ASSISTANT, content: "Sorry, I'm having trouble connecting. Please try again." }]);
    } finally {
      setIsLoading(false);
    }
  };

  const displayedMessages = messages.slice(1);

  return (
    <div className="flex flex-col h-screen bg-gray-100 dark:bg-gray-900">
      {/* Header */}
      <div className="flex items-center justify-between p-4 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 flex-shrink-0" style={{ paddingTop: 'calc(env(safe-area-inset-top) + 1rem)' }}>
        <button onClick={() => navigate('/')} className="p-2 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700">
          <ArrowLeftIcon className="w-6 h-6 text-text-main dark:text-gray-300" />
        </button>
        <div className="flex items-center gap-3">
          <AssistantIcon className="h-8 w-8 text-primary dark:text-secondary" />
          <div>
            <h2 className="text-xl font-serif font-bold text-primary dark:text-white">Pastor AI</h2>
            <select 
              value={language}
              onChange={e => setLanguage(e.target.value)}
              className="bg-transparent text-xs text-gray-500 dark:text-gray-400 focus:outline-none -ml-1"
            >
              <option value="English">English</option>
              <option value="Swahili">Swahili</option>
            </select>
          </div>
        </div>
        <div className="w-10"></div>
      </div>

      {/* Chat Area */}
      <div className="flex-1 p-4 overflow-y-auto space-y-4">
        {displayedMessages.map((msg, index) => (
          <div key={index} className={`flex items-end gap-2 ${msg.author === MessageAuthor.USER ? 'justify-end' : 'justify-start'}`}>
            {msg.author === MessageAuthor.ASSISTANT && <AssistantIcon className="w-8 h-8 text-primary dark:text-secondary flex-shrink-0" />}
            <div className={`max-w-md p-3 rounded-lg ${msg.author === MessageAuthor.USER ? 'bg-primary text-white rounded-br-none' : 'bg-gray-200 dark:bg-gray-700 text-text-main dark:text-gray-200 rounded-bl-none'}`}>
              <div className="prose prose-sm dark:prose-invert max-w-none" style={{ whiteSpace: 'pre-wrap' }}>
                <ReactMarkdown>{msg.content}</ReactMarkdown>
              </div>
            </div>
          </div>
        ))}
        {isLoading && messages.length > 1 && (
           <div className="flex items-end gap-2 justify-start">
             <AssistantIcon className="w-8 h-8 text-primary dark:text-secondary flex-shrink-0" />
             <div className="max-w-md p-3 rounded-lg bg-gray-200 dark:bg-gray-700">
                <div className="flex items-center justify-center space-x-1">
                  <div className="w-2 h-2 bg-gray-500 rounded-full animate-pulse"></div>
                  <div className="w-2 h-2 bg-gray-500 rounded-full animate-pulse" style={{ animationDelay: '0.2s' }}></div>
                  <div className="w-2 h-2 bg-gray-500 rounded-full animate-pulse" style={{ animationDelay: '0.4s' }}></div>
                </div>
             </div>
           </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="p-4 bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 flex-shrink-0">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleVoiceInput}
            className={`p-3 rounded-full transition-colors ${isListening ? 'bg-red-600 text-white animate-pulse' : 'text-gray-500 hover:bg-gray-200 dark:hover:bg-gray-700'}`}
            aria-label={isListening ? 'Stop listening' : 'Start listening'}
          >
            {isListening ? (
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                <rect x="6" y="6" width="12" height="12" rx="2" />
              </svg>
            ) : (
              <MicrophoneIcon className="w-5 h-5" />
            )}
          </button>
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleSend()}
            placeholder="Ask a question or share a thought..."
            className="flex-1 px-4 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-full focus:outline-none focus:ring-2 focus:ring-secondary min-w-0"
            disabled={isLoading}
          />
          <button
            onClick={handleSend}
            disabled={isLoading || !input.trim()}
            className="p-3 rounded-full bg-secondary text-primary hover:bg-gold-light disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
          >
            <SendIcon className="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default PastorAiPage;
