import type { Request, Response } from 'express';
import prisma from '../lib/prisma.js';

export const createConversation = async (req: Request, res: Response) => {
  try {
    const currentUserId = req.user?.userId;
    const otherUserId = Number(req.body?.otherUserId);

    if (!currentUserId) {
      return res.status(401).json({
        error: 'Utente non autenticato'
      });
    }

    if (!otherUserId || Number.isNaN(otherUserId)) {
      return res.status(400).json({
        error: 'otherUserId deve essere un numero valido'
      });
    }

    const otherUser = await prisma.user.findUnique({
      where: { id: otherUserId }
    });

    if (!otherUser) {
      return res.status(404).json({
        error: 'Utente destinatario non trovato'
      });
    }

    if (currentUserId === otherUserId) {
      return res.status(400).json({
        error: 'Non puoi creare una chat con te stesso'
      });
    }

    const user1Id = Math.min(currentUserId, otherUserId);
    const user2Id = Math.max(currentUserId, otherUserId);

    const existingConversation = await prisma.conversation.findUnique({
      where: {
        user1Id_user2Id: {
          user1Id,
          user2Id
        }
      }
    });

    if (existingConversation) {
      return res.status(200).json(existingConversation);
    }

    const conversation = await prisma.conversation.create({
      data: {
        user1Id,
        user2Id
      }
    });

    return res.status(201).json(conversation);
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      error: 'Errore durante la creazione della chat'
    });
  }
};

export const getConversations = async (req: Request, res: Response) => {
  try {
    const currentUserId = req.user?.userId;

    if (!currentUserId) {
      return res.status(401).json({
        error: 'Utente non autenticato'
      });
    }

    const conversations = await prisma.conversation.findMany({
      where: {
        OR: [
          { user1Id: currentUserId },
          { user2Id: currentUserId }
        ]
      },
      include: {
        user1: {
          select: {
            id: true,
            nome: true,
            cognome: true,
            username: true,
            email: true,
            immagine: true,
            stato: true
          }
        },
        user2: {
          select: {
            id: true,
            nome: true,
            cognome: true,
            username: true,
            email: true,
            immagine: true,
            stato: true
          }
        },
        messages: {
          orderBy: {
            createdAt: 'desc'
          },
          take: 1,
          select: {
            id: true,
            content: true,
            createdAt: true,
            senderId: true
          }
        }
      },
      orderBy: {
        updatedAt: 'desc'
      }
    });

    const formattedConversations = conversations.map((conversation) => {
      const otherUser =
        conversation.user1Id === currentUserId
          ? conversation.user2
          : conversation.user1;

      const { messages, ...conversationWithoutMessages } = conversation;

      return {
        ...conversationWithoutMessages,
        otherUser,
        lastMessage: messages[0] || null
      };
    });

    return res.json(formattedConversations);
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      error: 'Errore nel recupero delle conversazioni'
    });
  }
};