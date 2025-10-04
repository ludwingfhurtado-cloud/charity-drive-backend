import React, { useState, useRef, useEffect } from 'react';
import { useAppContext } from '../hooks/useAppContext';
import { t } from '../i18n';

const ServerStatusIndicator: React.FC = () => {
    const { serverStatus, language, checkServerStatus } = useAppContext();

    const getStatusInfo = () => {
        switch (serverStatus) {
            case 'online':
                return {
                    color: 'bg-green-500',
                    text: t('server_status_online', language),
                };
            case 'offline':
                return {
                    color: 'bg-red-500',
                    text: t('server_status_offline', language),
                };
            case 'connecting':
            default:
                return {
                    color: 'bg-yellow-500 animate-pulse',
                    text: t('server_status_connecting', language),
                };
        }
    };

    const { color, text } = getStatusInfo();

    return (
        <div className="px-4 py-3 border-t border-gray-700 space-y-2">
            <div className="text-xs font-semibold text-gray-400">{t('server_status_label', language)}</div>
            <div className="flex items-center space-x-2">
                <div className={`w-3 h-3 rounded-full ${color}`}></div>
                <span className="text-sm text-gray-300">{text}</span>
            </div>
            {serverStatus === 'offline' && (
                <button
                    onClick={checkServerStatus}
                    className="w-full text-left mt-1 text-sm text-blue-400 hover:text-blue-300"
                >
                    {t('server_status_retry', language)}
                </button>
            )}
        </div>
    );
};


const HamburgerMenu: React.FC = () => {
    const { isDriverMode, handleToggleDriverMode, language } = useAppContext();
    const [isOpen, setIsOpen] = useState(false);
    const menuRef = useRef<HTMLDivElement>(null);

    // Close menu if clicking outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const toggleMode = () => {
        handleToggleDriverMode();
        setIsOpen(false);
    }
    
    return (
        <div ref={menuRef} className="relative z-50">
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="p-2 bg-gray-900/80 backdrop-blur-sm rounded-full text-white hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                aria-label="Menu"
                aria-expanded={isOpen}
            >
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16m-7 6h7" />
                </svg>
            </button>

            <div className={`absolute left-0 mt-2 w-56 origin-top-left rounded-md shadow-lg bg-gray-800 ring-1 ring-black ring-opacity-5 transition-all duration-200 ease-out ${isOpen ? 'opacity-100 scale-100' : 'opacity-0 scale-95 pointer-events-none'}`}>
                <div className="py-1" role="menu" aria-orientation="vertical" aria-labelledby="options-menu">
                    <a href="#" onClick={(e) => { e.preventDefault(); toggleMode(); }} className="block px-4 py-2 text-sm text-gray-300 hover:bg-gray-700 hover:text-white" role="menuitem">
                        {isDriverMode ? t('switch_to_rider_mode', language) : t('switch_to_driver_mode', language)}
                    </a>
                    <a href="#" className="block px-4 py-2 text-sm text-gray-300 hover:bg-gray-700 hover:text-white" role="menuitem">History</a>
                    <a href="#" className="block px-4 py-2 text-sm text-gray-300 hover:bg-gray-700 hover:text-white" role="menuitem">Quick Select Areas</a>
                    <a href="#" className="block px-4 py-2 text-sm text-gray-300 hover:bg-gray-700 hover:text-white" role="menuitem">Previous Addresses</a>
                </div>
                <ServerStatusIndicator />
            </div>
        </div>
    );
};

export default HamburgerMenu;