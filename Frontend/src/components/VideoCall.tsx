import { useEffect, useRef, useState } from 'react';
import { getSocket } from '../socket';

type Props = {
    conversationId: number;
    currentUserId: number;
    initialOffer?: RTCSessionDescriptionInit | null;
    onClose: () => void;
};

function VideoCall({
    conversationId,
    currentUserId,
    initialOffer,
    onClose
}: Props) {
    const localVideoRef = useRef<HTMLVideoElement | null>(null);
    const remoteVideoRef = useRef<HTMLVideoElement | null>(null);

    const peerRef = useRef<RTCPeerConnection | null>(null);
    const localStreamRef = useRef<MediaStream | null>(null);

    const [isCalling, setIsCalling] = useState(false);
    const [isCameraOn, setIsCameraOn] = useState(true);
    const [isMicOn, setIsMicOn] = useState(true);

    const [incomingOffer, setIncomingOffer] =
        useState<RTCSessionDescriptionInit | null>(
            initialOffer || null
        );

    const createPeer = () => {
        const socket = getSocket();
        if (!socket) return null;

        const peer = new RTCPeerConnection({
            iceServers: [
                {
                    urls: 'stun:stun.l.google.com:19302'
                }
            ]
        });

        peer.onicecandidate = (event) => {
            if (event.candidate) {
                socket.emit('iceCandidate', {
                    conversationId,
                    candidate: event.candidate
                });
            }
        };

        peer.ontrack = (event) => {
            if (remoteVideoRef.current) {
                remoteVideoRef.current.srcObject = event.streams[0];
            }
        };

        peerRef.current = peer;

        return peer;
    };

    const startLocalStream = async () => {
        const stream = await navigator.mediaDevices.getUserMedia({
            video: true,
            audio: true
        });

        localStreamRef.current = stream;

        if (localVideoRef.current) {
            localVideoRef.current.srcObject = stream;
        }

        return stream;
    };

    const startCall = async () => {
        const socket = getSocket();
        if (!socket) return;

        setIsCalling(true);

        const stream = await startLocalStream();

        const peer = createPeer();
        if (!peer) return;

        stream.getTracks().forEach((track) => {
            peer.addTrack(track, stream);
        });

        const offer = await peer.createOffer();

        await peer.setLocalDescription(offer);

        socket.emit('callUser', {
            conversationId,
            offer
        });
    };

    const answerCall = async () => {
        const socket = getSocket();

        if (!socket || !incomingOffer) return;

        setIsCalling(true);

        const stream = await startLocalStream();

        const peer = createPeer();
        if (!peer) return;

        stream.getTracks().forEach((track) => {
            peer.addTrack(track, stream);
        });

        await peer.setRemoteDescription(
            new RTCSessionDescription(incomingOffer)
        );

        const answer = await peer.createAnswer();

        await peer.setLocalDescription(answer);

        socket.emit('answerCall', {
            conversationId,
            answer
        });

        setIncomingOffer(null);
    };

    const toggleCamera = () => {
        const videoTrack = localStreamRef.current
            ?.getVideoTracks()
            .find(Boolean);

        if (!videoTrack) return;

        videoTrack.enabled = !videoTrack.enabled;
        setIsCameraOn(videoTrack.enabled);
    };

    const toggleMic = () => {
        const audioTrack = localStreamRef.current
            ?.getAudioTracks()
            .find(Boolean);

        if (!audioTrack) return;

        audioTrack.enabled = !audioTrack.enabled;
        setIsMicOn(audioTrack.enabled);
    };

    const cleanupCall = () => {
        peerRef.current?.close();
        peerRef.current = null;

        localStreamRef.current?.getTracks().forEach((track) => {
            track.stop();
        });

        localStreamRef.current = null;

        setIncomingOffer(null);
        setIsCalling(false);
        setIsCameraOn(true);
        setIsMicOn(true);
    };

    const endCall = () => {
        const socket = getSocket();

        socket?.emit('endCall', {
            conversationId,
            fromUserId: currentUserId
        });

        cleanupCall();

        onClose();
    };

    useEffect(() => {
        const socket = getSocket();
        if (!socket) return;

        socket.on('incomingCall', ({ offer }) => {
            setIncomingOffer(offer);
        });

        socket.on('callAnswered', async ({ answer }) => {
            if (!peerRef.current) return;

            await peerRef.current.setRemoteDescription(
                new RTCSessionDescription(answer)
            );
        });

        socket.on('iceCandidate', async ({ candidate }) => {
            if (!peerRef.current || !candidate) return;

            await peerRef.current.addIceCandidate(
                new RTCIceCandidate(candidate)
            );
        });

        socket.on('callRejected', () => {
            cleanupCall();
            onClose();
        });

        socket.on('callEnded', () => {
            cleanupCall();
            onClose();
        });

        return () => {
            socket.off('incomingCall');
            socket.off('callAnswered');
            socket.off('iceCandidate');
            socket.off('callRejected');
            socket.off('callEnded');
        };
    }, [conversationId, onClose]);

    useEffect(() => {
        if (initialOffer && !isCalling) {
            answerCall();
            return;
        }

        if (!initialOffer && !isCalling) {
            startCall();
        }
    }, []);

    return (
        <div
            style={{
                position: 'fixed',
                inset: 0,
                zIndex: 9999,
                background:
                    'linear-gradient(135deg, rgba(2,6,23,0.98) 0%, rgba(30,27,75,0.96) 55%, rgba(49,46,129,0.94) 100%)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                padding: 28,
                color: 'white'
            }}
        >
            <div
                style={{
                    position: 'relative',
                    width: 'min(1180px, 96vw)',
                    height: 'min(720px, 88vh)',
                    borderRadius: 32,
                    overflow: 'hidden',
                    background:
                        'radial-gradient(circle at 85% 85%, rgba(139,92,246,0.22), transparent 34%), linear-gradient(135deg, rgba(15,23,42,0.88) 0%, rgba(17,24,39,0.88) 100%)',
                    border: '1px solid rgba(255,255,255,0.14)',
                    boxShadow: '0 18px 60px rgba(0,0,0,0.55)'
                }}
            >
                <video
                    ref={remoteVideoRef}
                    autoPlay
                    playsInline
                    style={{
                        width: '100%',
                        height: '100%',
                        objectFit: 'cover',
                        backgroundColor: 'rgba(255,255,255,0.08)'
                    }}
                />

                <div
                    style={{
                        position: 'absolute',
                        top: 28,
                        right: 28,
                        width: 260,
                        height: 150,
                        borderRadius: 22,
                        overflow: 'hidden',
                        background: 'rgba(15,23,42,0.82)',
                        border: '1px solid rgba(255,255,255,0.18)',
                        boxShadow: '0 10px 32px rgba(0,0,0,0.4)'
                    }}
                >
                    <video
                        ref={localVideoRef}
                        autoPlay
                        muted
                        playsInline
                        style={{
                            width: '100%',
                            height: '100%',
                            objectFit: 'cover',
                            backgroundColor: '#111827',
                            opacity: isCameraOn ? 1 : 0.2
                        }}
                    />

                    {!isCameraOn && (
                        <div
                            style={{
                                position: 'absolute',
                                inset: 0,
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                fontSize: 36,
                                background: 'rgba(15,23,42,0.82)'
                            }}
                        >
                            📷
                        </div>
                    )}
                </div>

                <div
                    style={{
                        position: 'absolute',
                        left: '50%',
                        bottom: 30,
                        transform: 'translateX(-50%)',
                        padding: '18px 26px',
                        borderRadius: 28,
                        background: 'rgba(15,23,42,0.62)',
                        backdropFilter: 'blur(18px)',
                        WebkitBackdropFilter: 'blur(18px)',
                        border: '1px solid rgba(255,255,255,0.12)',
                        boxShadow: '0 10px 34px rgba(0,0,0,0.38)',
                        display: 'flex',
                        alignItems: 'center',
                        gap: 22
                    }}
                >
                    <button
                        onClick={toggleCamera}
                        style={{
                            width: 55,
                            height: 55,
                            borderRadius: '50%',
                            border: 'none',
                            background: isCameraOn
                                ? 'rgba(255,255,255,0.12)'
                                : 'rgba(239,68,68,0.55)',
                            color: 'white',
                            fontSize: 22,
                            cursor: 'pointer'
                        }}
                    >
                        📷
                    </button>

                    <button
                        onClick={endCall}
                        style={{
                            width: 55,
                            height: 55,
                            borderRadius: '50%',
                            border: 'none',
                            background: '#ef4444',
                            color: 'white',
                            fontSize: 24,
                            cursor: 'pointer',
                            boxShadow: '0 8px 24px rgba(239,68,68,0.38)'
                        }}
                    >
                        📞
                    </button>

                    <button
                        onClick={toggleMic}
                        style={{
                            width: 55,
                            height: 55,
                            borderRadius: '50%',
                            border: 'none',
                            background: isMicOn
                                ? 'rgba(255,255,255,0.12)'
                                : 'rgba(239,68,68,0.55)',
                            color: 'white',
                            fontSize: 22,
                            cursor: 'pointer'
                        }}
                    >
                        🎙️
                    </button>
                </div>
            </div>
        </div>
    );
}

export default VideoCall;