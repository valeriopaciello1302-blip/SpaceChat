import type { Request, Response } from 'express';
import prisma from '../lib/prisma.js';
import bcrypt from 'bcrypt';

export const getUsers = async (_req: Request, res: Response) => {
  try {
    const users = await prisma.user.findMany({
      select: {
        id: true,
        email: true,
        nome: true,
        cognome: true,
        username: true,
        telefono: true,
        indirizzo: true,
        immagine: true,
        ruolo: true,
        stato: true,
        createdAt: true,
        updatedAt: true
      }
    });

    return res.json(users);
  } catch (error) {
    console.error(error);

    return res.status(500).json({
      error: 'Errore nel recupero utenti'
    });
  }
};

export const createUser = async (req: Request, res: Response) => {
  try {
    const {
      email,
      password,
      nome,
      cognome,
      username,
      telefono,
      indirizzo,
      immagine
    } = req.body;

    if (
      typeof email !== 'string' ||
      typeof password !== 'string' ||
      typeof nome !== 'string' ||
      typeof cognome !== 'string' ||
      typeof username !== 'string'
    ) {
      return res.status(400).json({
        error: 'Email, password, nome, cognome e username devono essere stringhe valide'
      });
    }

    if (
      !email.trim() ||
      !password.trim() ||
      !nome.trim() ||
      !cognome.trim() ||
      !username.trim()
    ) {
      return res.status(400).json({
        error: 'Email, password, nome, cognome e username sono obbligatori'
      });
    }

    if (telefono !== undefined && typeof telefono !== 'string') {
      return res.status(400).json({
        error: 'Telefono deve essere una stringa valida'
      });
    }

    if (indirizzo !== undefined && typeof indirizzo !== 'string') {
      return res.status(400).json({
        error: 'Indirizzo deve essere una stringa valida'
      });
    }

    if (immagine !== undefined && typeof immagine !== 'string') {
      return res.status(400).json({
        error: 'Immagine deve essere una stringa valida'
      });
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!emailRegex.test(email.trim())) {
      return res.status(400).json({
        error: 'Formato email non valido'
      });
    }

    const passwordRegex =
      /^(?=.*[A-Z])(?=.*\d)(?=.*[\W_]).{8,}$/;

    if (!passwordRegex.test(password.trim())) {
      return res.status(400).json({
        error:
          'La password deve avere almeno 8 caratteri, una maiuscola, un numero e un carattere speciale'
      });
    }

    const existingUser = await prisma.user.findUnique({
      where: { email: email.trim() }
    });

    if (existingUser) {
      return res.status(409).json({
        error: 'Email già registrata'
      });
    }

    const hashedPassword = await bcrypt.hash(password, 12);

    const newUser = await prisma.user.create({
      data: {
        email: email.trim(),
        password: hashedPassword,
        nome: nome.trim(),
        cognome: cognome.trim(),
        username: username.trim(),
        telefono: telefono?.trim() || null,
        indirizzo: indirizzo?.trim() || null,
        immagine: immagine?.trim() || null
      }
    });

    return res.status(201).json({
      id: newUser.id,
      email: newUser.email,
      nome: newUser.nome,
      cognome: newUser.cognome,
      username: newUser.username,
      telefono: newUser.telefono,
      indirizzo: newUser.indirizzo,
      immagine: newUser.immagine,
      ruolo: newUser.ruolo,
      stato: newUser.stato,
      createdAt: newUser.createdAt,
      updatedAt: newUser.updatedAt
    });
  } catch (error) {
    console.error(error);

    return res.status(500).json({
      error: "Errore nella creazione dell'utente"
    });
  }
};

export const deleteUser = async (req: Request, res: Response) => {
  try {
    const userId = Number(req.params.id);
    const currentUserId = req.user?.userId;

    if (!userId || Number.isNaN(userId)) {
      return res.status(400).json({
        error: 'ID utente non valido'
      });
    }

    if (currentUserId === userId) {
      return res.status(400).json({
        error: 'Non puoi eliminare il tuo stesso account'
      });
    }

    const existingUser = await prisma.user.findUnique({
      where: { id: userId }
    });

    if (!existingUser) {
      return res.status(404).json({
        error: 'Utente non trovato'
      });
    }

    await prisma.message.deleteMany({
      where: {
        senderId: userId
      }
    });

    await prisma.conversation.deleteMany({
      where: {
        OR: [
          { user1Id: userId },
          { user2Id: userId }
        ]
      }
    });

    await prisma.user.delete({
      where: { id: userId }
    });

    return res.json({
      message: 'Utente eliminato correttamente'
    });
  } catch (error) {
    console.error(error);

    return res.status(500).json({
      error: "Errore durante l'eliminazione dell'utente"
    });
  }
};

export const updateMyAvatar = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.userId;
    const { immagine } = req.body;

    if (!userId) {
      return res.status(401).json({ error: 'Utente non autenticato' });
    }

    if (typeof immagine !== 'string' || !immagine.trim()) {
      return res.status(400).json({
        error: 'Avatar non valido'
      });
    }

    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: {
        immagine: immagine.trim()
      },
      select: {
        id: true,
        email: true,
        nome: true,
        cognome: true,
        username: true,
        ruolo: true,
        stato: true,
        immagine: true
      }
    });

    return res.json(updatedUser);
  } catch (error) {
    console.error(error);

    return res.status(500).json({
      error: "Errore durante l'aggiornamento avatar"
    });
  }
};