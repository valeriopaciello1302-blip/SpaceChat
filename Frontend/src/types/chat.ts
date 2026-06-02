export type User = {
    id: number;
    email: string;
    nome: string;
    cognome: string;
    username: string;
    immagine?: string | null;
    stato?: 'ONLINE' | 'AWAY' | 'OFFLINE';
};

export type Message = {
    id: number;
    content: string;
    createdAt: string;
    senderId: number;
};

export type Conversation = {
    id: number;
    user1Id: number;
    user2Id: number;
    createdAt: string;
    updatedAt: string;
    otherUser: User;
    lastMessage: Message | null;
};