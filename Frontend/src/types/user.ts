export type User = {
  id: number;
  email: string;
  nome: string;
  cognome: string;
  username: string;
  immagine?: string | null;
  ruolo: 'USER' | 'ADMIN';
  stato?: 'Online' | 'Offline' | 'Away';
};