import React, { useEffect } from 'react';

interface ToastProps {
    message: string;
    onClose: () => void;
    duration?: number;
}

export const Toast: React.FC<ToastProps> = ({ message, onClose, duration = 3000 }) => {
    useEffect(() => {
        const timer = setTimeout(() => {
            onClose();
        }, duration);

        return () => clearTimeout(timer);
    }, [duration, onClose]);

    return (
        <div className="fixed top-4 right-4 bg-gray-800 text-white px-6 py-3 rounded-lg shadow-lg border border-gray-700 z-50 animate-fade-in-down">
            <div className="flex items-center gap-2">
                <span className="text-sm font-medium">{message}</span>
                <button
                    onClick={onClose}
                    className="ml-4 text-gray-400 hover:text-white focus:outline-none"
                >
                    &times;
                </button>
            </div>
        </div>
    );
};
