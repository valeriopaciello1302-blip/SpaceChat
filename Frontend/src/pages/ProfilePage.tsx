import { useState } from 'react';
import { api } from '../api/client';
import type { User } from '../types/user';

type Props = {
    user: User;
    onBack: () => void;
    onUserUpdate: (user: User) => void;
};

function ProfilePage({ user, onBack, onUserUpdate }: Props) {
    const avatars = [
        '/avatars/alien-1.png',
        '/avatars/alien-2.png',
        '/avatars/alien-3.png',
        '/avatars/alien-4.png',
        '/avatars/alien-5.png',
        '/avatars/alien-6.png',
        '/avatars/alien-7.png',
        '/avatars/alien-8.png',
        '/avatars/alien-9.png'
    ];

    const [oldPassword, setOldPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmNewPassword, setConfirmNewPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);

    const [message, setMessage] = useState('');
    const [error, setError] = useState('');

    const [isAvatarModalOpen, setIsAvatarModalOpen] =
        useState(false);

    const updateAvatar = async (avatar: string) => {
        try {
            setMessage('');
            setError('');

            const updatedUser = await api('/users/me/avatar', {
                method: 'PATCH',
                body: JSON.stringify({
                    immagine: avatar
                })
            });

            onUserUpdate(updatedUser);

            setMessage('Avatar aggiornato correttamente');
        } catch (error: any) {
            setError(error.message);
        }
    };

    const changePassword = async () => {
        try {
            setMessage('');
            setError('');

            if (!oldPassword.trim() || !newPassword.trim() || !confirmNewPassword.trim()) {
                setError('Compila tutti i campi password');
                return;
            }

            if (newPassword !== confirmNewPassword) {
                setError('La nuova password e la conferma non coincidono');
                return;
            }

            const data = await api('/auth/change-password', {
                method: 'PATCH',
                body: JSON.stringify({
                    oldPassword,
                    newPassword
                })
            });

            setMessage(data.message);

            setOldPassword('');
            setNewPassword('');
            setConfirmNewPassword('');
        } catch (error: any) {
            setError(error.message);
        }
    };

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
                    width: 500,
                    padding: 32,
                    borderRadius: 24,
                    background: 'rgba(255,255,255,0.08)',
                    backdropFilter: 'blur(16px)',
                    WebkitBackdropFilter: 'blur(16px)',
                    border: '1px solid rgba(255,255,255,0.12)',
                    boxShadow: '0 8px 32px rgba(0,0,0,0.35)'
                }}
            >
                <h2 style={{ marginBottom: 8 }}>
                    Profilo personale
                </h2>

                <p
                    style={{
                        color: '#cbd5e1',
                        marginBottom: 24
                    }}
                >
                    Gestisci i tuoi dati, avatar e password
                </p>

                <div
                    style={{
                        display: 'grid',
                        gap: 10,
                        marginBottom: 24
                    }}
                >
                    <p>
                        <strong>Email:</strong> {user.email}
                    </p>

                    <p>
                        <strong>Username:</strong> {user.username}
                    </p>
                </div>

                <div style={{ marginBottom: 24 }}>
                    <h3 style={{ marginBottom: 12 }}>
                        Immagine profilo
                    </h3>

                    <div
                        style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: 12
                        }}
                    >
                        <div
                            style={{
                                width: 56,
                                height: 56,
                                borderRadius: '50%',
                                background: 'rgba(255,255,255,0.08)',
                                border:
                                    '1px solid rgba(255,255,255,0.2)',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                fontSize: 28,
                                overflow: 'hidden'
                            }}
                        >
                            {user.immagine && !user.immagine.includes('ds/valerio.png') ? (
                                <img
                                    src={user.immagine}
                                    alt="Avatar"
                                    style={{
                                        width: '100%',
                                        height: '100%',
                                        objectFit: 'cover'
                                    }}
                                />
                            ) : (
                                '👤'
                            )}
                        </div>

                        <button
                            onClick={() =>
                                setIsAvatarModalOpen(true)
                            }
                            style={{
                                padding: '10px 14px',
                                borderRadius: 12,
                                border:
                                    '1px solid rgba(255,255,255,0.14)',
                                background:
                                    'rgba(255,255,255,0.06)',
                                color: 'white',
                                fontWeight: 600
                            }}
                        >
                            Scegli immagine profilo
                        </button>
                    </div>
                </div>

                <hr
                    style={{
                        borderColor:
                            'rgba(255,255,255,0.12)'
                    }}
                />

                <h3
                    style={{
                        marginTop: 24,
                        marginBottom: 16
                    }}
                >
                    Cambia password
                </h3>

                {message && (
                    <p style={{ color: '#22c55e' }}>
                        {message}
                    </p>
                )}

                {error && (
                    <p style={{ color: '#ef4444' }}>
                        {error}
                    </p>
                )}

                <div
                    style={{
                        display: 'grid',
                        gap: 12
                    }}
                >
                    <input
                        type={
                            showPassword ? 'text' : 'password'
                        }
                        placeholder="Vecchia password"
                        value={oldPassword}
                        onChange={(e) =>
                            setOldPassword(e.target.value)
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

                    <input
                        type={
                            showPassword ? 'text' : 'password'
                        }
                        placeholder="Nuova password"
                        value={newPassword}
                        onChange={(e) =>
                            setNewPassword(e.target.value)
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

                    <input
                        type={
                            showPassword ? 'text' : 'password'
                        }
                        placeholder="Conferma nuova password"
                        value={confirmNewPassword}
                        onChange={(e) =>
                            setConfirmNewPassword(e.target.value)
                        }
                        onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                                changePassword();
                            }
                        }}
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

                    <label
                        style={{
                            color: '#cbd5e1',
                            fontSize: 14
                        }}
                    >
                        <input
                            type="checkbox"
                            checked={showPassword}
                            onChange={() =>
                                setShowPassword(!showPassword)
                            }
                        />{' '}
                        Mostra password
                    </label>

                    <button
                        onClick={changePassword}
                        style={{
                            padding: 14,
                            borderRadius: 12,
                            border: 'none',
                            background:
                                'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)',
                            color: 'white',
                            fontWeight: 600
                        }}
                    >
                        Cambia password
                    </button>

                    <button
                        onClick={onBack}
                        style={{
                            padding: 14,
                            borderRadius: 12,
                            border:
                                '1px solid rgba(255,255,255,0.14)',
                            background:
                                'rgba(255,255,255,0.06)',
                            color: 'white',
                            fontWeight: 600
                        }}
                    >
                        Torna alla chat
                    </button>
                </div>
            </div>

            {isAvatarModalOpen && (
                <div
                    style={{
                        position: 'fixed',
                        inset: 0,
                        backgroundColor: 'rgba(0,0,0,0.65)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        zIndex: 9999
                    }}
                >
                    <div
                        style={{
                            width: 420,
                            padding: 28,
                            borderRadius: 24,
                            background: 'rgba(15,23,42,0.92)',
                            backdropFilter: 'blur(16px)',
                            WebkitBackdropFilter: 'blur(16px)',
                            border:
                                '1px solid rgba(255,255,255,0.14)',
                            boxShadow:
                                '0 8px 32px rgba(0,0,0,0.45)'
                        }}
                    >
                        <h2 style={{ marginBottom: 8 }}>
                            Scegli la tua immagine profilo
                        </h2>

                        <p
                            style={{
                                color: '#cbd5e1',
                                marginBottom: 20
                            }}
                        >
                            Seleziona un avatar per Spacechat
                        </p>

                        <div
                            style={{
                                display: 'grid',
                                gridTemplateColumns:
                                    'repeat(4, 1fr)',
                                gap: 14
                            }}
                        >
                            {avatars.map((avatar) => (
                                <button
                                    key={avatar}
                                    onClick={() => {
                                        updateAvatar(avatar);
                                        setIsAvatarModalOpen(false);
                                    }}
                                    style={{
                                        width: 70,
                                        height: 70,
                                        borderRadius: 18,
                                        border:
                                            user.immagine === avatar
                                                ? '2px solid #8b5cf6'
                                                : '1px solid rgba(255,255,255,0.2)',
                                        background:
                                            user.immagine === avatar
                                                ? 'rgba(139,92,246,0.35)'
                                                : 'rgba(255,255,255,0.08)',
                                        fontSize: 32,
                                        cursor: 'pointer'
                                    }}
                                >
                                    <img
                                        src={avatar}
                                        alt="Avatar"
                                        style={{
                                            width: '100%',
                                            height: '100%',
                                            objectFit: 'cover',
                                            borderRadius: 18
                                        }}
                                    />
                                </button>
                            ))}
                        </div>

                        <button
                            onClick={() =>
                                setIsAvatarModalOpen(false)
                            }
                            style={{
                                width: '100%',
                                marginTop: 20,
                                padding: 12,
                                borderRadius: 12,
                                border:
                                    '1px solid rgba(255,255,255,0.14)',
                                background:
                                    'rgba(255,255,255,0.06)',
                                color: 'white',
                                fontWeight: 600
                            }}
                        >
                            Chiudi
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}

export default ProfilePage;