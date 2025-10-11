import React, { useState, useRef, useEffect } from 'react';
import { useAppContext } from "../contexts/AppContext";

const GlobeIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2h8a2 2 0 002-2v-1a2 2 0 012-2h1.945M7.707 4.293l.535.535M16.293 4.293l-.535.535M12 21v-4M21 12h-4M3 12H1m18 0a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
);

interface LanguageSelectorProps {
    bottomOffset: number;
}

const LanguageSelector: React.FC<LanguageSelectorProps> = ({ bottomOffset }) => {
    const { language, setLanguage } = useAppContext();
    const [isOpen, setIsOpen] = useState(false);
    const containerRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const languages: { code: 'en' | 'es' | 'pt'; label: string }[] = [
        { code: 'en', label: 'EN' },
        { code: 'es', label: 'ES' },
        { code: 'pt', label: 'PT' },
    ];

    const handleSelectLanguage = (langCode: 'en' | 'es' | 'pt') => {
        setLanguage(langCode);
        setIsOpen(false);
    };
    
    return (
        <div 
            ref={containerRef} 
            className="fixed right-4 z-50 transition-all duration-500 ease-in-out"
            style={{ bottom: `calc(5rem + ${bottomOffset}px)` }}
        >
            <div className="relative flex items-center justify-center">
                {/* Language Buttons */}
                {languages.map((lang, index) => {
                    const getPositionClass = () => {
                        // Fan out upwards and left from bottom-right corner
                        switch(lang.code) {
                            case 'en': return '-translate-y-16'; // Up
                            case 'es': return '-translate-x-14 -translate-y-12'; // Up-left
                            case 'pt': return '-translate-x-16'; // Left
                            default: return '';
                        }
                    }
                    return (
                        <button
                            key={lang.code}
                            onClick={() => handleSelectLanguage(lang.code)}
                            className={`absolute w-12 h-12 rounded-full font-bold text-white transition-all duration-300 ease-in-out flex items-center justify-center shadow-lg ${
                                isOpen ? `opacity-100 scale-100 ${getPositionClass()}` : 'opacity-0 scale-50 pointer-events-none'
                            } ${
                                language === lang.code ? 'bg-blue-600 ring-2 ring-white' : 'bg-gray-700 hover:bg-gray-600'
                            }`}
                            aria-label={`Select ${lang.label}`}
                        >
                            {lang.label}
                        </button>
                    )
                })}

                {/* Main FAB */}
                <button
                    onClick={() => setIsOpen(!isOpen)}
                    className="w-16 h-16 bg-gray-800 text-white rounded-full flex items-center justify-center shadow-xl hover:bg-gray-700 focus:outline-none focus:ring-4 focus:ring-blue-500/50 transition-all duration-300 transform hover:scale-105"
                    aria-label="Select Language"
                    aria-expanded={isOpen}
                >
                    <GlobeIcon />
                </button>
            </div>
        </div>
    );
};

export default LanguageSelector;