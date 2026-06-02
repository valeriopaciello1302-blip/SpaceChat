import type { Conversation } from '../types/chat';

type Props = {
  conversations: Conversation[];
  selectedConversationId?: number;
  unreadCounts: Record<number, number>;
  onSelect: (conversation: Conversation) => void;
};

function ConversationList({
  conversations,
  selectedConversationId,
  unreadCounts,
  onSelect
}: Props) {
  const getStatusColor = (stato?: string) => {
    const normalized = stato?.toLowerCase();

    if (normalized === 'online') return '#22c55e';
    if (normalized === 'away') return '#f59e0b';
    return '#ef4444';
  };

  const getLastMessageTime = (createdAt?: string | Date) => {
    if (!createdAt) return '';

    return new Date(createdAt).toLocaleTimeString([], {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

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

    return <span style={{ fontSize: 22 }}>👤</span>;
  };

  return (
    <div>
      <h3 style={{ marginBottom: 12, color: '#cbd5e1' }}>
        Chat
      </h3>

      {conversations.length === 0 ? (
        <p style={{ color: '#94a3b8' }}>Nessuna conversazione</p>
      ) : (
        conversations.map((conversation) => {
          const otherUser = conversation.otherUser;
          const statusText = otherUser.stato?.toLowerCase() || 'offline';
          const isActive = selectedConversationId === conversation.id;
          const unread = unreadCounts[conversation.id] || 0;

          return (
            <div
              key={conversation.id}
              onClick={() => onSelect(conversation)}
              style={{
                cursor: 'pointer',
                padding: 12,
                borderRadius: 16,
                marginBottom: 10,
                height: 82,
                boxSizing: 'border-box',
                background: isActive
                  ? 'rgba(99,102,241,0.26)'
                  : unread > 0
                    ? 'rgba(245,158,11,0.18)'
                    : 'rgba(255,255,255,0.08)',
                backdropFilter: 'blur(12px)',
                WebkitBackdropFilter: 'blur(12px)',
                border: isActive
                  ? '1px solid rgba(139,92,246,0.75)'
                  : unread > 0
                    ? '1px solid rgba(245,158,11,0.65)'
                    : '1px solid rgba(255,255,255,0.12)',
                boxShadow: isActive
                  ? '0 0 18px rgba(99,102,241,0.28)'
                  : unread > 0
                    ? '0 0 18px rgba(245,158,11,0.24)'
                    : 'none',
                display: 'flex',
                alignItems: 'center',
                gap: 12,
                overflow: 'hidden',
                transition: 'all 0.2s ease'
              }}
            >
              <div
                style={{
                  width: 46,
                  height: 46,
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
                {renderAvatar(otherUser.immagine)}
              </div>

              <div
                style={{
                  flex: 1,
                  minWidth: 0,
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'center'
                }}
              >
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 6,
                    marginBottom: 4
                  }}
                >
                  <strong
                    style={{
                      color: 'white',
                      fontSize: 14,
                      whiteSpace: 'nowrap',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis'
                    }}
                  >
                    {otherUser.nome} {otherUser.cognome}
                  </strong>

                  <span
                    style={{
                      width: 8,
                      height: 8,
                      borderRadius: '50%',
                      backgroundColor: getStatusColor(otherUser.stato),
                      flexShrink: 0
                    }}
                  />

                  <span style={{ fontSize: 11, color: '#cbd5e1' }}>
                    {statusText}
                  </span>
                </div>

                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    gap: 8
                  }}
                >
                  <p
                    style={{
                      fontSize: 12,
                      color: unread > 0 ? '#fcd34d' : '#94a3b8',
                      fontWeight: unread > 0 ? 700 : 400,
                      whiteSpace: 'nowrap',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      flex: 1,
                      margin: 0
                    }}
                  >
                    {conversation.lastMessage
                      ? conversation.lastMessage.content
                      : 'Nessun messaggio'}
                  </p>

                  <span
                    style={{
                      fontSize: 10,
                      color: unread > 0 ? '#fbbf24' : '#64748b',
                      flexShrink: 0
                    }}
                  >
                    {conversation.lastMessage
                      ? getLastMessageTime(conversation.lastMessage.createdAt)
                      : ''}
                  </span>
                </div>
              </div>
            </div>
          );
        })
      )}
    </div>
  );
}

export default ConversationList;