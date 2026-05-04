import React from 'react';

interface ActiveUser {
  id: string;
  username: string;
  avatar_url?: string;
  color: string;
  cursor_position: number;
}

interface ActiveUsersProps {
  users: ActiveUser[];
}

export const ActiveUsers: React.FC<ActiveUsersProps> = ({ users }) => {
  return (
    <div className="flex items-center -space-x-3">
      {users.map((user) => (
        <div
          key={user.id}
          className="relative group"
        >
          <div
            className="w-9 h-9 rounded-full flex items-center justify-center text-white text-[13px] font-black shadow-lg transition-all duration-300 hover:-translate-y-1 hover:z-10 ring-4 overflow-hidden"
            style={{ 
              backgroundColor: user.color || 'var(--brand-primary)',
              borderColor: 'var(--bg-surface)'
            }}
          >
            {user.avatar_url ? (
              <img src={user.avatar_url} alt={user.username} className="w-full h-full object-cover" />
            ) : (
              user.username.charAt(0).toUpperCase()
            )}
          </div>
          
          <div className="absolute top-12 left-1/2 -translate-x-1/2 glass px-3 py-1.5 rounded-xl opacity-0 group-hover:opacity-100 transition-all duration-300 pointer-events-none whitespace-nowrap z-50 shadow-2xl border" style={{ borderColor: 'var(--border-subtle)' }}>
            <p className="text-[10px] font-black uppercase tracking-widest" style={{ color: 'var(--text-heading)' }}>{user.username}</p>
          </div>
        </div>
      ))}
      {users.length > 0 && (
        <div className="pl-6 flex items-center gap-2">
          <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
          <span className="text-[10px] font-black uppercase tracking-widest" style={{ color: 'var(--text-muted)' }}>
            {users.length} Live
          </span>
        </div>
      )}
    </div>
  );
};
