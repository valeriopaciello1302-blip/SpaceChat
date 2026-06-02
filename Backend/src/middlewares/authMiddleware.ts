import type { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

const authMiddleware = (req: Request, res: Response, next: NextFunction) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader) {
      return res.status(401).json({ error: 'Token mancante' });
    }

    const secret = process.env.JWT_SECRET;

    if (!secret) {
      return res.status(500).json({ error: 'JWT_SECRET non configurato' });
    }

    let token = authHeader;

    if (authHeader.startsWith('Bearer ')) {
      const parts = authHeader.split(' ');
      if (!parts[1]) {
        return res.status(401).json({ error: 'Token mancante' });
      }
      token = parts[1];
    }

    const decoded = jwt.verify(token, secret);

    if (typeof decoded === 'string' || !decoded.userId) {
      return res.status(401).json({ error: 'Token non valido' });
    }

    req.user = {
      userId: Number(decoded.userId)
    };

    next();
  } catch (error) {
    if (error instanceof Error) {
      console.error('JWT ERROR:', error.message);
    }

    return res.status(401).json({ error: 'Token non valido o scaduto' });
  }
};

export default authMiddleware;