import type { Request, Response } from 'express';
import prisma from '../lib/prisma.js';
import { getIo } from '../socket.js';

export const createMessage = async (req: Request, res: Response) => {
  try {
    const senderId = req.user?.userId;
    const conversationId = Number(req.body?.conversationId);
    const content = req.body?.content;

    if (!senderId) {
      return res.status(401).json({
        error: 'Utente non autenticato'
      });
    }

    if (
      !conversationId ||
      Number.isNaN(conversationId) ||
      typeof content !== 'string' ||
      content.trim().length === 0
    ) {
      return res.status(400).json({
        error: 'conversationId e content sono obbligatori'
      });
    }

    const conversation = await prisma.conversation.findUnique({
      where: { id: conversationId }
    });

    if (!conversation) {
      return res.status(404).json({
        error: 'Conversazione non trovata'
      });
    }

    if (!conversation.user1Id || !conversation.user2Id) {
      return res.status(500).json({
        error: 'Conversazione corrotta'
      });
    }

    if (
      conversation.user1Id !== senderId &&
      conversation.user2Id !== senderId
    ) {
      return res.status(403).json({
        error: 'Non puoi inviare messaggi in questa conversazione'
      });
    }

    const message = await prisma.message.create({
      data: {
        content: content.trim(),
        senderId,
        conversationId
      },
      include: {
        sender: {
          select: {
            id: true,
            nome: true,
            cognome: true,
            username: true,
            email: true,
            immagine: true
          }
        }
      }
    });

    await prisma.conversation.update({
      where: { id: conversationId },
      data: {
        updatedAt: new Date()
      }
    });

    const io = getIo();

    io
      .to(`user_${conversation.user1Id}`)
      .to(`user_${conversation.user2Id}`)
      .emit('newMessage', message);

    return res.status(201).json(message);
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      error: 'Errore nella creazione del messaggio'
    });
  }
};

export const getMessagesByConversation = async (req: Request, res: Response) => {
  try {
    const currentUserId = req.user?.userId;
    const conversationId = Number(req.params.id);

    if (!currentUserId) {
      return res.status(401).json({
        error: 'Utente non autenticato'
      });
    }

    if (!conversationId || Number.isNaN(conversationId)) {
      return res.status(400).json({
        error: 'conversationId non valido'
      });
    }

    const conversation = await prisma.conversation.findUnique({
      where: { id: conversationId }
    });

    if (!conversation) {
      return res.status(404).json({
        error: 'Conversazione non trovata'
      });
    }

    if (
      conversation.user1Id !== currentUserId &&
      conversation.user2Id !== currentUserId
    ) {
      return res.status(403).json({
        error: 'Non puoi accedere a questa conversazione'
      });
    }

    const messages = await prisma.message.findMany({
      where: {
        conversationId
      },
      include: {
        sender: {
          select: {
            id: true,
            nome: true,
            cognome: true,
            username: true,
            email: true,
            immagine: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      },
      take: 30
    });

    messages.reverse();

    return res.json(messages);
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      error: 'Errore nel recupero dei messaggi'
    });
  }
};