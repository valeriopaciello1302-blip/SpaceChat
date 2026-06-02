import { useEffect, useRef, useState } from 'react';
import { api } from './api/client';
import ConversationList from './components/ConversationList';
import type { Conversation } from './types/chat';
import { connectSocket, getSocket, disconnectSocket } from './socket';
import type { User } from './types/user';
import LoginPage from './pages/LoginPage';
import AdminPage from './pages/AdminPage';
import ProfilePage from './pages/ProfilePage';
import VideoCall from './components/VideoCall';
import logo from './assets/logo.png';

type Message = {
  id: number;
  content: string;
  createdAt: string;
  senderId: number;
  conversationId: number;
  sender: {
    id: number;
    nome: string;
    cognome: string;
    username: string;
    email: string;
    immagine?: string | null;
  };
};

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(
    !!localStorage.getItem('token')
  );

  const [user, setUser] = useState<User | null>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedConversation, setSelectedConversation] =
    useState<Conversation | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');

  const [unreadCounts, setUnreadCounts] = useState<Record<number, number>>({});

  const [isAdminView, setIsAdminView] = useState(false);
  const [isProfileView, setIsProfileView] = useState(false);
  const [isVideoCallOpen, setIsVideoCallOpen] = useState(false);
  const [incomingOffer, setIncomingOffer] =
    useState<RTCSessionDescriptionInit | null>(null);
  const [incomingCallConversation, setIncomingCallConversation] =
    useState<Conversation | null>(null);

  const [isIncomingCallModalOpen, setIsIncomingCallModalOpen] =
    useState(false);
  const [isUserlistOpen, setIsUserlistOpen] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [typingUser, setTypingUser] = useState('');

  const messagesEndRef = useRef<HTMLDivElement | null>(null);
  const typingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const selectedConversationIdRef = useRef<number | null>(null);
  const [userSearch, setUserSearch] = useState('');
  const renderAvatar = (image?: string | null, size = 52) => {
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

    return <span style={{ fontSize: size / 2 }}>👤</span>;
  };

  useEffect(() => {
    selectedConversationIdRef.current = selectedConversation?.id || null;
  }, [selectedConversation]);

  useEffect(() => {
    if (!isAuthenticated) return;

    api('/auth/me')
      .then(setUser)
      .catch(() => {
        localStorage.removeItem('token');
        setIsAuthenticated(false);
      });

    api('/users').then(setUsers);
    api('/conversations').then(setConversations);
  }, [isAuthenticated]);

  useEffect(() => {
    if (!user) return;

    const socket = connectSocket(user.id);

    socket.on('newMessage', (message: Message) => {
      const isCurrentConversation =
        selectedConversationIdRef.current === message.conversationId;

      if (isCurrentConversation) {
        setMessages((prev) =>
          prev.some((m) => m.id === message.id) ? prev : [...prev, message]
        );
      }

      setConversations((prev) => {
        const updated = prev.map((conversation) =>
          conversation.id === message.conversationId
            ? { ...conversation, lastMessage: message }
            : conversation
        );

        return updated.sort((a, b) => {
          const dateA = a.lastMessage?.createdAt
            ? new Date(a.lastMessage.createdAt).getTime()
            : 0;

          const dateB = b.lastMessage?.createdAt
            ? new Date(b.lastMessage.createdAt).getTime()
            : 0;

          return dateB - dateA;
        });
      });

      if (!isCurrentConversation) {
        setUnreadCounts((prev) => ({
          ...prev,
          [message.conversationId]: 1
        }));
      }
    });

    socket.on('userTyping', ({ conversationId, user }) => {
      if (selectedConversationIdRef.current !== conversationId) return;

      setTypingUser(user);
      setIsTyping(true);
    });

    socket.on('userStopTyping', ({ conversationId }) => {
      if (selectedConversationIdRef.current !== conversationId) return;

      setIsTyping(false);
    });

    socket.on('userStatusChanged', ({ userId, stato }) => {
      setUsers((prev) =>
        prev.map((u) => (u.id === userId ? { ...u, stato } : u))
      );

      setConversations((prev) =>
        prev.map((conversation) =>
          conversation.otherUser.id === userId
            ? {
              ...conversation,
              otherUser: {
                ...conversation.otherUser,
                stato
              }
            }
            : conversation
        )
      );

      setSelectedConversation((prev) =>
        prev && prev.otherUser.id === userId
          ? {
            ...prev,
            otherUser: {
              ...prev.otherUser,
              stato
            }
          }
          : prev
      );
    });

    socket.on('incomingCall', ({ conversationId, offer }) => {
      const conv = conversations.find((c) => c.id === conversationId);

      if (conv) {
        setIncomingCallConversation(conv);
        setSelectedConversation(conv);
      }

      setIncomingOffer(offer);
      setIsIncomingCallModalOpen(true);
    });

    return () => {
      socket.off('newMessage');
      socket.off('userTyping');
      socket.off('userStopTyping');
      socket.off('userStatusChanged');
      socket.off('incomingCall');
    };
  }, [user, conversations]);

  useEffect(() => {
    if (!selectedConversation || !user) return;

    setUnreadCounts((prev) => ({
      ...prev,
      [selectedConversation.id]: 0
    }));

    api(`/messages/conversation/${selectedConversation.id}`).then(setMessages);

    const socket = getSocket();
    socket?.emit('joinConversation', selectedConversation.id);
  }, [selectedConversation, user]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({
      behavior: 'smooth'
    });
  }, [messages]);

  useEffect(() => {
    if (!user) return;

    const socket = getSocket();
    if (!socket) return;

    let timeout: ReturnType<typeof setTimeout>;

    const setAway = () => socket.emit('userAway');

    const setOnline = () => {
      socket.emit('userBackOnline');
      clearTimeout(timeout);
      timeout = setTimeout(setAway, 10000);
    };

    window.addEventListener('mousemove', setOnline);
    window.addEventListener('keydown', setOnline);

    timeout = setTimeout(setAway, 10000);

    return () => {
      window.removeEventListener('mousemove', setOnline);
      window.removeEventListener('keydown', setOnline);
      clearTimeout(timeout);
    };
  }, [user]);

  const openConversation = async (otherUserId: number) => {
    const conversation = await api('/conversations', {
      method: 'POST',
      body: JSON.stringify({ otherUserId })
    });

    const otherUser = users.find((u) => u.id === otherUserId);
    if (!otherUser) return;

    const fullConv = {
      ...conversation,
      otherUser,
      lastMessage: conversation.lastMessage || null
    };

    setSelectedConversation(fullConv);

    setConversations((prev) =>
      prev.some((c) => c.id === fullConv.id)
        ? prev.map((c) => (c.id === fullConv.id ? fullConv : c))
        : [fullConv, ...prev]
    );
  };

  const sendMessage = async () => {
    if (!selectedConversation || !newMessage.trim()) return;

    const message = await api('/messages', {
      method: 'POST',
      body: JSON.stringify({
        conversationId: selectedConversation.id,
        content: newMessage
      })
    });

    setMessages((prev) =>
      prev.some((m) => m.id === message.id) ? prev : [...prev, message]
    );

    setConversations((prev) => {
      const updated = prev.map((conversation) =>
        conversation.id === message.conversationId
          ? { ...conversation, lastMessage: message }
          : conversation
      );

      return updated.sort((a, b) => {
        const dateA = a.lastMessage?.createdAt
          ? new Date(a.lastMessage.createdAt).getTime()
          : 0;

        const dateB = b.lastMessage?.createdAt
          ? new Date(b.lastMessage.createdAt).getTime()
          : 0;

        return dateB - dateA;
      });
    });

    setNewMessage('');

    const socket = getSocket();
    socket?.emit('stopTyping', {
      conversationId: selectedConversation.id
    });
  };

  const handleTyping = (value: string) => {
    setNewMessage(value);

    if (!selectedConversation || !user) return;

    const socket = getSocket();

    socket?.emit('typing', {
      conversationId: selectedConversation.id,
      user: user.nome
    });

    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    typingTimeoutRef.current = setTimeout(() => {
      socket?.emit('stopTyping', {
        conversationId: selectedConversation.id
      });
    }, 1200);
  };

  const logout = () => {
    localStorage.removeItem('token');
    disconnectSocket();

    setIsAuthenticated(false);
    setUser(null);
    setUsers([]);
    setConversations([]);
    setSelectedConversation(null);
    setMessages([]);
    setUnreadCounts({});
    setIsAdminView(false);
    setIsProfileView(false);
    setIsVideoCallOpen(false);
    setIsUserlistOpen(false);
  };

  if (!isAuthenticated) {
    return <LoginPage onLogin={() => setIsAuthenticated(true)} />;
  }

  if (isAdminView && user?.ruolo === 'ADMIN') {
    return <AdminPage />;
  }

  if (isProfileView && user) {
    return (
      <ProfilePage
        user={user}
        onBack={() => setIsProfileView(false)}
        onUserUpdate={setUser}
      />
    );
  }

  return (
    <div
      style={{
        display: 'flex',
        width: '100vw',
        height: '100vh',
        maxHeight: '100vh',
        overflow: 'hidden',
        backgroundColor: '#0f172a',
        color: '#e5e7eb'
      }}
    >
      <aside
        style={{
          width: 400,
          height: '100vh',
          padding: 16,
          display: 'flex',
          flexDirection: 'column',
          gap: 12,
          overflow: 'hidden',
          background:
            'linear-gradient(180deg, rgba(30,27,75,0.96) 0%, rgba(15,23,42,0.98) 100%)',
          borderRight: '1px solid rgba(255,255,255,0.1)'
        }}
      >
        <div style={{ flexShrink: 0 }}>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 10,
              paddingLeft: 8
            }}
          >
            <img
              src={logo}
              alt="Spacechat"
              style={{
                width: 42,
                height: 42,
                objectFit: 'contain'
              }}
            />

            <h2
              style={{
                margin: 0,
                color: 'white',
                letterSpacing: 1,
                fontSize: 28
              }}
            >
              SPACECHAT
            </h2>
          </div>

          {user && (
            <p style={{ paddingTop: 12 }}>
              <strong>Ciao {user.nome}! Con chi vuoi chattare?</strong>
            </p>
          )}
        </div>

        <hr style={{ borderColor: '#374151', width: '100%' }} />

        <div
          style={{
            flex: 1,
            minHeight: 0,
            overflowY: 'auto'
          }}
        >
          <ConversationList
            conversations={conversations}
            selectedConversationId={selectedConversation?.id}
            unreadCounts={unreadCounts}
            onSelect={setSelectedConversation}
          />
        </div>

        <div
          style={{
            flexShrink: 0,
            display: 'flex',
            flexDirection: 'column',
            gap: 8,
            paddingTop: 12,
            borderTop: '1px solid #374151'
          }}
        >
          <button
            onClick={() => setIsUserlistOpen(true)}
            style={{
              padding: '8px 14px',
              borderRadius: 12,
              border: '1px solid rgba(255,255,255,0.14)',
              background: 'rgba(255,255,255,0.08)',
              color: 'white',
              fontWeight: 600
            }}
          >
            Lista utenti
          </button>

          <button
            onClick={() => setIsProfileView(true)}
            style={{
              padding: '8px 14px',
              borderRadius: 12,
              border: '1px solid rgba(255,255,255,0.14)',
              background: 'rgba(255,255,255,0.08)',
              color: 'white',
              fontWeight: 600
            }}
          >
            Profilo
          </button>

          {user?.ruolo === 'ADMIN' && (
            <button
              onClick={() => setIsAdminView(true)}
              style={{
                padding: '8px 14px',
                borderRadius: 12,
                border: '1px solid rgba(255,255,255,0.14)',
                background: 'rgba(99,102,241,0.25)',
                color: 'white',
                fontWeight: 600
              }}
            >
              Admin
            </button>
          )}

          <button
            onClick={logout}
            style={{
              padding: '8px 14px',
              borderRadius: 12,
              border: '1px solid rgba(239,68,68,0.35)',
              background: 'rgba(239,68,68,0.16)',
              color: '#fecaca',
              fontWeight: 600
            }}
          >
            Effettua il logout
          </button>
        </div>
      </aside>

      <main
        style={{
          flex: 1,
          height: '100vh',
          maxHeight: '100vh',
          minHeight: 0,
          padding: 16,
          display: 'flex',
          flexDirection: 'column',
          backgroundColor: '#111c33',
          overflow: 'hidden'
        }}
      >
        {selectedConversation ? (
          <div
            style={{
              height: '100%',
              minHeight: 0,
              display: 'flex',
              flexDirection: 'column',
              overflow: 'hidden'
            }}
          >
            <div
              style={{
                backgroundColor: 'rgba(51, 46, 121, 0.96)',
                paddingInline: 18,
                paddingBlock: 40,
                borderRadius: 16,
                flexShrink: 0,
                height: 64,
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: 12
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <div
                  style={{
                    width: 60,
                    height: 60,
                    borderRadius: '50%',
                    background: 'rgba(99,102,241,0.25)',
                    border: '1px solid rgba(255,255,255,0.12)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                    overflow: 'hidden'
                  }}
                >
                  {renderAvatar(selectedConversation.otherUser.immagine, 60)}
                </div>

                <div>
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 14
                    }}
                  >
                    <h2 style={{ margin: 0, fontSize: 24 }}>
                      {selectedConversation.otherUser.nome}{' '}
                      {selectedConversation.otherUser.cognome}
                    </h2>

                    <span
                      style={{
                        width: 9,
                        height: 9,
                        borderRadius: '50%',
                        backgroundColor:
                          selectedConversation.otherUser.stato?.toLowerCase() ===
                            'online'
                            ? '#22c55e'
                            : selectedConversation.otherUser.stato?.toLowerCase() ===
                              'away'
                              ? '#f59e0b'
                              : '#ef4444'
                      }}
                    />
                  </div>

                  <span style={{ fontSize: 12, color: '#cbd5e1' }}>
                    {selectedConversation.otherUser.stato?.toLowerCase() ||
                      'offline'}
                  </span>
                </div>
              </div>

              <button
                onClick={() => {
                  setIncomingOffer(null);
                  setIsVideoCallOpen(true);
                }}
                style={{
                  backgroundColor: '#6366f1',
                  border: 'none',
                  padding: '8px 12px',
                  borderRadius: 8,
                  color: 'white'
                }}
              >
                📞 Video
              </button>
            </div>

            <div
              style={{
                flex: 1,
                minHeight: 0,
                overflowY: 'auto',
                display: 'flex',
                flexDirection: 'column',
                padding: '12px 0'
              }}
            >
              <div style={{ marginTop: 'auto' }} />

              {messages.map((msg) => {
                const isMe = msg.senderId === user?.id;

                const time = new Date(msg.createdAt).toLocaleTimeString([], {
                  hour: '2-digit',
                  minute: '2-digit'
                });

                return (
                  <div
                    key={msg.id}
                    style={{
                      display: 'flex',
                      justifyContent: isMe ? 'flex-end' : 'flex-start',
                      marginBottom: 10,
                      paddingRight: isMe ? 15 : 0,
                      paddingLeft: isMe ? 0 : 15,
                      width: '100%',
                      gap: 0
                    }}
                  >
                    <div
                      style={{
                        background: isMe
                          ? 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)'
                          : 'rgba(255,255,255,0.08)',
                        backdropFilter: !isMe ? 'blur(12px)' : undefined,
                        WebkitBackdropFilter: !isMe ? 'blur(12px)' : undefined,
                        border: !isMe
                          ? '1px solid rgba(255,255,255,0.08)'
                          : 'none',
                        padding: '10px 14px',
                        borderRadius: isMe
                          ? '18px 18px 4px 18px'
                          : '18px 18px 18px 4px',
                        maxWidth: '62%',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: 6,
                        boxShadow: '0 4px 12px rgba(0,0,0,0.18)'
                      }}
                    >
                      <span
                        style={{
                          color: 'white',
                          lineHeight: 1.4,
                          wordBreak: 'break-word'
                        }}
                      >
                        {msg.content}
                      </span>

                      <span
                        style={{
                          fontSize: 10,
                          color: isMe ? '#e0e7ff' : '#94a3b8',
                          alignSelf: 'flex-end'
                        }}
                      >
                        {time}
                      </span>
                    </div>
                  </div>
                );
              })}

              <div ref={messagesEndRef} />
            </div>

            {isTyping && (
              <div
                style={{
                  paddingLeft: 18,
                  paddingBottom: 8,
                  fontSize: 12,
                  color: '#94a3b8',
                  fontStyle: 'italic'
                }}
              >
                {typingUser} sta scrivendo...
              </div>
            )}

            <div
              style={{
                flexShrink: 0,
                display: 'flex',
                gap: 8,
                paddingTop: 12,
                borderTop: '1px solid #243044'
              }}
            >
              <input
                value={newMessage}
                onChange={(e) => handleTyping(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && sendMessage()}
                placeholder="Scrivi un messaggio..."
                style={{
                  flex: 1,
                  padding: '14px 16px',
                  borderRadius: 16,
                  border: '1px solid rgba(255,255,255,0.08)',
                  background: 'rgba(255,255,255,0.06)',
                  backdropFilter: 'blur(12px)',
                  WebkitBackdropFilter: 'blur(12px)',
                  color: 'white',
                  outline: 'none',
                  fontSize: 14,
                  boxShadow: '0 4px 12px rgba(0,0,0,0.12)'
                }}
              />

              <button
                onClick={sendMessage}
                disabled={!newMessage.trim()}
                style={{
                  background: !newMessage.trim()
                    ? 'rgba(148,163,184,0.25)'
                    : 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)',
                  border: 'none',
                  padding: '0 22px',
                  borderRadius: 16,
                  color: 'white',
                  fontWeight: 700,
                  fontSize: 14,
                  boxShadow: !newMessage.trim()
                    ? 'none'
                    : '0 4px 14px rgba(99,102,241,0.35)',
                  cursor: !newMessage.trim() ? 'not-allowed' : 'pointer',
                  opacity: !newMessage.trim() ? 0.6 : 1
                }}
              >
                Invia
              </button>
            </div>
          </div>
        ) : (
          <div
            style={{
              flex: 1,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexDirection: 'column',
              gap: 12
            }}
          >
            <img
              src={logo}
              alt="Spacechat"
              style={{
                width: 90,
                height: 90,
                objectFit: 'contain',
                opacity: 0.65
              }}
            />

            <h2 style={{ opacity: 0.85, margin: 0 }}>
              Benvenuto su Spacechat
            </h2>

            <p style={{ color: '#94a3b8' }}>
              Seleziona una conversazione per iniziare
            </p>
          </div>
        )}
      </main>

      {isUserlistOpen && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(0,0,0,0.45)',
            backdropFilter: 'blur(12px)',
            WebkitBackdropFilter: 'blur(12px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 9998
          }}
        >
          <div
            style={{
              width: 460,
              maxHeight: '80vh',
              overflow: 'hidden',
              borderRadius: 24,
              background: 'rgba(17,24,39,0.82)',
              backdropFilter: 'blur(18px)',
              WebkitBackdropFilter: 'blur(18px)',
              border: '1px solid rgba(255,255,255,0.12)',
              boxShadow: '0 8px 32px rgba(0,0,0,0.45)',
              display: 'flex',
              flexDirection: 'column'
            }}
          >
            <div
              style={{
                padding: 20,
                borderBottom: '1px solid rgba(255,255,255,0.08)',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center'
              }}
            >
              <div>
                <h2 style={{ margin: 0 }}>Lista utenti</h2>

                <p
                  style={{
                    color: '#94a3b8',
                    fontSize: 13,
                    marginTop: 4
                  }}
                >
                  Seleziona un utente per iniziare una chat
                </p>
              </div>

              <button
                onClick={() => {
                  setIsUserlistOpen(false);
                  setUserSearch('');
                }}
                style={{
                  padding: '8px 12px',
                  borderRadius: 12,
                  border: '1px solid rgba(255,255,255,0.12)',
                  background: 'rgba(255,255,255,0.06)',
                  color: 'white'
                }}
              >
                Chiudi
              </button>
            </div>

            <div
              style={{
                padding: '16px 16px 0'
              }}
            >
              <input
                value={userSearch}
                onChange={(e) => setUserSearch(e.target.value)}
                placeholder="Cerca utente..."
                style={{
                  width: '100%',
                  boxSizing: 'border-box',
                  padding: '12px 14px',
                  borderRadius: 14,
                  border: '1px solid rgba(255,255,255,0.1)',
                  background: 'rgba(255,255,255,0.06)',
                  color: 'white',
                  outline: 'none'
                }}
              />
            </div>

            <div
              style={{
                padding: 16,
                overflowY: 'auto',
                display: 'flex',
                flexDirection: 'column',
                gap: 10
              }}
            >

              {users
                .filter((u) => u.id !== user?.id)
                .filter((u) => {
                  const search = userSearch.toLowerCase().trim();

                  if (!search) return true;

                  return (
                    u.nome.toLowerCase().includes(search) ||
                    u.cognome.toLowerCase().includes(search) ||
                    u.email.toLowerCase().includes(search)
                  );
                })
                .map((u) => (
                  <div
                    key={u.id}
                    onClick={() => {
                      openConversation(u.id);
                      setIsUserlistOpen(false);
                      setUserSearch('');
                    }}
                    style={{
                      cursor: 'pointer',
                      padding: 14,
                      borderRadius: 18,
                      background: 'rgba(255,255,255,0.06)',
                      border: '1px solid rgba(255,255,255,0.08)',
                      display: 'flex',
                      alignItems: 'center',
                      gap: 14
                    }}
                  >
                    <div
                      style={{
                        width: 52,
                        height: 52,
                        borderRadius: '50%',
                        background: 'rgba(99,102,241,0.25)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        flexShrink: 0,
                        border: '1px solid rgba(255,255,255,0.12)',
                        overflow: 'hidden'
                      }}
                    >
                      {renderAvatar(u.immagine, 52)}
                    </div>

                    <div style={{ flex: 1 }}>
                      <strong style={{ color: 'white' }}>
                        {u.nome} {u.cognome}
                      </strong>

                      <p style={{ color: '#94a3b8', fontSize: 12 }}>
                        {u.stato?.toLowerCase() || 'offline'}
                      </p>
                    </div>
                  </div>
                ))}
            </div>
          </div>
        </div>
      )}

      {isIncomingCallModalOpen && incomingCallConversation && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(0,0,0,0.55)',
            backdropFilter: 'blur(14px)',
            WebkitBackdropFilter: 'blur(14px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 9999
          }}
        >
          <div
            style={{
              width: 380,
              padding: 32,
              borderRadius: 28,
              background: 'rgba(15,23,42,0.92)',
              border: '1px solid rgba(255,255,255,0.14)',
              boxShadow: '0 12px 40px rgba(0,0,0,0.55)',
              textAlign: 'center',
              color: 'white'
            }}
          >
            <h5
              style={{
                margin: 0,
                marginBottom: 8,
                color: '#cbd5e1',
                fontSize: 14,
                fontWeight: 500
              }}
            >
              Videochiamata in entrata da...
            </h5>

            <h2
              style={{
                margin: 0,
                marginBottom: 24,
                fontSize: 28
              }}
            >
              {incomingCallConversation.otherUser.nome}{' '}
              {incomingCallConversation.otherUser.cognome}
            </h2>

            <div
              style={{
                width: 110,
                height: 110,
                borderRadius: '50%',
                margin: '0 auto 30px',
                background: 'rgba(99,102,241,0.25)',
                border: '1px solid rgba(255,255,255,0.14)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                overflow: 'hidden'
              }}
            >
              {renderAvatar(
                incomingCallConversation.otherUser.immagine,
                110
              )}
            </div>

            <div
              style={{
                display: 'flex',
                justifyContent: 'center',
                gap: 28
              }}
            >
              <button
                onClick={() => {
                  setIsIncomingCallModalOpen(false);
                  setSelectedConversation(incomingCallConversation);
                  setIsVideoCallOpen(true);
                }}
                style={{
                  width: 72,
                  height: 72,
                  borderRadius: '50%',
                  border: 'none',
                  background: '#22c55e',
                  color: 'white',
                  fontSize: 30,
                  cursor: 'pointer',
                  boxShadow: '0 8px 24px rgba(34,197,94,0.35)'
                }}
              >
                📞
              </button>

              <button
                onClick={() => {
                  const socket = getSocket();

                  socket?.emit('rejectCall', {
                    conversationId: incomingCallConversation.id
                  });

                  setIncomingOffer(null);
                  setIncomingCallConversation(null);
                  setIsIncomingCallModalOpen(false);
                }}
                style={{
                  width: 72,
                  height: 72,
                  borderRadius: '50%',
                  border: 'none',
                  background: '#ef4444',
                  color: 'white',
                  fontSize: 30,
                  cursor: 'pointer',
                  boxShadow: '0 8px 24px rgba(239,68,68,0.35)'
                }}
              >
                ✕
              </button>
            </div>
          </div>
        </div>
      )}

      {isVideoCallOpen && selectedConversation && user && (
        <VideoCall
          conversationId={selectedConversation.id}
          currentUserId={user.id}
          initialOffer={incomingOffer}
          onClose={() => {
            setIsVideoCallOpen(false);
            setIncomingOffer(null);
          }}
        />
      )}
    </div>
  );
}

export default App;