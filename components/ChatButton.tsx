import React from 'react';
import { useAppContext } from '../hooks/useAppContext';
import { t } from '../i18n';

const ChatIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-7 w-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
    </svg>
);


const ChatButton: React.FC = () => {
    const { toggleChat, language } = useAppContext();

    return (
        <div 
            className="fixed right-4 z-50 transition-all duration-500 ease-in-out"
            style={{ bottom: `10rem` }}
        >
            <button
                onClick={toggleChat}
                className="w-16 h-16 bg-blue-600 text-white rounded-full flex items-center justify-center shadow-xl hover:bg-blue-700 focus:outline-none focus:ring-4 focus:ring-blue-500/50 transition-all duration-300 transform hover:scale-105"
                aria-label={t('chat_button_aria', language)}
            >
                <ChatIcon />
            </button>
        </div>
    );
};

export default ChatButton;