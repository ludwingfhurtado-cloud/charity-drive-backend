import React, { useState, useEffect } from 'react';
import { useAppContext } from '../hooks/useAppContext';
import { t } from '../i18n';
import { CallStatus } from '../types';

const CallInterface: React.FC = () => {
    const { language, callDetails, endCall, answerCall, isDriverMode } = useAppContext();
    const [timer, setTimer] = useState(0);

    useEffect(() => {
        let interval: ReturnType<typeof setInterval> | null = null;
        if (callDetails.status === CallStatus.ACTIVE) {
            interval = setInterval(() => {
                setTimer(prev => prev + 1);
            }, 1000);
        } else {
            setTimer(0);
        }
        return () => {
            if (interval) clearInterval(interval);
        };
    }, [callDetails.status]);

    const formatTime = (seconds: number) => {
        const mins = Math.floor(seconds / 60).toString().padStart(2, '0');
        const secs = (seconds % 60).toString().padStart(2, '0');
        return `${mins}:${secs}`;
    };

    const isIncoming = isDriverMode 
        ? callDetails.caller === 'rider' 
        : callDetails.caller === 'driver';

    const getTitle = () => {
        if (callDetails.status === CallStatus.RINGING && isIncoming) {
            return callDetails.type === 'video' ? t('incoming_call_title_video', language) : t('incoming_call_title_voice', language);
        }
        return callDetails.type === 'video' ? 'Video Call' : 'Voice Call';
    }

    const getSubtitle = () => {
        if (isIncoming) {
             return isDriverMode ? t('incoming_call_from_rider', language) : t('incoming_call_from_driver', language);
        }
        return isDriverMode ? 'Calling Rider...' : 'Calling Driver...';
    };


    return (
        <div className="fixed inset-0 bg-gray-900 bg-opacity-95 z-[100] flex flex-col items-center justify-center animate-fade-in p-4 text-white">
            <div className="text-center">
                <h2 className="text-3xl font-bold">{getTitle()}</h2>
                <p className="text-gray-400 mt-2 text-lg">{getSubtitle()}</p>
            </div>
            
            <div className="my-16 flex flex-col items-center">
                <div className="w-40 h-40 bg-gray-700 rounded-full flex items-center justify-center text-gray-400">
                    {/* Placeholder for video or avatar */}
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-20 w-20" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}><path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
                </div>
                 <p className="mt-6 text-xl font-semibold">
                    {callDetails.status === CallStatus.RINGING && t('call_status_ringing', language)}
                    {callDetails.status === CallStatus.ACTIVE && formatTime(timer)}
                </p>
            </div>

            <div className="flex items-center space-x-8">
                {(callDetails.status === CallStatus.RINGING && isIncoming) && (
                    <>
                        <button onClick={answerCall} className="w-20 h-20 bg-green-500 rounded-full flex items-center justify-center" aria-label={t('call_accept_button', language)}>
                             <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10" viewBox="0 0 20 20" fill="currentColor"><path d="M2 3a1 1 0 011-1h2.153a1 1 0 01.986.836l.74 4.435a1 1 0 01-.54 1.06l-1.548.773a11.037 11.037 0 006.105 6.105l.774-1.548a1 1 0 011.059-.54l4.435.74a1 1 0 01.836.986V17a1 1 0 01-1 1h-2C7.82 18 2 12.18 2 5V3z" /></svg>
                        </button>
                        <button onClick={endCall} className="w-20 h-20 bg-red-500 rounded-full flex items-center justify-center" aria-label={t('call_decline_button', language)}>
                           <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
                        </button>
                    </>
                )}
                {(callDetails.status === CallStatus.ACTIVE || (callDetails.status === CallStatus.RINGING && !isIncoming)) && (
                     <button onClick={endCall} className="w-20 h-20 bg-red-500 rounded-full flex items-center justify-center" aria-label={t('call_end_button', language)}>
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
                    </button>
                )}
            </div>
        </div>
    );
};

export default CallInterface;