import type { Request, Response } from 'express';
import prisma from '../lib/prisma.js';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';

export const login = async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;

    if (
      typeof email !== 'string' ||
      typeof password !== 'string'
    ) {
      return res.status(400).json({
        error: 'Email e password devono essere stringhe valide'
      });
    }

    if (!email.trim() || !password.trim()) {
      return res.status(400).json({
        error: 'Email e password sono obbligatori'
      });
    }

    const user = await prisma.user.findUnique({
      where: { email }
    });

    if (!user) {
      return res.status(401).json({
        error: 'Credenziali non valide'
      });
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);

    if (!isPasswordValid) {
      return res.status(401).json({
        error: 'Credenziali non valide'
      });
    }

    const secret = process.env.JWT_SECRET;

    if (!secret) {
      return res.status(500).json({
        error: 'JWT_SECRET non configurato'
      });
    }

    const token = jwt.sign(
      { userId: user.id },
      secret,
      { expiresIn: '1h' }
    );

    return res.status(200).json({
      message: 'Login riuscito',
      token,
      user: {
        id: user.id,
        email: user.email,
        nome: user.nome,
        cognome: user.cognome,
        username: user.username,
        ruolo: user.ruolo,
        mustChangePassword: user.mustChangePassword
      }
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      error: 'Errore durante il login'
    });
  }
};

export const getMe = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.userId;

    if (!userId) {
      return res.status(401).json({
        error: 'Utente non autenticato'
      });
    }

    const user = await prisma.user.findUnique({
      where: { id: userId }
    });

    if (!user) {
      return res.status(404).json({
        error: 'Utente non trovato'
      });
    }

    return res.json({
      id: user.id,
      email: user.email,
      nome: user.nome,
      cognome: user.cognome,
      username: user.username,
      ruolo: user.ruolo
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      error: 'Errore nel recupero utente'
    });
  }
};

export const changePassword = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.userId;
    const { oldPassword, newPassword } = req.body;

    if (!userId) {
      return res.status(401).json({
        error: 'Utente non autenticato'
      });
    }

    if (
      typeof oldPassword !== 'string' ||
      typeof newPassword !== 'string'
    ) {
      return res.status(400).json({
        error: 'vecchia password e nuova password devono essere stringhe valide'
      });
    }

    if (!oldPassword.trim() || !newPassword.trim()) {
      return res.status(400).json({
        error: 'La vecchia password e la nuova password sono obbligatorie'
      });
    }

    const passwordRegex =
      /^(?=.*[A-Z])(?=.*\d)(?=.*[\W_]).{8,}$/;

    if (!passwordRegex.test(newPassword.trim())) {
      return res.status(400).json({
        error:
          'La nuova password deve avere almeno 8 caratteri, una maiuscola, un numero e un carattere speciale'
      });
    }

    const user = await prisma.user.findUnique({
      where: { id: userId }
    });

    if (!user) {
      return res.status(404).json({
        error: 'Utente non trovato'
      });
    }

    const isOldPasswordValid = await bcrypt.compare(oldPassword, user.password);

    if (!isOldPasswordValid) {
      return res.status(401).json({
        error: 'La vecchia password non è valida'
      });
    }

    const hashedNewPassword = await bcrypt.hash(newPassword, 12);

    await prisma.user.update({
      where: { id: userId },
      data: {
        password: hashedNewPassword,
        mustChangePassword: false
      }
    });

    return res.json({
      message: 'Password cambiata con successo'
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      error: 'Errore durante il cambio della password'
    });
  }
};
