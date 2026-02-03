"use client";

import { useEffect, useRef, useState } from "react";
import axios, { AxiosError } from 'axios';
import { useRouter } from "next/navigation";

// --- Helper Components & Icons (You can move these to a shared file) ---

const Spinner = () => (
    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-white"></div>
);

const CloseCircle = ({ className }: { className?: string }) => (
    <svg className={className} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" d="m9.75 9.75 4.5 4.5m0-4.5-4.5 4.5M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
    </svg>
);

const GoogleIcon = () => (
    <svg className="w-6 h-6 mr-3" viewBox="0 0 48 48">
        <path fill="#FFC107" d="M43.611 20.083H42V20H24v8h11.303c-1.649 4.657-6.08 8-11.303 8c-6.627 0-12-5.373-12-12s5.373-12 12-12c3.059 0 5.842 1.154 7.961 3.039l5.657-5.657C34.046 6.053 29.268 4 24 4C12.955 4 4 12.955 4 24s8.955 20 20 20s20-8.955 20-20c0-1.341-.138-2.65-.389-3.917z"></path>
        <path fill="#FF3D00" d="M6.306 14.691L12.127 19.46a8.973 8.973 0 0 1 11.873-1.465l5.657-5.657A19.923 19.923 0 0 0 6.306 14.691z"></path>
        <path fill="#4CAF50" d="M24 44c5.166 0 9.86-1.977 13.409-5.192l-6.19-5.238A8.994 8.994 0 0 1 24 36c-5.202 0-9.619-3.317-11.283-7.946l-6.522 5.025A19.94 19.94 0 0 0 24 44z"></path>
        <path fill="#1976D2" d="M43.611 20.083H42V20H24v8h11.303c-.792 2.237-2.231 4.166-4.087 5.571l6.19 5.238C42.612 34.869 44 30.138 44 24c0-1.341-.138-2.65-.389-3.917z"></path>
    </svg>
);

// --- Main Modal Component ---

interface JoinRoomLobbyProps {
    open: boolean;
    onClose: () => void;
    onSwitchToCreateRoomLobby: () => void;
}

// interface AuthenticatedUser {
//     id: string;
//     email: string;
//     username: string;
// }

interface ErrorResponse {
    message: string;
}

export const JoinRoomLobbyModal = ({ open, onClose, onSwitchToCreateRoomLobby }: JoinRoomLobbyProps) => {
    const modalRef = useRef<HTMLDivElement>(null);
    const router = useRouter();

    const [step, setStep] = useState<'enter_code' | 'enter_details'>('enter_code');
    const [roomCode, setRoomCode] = useState('');
    const [guestName, setGuestName] = useState('');

    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const [isAuthenticated, setIsAuthenticated] = useState(false);
    // const [userData, setUserData] = useState<AuthenticatedUser | null>(null);

    useEffect(() => {
        console.log("Welcome to Screeo!");
    }, [isAuthenticated]);

    // --- Effect for resetting state when modal opens/closes ---
    useEffect(() => {
        if (open) {
            // Reset state when modal is opened
            setStep('enter_code');
            setRoomCode('');
            setGuestName('');
            setError(null);
            setIsLoading(false);
        }
    }, [open]);

    // --- Effect for handling clicks outside the modal ---
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => e.key === "Escape" && onClose();
        const handleClickOutside = (e: MouseEvent) => {
            if (modalRef.current && !modalRef.current.contains(e.target as Node)) {
                onClose();
            }
        };

        if (open) {
            document.addEventListener("keydown", handleKeyDown);
            document.addEventListener("mousedown", handleClickOutside);
        }

        return () => {
            document.removeEventListener("keydown", handleKeyDown);
            document.removeEventListener("mousedown", handleClickOutside);
        };
    }, [open, onClose]);

    // --- Action Handlers ---

    const handleVerifyRoom = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        setError(null);

        // Extract roomId from URL if a full URL is pasted
        const formattedRoomId = roomCode.split('/').pop() || roomCode;

        try {
            // 1. Verify the room exists
            await axios.get(`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/v1/rooms/${formattedRoomId}`);

            // 2. If room exists, check authentication
            const authResponse = await axios.get(`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/v1/auth/session`, { withCredentials: true });

            if (authResponse.data?.message?.isAuthenticated) {
                // If authenticated, join immediately
                router.push(`/r/${formattedRoomId}`);
            } else {
                // If not authenticated, move to the guest details step
                setIsAuthenticated(false);
                setStep('enter_details');
            }

        } catch (err) {
            // const axiosError = err as AxiosError<any>;
            const axiosError = err as AxiosError<ErrorResponse>;
            if (axiosError.response?.status === 404) {
                setError("No meeting found with that ID. Please check the code and try again.");
            } else {
                setError("Something went wrong. Please try again later.");
            }
            console.error("Failed to verify room:", err);
        } finally {
            setIsLoading(false);
        }
    };

    const handleJoinAsGuest = (e: React.FormEvent) => {
        e.preventDefault();
        const formattedRoomId = roomCode.split('/').pop() || roomCode;
        // In a real app, you might pass the guest name in state or query params
        // For now, we just redirect. The RoomComponent will handle the guest logic.
        router.push(`/r/${formattedRoomId}`);
    };

    const handleSignInWithGoogle = () => {
        const formattedRoomId = roomCode.split('/').pop() || roomCode;
        // Redirect to Google Auth, which should then redirect back to the room
        window.location.href = `${process.env.NEXT_PUBLIC_BACKEND_URL}/auth/google?redirect=/r/${formattedRoomId}`;
    };

    // --- Render Logic ---

    if (!open) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">

            <div>

            </div>

            <div
                ref={modalRef}
                className="bg-white rounded-2xl shadow-2xl w-full max-w-md m-auto transform transition-all duration-300 scale-95 opacity-0 animate-fade-in-scale"
                style={{ animationFillMode: 'forwards' }}
            >
                <div className="p-6 relative">
                    <button onClick={onClose} className="absolute top-4 right-4 text-gray-400 hover:text-red-500 transition-colors">
                        <CloseCircle className="h-7 w-7" />
                    </button>

                    <div className="flex justify-center mb-4">
                        <h1 className="bg-gradient-to-r text-2xl font-extrabold from-blue-600 to-cyan-600 bg-clip-text text-transparent">
                            Join a Meeting
                        </h1>
                    </div>

                    {/* Step 1: Enter Room Code */}
                    {step === 'enter_code' && (
                        <form onSubmit={handleVerifyRoom}>
                            <p className="text-center text-gray-600 mb-4">Enter the meeting link or code to join.</p>
                            <input
                                type="text"
                                value={roomCode}
                                onChange={(e) => setRoomCode(e.target.value)}
                                placeholder="e.g., abc-def-ghi"
                                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 text-center text-lg"
                                required
                            />
                            {error && <p className="text-red-500 text-sm text-center mt-2">{error}</p>}
                            <button
                                type="submit"
                                disabled={!roomCode || isLoading}
                                className="w-full mt-4 bg-cyan-600 text-white font-bold py-3 px-6 rounded-lg hover:bg-cyan-700 transition-all duration-300 disabled:bg-gray-400 flex items-center justify-center"
                            >
                                {isLoading ? <Spinner /> : 'Join'}
                            </button>
                            <div className="text-center mt-6">
                                <button type="button" onClick={onSwitchToCreateRoomLobby} className="text-sm font-semibold text-cyan-700 hover:text-cyan-800 cursor-pointer hover:underline">
                                    Or, create a new meeting
                                </button>
                            </div>
                        </form>
                    )}

                    {/* Step 2: Enter Guest Details */}
                    {step === 'enter_details' && (
                        <div>
                            <p className="text-center text-gray-600 mb-6">Sign in for the best experience or continue as a guest.</p>
                            <button onClick={handleSignInWithGoogle} className="w-full flex items-center justify-center bg-white border border-gray-300 text-gray-700 font-semibold py-3 px-6 rounded-lg hover:bg-gray-50 transition-all duration-300">
                                <GoogleIcon />
                                Sign in with Google
                            </button>

                            <div className="my-6 flex items-center">
                                <div className="flex-grow border-t border-gray-300"></div>
                                <span className="flex-shrink mx-4 text-gray-500 font-semibold">OR</span>
                                <div className="flex-grow border-t border-gray-300"></div>
                            </div>

                            <form onSubmit={handleJoinAsGuest}>
                                <label htmlFor="guestName" className="block text-sm font-medium text-gray-700 mb-2">Continue as a guest</label>
                                <input
                                    id="guestName"
                                    type="text"
                                    value={guestName}
                                    onChange={(e) => setGuestName(e.target.value)}
                                    placeholder="Enter your display name"
                                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500"
                                    required
                                />
                                <button
                                    type="submit"
                                    disabled={!guestName}
                                    className="w-full mt-4 bg-gray-700 text-white font-bold py-3 px-6 rounded-lg hover:bg-gray-800 transition-all duration-300 disabled:bg-gray-400 flex items-center justify-center"
                                >
                                    Join as Guest
                                </button>
                            </form>
                        </div>
                    )}

                </div>
            </div>
            {/* Simple keyframes for animation */}
            <style jsx global>{`
                @keyframes fade-in-scale {
                    from { transform: scale(0.95); opacity: 0; }
                    to { transform: scale(1); opacity: 1; }
                }
                .animate-fade-in-scale {
                    animation: fade-in-scale 0.3s cubic-bezier(0.165, 0.84, 0.44, 1) forwards;
                }
            `}</style>
        </div>
    );
};