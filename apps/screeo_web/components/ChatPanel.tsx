import React, { useState, useRef, useEffect } from 'react';

export interface ChatMessage {
    senderId: string;
    username: string;
    message: string;
    timestamp: string;
    isLocal?: boolean;
}

interface ChatPanelProps {
    isOpen: boolean;
    onClose: () => void;
    messages: ChatMessage[];
    onSendMessage: (message: string) => void;
    currentUserId: string;
}

export const ChatPanel: React.FC<ChatPanelProps> = ({ isOpen, onClose, messages, onSendMessage, currentUserId }) => {
    const [newMessage, setNewMessage] = useState('');
    const messagesEndRef = useRef<HTMLDivElement>(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages, isOpen]);

    const handleSend = (e?: React.FormEvent) => {
        e?.preventDefault();
        if (newMessage.trim()) {
            onSendMessage(newMessage);
            setNewMessage('');
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed right-0 top-0 bottom-0 w-80 bg-gray-900 border-l border-gray-800 flex flex-col shadow-2xl transition-transform duration-300 transform translate-x-0 z-40">
            {/* Header */}
            <div className="p-4 border-b border-gray-800 flex justify-between items-center bg-gray-900/95 backdrop-blur">
                <h3 className="text-white font-semibold">In-call messages</h3>
                <button
                    onClick={onClose}
                    className="text-gray-400 hover:text-white p-1 rounded-full hover:bg-gray-800 transition-colors"
                >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                    </svg>
                </button>
            </div>

            {/* Messages Area */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {messages.length === 0 ? (
                    <div className="text-center text-gray-500 mt-10 text-sm">
                        No messages yet. refStart the conversation!
                    </div>
                ) : (
                    messages.map((msg, idx) => {
                        const isMe = msg.isLocal || msg.senderId === currentUserId;
                        return (
                            <div key={idx} className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}>
                                <div className="flex items-baseline gap-2 mb-1">
                                    <span className="text-xs font-medium text-gray-400">
                                        {isMe ? 'You' : msg.username}
                                    </span>
                                    <span className="text-[10px] text-gray-600">
                                        {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                    </span>
                                </div>
                                <div
                                    className={`px-3 py-2 rounded-2xl max-w-[85%] text-sm break-words ${isMe
                                            ? 'bg-blue-600 text-white rounded-br-none'
                                            : 'bg-gray-800 text-gray-200 rounded-bl-none'
                                        }`}
                                >
                                    {msg.message}
                                </div>
                            </div>
                        );
                    })
                )}
                <div ref={messagesEndRef} />
            </div>

            {/* Input Area */}
            <div className="p-4 border-t border-gray-800 bg-gray-900">
                <form onSubmit={handleSend} className="relative">
                    <input
                        type="text"
                        value={newMessage}
                        onChange={(e) => setNewMessage(e.target.value)}
                        placeholder="Send a message..."
                        className="w-full bg-gray-800 text-white rounded-full pl-4 pr-10 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50 border border-gray-700 placeholder-gray-500"
                    />
                    <button
                        type="submit"
                        disabled={!newMessage.trim()}
                        className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 bg-blue-600 rounded-full text-white disabled:opacity-50 disabled:cursor-not-allowed hover:bg-blue-500 transition-colors"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                            <path d="M10.894 2.553a1 1 0 00-1.788 0l-7 14a1 1 0 001.169 1.409l5-1.429A1 1 0 009 15.571V11a1 1 0 112 0v4.571a1 1 0 00.725.962l5 1.428a1 1 0 001.17-1.408l-7-14z" />
                        </svg>
                    </button>
                </form>
            </div>
        </div>
    );
};
