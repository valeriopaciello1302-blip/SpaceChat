import type { Request, Response, NextFunction } from 'express';
import prisma from '../lib/prisma.js';

const adminMiddleware = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const userId = req.user?.userId;

    if (!userId) {
      return res.status(401).json({
        error: 'Utente non autenticato'
      });
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        ruolo: true
      }
    });

    if (!user || user.ruolo !== 'ADMIN') {
      return res.status(403).json({
        error: 'Accesso riservato agli amministratori'
      });
    }

    next();
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      error: 'Errore controllo amministratore'
    });
  }
};

export default adminMiddleware;