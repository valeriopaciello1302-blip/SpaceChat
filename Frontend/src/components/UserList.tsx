import type { User } from '../types/user';

type Props = {
    users: User[];
    currentUserId?: number;
    onSelect: (userId: number) => void;
};

function UserList({ users, currentUserId, onSelect }: Props) {
    const getStatusColor = (stato?: string) => {
        const normalized = stato?.toLowerCase();

        if (normalized === 'online') return 'green';
        if (normalized === 'away') return 'orange';
        if (normalized === 'offline') return 'red';

        return 'red';
    };

    const visibleUsers = users.filter((u) => u.id !== currentUserId);

    return (
        <div>
            <h2>Utenti</h2>

            {visibleUsers.map((user) => {
                const statusText = user.stato?.toLowerCase() || 'offline';

                return (
                    <div
                        key={user.id}
                        onClick={() => onSelect(user.id)}
                        style={{
                            cursor: 'pointer',
                            padding: '8px',
                            borderBottom: '1px solid #eee'
                        }}
                    >
                        <strong>
                            {user.nome} {user.cognome}
                        </strong>

                        <div style={{ fontSize: '12px' }}>
                            <span
                                style={{
                                    display: 'inline-block',
                                    width: '8px',
                                    height: '8px',
                                    borderRadius: '50%',
                                    backgroundColor: getStatusColor(user.stato),
                                    marginRight: '6px'
                                }}
                            />

                            {statusText}
                        </div>
                    </div>
                );
            })}
        </div>
    );
}

export default UserList;