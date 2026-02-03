"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import axios from "axios";
import { Navbar } from "../ui/Navbar";
import { Button } from "../ui/buttons/Button";
import { Video } from "../icons/Video";
import { Keyboard } from "../icons/Keyboard";

export const LandingPage = () => {
    const router = useRouter();
    const [roomId, setRoomId] = useState("");
    const [isCreating, setIsCreating] = useState(false);
    const [showGuestModal, setShowGuestModal] = useState(false);
    const [guestName, setGuestName] = useState("");

    // New Meeting Handler
    const handleNewMeeting = async (providedGuestName?: string) => {
        setIsCreating(true);
        try {
            const payload = providedGuestName ? { guestName: providedGuestName } : {};
            const res = await axios.post(`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/v1/rooms`, payload, {
                withCredentials: true
            });

            const { roomId, guestId } = res.data;

            if (guestId && providedGuestName) {
                sessionStorage.setItem('guestId', guestId);
                sessionStorage.setItem('guestName', providedGuestName);
            }

            router.push(`/r/${roomId}`);

        } catch (error: any) {
            if (error.response?.status === 400 && error.response.data.message.includes("Guest name")) {
                setShowGuestModal(true);
            } else {
                console.error("Failed to create room", error);
                alert("Failed to create room. Please try again.");
            }
        } finally {
            setIsCreating(false);
        }
    };

    const handleGuestSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (guestName.trim()) {
            handleNewMeeting(guestName);
        }
    };

    const handleJoin = (e: React.FormEvent) => {
        e.preventDefault();
        if (roomId.trim()) {
            router.push(`/r/${roomId}`);
        }
    };

    return (
        <div className="bg-[#08090a] text-[#eaf2ef] min-h-screen flex flex-col overflow-hidden relative">
            <div className="mt-6 mx-6">
                <Navbar />
            </div>

            <div className="flex-1 flex flex-col md:flex-row items-center justify-center gap-12 px-6 md:px-20 relative z-10">
                {/* Left Content */}
                <div className="max-w-2xl space-y-8 animate-fade-in-up">
                    <h1 className="text-5xl md:text-7xl font-bold leading-tight bg-gradient-to-r from-white to-gray-400 bg-clip-text text-transparent">
                        Video calls and meetings for everyone.
                    </h1>
                    <p className="text-xl text-gray-400 max-w-lg">
                        Connect, collaborate, and celebrate from anywhere with SCREEO. Secure, high-quality video meetings available to everyone, on any device.
                    </p>

                    <div className="flex flex-col sm:flex-row gap-4 items-center">
                        <Button
                            text={isCreating ? "Creating..." : "New Meeting"}
                            colorVariant="purple"
                            sizeVariant="medium"
                            hoverVariant="purple_2"
                            startIcon={<Video className="size-6" />}
                            onClick={() => handleNewMeeting()}
                            disabled={isCreating}
                            className="bg-[#735cdd] hover:bg-[#5f4bb6] px-6 py-4 rounded-xl text-lg w-full sm:w-auto justify-center shadow-lg shadow-purple-900/20"
                        />

                        <form onSubmit={handleJoin} className="flex gap-2 w-full sm:w-auto relative group">
                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
                                <Keyboard className="size-5" />
                            </div>
                            <input
                                type="text"
                                placeholder="Enter a code or link"
                                className="pl-10 pr-4 py-3.5 rounded-xl bg-white/5 border border-white/10 focus:border-[#735cdd] focus:ring-1 focus:ring-[#735cdd] outline-none transition-all w-full sm:w-64"
                                value={roomId}
                                onChange={(e) => setRoomId(e.target.value)}
                            />
                            {roomId && (
                                <button className="text-[#735cdd] font-bold hover:text-white transition-colors px-2">Join</button>
                            )}
                        </form>
                    </div>

                    <div className="pt-8 border-t border-white/5 w-full">
                        <p className="text-sm text-gray-500">
                            <span className="text-green-500">●</span> <span className="text-white font-medium">Safe & Secure</span> • No application download needed
                        </p>
                    </div>
                </div>

                {/* Right Content / Visual */}
                <div className="w-full max-w-xl relative hidden md:block">
                    {/* Decorative Elements */}
                    <div className="absolute -top-20 -right-20 w-72 h-72 bg-purple-600/20 rounded-full blur-3xl"></div>
                    <div className="absolute -bottom-20 -left-20 w-72 h-72 bg-blue-600/20 rounded-full blur-3xl"></div>

                    <div className="relative bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-4 shadow-2xl rotate-3 hover:rotate-0 transition-transform duration-500">
                        <div className="aspect-video bg-gray-900 rounded-lg flex items-center justify-center overflow-hidden relative">
                            {/* Mock UI of a call */}
                            <div className="grid grid-cols-2 gap-2 p-2 w-full h-full">
                                <div className="bg-gray-800 rounded animate-pulse"></div>
                                <div className="bg-gray-700 rounded animate-pulse delay-75"></div>
                            </div>
                            <div className="absolute bottom-4 flex gap-2">
                                <div className="w-8 h-8 rounded-full bg-red-500"></div>
                                <div className="w-8 h-8 rounded-full bg-gray-700"></div>
                                <div className="w-8 h-8 rounded-full bg-gray-700"></div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Guest Name Modal */}
            {showGuestModal && (
                <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
                    <div className="bg-[#1a1c1e] p-6 rounded-2xl border border-white/10 w-full max-w-sm shadow-2xl scale-100 animate-in fade-in zoom-in duration-200">
                        <h3 className="text-xl font-bold mb-4">What's your name?</h3>
                        <form onSubmit={handleGuestSubmit}>
                            <input
                                autoFocus
                                type="text"
                                className="w-full bg-black/30 border border-white/10 rounded-lg px-4 py-2 mb-4 focus:border-[#735cdd] outline-none"
                                placeholder="Your Name"
                                value={guestName}
                                onChange={(e) => setGuestName(e.target.value)}
                            />
                            <div className="flex gap-2 justify-end">
                                <button
                                    type="button"
                                    onClick={() => setShowGuestModal(false)}
                                    className="px-4 py-2 rounded-lg hover:bg-white/5 transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    className="bg-[#735cdd] hover:bg-[#624ebd] px-4 py-2 rounded-lg font-medium transition-colors"
                                >
                                    Continue
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    )
}