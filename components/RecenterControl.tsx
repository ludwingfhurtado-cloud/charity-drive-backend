import React from 'react';
import { useAppContext } from '../hooks/useAppContext';

const RecenterIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
    </svg>
);

const RecenterControl: React.FC = () => {
    const { handleRecenterMap } = useAppContext();

    return (
        <button
            onClick={handleRecenterMap}
            className="p-2 bg-gray-800/80 backdrop-blur-sm rounded-full text-white hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
            aria-label="Recenter map"
        >
            <RecenterIcon />
        </button>
    );
};

export default RecenterControl;
