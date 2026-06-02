import type { Request, Response } from 'express';
import prisma from '../lib/prisma.js';
import bcrypt from 'bcrypt';

export const createRegistrationRequest = async (req: Request, res: Response) => {
    try {
        const {
            email,
            nome,
            cognome,
            username,
            telefono,
            indirizzo,
            immagine
        } = req.body;

        if (
            typeof email !== 'string' ||
            typeof nome !== 'string' ||
            typeof cognome !== 'string' ||
            typeof username !== 'string'
        ) {
            return res.status(400).json({
                error: 'Email, nome, cognome e username sono obbligatori'
            });
        }

        if (
            !email.trim() ||
            !nome.trim() ||
            !cognome.trim() ||
            !username.trim()
        ) {
            return res.status(400).json({
                error: 'Compila tutti i campi obbligatori'
            });
        }

        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

        if (!emailRegex.test(email.trim())) {
            return res.status(400).json({
                error: 'Formato email non valido'
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

        const existingRequest = await prisma.registrationRequest.findUnique({
            where: { email: email.trim() }
        });

        if (existingRequest) {
            return res.status(409).json({
                error: 'Richiesta già inviata'
            });
        }

        const request = await prisma.registrationRequest.create({
            data: {
                email: email.trim(),
                nome: nome.trim(),
                cognome: cognome.trim(),
                username: username.trim(),
                telefono: telefono?.trim() || null,
                indirizzo: indirizzo?.trim() || null,
                immagine: immagine?.trim() || null
            }
        });

        return res.status(201).json(request);
    } catch (error) {
        console.error(error);

        return res.status(500).json({
            error: 'Errore durante l’invio della richiesta'
        });
    }
};

export const getRegistrationRequests = async (_req: Request, res: Response) => {
    try {
        const requests = await prisma.registrationRequest.findMany({
            orderBy: {
                createdAt: 'desc'
            }
        });

        return res.json(requests);
    } catch (error) {
        console.error(error);

        return res.status(500).json({
            error: 'Errore nel recupero delle richieste'
        });
    }
};

export const rejectRegistrationRequest = async (req: Request, res: Response) => {
    try {
        const requestId = Number(req.params.id);

        if (!requestId || Number.isNaN(requestId)) {
            return res.status(400).json({
                error: 'ID richiesta non valido'
            });
        }

        await prisma.registrationRequest.delete({
            where: { id: requestId }
        });

        return res.json({
            message: 'Richiesta rifiutata'
        });
    } catch (error) {
        console.error(error);

        return res.status(500).json({
            error: 'Errore durante il rifiuto della richiesta'
        });
    }
};

export const approveRegistrationRequest = async (req: Request, res: Response) => {
    try {
        const requestId = Number(req.params.id);
        const { password } = req.body;

        if (!requestId || Number.isNaN(requestId)) {
            return res.status(400).json({
                error: 'ID richiesta non valido'
            });
        }

        if (typeof password !== 'string' || !password.trim()) {
            return res.status(400).json({
                error: 'Password temporanea obbligatoria'
            });
        }

        const passwordRegex = /^(?=.*[A-Z])(?=.*\d)(?=.*[\W_]).{8,}$/;

        if (!passwordRegex.test(password.trim())) {
            return res.status(400).json({
                error:
                    'La password deve avere almeno 8 caratteri, una maiuscola, un numero e un carattere speciale'
            });
        }

        const request = await prisma.registrationRequest.findUnique({
            where: { id: requestId }
        });

        if (!request) {
            return res.status(404).json({
                error: 'Richiesta non trovata'
            });
        }

        const existingUser = await prisma.user.findUnique({
            where: { email: request.email }
        });

        if (existingUser) {
            await prisma.registrationRequest.delete({
                where: { id: requestId }
            });

            return res.status(409).json({
                error: 'Utente già esistente'
            });
        }

        const hashedPassword = await bcrypt.hash(password, 12);

        const newUser = await prisma.user.create({
            data: {
                email: request.email,
                password: hashedPassword,
                nome: request.nome,
                cognome: request.cognome,
                username: request.username,
                telefono: request.telefono,
                indirizzo: request.indirizzo,
                immagine: request.immagine,
                mustChangePassword: true
            }
        });

        await prisma.registrationRequest.delete({
            where: { id: requestId }
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
            error: 'Errore durante l’approvazione della richiesta'
        });
    }
};