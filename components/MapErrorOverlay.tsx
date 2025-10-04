import React from 'react';
import { useAppContext } from '../hooks/useAppContext';
import { t } from '../i18n';

const CheckmarkIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-green-400" viewBox="0 0 20 20" fill="currentColor">
        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
    </svg>
);

const WarningIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
        <path fillRule="evenodd" d="M8.257 3.099c.636-1.21 2.37-1.21 3.006 0l5.418 10.34a1.75 1.75 0 01-1.503 2.561H4.342a1.75 1.75 0 01-1.503-2.561L8.257 3.099zM10 13a1 1 0 110-2 1 1 0 010 2zm-1-4a1 1 0 011-1h.008a1 1 0 011 1v2a1 1 0 01-1 1h-.008a1 1 0 01-1-1V9z" clipRule="evenodd" />
    </svg>
);

const ChecklistItem: React.FC<{ text: string }> = ({ text }) => (
    <li className="flex items-start space-x-3">
        <div className="flex-shrink-0 pt-1">
            <CheckmarkIcon />
        </div>
        <span className="text-gray-300">{text}</span>
    </li>
);

const MapErrorOverlay: React.FC = () => {
    const { language, serverError } = useAppContext();

    return (
        <div className="absolute inset-0 bg-gray-900 z-[200] flex items-center justify-center p-4 animate-fade-in">
            <div className="w-full max-w-lg bg-gray-800/50 backdrop-blur-md rounded-2xl shadow-2xl p-6 sm:p-8 border border-yellow-500/30">
                <div className="flex items-center space-x-4 mb-4">
                    <WarningIcon />
                    <h1 className="text-2xl font-bold text-yellow-400">{t('map_error_title', language)}</h1>
                </div>
                <p className="text-gray-400 mb-6">{t('map_error_subtitle', language)}</p>

                <div className="bg-gray-900/50 rounded-lg p-4 mb-6">
                    <p className="text-xs text-gray-500 mb-2">Google's Error Message:</p>
                    <p className="text-xs text-red-400 font-mono break-words">{serverError}</p>
                </div>

                <h2 className="text-lg font-semibold text-white mb-3">{t('map_error_checklist_title', language)}</h2>
                <ul className="space-y-3">
                    <ChecklistItem text={t('map_error_checklist_billing', language)} />
                    <ChecklistItem text={t('map_error_checklist_maps_api', language)} />
                    <ChecklistItem text={t('map_error_checklist_places_api', language)} />
                    <ChecklistItem text={t('map_error_checklist_routes_api', language)} />
                    <ChecklistItem text={t('map_error_checklist_restrictions', language)} />
                </ul>
                
                <p className="text-xs text-gray-500 mt-6 text-center">{t('map_error_footer', language)}</p>
            </div>
        </div>
    );
};

export default MapErrorOverlay;
