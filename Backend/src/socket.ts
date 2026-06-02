import { Server, type Socket } from 'socket.io';
import prisma from './lib/prisma.js';
import type { Server as HttpServer } from 'node:http';
import type { Server as HttpsServer } from 'node:https';

interface ExtendedSocket extends Socket {
    userId?: number;
}

const connectedUsers = new Map<number, number>();

let io: Server;

const canAccessConversation = async (
    conversationId: number,
    userId?: number
) => {
    if (!userId || !conversationId || Number.isNaN(conversationId)) {
        return false;
    }

    const conversation = await prisma.conversation.findUnique({
        where: { id: conversationId }
    });

    if (!conversation) {
        return false;
    }

    return (
        conversation.user1Id === userId ||
        conversation.user2Id === userId
    );
};

export const initSocket = (server: HttpServer | HttpsServer) => {
    io = new Server(server, {
        cors: {
            origin: '*'
        }
    });

    io.on('connection', (socket: ExtendedSocket) => {
        console.log('User connected:', socket.id);

        socket.on('userOnline', async (userId) => {
            try {
                const numericUserId = Number(userId);

                if (!numericUserId || Number.isNaN(numericUserId)) {
                    socket.emit('statusError', {
                        error: 'userId non valido'
                    });
                    return;
                }

                socket.userId = numericUserId;

                socket.join(`user_${numericUserId}`);

                const currentConnections =
                    connectedUsers.get(numericUserId) || 0;

                connectedUsers.set(numericUserId, currentConnections + 1);

                if (currentConnections === 0) {
                    await prisma.user.update({
                        where: { id: numericUserId },
                        data: { stato: 'ONLINE' }
                    });

                    io.emit('userStatusChanged', {
                        userId: numericUserId,
                        stato: 'ONLINE'
                    });

                    console.log(`User ${numericUserId} is ONLINE`);
                }

                console.log(
                    `User ${numericUserId} connections: ${connectedUsers.get(
                        numericUserId
                    )}`
                );
            } catch (error) {
                console.error('Errore userOnline:', error);
            }
        });

        socket.on('userAway', async () => {
            try {
                if (!socket.userId) return;

                await prisma.user.update({
                    where: { id: socket.userId },
                    data: { stato: 'AWAY' }
                });

                io.emit('userStatusChanged', {
                    userId: socket.userId,
                    stato: 'AWAY'
                });

                console.log(`User ${socket.userId} is AWAY`);
            } catch (error) {
                console.error('Errore userAway:', error);
            }
        });

        socket.on('userBackOnline', async () => {
            try {
                if (!socket.userId) return;

                await prisma.user.update({
                    where: { id: socket.userId },
                    data: { stato: 'ONLINE' }
                });

                io.emit('userStatusChanged', {
                    userId: socket.userId,
                    stato: 'ONLINE'
                });

                console.log(`User ${socket.userId} is ONLINE`);
            } catch (error) {
                console.error('Errore userBackOnline:', error);
            }
        });

        socket.on('joinConversation', async (conversationId) => {
            try {
                const numericConversationId = Number(conversationId);

                const allowed = await canAccessConversation(
                    numericConversationId,
                    socket.userId
                );

                if (!allowed) {
                    socket.emit('conversationError', {
                        error: 'Non puoi accedere a questa conversazione'
                    });
                    return;
                }

                socket.join(`conversation_${numericConversationId}`);

                console.log(
                    `Socket ${socket.id} joined conversation_${numericConversationId}`
                );
            } catch (error) {
                console.error('Errore joinConversation:', error);
            }
        });

        socket.on('typing', async ({ conversationId, user }) => {
            try {
                const numericConversationId = Number(conversationId);

                const allowed = await canAccessConversation(
                    numericConversationId,
                    socket.userId
                );

                if (!allowed || !socket.userId) return;

                const conversation = await prisma.conversation.findUnique({
                    where: { id: numericConversationId }
                });

                if (!conversation) return;

                const receiverId =
                    conversation.user1Id === socket.userId
                        ? conversation.user2Id
                        : conversation.user1Id;

                io.to(`user_${receiverId}`).emit('userTyping', {
                    conversationId: numericConversationId,
                    user
                });

                console.log(
                    `User ${socket.userId} typing to user ${receiverId} in conversation ${numericConversationId}`
                );
            } catch (error) {
                console.error('Errore typing:', error);
            }
        });

        socket.on('stopTyping', async ({ conversationId }) => {
            try {
                const numericConversationId = Number(conversationId);

                const allowed = await canAccessConversation(
                    numericConversationId,
                    socket.userId
                );

                if (!allowed || !socket.userId) return;

                const conversation = await prisma.conversation.findUnique({
                    where: { id: numericConversationId }
                });

                if (!conversation) return;

                const receiverId =
                    conversation.user1Id === socket.userId
                        ? conversation.user2Id
                        : conversation.user1Id;

                io.to(`user_${receiverId}`).emit('userStopTyping', {
                    conversationId: numericConversationId
                });

                console.log(
                    `User ${socket.userId} stopped typing to user ${receiverId} in conversation ${numericConversationId}`
                );
            } catch (error) {
                console.error('Errore stopTyping:', error);
            }
        });

        socket.on('callUser', async ({ conversationId, offer }) => {
            try {
                const numericConversationId = Number(conversationId);

                const allowed = await canAccessConversation(
                    numericConversationId,
                    socket.userId
                );

                if (!allowed) {
                    socket.emit('callError', {
                        error: 'Non puoi avviare una chiamata in questa conversazione'
                    });
                    return;
                }

                socket.to(`conversation_${numericConversationId}`).emit('incomingCall', {
                    conversationId: numericConversationId,
                    offer,
                    fromUserId: socket.userId
                });

                console.log(
                    `Call from user ${socket.userId} in conversation ${numericConversationId}`
                );
            } catch (error) {
                console.error('Errore callUser:', error);
            }
        });

        socket.on('answerCall', async ({ conversationId, answer }) => {
            try {
                const numericConversationId = Number(conversationId);

                const allowed = await canAccessConversation(
                    numericConversationId,
                    socket.userId
                );

                if (!allowed) {
                    socket.emit('callError', {
                        error: 'Non puoi rispondere a questa chiamata'
                    });
                    return;
                }

                socket.to(`conversation_${numericConversationId}`).emit('callAnswered', {
                    conversationId: numericConversationId,
                    answer,
                    fromUserId: socket.userId
                });

                console.log(
                    `Call answered by user ${socket.userId} in conversation ${numericConversationId}`
                );
            } catch (error) {
                console.error('Errore answerCall:', error);
            }
        });

        socket.on('iceCandidate', async ({ conversationId, candidate }) => {
            try {
                const numericConversationId = Number(conversationId);

                const allowed = await canAccessConversation(
                    numericConversationId,
                    socket.userId
                );

                if (!allowed) {
                    socket.emit('callError', {
                        error: 'Non puoi inviare ICE candidate in questa conversazione'
                    });
                    return;
                }

                socket.to(`conversation_${numericConversationId}`).emit('iceCandidate', {
                    conversationId: numericConversationId,
                    candidate,
                    fromUserId: socket.userId
                });
            } catch (error) {
                console.error('Errore iceCandidate:', error);
            }
        });

        socket.on('endCall', async ({ conversationId }) => {
            try {
                const numericConversationId = Number(conversationId);

                const allowed = await canAccessConversation(
                    numericConversationId,
                    socket.userId
                );

                if (!allowed) {
                    socket.emit('callError', {
                        error: 'Non puoi terminare questa chiamata'
                    });
                    return;
                }

                socket.to(`conversation_${numericConversationId}`).emit('callEnded', {
                    conversationId: numericConversationId,
                    fromUserId: socket.userId
                });

                console.log(
                    `Call ended by user ${socket.userId} in conversation ${numericConversationId}`
                );
            } catch (error) {
                console.error('Errore endCall:', error);
            }
        });

        socket.on('rejectCall', async ({ conversationId }) => {
            try {
                const numericConversationId = Number(conversationId);

                const allowed = await canAccessConversation(
                    numericConversationId,
                    socket.userId
                );

                if (!allowed) {
                    socket.emit('callError', {
                        error: 'Non puoi rifiutare questa chiamata'
                    });
                    return;
                }

                socket.to(`conversation_${numericConversationId}`).emit('callRejected', {
                    conversationId: numericConversationId,
                    fromUserId: socket.userId
                });

                console.log(
                    `Call rejected by user ${socket.userId} in conversation ${numericConversationId}`
                );
            } catch (error) {
                console.error('Errore rejectCall:', error);
            }
        });

        socket.on('disconnect', async () => {
            try {
                if (socket.userId !== undefined) {
                    const userId = socket.userId;
                    const currentConnections = connectedUsers.get(userId) || 0;
                    const newConnections = currentConnections - 1;

                    if (newConnections <= 0) {
                        connectedUsers.delete(userId);

                        await prisma.user.update({
                            where: { id: userId },
                            data: { stato: 'OFFLINE' }
                        });

                        io.emit('userStatusChanged', {
                            userId,
                            stato: 'OFFLINE'
                        });

                        console.log(`User ${userId} is OFFLINE`);
                    } else {
                        connectedUsers.set(userId, newConnections);

                        console.log(
                            `User ${userId} connections: ${newConnections}`
                        );
                    }
                }

                console.log('User disconnected:', socket.id);
            } catch (error) {
                console.error('Errore disconnect:', error);
            }
        });
    });

    return io;
};

export const getIo = () => {
    if (!io) {
        throw new Error('Socket.io non inizializzato');
    }

    return io;
};