"use client";

import { useEffect, useRef, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { io, Socket } from 'socket.io-client';
import axios from 'axios';
import { Phone } from '../icons/Phone';
import { ScreenShareOff } from '../icons/ScreenShareOff';
import { MicOn } from '../icons/MicOn';
import { MicOff } from '../icons/MicOff';
import { ScreenShare } from '../icons/ScreenShare';
import { ChatPanel, ChatMessage } from '../ChatPanel';
import { Toast } from '../Toast';
import { MessageCircle } from '../icons/MessageCircle';

interface Participant {
    id: string;
    username: string;
    stream?: MediaStream | null;
    isMuted?: boolean;
}

export const RoomComponent = ({ params }: { params: { id: string } }) => {
    const roomId = params.id;
    const router = useRouter();
    const [participants, setParticipants] = useState<Record<string, Participant>>({});
    const [userId, setUserId] = useState<string | null>(null);
    const [username, setUsername] = useState<string>('Guest');

    const [isMicOn, setIsMicOn] = useState(false);
    const [isSharingScreen, setIsSharingScreen] = useState(false);
    const [isChatOpen, setIsChatOpen] = useState(false);
    const [messages, setMessages] = useState<ChatMessage[]>([]);
    const [toasts, setToasts] = useState<{ id: string, message: string }[]>([]);

    const socketRef = useRef<Socket | null>(null);
    const peersRef = useRef<Record<string, RTCPeerConnection>>({});
    const localStreamRef = useRef<MediaStream | null>(null);

    useEffect(() => {
        axios.get(`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/v1/auth/session`, { withCredentials: true })
            .then(res => {
                if (res.data?.message?.isAuthenticated) {
                    setUserId(res.data.message.user.id);
                    setUsername(res.data.message.user.username);
                } else {
                    const storedGuestId = sessionStorage.getItem('guestId');
                    const storedGuestName = sessionStorage.getItem('guestName');
                    const guestId = storedGuestId || `guest-${Math.random().toString(36).substring(2, 9)}`;
                    setUserId(guestId);
                    setUsername(storedGuestName || `Guest-${guestId.substring(0, 4)}`);
                }
            }).catch(() => {
                const storedGuestId = sessionStorage.getItem('guestId');
                const storedGuestName = sessionStorage.getItem('guestName');
                const guestId = storedGuestId || `guest-${Math.random().toString(36).substring(2, 9)}`;
                setUserId(guestId);
                setUsername(storedGuestName || `Guest-${guestId.substring(0, 4)}`);
            });
    }, []);

    const createPeerConnection = useCallback((peerId: string) => {
        if (peersRef.current[peerId]) return peersRef.current[peerId];

        const peer = new RTCPeerConnection({
            iceServers: [{ urls: 'stun:stun.l.google.com:19302' }],
        });

        peer.onnegotiationneeded = async () => {
            console.log("Negotiation needed for peer:", peerId);
            try {
                const offer = await peer.createOffer();
                await peer.setLocalDescription(offer);
                socketRef.current?.emit('offer', { to: peerId, offer });
            } catch (err) {
                console.error("Error creating offer:", err);
            }
        };

        peer.onicecandidate = (event) => {
            if (event.candidate) {
                socketRef.current?.emit('ice-candidate', { to: peerId, candidate: event.candidate });
            }
        };

        peer.ontrack = (event) => {
            setParticipants(prev => {
                const existingParticipant = prev[peerId] || { id: peerId, username: 'New User' };
                return {
                    ...prev,
                    [peerId]: { ...existingParticipant, stream: event.streams[0] }
                };
            });
        };

        localStreamRef.current?.getTracks().forEach(track => {
            peer.addTrack(track, localStreamRef.current!);
        });

        peersRef.current[peerId] = peer;
        return peer;
    }, []);

    const participantsRef = useRef(participants);
    const isChatOpenRef = useRef(isChatOpen);

    useEffect(() => {
        participantsRef.current = participants;
    }, [participants]);

    useEffect(() => {
        isChatOpenRef.current = isChatOpen;
    }, [isChatOpen]);

    useEffect(() => {
        if (!userId || !username) return;

        // Initialize with empty stream
        if (!localStreamRef.current) {
            localStreamRef.current = new MediaStream();
        }

        const socket = io(process.env.NEXT_PUBLIC_SIGNALING_SERVER_URL || 'http://localhost:3001');
        socketRef.current = socket;

        setParticipants(prev => ({
            ...prev,
            [userId]: {
                id: userId,
                username,
                stream: localStreamRef.current,
                isMuted: !isMicOn
            }
        }));

        socket.emit('join-room', roomId, userId, username);

        const handleUserConnected = (participant: { id: string, username: string }) => {
            console.log(`User connected: ${participant.username} (${participant.id})`);
            setParticipants(prev => ({ ...prev, [participant.id]: participant }));
            createPeerConnection(participant.id);
            addToast(`${participant.username} joined the room`);
        };

        const handleExistingUsers = (participants: Participant[]) => {
            console.log("Existing users in room:", participants);
            for (const participant of participants) {
                setParticipants(prev => ({ ...prev, [participant.id]: participant }));
                const peer = createPeerConnection(participant.id);
            }
        };

        const handleOffer = async ({ offer, from }: { offer: RTCSessionDescriptionInit; from: string }) => {
            const peer = createPeerConnection(from);
            await peer.setRemoteDescription(new RTCSessionDescription(offer));
            const answer = await peer.createAnswer();
            await peer.setLocalDescription(answer);
            socket.emit('answer', { to: from, answer });
        };

        const handleAnswer = async ({ answer, from }: { answer: RTCSessionDescriptionInit; from: string }) => {
            const peer = peersRef.current[from];
            if (peer) {
                await peer.setRemoteDescription(new RTCSessionDescription(answer));
            }
        };

        const handleIceCandidate = (data: { candidate: RTCIceCandidateInit; from: string }) => {
            const peer = peersRef.current[data.from];
            if (peer) {
                peer.addIceCandidate(new RTCIceCandidate(data.candidate));
            }
        };

        const handleUserDisconnected = (disconnectedUserId: string) => {
            const currentParticipants = participantsRef.current;
            const username = currentParticipants[disconnectedUserId]?.username || 'Unknown user';
            addToast(`${username} left the room`);

            if (peersRef.current[disconnectedUserId]) {
                peersRef.current[disconnectedUserId].close();
                delete peersRef.current[disconnectedUserId];
            }
            setParticipants(prev => {
                const newParticipants = { ...prev };
                delete newParticipants[disconnectedUserId];
                return newParticipants;
            });
        };

        const handleReceiveMessage = (data: ChatMessage) => {
            setMessages(prev => [...prev, data]);
            if (!isChatOpenRef.current) {
                addToast(`New message from ${data.username}`);
            }
        };

        socket.on('user-connected', handleUserConnected);
        socket.on('existing-users', handleExistingUsers);
        socket.on('offer', handleOffer);
        socket.on('answer', handleAnswer);
        socket.on('ice-candidate', handleIceCandidate);
        socket.on('user-disconnected', handleUserDisconnected);
        socket.on('receive-message', handleReceiveMessage);

        return () => {
            socket.disconnect();
            Object.values(peersRef.current).forEach(peer => peer.close());
            localStreamRef.current?.getTracks().forEach(track => track.stop());
        };

    }, [userId, roomId, createPeerConnection, username]);

    const addToast = (message: string) => {
        const id = Math.random().toString(36).substring(7);
        setToasts(prev => [...prev, { id, message }]);
    };

    const removeToast = (id: string) => {
        setToasts(prev => prev.filter(t => t.id !== id));
    };

    const handleSendMessage = (message: string) => {
        if (!userId || !roomId) return;
        const msg: ChatMessage = {
            senderId: userId,
            username: username,
            message,
            timestamp: new Date().toISOString(),
            isLocal: true
        };
        // Optimistic update
        setMessages(prev => [...prev, msg]);
        socketRef.current?.emit('send-message', roomId, message);
    };

    const toggleMedia = useCallback(async (type: 'mic' | 'screen') => {
        const isCurrentlyOn = type === 'mic' ? isMicOn : isSharingScreen;
        const setOn = type === 'mic' ? setIsMicOn : setIsSharingScreen;

        if (!isCurrentlyOn) {
            // Turning ON
            try {
                const newMediaStream = type === 'mic'
                    ? await navigator.mediaDevices.getUserMedia({ audio: true })
                    : await navigator.mediaDevices.getDisplayMedia({
                        video: {
                            displaySurface: "monitor" // This helps with full screen capture
                        },
                        audio: {
                            echoCancellation: true,
                            noiseSuppression: true
                        }
                    });

                const newTrack = newMediaStream.getTracks()[0];

                // Add track to local stream
                if (!localStreamRef.current) {
                    localStreamRef.current = new MediaStream();
                }
                localStreamRef.current.addTrack(newTrack);

                // Replace or add track in all peer connections
                Object.values(peersRef.current).forEach(peer => {
                    const sender = peer.getSenders().find(s => s.track?.kind === newTrack.kind);
                    if (sender) {
                        sender.replaceTrack(newTrack);
                    } else {
                        peer.addTrack(newTrack, localStreamRef.current!);
                    }
                });

                if (type === 'screen') {
                    newTrack.onended = () => toggleMedia('screen');
                }

                setOn(true);

                // Update local participant
                setParticipants(prev => ({
                    ...prev,
                    [userId!]: {
                        ...prev[userId!],
                        stream: localStreamRef.current,
                        isMuted: type === 'mic' ? false : prev[userId!]?.isMuted
                    }
                }));
            } catch (e) {
                console.error(`Error starting ${type}:`, e);
                return;
            }
        } else {
            // Turning OFF
            const trackKind = type === 'mic' ? 'audio' : 'video';
            const tracksToRemove = localStreamRef.current?.getTracks().filter(t => t.kind === trackKind) || [];

            tracksToRemove.forEach(track => {
                track.stop();
                localStreamRef.current?.removeTrack(track);

                // Remove track from all peer connections
                Object.values(peersRef.current).forEach(peer => {
                    const sender = peer.getSenders().find(s => s.track === track);
                    if (sender) {
                        peer.removeTrack(sender);
                    }
                });
            });

            setOn(false);

            // Update local participant
            setParticipants(prev => ({
                ...prev,
                [userId!]: {
                    ...prev[userId!],
                    stream: localStreamRef.current,
                    isMuted: type === 'mic' ? true : prev[userId!]?.isMuted
                }
            }));
        }
    }, [isMicOn, isSharingScreen, userId]);

    const handleLeaveRoom = () => router.push('/');

    const participantIds = Object.keys(participants);
    const gridLayout = () => {
        const count = participantIds.length;
        if (count <= 1) return 'grid-cols-1';
        if (count <= 2) return 'grid-cols-2';
        if (count <= 4) return 'grid-cols-2 grid-rows-2';
        if (count <= 6) return 'grid-cols-3 grid-rows-2';
        return 'grid-cols-3 grid-rows-3';
    }

    return (
        <div className="flex flex-col h-screen bg-gray-900 text-white relative overflow-hidden">
            {/* Toasts */}
            <div className="fixed top-4 right-4 z-50 flex flex-col gap-2">
                {toasts.map(toast => (
                    <Toast key={toast.id} message={toast.message} onClose={() => removeToast(toast.id)} />
                ))}
            </div>

            <main className={`flex-1 grid gap-4 p-4 ${gridLayout()} overflow-auto transition-all duration-300 ${isChatOpen ? 'mr-80' : ''}`}>
                {participantIds.map(pId => (
                    <VideoPlayer key={pId} participant={participants[pId]} isLocal={pId === userId} />
                ))}
            </main>

            <ChatPanel
                isOpen={isChatOpen}
                onClose={() => setIsChatOpen(false)}
                messages={messages}
                onSendMessage={handleSendMessage}
                currentUserId={userId || ''}
            />
            <footer className="shrink-0 bg-gray-800/50 backdrop-blur-sm p-4 flex justify-center items-center gap-4 border-t border-gray-700">
                <ControlButton onClick={() => toggleMedia('mic')} isOn={isMicOn}>
                    {isMicOn ? <MicOn className='cursor-pointer size-6' /> : <MicOff className='cursor-pointer size-6' />}
                </ControlButton>
                <ControlButton onClick={() => toggleMedia('screen')} isOn={isSharingScreen}>
                    {isSharingScreen ? <ScreenShareOff className='size-6 cursor-pointer' /> : <ScreenShare className='size-6 cursor-pointer' />}
                </ControlButton>
                <ControlButton onClick={() => setIsChatOpen(!isChatOpen)} isOn={isChatOpen}>
                    <MessageCircle className="size-6 cursor-pointer" />
                </ControlButton>
                <ControlButton onClick={handleLeaveRoom} isDanger>
                    <Phone className='size-6 cursor-pointer' />
                </ControlButton>
            </footer>
        </div>
    );
};

const VideoPlayer = ({ participant, isLocal }: { participant: Participant, isLocal: boolean }) => {
    const videoRef = useRef<HTMLVideoElement>(null);
    useEffect(() => {
        if (videoRef.current && participant.stream) {
            videoRef.current.srcObject = participant.stream;
        }
    }, [participant.stream]);

    const hasVideo = !!participant.stream && participant.stream.getVideoTracks().length > 0 && participant.stream.getVideoTracks()[0].enabled;
    const isMuted = participant.isMuted || (participant.stream && participant.stream.getAudioTracks().length > 0 && !participant.stream.getAudioTracks()[0].enabled);


    // Listen for track updates (mute/unmute, video on/off)
    // In a real app we'd need more complex listeners on the MediaStreamTrack 'ended' and 'mute' events,
    // but for now relying on state updates or parent re-renders might be approximations.
    // However, the 'hasVideo' check above evaluates the CURRENT state of the tracks.
    // To ensure the component re-renders when tracks change state, we might need a forceUpdate or better listener.
    // For this implementation, we will assume VideoPlayer re-renders when `participant` updates.

    return (
        <div className="bg-gray-800 rounded-lg overflow-hidden relative shadow-lg flex items-center justify-center border border-gray-700">
            {hasVideo ? (
                <video ref={videoRef} autoPlay playsInline muted={isLocal} className="w-full h-full object-contain bg-black" />
            ) : (
                <div className="flex flex-col items-center justify-center text-gray-400">
                    <div className="w-20 h-20 bg-gray-700 rounded-full flex items-center justify-center mb-2">
                        <span className="text-3xl font-bold text-gray-300">{participant.username.charAt(0).toUpperCase()}</span>
                    </div>
                    <span className="font-medium text-lg">{participant.username} {isLocal && "(You)"}</span>
                </div>
            )}

            <div className="absolute bottom-2 left-2 bg-black/60 backdrop-blur-sm px-3 py-1.5 rounded-md text-sm font-semibold flex items-center gap-2">
                <span>{participant.username} {isLocal && "(You)"}</span>
                {participant.isMuted && ( // Use participant.isMuted from state as it's more reliable than track.enabled for remote peers if we sync it
                    <MicOff className="w-4 h-4 text-red-500" />
                )}
            </div>
        </div>
    );
};

const ControlButton = ({ children, onClick, isOn = false, isDanger = false }: { children: React.ReactNode, onClick: () => void, isOn?: boolean, isDanger?: boolean }) => {
    const baseClasses = 'p-3 rounded-full text-white transition-all duration-200 ease-in-out transform hover:scale-110';
    const onClasses = 'bg-gray-600 hover:bg-gray-500';
    const offClasses = 'bg-blue-600 hover:bg-blue-500';
    const dangerClasses = 'bg-red-600 hover:bg-red-500';
    const classes = `${baseClasses} ${isDanger ? dangerClasses : isOn ? offClasses : onClasses}`;

    return <button onClick={onClick} className={classes}>{children}</button>;
};