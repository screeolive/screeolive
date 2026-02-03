import { useEffect, useRef, useState } from "react";
import axios, { AxiosError } from 'axios'; // Import axios
import { useRouter } from "next/navigation";
import Image from "next/image";

// --- Helper Components & Icons ---

// A simple spinner for loading states
const Spinner = () => (
    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-cyan-600"></div>
);

// Close Icon (You can replace this with your own SVG icon component)
const CloseCircle = ({ className }: { className?: string }) => (
    <svg className={className} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" d="m9.75 9.75 4.5 4.5m0-4.5-4.5 4.5M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
    </svg>
);

// Google Icon
const GoogleIcon = () => (
    <svg className="w-6 h-6 mr-3" viewBox="0 0 48 48">
        <path fill="#FFC107" d="M43.611 20.083H42V20H24v8h11.303c-1.649 4.657-6.08 8-11.303 8c-6.627 0-12-5.373-12-12s5.373-12 12-12c3.059 0 5.842 1.154 7.961 3.039l5.657-5.657C34.046 6.053 29.268 4 24 4C12.955 4 4 12.955 4 24s8.955 20 20 20s20-8.955 20-20c0-1.341-.138-2.65-.389-3.917z"></path>
        <path fill="#FF3D00" d="M6.306 14.691L12.127 19.46a8.973 8.973 0 0 1 11.873-1.465l5.657-5.657A19.923 19.923 0 0 0 6.306 14.691z"></path>
        <path fill="#4CAF50" d="M24 44c5.166 0 9.86-1.977 13.409-5.192l-6.19-5.238A8.994 8.994 0 0 1 24 36c-5.202 0-9.619-3.317-11.283-7.946l-6.522 5.025A19.94 19.94 0 0 0 24 44z"></path>
        <path fill="#1976D2" d="M43.611 20.083H42V20H24v8h11.303c-.792 2.237-2.231 4.166-4.087 5.571l6.19 5.238C42.612 34.869 44 30.138 44 24c0-1.341-.138-2.65-.389-3.917z"></path>
    </svg>
);

// --- Main Modal Component ---

interface CreateRoomLobbyProps {
    open: boolean;
    onClose: () => void;
    onSwitchToJoinRoomLobby: () => void;
}

interface AuthenticatedUser {
    id: string;
    email: string;
    username: string;
}

export const CreateRoomLobbyModal = ({ open, onClose, onSwitchToJoinRoomLobby }: CreateRoomLobbyProps) => {
    const modalRef = useRef<HTMLDivElement>(null);
    const router = useRouter();

    const [isLoading, setIsLoading] = useState(true);
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [userData, setUserData] = useState<AuthenticatedUser | null>(null);
    const [guestName, setGuestName] = useState("");
    const [isCreatingRoom, setIsCreatingRoom] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // --- Effect for checking authentication status ---
    useEffect(() => {
        if (!open) {
            setIsLoading(true);
            setError(null);
            return;
        }

        const checkAuthStatus = async () => {
            try {
                // Using axios for the API call
                const response = await axios.get(`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/v1/auth/session`, { withCredentials: true });

                if (response.data?.message?.isAuthenticated) {
                    setUserData(response.data.message.user);
                    setIsAuthenticated(true);
                } else {
                    setIsAuthenticated(false);
                }
            } catch (err) {
                // Axios places error response data in `err.response`
                const axiosError = err as AxiosError;
                console.error("Failed to fetch auth session:", axiosError.response?.data || axiosError.message);
                setIsAuthenticated(false);
                if (axiosError.response?.status !== 401) { // 401 is expected for guests
                    setError("Could not connect to the server.");
                }
            } finally {
                setIsLoading(false);
            }
        };

        checkAuthStatus();
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

    const handleCreateRoom = async (joinAsGuest: boolean = false) => {
        setIsCreatingRoom(true);
        setError(null);
        try {
            // Using axios to create the room
            const payload = joinAsGuest ? { guestName } : {};
            const response = await axios.post(`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/v1/rooms`, payload, { withCredentials: true });

            const roomId = response.data?.roomId;
            if (!roomId) {
                throw new Error("Invalid response from server.");
            }

            // Redirect to the new meeting room
            router.push(`/r/${roomId}`);

        } catch (err) {
            const axiosError = err as AxiosError<{ message?: string }>;
            const errorMessage = axiosError.response?.data?.message || 'Failed to create room. Please try again.';
            setError(errorMessage);
            setIsCreatingRoom(false);
        }
    };

    const handleSignInWithGoogle = () => {
        window.location.href = `${process.env.NEXT_PUBLIC_BACKEND_URL}/auth/google`;
    };


    // --- Render Logic ---

    const renderContent = () => {
        if (isLoading) {
            return <div className="flex justify-center items-center h-64"><Spinner /></div>;
        }

        if (error) {
            return <div className="text-center text-red-500 p-8">{error}</div>;
        }

        const switchToJoinView = (
            <div className="text-center mt-6">
                <button
                    onClick={onSwitchToJoinRoomLobby}
                    className="text-sm font-semibold text-cyan-700 hover:text-cyan-800 cursor-pointer hover:underline"
                >
                    Or, join an existing meeting
                </button>
            </div>
        );

        if (isAuthenticated && userData) {
            // --- Authenticated User View ---
            return (
                <div className="text-center">
                    <Image
                        src={`https://api.dicebear.com/8.x/initials/png?seed=${encodeURIComponent(userData.username)}`}
                        alt="avatar"
                        width={128}
                        height={128}
                        className="w-24 h-24 rounded-full mx-auto mb-4 border-4 border-cyan-100"
                    />
                    {/* <Image src={`https://api.dicebear.com/8.x/initials/svg?seed=${userData.username}`} alt="avatar" width={128} height={128} className="w-24 h-24 rounded-full mx-auto mb-4 border-4 border-cyan-100" /> */}
                    <h2 className="text-2xl font-bold text-gray-800">Welcome, {userData.username}!</h2>
                    <p className="text-gray-500 mt-2">You&apos;re all set to start your meeting.</p>
                    <div className="mt-8">
                        <button
                            onClick={() => handleCreateRoom(false)}
                            disabled={isCreatingRoom}
                            className="w-full bg-cyan-600 text-white font-bold py-3 px-6 rounded-lg text-lg hover:bg-cyan-700 transition-all duration-300 disabled:bg-gray-400 flex items-center justify-center"
                        >
                            {isCreatingRoom ? <Spinner /> : '🚀 Start Meeting'}
                        </button>
                    </div>
                    {switchToJoinView}
                </div>
            );
        }

        // --- Guest User View ---
        return (
            <div>
                <p className="text-center text-gray-600 mb-6">Sign in or continue as a guest to create your meeting.</p>
                <button
                    onClick={handleSignInWithGoogle}
                    className="w-full flex items-center justify-center bg-white border border-gray-300 text-gray-700 font-semibold py-3 px-6 rounded-lg hover:bg-gray-50 transition-all duration-300"
                >
                    <GoogleIcon />
                    Sign in with Google
                </button>

                <div className="my-6 flex items-center">
                    <div className="flex-grow border-t border-gray-300"></div>
                    <span className="flex-shrink mx-4 text-gray-500 font-semibold">OR</span>
                    <div className="flex-grow border-t border-gray-300"></div>
                </div>

                <form onSubmit={(e) => { e.preventDefault(); handleCreateRoom(true); }}>
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
                        disabled={!guestName || isCreatingRoom}
                        className="w-full mt-4 bg-gray-700 text-white font-bold py-3 px-6 rounded-lg hover:bg-gray-800 transition-all duration-300 disabled:bg-gray-400 flex items-center justify-center"
                    >
                        {isCreatingRoom ? <Spinner /> : 'Create as Guest'}
                    </button>
                </form>
                {switchToJoinView}
            </div>
        );
    };

    if (!open) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
            <div
                ref={modalRef}
                className="bg-white rounded-2xl shadow-2xl w-full max-w-md m-auto transform transition-all duration-300 scale-95 opacity-0 animate-fade-in-scale"
                style={{ animationFillMode: 'forwards' }} // CSS for the custom animation
            >
                <div className="p-6 relative">
                    <button onClick={onClose} className="absolute top-4 right-4 text-gray-400 hover:text-red-500 transition-colors">
                        <CloseCircle className="h-7 w-7" />
                    </button>

                    <div className="flex justify-center mb-4">
                        <h1 className="bg-gradient-to-r text-2xl font-extrabold from-blue-600 to-cyan-600 bg-clip-text text-transparent">
                            Create a Meeting
                        </h1>
                    </div>

                    {renderContent()}
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