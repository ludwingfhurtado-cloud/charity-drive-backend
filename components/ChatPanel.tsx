import React, { useState, useRef, useEffect } from 'react';
import { useAppContext } from '../hooks/useAppContext';
import { t } from '../i18n';

const ChatPanel: React.FC = () => {
    const { language, toggleChat, chatHistory, sendMessage, isDriverMode, initiateCall } = useAppContext();
    const [message, setMessage] = useState('');
    const messagesEndRef = useRef<HTMLDivElement>(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }

    useEffect(scrollToBottom, [chatHistory]);

    const handleSendMessage = (e: React.FormEvent) => {
        e.preventDefault();
        if (message.trim()) {
            sendMessage(message.trim());
            setMessage('');
        }
    };

    const currentUser = isDriverMode ? 'driver' : 'rider';

    return (
        <div className="fixed inset-0 bg-black/60 z-[60]" onClick={toggleChat}>
            <div 
                className="absolute top-0 right-0 h-full w-full max-w-md bg-gray-900 shadow-2xl flex flex-col animate-fade-in"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Header */}
                <div className="flex items-center justify-between p-4 border-b border-gray-700 flex-shrink-0">
                    <h2 className="text-xl font-bold text-white">{t('chat_panel_title', language)}</h2>
                    <button onClick={toggleChat} className="p-2 text-gray-400 hover:text-white">&times;</button>
                </div>

                {/* Messages */}
                <div className="flex-grow p-4 overflow-y-auto">
                    <div className="space-y-4">
                        {chatHistory.map((msg) => (
                            <div key={msg.id} className={`flex items-end gap-2 ${msg.sender === currentUser ? 'justify-end' : 'justify-start'}`}>
                                <div className={`max-w-[75%] rounded-2xl px-4 py-2 ${msg.sender === currentUser ? 'bg-blue-600 text-white rounded-br-none' : 'bg-gray-700 text-gray-200 rounded-bl-none'}`}>
                                    <p className="text-sm">{msg.text}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                    <div ref={messagesEndRef} />
                </div>

                {/* Call Buttons and Input */}
                <div className="p-4 border-t border-gray-700 flex-shrink-0 space-y-3">
                     <div className="flex justify-around">
                        <button 
                            className="flex flex-col items-center text-gray-300 hover:text-blue-400 transition-colors"
                            onClick={() => initiateCall('voice')}
                            aria-label={t('voice_call_button_aria', language)}
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" viewBox="0 0 20 20" fill="currentColor"><path d="M2 3a1 1 0 011-1h2.153a1 1 0 01.986.836l.74 4.435a1 1 0 01-.54 1.06l-1.548.773a11.037 11.037 0 006.105 6.105l.774-1.548a1 1 0 011.059-.54l4.435.74a1 1 0 01.836.986V17a1 1 0 01-1 1h-2C7.82 18 2 12.18 2 5V3z" /></svg>
                        </button>
                         <button 
                            className="flex flex-col items-center text-gray-300 hover:text-blue-400 transition-colors"
                            onClick={() => initiateCall('video')}
                            aria-label={t('video_call_button_aria', language)}
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" viewBox="0 0 20 20" fill="currentColor"><path d="M2 6a2 2 0 012-2h6a2 2 0 012 2v8a2 2 0 01-2 2H4a2 2 0 01-2-2V6zM14.553 7.106A1 1 0 0014 8v4a1 1 0 001.553.832l3-2a1 1 0 000-1.664l-3-2z" /></svg>
                        </button>
                    </div>
                    <form onSubmit={handleSendMessage} className="flex items-center gap-2">
                        <input
                            type="text"
                            value={message}
                            onChange={(e) => setMessage(e.target.value)}
                            placeholder={t('chat_input_placeholder', language)}
                            className="flex-grow bg-gray-800 rounded-full py-2 px-4 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                        <button type="submit" className="p-2 bg-blue-600 rounded-full text-white" aria-label={t('chat_send_button_aria', language)}>
                           <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M5 10l7-7m0 0l7 7m-7-7v18" />
                            </svg>
                        </button>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default ChatPanel;