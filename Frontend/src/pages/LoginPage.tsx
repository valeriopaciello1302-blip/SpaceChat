import { useState } from 'react';
import { api } from '../api/client';
import logo from '../assets/logo.png';

type Props = {
  onLogin: () => void;
};

type RegistrationRequestForm = {
  email: string;
  nome: string;
  cognome: string;
  username: string;
  telefono: string;
  indirizzo: string;
  immagine: string;
};

const initialRequestForm: RegistrationRequestForm = {
  email: '',
  nome: '',
  cognome: '',
  username: '',
  telefono: '',
  indirizzo: '',
  immagine: ''
};

function LoginPage({ onLogin }: Props) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const [isRequestModalOpen, setIsRequestModalOpen] = useState(false);
  const [requestForm, setRequestForm] =
    useState<RegistrationRequestForm>(initialRequestForm);
  const [requestError, setRequestError] = useState('');
  const [requestSuccess, setRequestSuccess] = useState('');

  const handleLogin = async () => {
    try {
      const data = await api('/auth/login', {
        method: 'POST',
        body: JSON.stringify({
          email,
          password
        })
      });

      localStorage.setItem('token', data.token);

      if (data.user.mustChangePassword) {
        alert('Si consiglia di cambiare la password temporanea');
      }

      onLogin();
    } catch (error: any) {
      console.error(error.message);
      alert(error.message);
    }
  };

  const handleRequestChange = (
    field: keyof RegistrationRequestForm,
    value: string
  ) => {
    setRequestForm((prev) => ({
      ...prev,
      [field]: value
    }));
  };

  const sendRegistrationRequest = async () => {
    try {
      setRequestError('');
      setRequestSuccess('');

      await api('/registration-requests', {
        method: 'POST',
        body: JSON.stringify({
          email: requestForm.email,
          nome: requestForm.nome,
          cognome: requestForm.cognome,
          username: requestForm.username,
          telefono: requestForm.telefono || undefined,
          indirizzo: requestForm.indirizzo || undefined,
          immagine: requestForm.immagine || undefined
        })
      });

      setRequestForm(initialRequestForm);
      setRequestSuccess(
        'Richiesta inviata correttamente. Attendi approvazione admin.'
      );
    } catch (error: any) {
      setRequestError(error.message);
    }
  };

  return (
    <div
      style={{
        width: '100vw',
        height: '100vh',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        background:
          'linear-gradient(135deg, #0f172a 0%, #1e1b4b 50%, #312e81 100%)'
      }}
    >
      <div
        style={{
          width: 380,
          padding: 32,
          borderRadius: 24,
          background: 'rgba(255,255,255,0.08)',
          backdropFilter: 'blur(16px)',
          WebkitBackdropFilter: 'blur(16px)',
          border: '1px solid rgba(255,255,255,0.12)',
          boxShadow: '0 8px 32px rgba(0,0,0,0.35)',
          display: 'flex',
          flexDirection: 'column',
          gap: 16
        }}
      >
        <div
          style={{
            textAlign: 'center',
            marginBottom: 12
          }}
        >
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              marginBottom: 28
            }}
          >
            <img
              src={logo}
              alt="Spacechat"
              style={{
                width: 120,
                height: 120,
                objectFit: 'contain',
                marginBottom: 14
              }}
            />

            <h1
              style={{
                margin: 0,
                color: 'white',
                letterSpacing: 2,
                fontSize: 34
              }}
            >
              SPACECHAT
            </h1>

            <p
              style={{
                marginTop: 10,
                color: '#94a3b8',
                fontSize: 16
              }}
            >
              Connect beyond the stars
            </p>
          </div>

          <p
            style={{
              color: '#cbd5e1',
              fontSize: 14
            }}
          >
            Accedi alla tua piattaforma
          </p>
        </div>

        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          style={{
            padding: 14,
            borderRadius: 12,
            border: '1px solid rgba(255,255,255,0.1)',
            backgroundColor: 'rgba(255,255,255,0.06)',
            color: 'white',
            outline: 'none'
          }}
        />

        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              handleLogin();
            }
          }}
          style={{
            padding: 14,
            borderRadius: 12,
            border: '1px solid rgba(255,255,255,0.1)',
            backgroundColor: 'rgba(255,255,255,0.06)',
            color: 'white',
            outline: 'none'
          }}
        />

        <button
          onClick={handleLogin}
          style={{
            marginTop: 8,
            padding: 14,
            borderRadius: 12,
            border: 'none',
            background:
              'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)',
            color: 'white',
            fontWeight: 600,
            fontSize: 15
          }}
        >
          Accedi
        </button>

        <button
          onClick={() => {
            setRequestError('');
            setRequestSuccess('');
            setRequestForm(initialRequestForm);
            setIsRequestModalOpen(true);
          }}
          style={{
            padding: 12,
            borderRadius: 12,
            border: '1px solid rgba(255,255,255,0.14)',
            background: 'rgba(255,255,255,0.06)',
            color: '#cbd5e1',
            fontWeight: 600,
            fontSize: 14
          }}
        >
          Richiedi iscrizione
        </button>
      </div>

      {isRequestModalOpen && (
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
              boxShadow: '0 8px 32px rgba(0,0,0,0.45)',
              color: 'white'
            }}
          >
            <h2 style={{ marginTop: 0 }}>Richiedi iscrizione</h2>

            <p style={{ color: '#cbd5e1', marginBottom: 20 }}>
              Compila il form. Un admin dovrà approvare la richiesta.
            </p>

            {requestError && (
              <p style={{ color: '#ef4444' }}>{requestError}</p>
            )}

            {requestSuccess && (
              <p style={{ color: '#22c55e' }}>{requestSuccess}</p>
            )}

            <div style={{ display: 'grid', gap: 12 }}>
              {[
                ['email', 'Email'],
                ['nome', 'Nome'],
                ['cognome', 'Cognome'],
                ['username', 'Username'],
                ['telefono', 'Telefono facoltativo'],
                ['indirizzo', 'Indirizzo facoltativo'],
                ['immagine', 'Immagine profilo facoltativa']
              ].map(([field, placeholder]) => (
                <input
                  key={field}
                  type="text"
                  placeholder={placeholder}
                  value={requestForm[field as keyof RegistrationRequestForm]}
                  onChange={(e) =>
                    handleRequestChange(
                      field as keyof RegistrationRequestForm,
                      e.target.value
                    )
                  }
                  style={{
                    padding: 14,
                    borderRadius: 12,
                    border: '1px solid rgba(255,255,255,0.1)',
                    backgroundColor: 'rgba(255,255,255,0.06)',
                    color: 'white',
                    outline: 'none'
                  }}
                />
              ))}

              <button
                onClick={sendRegistrationRequest}
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
                Invia richiesta iscrizione
              </button>

              <button
                onClick={() => setIsRequestModalOpen(false)}
                style={{
                  padding: 14,
                  borderRadius: 12,
                  border: '1px solid rgba(255,255,255,0.14)',
                  background: 'rgba(255,255,255,0.06)',
                  color: 'white',
                  fontWeight: 600
                }}
              >
                Chiudi
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default LoginPage;