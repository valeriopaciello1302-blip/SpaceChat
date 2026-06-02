import { useEffect, useState } from 'react';
import { api } from '../api/client';
import type { User } from '../types/user';

type RegistrationRequest = {
  id: number;
  email: string;
  nome: string;
  cognome: string;
  username: string;
  telefono?: string | null;
  indirizzo?: string | null;
  immagine?: string | null;
  createdAt: string;
};

function AdminPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [requests, setRequests] = useState<RegistrationRequest[]>([]);

  const [userToDelete, setUserToDelete] = useState<User | null>(null);

  const [isRequestsModalOpen, setIsRequestsModalOpen] =
    useState(false);

  const [requestToApprove, setRequestToApprove] =
    useState<RegistrationRequest | null>(null);

  const [temporaryPassword, setTemporaryPassword] =
    useState('');

  useEffect(() => {
    api('/users')
      .then(setUsers)
      .catch(console.error);

    api('/registration-requests')
      .then(setRequests)
      .catch(console.error);
  }, []);

  const confirmDelete = async () => {
    if (!userToDelete) return;

    try {
      await api(`/admin/users/${userToDelete.id}`, {
        method: 'DELETE'
      });

      setUsers((prev) =>
        prev.filter((u) => u.id !== userToDelete.id)
      );

      setUserToDelete(null);
    } catch (error) {
      console.error(error);
    }
  };

  const rejectRequest = async (requestId: number) => {
    try {
      await api(`/registration-requests/${requestId}`, {
        method: 'DELETE'
      });

      setRequests((prev) =>
        prev.filter((r) => r.id !== requestId)
      );
    } catch (error) {
      console.error(error);
    }
  };

  const approveRequest = async () => {
    try {
      if (!requestToApprove) return;

      const createdUser = await api(
        `/registration-requests/${requestToApprove.id}/approve`,
        {
          method: 'POST',
          body: JSON.stringify({
            password: temporaryPassword
          })
        }
      );

      setUsers((prev) => [...prev, createdUser]);

      setRequests((prev) =>
        prev.filter((r) => r.id !== requestToApprove.id)
      );

      setRequestToApprove(null);
      setTemporaryPassword('');
    } catch (error: any) {
      alert(error.message);
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
            alignItems: 'center',
            marginBottom: 24
          }}
        >
          <div>
            <h2>Admin Panel</h2>

            <p style={{ color: '#cbd5e1' }}>
              Gestione utenti Spacechat
            </p>
          </div>

          <button
            onClick={() => window.location.reload()}
            style={{
              padding: '10px 14px',
              borderRadius: 12,
              border:
                '1px solid rgba(255,255,255,0.14)',
              background: 'rgba(255,255,255,0.06)',
              color: 'white',
              fontWeight: 600
            }}
          >
            Torna alla chat
          </button>
        </div>

        <button
          onClick={() =>
            setIsRequestsModalOpen(true)
          }
          style={{
            padding: '12px 16px',
            borderRadius: 12,
            border:
              requests.length > 0
                ? '1px solid rgba(245,158,11,0.6)'
                : '1px solid rgba(255,255,255,0.14)',
            background:
              requests.length > 0
                ? 'rgba(245,158,11,0.18)'
                : 'rgba(255,255,255,0.06)',
            color: 'white',
            fontWeight: 700,
            marginBottom: 20
          }}
        >
          Richieste utenti ({requests.length})
        </button>

        <div
          style={{
            maxHeight: '60vh',
            overflowY: 'auto',
            display: 'grid',
            gap: 10
          }}
        >
          {users.map((user) => (
            <div
              key={user.id}
              style={{
                padding: 14,
                borderRadius: 16,
                background:
                  'rgba(255,255,255,0.06)',
                border:
                  '1px solid rgba(255,255,255,0.10)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between'
              }}
            >
              <div>
                <strong>
                  {user.nome} {user.cognome}
                </strong>

                <p
                  style={{
                    color: '#94a3b8',
                    fontSize: 13
                  }}
                >
                  {user.email} ·{' '}
                  {user.ruolo.toLowerCase()}
                </p>
              </div>

              <button
                onClick={() =>
                  setUserToDelete(user)
                }
                style={{
                  padding: '8px 12px',
                  borderRadius: 10,
                  border:
                    '1px solid rgba(239,68,68,0.35)',
                  background:
                    'rgba(239,68,68,0.16)',
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

      {isRequestsModalOpen && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor:
              'rgba(0,0,0,0.55)',
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
              width: 600,
              maxHeight: '80vh',
              overflowY: 'auto',
              padding: 28,
              borderRadius: 24,
              background:
                'rgba(15,23,42,0.92)',
              border:
                '1px solid rgba(255,255,255,0.14)'
            }}
          >
            <h2>Richieste utenti</h2>

            {requests.length === 0 ? (
              <p style={{ color: '#94a3b8' }}>
                Nessuna richiesta
              </p>
            ) : (
              <div
                style={{
                  display: 'grid',
                  gap: 12,
                  marginTop: 20
                }}
              >
                {requests.map((request) => (
                  <div
                    key={request.id}
                    style={{
                      padding: 16,
                      borderRadius: 16,
                      background:
                        'rgba(255,255,255,0.06)',
                      border:
                        '1px solid rgba(255,255,255,0.10)'
                    }}
                  >
                    <strong>
                      {request.nome}{' '}
                      {request.cognome}
                    </strong>

                    <p
                      style={{
                        color: '#94a3b8',
                        fontSize: 13
                      }}
                    >
                      {request.email}
                    </p>

                    <p
                      style={{
                        color: '#cbd5e1',
                        fontSize: 13
                      }}
                    >
                      @{request.username}
                    </p>

                    <div
                      style={{
                        display: 'flex',
                        gap: 10,
                        marginTop: 14
                      }}
                    >
                      <button
                        onClick={() =>
                          setRequestToApprove(
                            request
                          )
                        }
                        style={{
                          flex: 1,
                          padding: 10,
                          borderRadius: 10,
                          border: 'none',
                          background: '#22c55e',
                          color: 'white',
                          fontWeight: 700
                        }}
                      >
                        Accetta
                      </button>

                      <button
                        onClick={() =>
                          rejectRequest(request.id)
                        }
                        style={{
                          flex: 1,
                          padding: 10,
                          borderRadius: 10,
                          border:
                            '1px solid rgba(239,68,68,0.35)',
                          background:
                            'rgba(239,68,68,0.18)',
                          color: '#fecaca',
                          fontWeight: 700
                        }}
                      >
                        Rifiuta
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            <button
              onClick={() =>
                setIsRequestsModalOpen(false)
              }
              style={{
                width: '100%',
                marginTop: 18,
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

      {requestToApprove && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor:
              'rgba(0,0,0,0.55)',
            backdropFilter: 'blur(12px)',
            WebkitBackdropFilter: 'blur(12px)',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            zIndex: 10000
          }}
        >
          <div
            style={{
              width: 420,
              padding: 28,
              borderRadius: 24,
              background:
                'rgba(15,23,42,0.92)',
              border:
                '1px solid rgba(255,255,255,0.14)'
            }}
          >
            <h2>Password temporanea</h2>

            <p style={{ color: '#cbd5e1' }}>
              Crea password per{' '}
              <strong>
                {requestToApprove.nome}
              </strong>
            </p>

            <input
              type="password"
              value={temporaryPassword}
              onChange={(e) =>
                setTemporaryPassword(
                  e.target.value
                )
              }
              placeholder="Password temporanea"
              style={{
                width: '100%',
                marginTop: 14,
                padding: 14,
                borderRadius: 12,
                border:
                  '1px solid rgba(255,255,255,0.1)',
                backgroundColor:
                  'rgba(255,255,255,0.06)',
                color: 'white',
                outline: 'none',
                boxSizing: 'border-box'
              }}
            />

            <div
              style={{
                display: 'flex',
                gap: 10,
                marginTop: 18
              }}
            >
              <button
                onClick={approveRequest}
                style={{
                  flex: 1,
                  padding: 12,
                  borderRadius: 12,
                  border: 'none',
                  background: '#22c55e',
                  color: 'white',
                  fontWeight: 700
                }}
              >
                Crea utente
              </button>

              <button
                onClick={() => {
                  setRequestToApprove(
                    null
                  );

                  setTemporaryPassword('');
                }}
                style={{
                  flex: 1,
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
            backgroundColor:
              'rgba(0,0,0,0.55)',
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
              background:
                'rgba(15,23,42,0.92)',
              border:
                '1px solid rgba(255,255,255,0.14)',
              boxShadow:
                '0 8px 32px rgba(0,0,0,0.45)',
              textAlign: 'center'
            }}
          >
            <h2>
              Conferma eliminazione
            </h2>

            <p
              style={{
                color: '#cbd5e1',
                margin: '16px 0'
              }}
            >
              Sei sicuro di voler
              eliminare questo utente?
            </p>

            <strong>
              {userToDelete.nome}{' '}
              {userToDelete.cognome}
            </strong>

            <div
              style={{
                display: 'flex',
                gap: 10,
                marginTop: 24
              }}
            >
              <button
                onClick={confirmDelete}
                style={{
                  flex: 1,
                  padding: 12,
                  borderRadius: 12,
                  border:
                    '1px solid rgba(239,68,68,0.35)',
                  background:
                    'rgba(239,68,68,0.18)',
                  color: '#fecaca',
                  fontWeight: 700
                }}
              >
                Elimina
              </button>

              <button
                onClick={() =>
                  setUserToDelete(null)
                }
                style={{
                  flex: 1,
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