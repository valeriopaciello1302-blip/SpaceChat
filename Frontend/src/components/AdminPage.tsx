import { useEffect, useState } from 'react';
import { api } from '../api/client';
import type { User } from '../types/user';

type NewUserForm = {
    email: string;
    password: string;
    nome: string;
    cognome: string;
    username: string;
    telefono: string;
    indirizzo: string;
    immagine: string;
};

const initialForm: NewUserForm = {
    email: '',
    password: '',
    nome: '',
    cognome: '',
    username: '',
    telefono: '',
    indirizzo: '',
    immagine: ''
};

function AdminPage() {
    const [users, setUsers] = useState<User[]>([]);
    const [search, setSearch] = useState('');
    const [userToDelete, setUserToDelete] = useState<User | null>(null);
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [newUser, setNewUser] = useState<NewUserForm>(initialForm);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    useEffect(() => {
        api('/users')
            .then(setUsers)
            .catch(console.error);
    }, []);

    const renderAvatar = (image?: string | null) => {
        if (image && !image.includes('ds/valerio.png')) {
            return (
                <img
                    src={image}
                    alt="Avatar"
                    style={{
                        width: '100%',
                        height: '100%',
                        objectFit: 'cover',
                        borderRadius: '50%'
                    }}
                />
            );
        }

        return <span style={{ fontSize: 24 }}>👤</span>;
    };

    const handleChange = (field: keyof NewUserForm, value: string) => {
        setNewUser((prev) => ({
            ...prev,
            [field]: value
        }));
    };

    const createUser = async () => {
        try {
            setError('');
            setSuccess('');

            const createdUser = await api('/admin/users', {
                method: 'POST',
                body: JSON.stringify({
                    email: newUser.email,
                    password: newUser.password,
                    nome: newUser.nome,
                    cognome: newUser.cognome,
                    username: newUser.username,
                    telefono: newUser.telefono || undefined,
                    indirizzo: newUser.indirizzo || undefined,
                    immagine: newUser.immagine || undefined
                })
            });

            setUsers((prev) => [...prev, createdUser]);
            setNewUser(initialForm);
            setIsCreateModalOpen(false);
            setSuccess('Utente creato correttamente');
        } catch (error: any) {
            setError(error.message);
        }
    };

    const confirmDelete = async () => {
        if (!userToDelete) return;

        try {
            await api(`/admin/users/${userToDelete.id}`, {
                method: 'DELETE'
            });

            setUsers((prev) => prev.filter((u) => u.id !== userToDelete.id));
            setUserToDelete(null);
        } catch (error) {
            console.error(error);
        }
    };

    const filteredUsers = users.filter((user) => {
        const value = search.toLowerCase().trim();

        if (!value) return true;

        return (
            user.nome.toLowerCase().includes(value) ||
            user.cognome.toLowerCase().includes(value) ||
            user.email.toLowerCase().includes(value) ||
            user.username.toLowerCase().includes(value)
        );
    });

    return (
        <div
            style={{
                minHeight: '100vh',
                background:
                    'linear-gradient(135deg, #0f172a 0%, #1e1b4b 50%, #312e81 100%)',
                color: 'white',
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                padding: 24
            }}
        >
            <div
                style={{
                    width: '100%',
                    maxWidth: 980,
                    padding: 28,
                    borderRadius: 24,
                    background: 'rgba(255,255,255,0.08)',
                    backdropFilter: 'blur(16px)',
                    WebkitBackdropFilter: 'blur(16px)',
                    border: '1px solid rgba(255,255,255,0.12)',
                    boxShadow: '0 8px 32px rgba(0,0,0,0.35)'
                }}
            >
                <div
                    style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        gap: 16,
                        alignItems: 'center',
                        marginBottom: 24
                    }}
                >
                    <div>
                        <h2 style={{ margin: 0 }}>Admin Panel</h2>

                        <p style={{ color: '#cbd5e1', marginTop: 4 }}>
                            Gestione utenti Spacechat
                        </p>
                    </div>

                    <button
                        onClick={() => window.location.reload()}
                        style={{
                            padding: '10px 14px',
                            borderRadius: 12,
                            border: '1px solid rgba(255,255,255,0.14)',
                            background: 'rgba(255,255,255,0.06)',
                            color: 'white',
                            fontWeight: 600
                        }}
                    >
                        Torna alla chat
                    </button>
                </div>

                <div
                    style={{
                        display: 'flex',
                        gap: 12,
                        marginBottom: 18
                    }}
                >
                    <input
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        placeholder="Cerca utente..."
                        style={{
                            flex: 1,
                            padding: '12px 14px',
                            borderRadius: 14,
                            border: '1px solid rgba(255,255,255,0.1)',
                            background: 'rgba(255,255,255,0.06)',
                            color: 'white',
                            outline: 'none'
                        }}
                    />

                    <button
                        onClick={() => {
                            setError('');
                            setSuccess('');
                            setNewUser(initialForm);
                            setIsCreateModalOpen(true);
                        }}
                        style={{
                            padding: '12px 16px',
                            borderRadius: 14,
                            border: 'none',
                            background:
                                'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)',
                            color: 'white',
                            fontWeight: 700
                        }}
                    >
                        Crea utente
                    </button>
                </div>

                {success && (
                    <p style={{ color: '#22c55e', marginBottom: 12 }}>
                        {success}
                    </p>
                )}

                <div
                    style={{
                        maxHeight: '58vh',
                        overflowY: 'auto',
                        display: 'grid',
                        gap: 10
                    }}
                >
                    {filteredUsers.map((user) => (
                        <div
                            key={user.id}
                            style={{
                                padding: 14,
                                borderRadius: 18,
                                background: 'rgba(255,255,255,0.06)',
                                border: '1px solid rgba(255,255,255,0.10)',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'space-between',
                                gap: 14
                            }}
                        >
                            <div
                                style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: 14,
                                    minWidth: 0
                                }}
                            >
                                <div
                                    style={{
                                        width: 52,
                                        height: 52,
                                        borderRadius: '50%',
                                        background: 'rgba(99,102,241,0.25)',
                                        border:
                                            '1px solid rgba(255,255,255,0.12)',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        overflow: 'hidden',
                                        flexShrink: 0
                                    }}
                                >
                                    {renderAvatar(user.immagine)}
                                </div>

                                <div style={{ minWidth: 0 }}>
                                    <strong>
                                        {user.nome} {user.cognome}
                                    </strong>

                                    <p
                                        style={{
                                            color: '#94a3b8',
                                            fontSize: 13,
                                            marginTop: 4
                                        }}
                                    >
                                        {user.email} ·{' '}
                                        {user.ruolo.toLowerCase()} ·{' '}
                                        {user.stato?.toLowerCase() || 'offline'}
                                    </p>
                                </div>
                            </div>

                            <button
                                onClick={() => setUserToDelete(user)}
                                style={{
                                    padding: '8px 12px',
                                    borderRadius: 10,
                                    border:
                                        '1px solid rgba(239,68,68,0.35)',
                                    background: 'rgba(239,68,68,0.16)',
                                    color: '#fecaca',
                                    fontWeight: 600
                                }}
                            >
                                Elimina
                            </button>
                        </div>
                    ))}
                </div>
            </div>

            {isCreateModalOpen && (
                <div
                    style={{
                        position: 'fixed',
                        inset: 0,
                        backgroundColor: 'rgba(0,0,0,0.55)',
                        backdropFilter: 'blur(12px)',
                        WebkitBackdropFilter: 'blur(12px)',
                        display: 'flex',
                        justifyContent: 'center',
                        alignItems: 'center',
                        zIndex: 9999
                    }}
                >
                    <div
                        style={{
                            width: 520,
                            maxHeight: '85vh',
                            overflowY: 'auto',
                            padding: 28,
                            borderRadius: 24,
                            background: 'rgba(15,23,42,0.92)',
                            border: '1px solid rgba(255,255,255,0.14)',
                            boxShadow: '0 8px 32px rgba(0,0,0,0.45)'
                        }}
                    >
                        <h2>Crea nuovo utente</h2>

                        <p style={{ color: '#cbd5e1', marginBottom: 20 }}>
                            Inserisci i dati del nuovo utente
                        </p>

                        {error && (
                            <p style={{ color: '#ef4444', marginBottom: 12 }}>
                                {error}
                            </p>
                        )}

                        <div style={{ display: 'grid', gap: 12 }}>
                            {[
                                ['email', 'Email'],
                                ['password', 'Password iniziale'],
                                ['nome', 'Nome'],
                                ['cognome', 'Cognome'],
                                ['username', 'Username'],
                                ['telefono', 'Telefono facoltativo'],
                                ['indirizzo', 'Indirizzo facoltativo'],
                                ['immagine', 'Avatar facoltativo']
                            ].map(([field, placeholder]) => (
                                <input
                                    key={field}
                                    type={field === 'password' ? 'password' : 'text'}
                                    placeholder={placeholder}
                                    value={newUser[field as keyof NewUserForm]}
                                    onChange={(e) =>
                                        handleChange(
                                            field as keyof NewUserForm,
                                            e.target.value
                                        )
                                    }
                                    style={{
                                        padding: 14,
                                        borderRadius: 12,
                                        border:
                                            '1px solid rgba(255,255,255,0.1)',
                                        backgroundColor:
                                            'rgba(255,255,255,0.06)',
                                        color: 'white',
                                        outline: 'none'
                                    }}
                                />
                            ))}

                            <button
                                onClick={createUser}
                                style={{
                                    padding: 14,
                                    borderRadius: 12,
                                    border: 'none',
                                    background:
                                        'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)',
                                    color: 'white',
                                    fontWeight: 700
                                }}
                            >
                                Crea utente
                            </button>

                            <button
                                onClick={() => setIsCreateModalOpen(false)}
                                style={{
                                    padding: 14,
                                    borderRadius: 12,
                                    border:
                                        '1px solid rgba(255,255,255,0.14)',
                                    background: 'rgba(255,255,255,0.06)',
                                    color: 'white',
                                    fontWeight: 600
                                }}
                            >
                                Annulla
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {userToDelete && (
                <div
                    style={{
                        position: 'fixed',
                        inset: 0,
                        backgroundColor: 'rgba(0,0,0,0.55)',
                        backdropFilter: 'blur(12px)',
                        WebkitBackdropFilter: 'blur(12px)',
                        display: 'flex',
                        justifyContent: 'center',
                        alignItems: 'center',
                        zIndex: 9999
                    }}
                >
                    <div
                        style={{
                            width: 430,
                            padding: 28,
                            borderRadius: 24,
                            background: 'rgba(15,23,42,0.92)',
                            border: '1px solid rgba(255,255,255,0.14)',
                            boxShadow: '0 8px 32px rgba(0,0,0,0.45)',
                            textAlign: 'center'
                        }}
                    >
                        <h2>Conferma eliminazione</h2>

                        <p style={{ color: '#cbd5e1', margin: '16px 0' }}>
                            Sei sicuro di voler eliminare questo utente?
                        </p>

                        <strong>
                            {userToDelete.nome} {userToDelete.cognome}
                        </strong>

                        <div style={{ display: 'flex', gap: 10, marginTop: 24 }}>
                            <button
                                onClick={confirmDelete}
                                style={{
                                    flex: 1,
                                    padding: 12,
                                    borderRadius: 12,
                                    border:
                                        '1px solid rgba(239,68,68,0.35)',
                                    background: 'rgba(239,68,68,0.18)',
                                    color: '#fecaca',
                                    fontWeight: 700
                                }}
                            >
                                Elimina
                            </button>

                            <button
                                onClick={() => setUserToDelete(null)}
                                style={{
                                    flex: 1,
                                    padding: 12,
                                    borderRadius: 12,
                                    border:
                                        '1px solid rgba(255,255,255,0.14)',
                                    background: 'rgba(255,255,255,0.06)',
                                    color: 'white',
                                    fontWeight: 600
                                }}
                            >
                                Annulla
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

export default AdminPage;