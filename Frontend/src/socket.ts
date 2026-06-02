import { io, type Socket } from 'socket.io-client';

let socket: Socket | null = null;
let activeUserId: number | null = null;

export const connectSocket = (userId: number) => {
    if (socket && activeUserId === userId) {
        return socket;
    }

    if (socket) {
        socket.disconnect();
    }

    activeUserId = userId;

    socket = io('http://localhost:3000');

    socket.on('connect', () => {
        socket?.emit('userOnline', userId);
    });

    return socket;
};

export const getSocket = () => {
    return socket;
};

export const disconnectSocket = () => {
    if (socket) {
        socket.disconnect();
        socket = null;
        activeUserId = null;
    }
};