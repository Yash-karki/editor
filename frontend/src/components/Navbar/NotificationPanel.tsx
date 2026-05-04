import React, { useState, useEffect } from 'react';
import { apiService } from '../../services/apiService';
import { socketService } from '../../services/socketService';

export const NotificationPanel: React.FC = () => {
  const [notifications, setNotifications] = useState<any[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    loadNotifications();

    const socket = socketService.getSocket();
    if (socket) {
      socket.on('notification', (notification) => {
        setNotifications(prev => [notification, ...prev]);
        setUnreadCount(prev => prev + 1);
      });
    }

    return () => {
      socket?.off('notification');
    };
  }, []);

  const loadNotifications = async () => {
    try {
      const data = await apiService.getNotifications();
      setNotifications(data);
      setUnreadCount(data.filter((n: any) => !n.read).length);
    } catch (err) {
      console.error('Failed to load notifications');
    }
  };

  const markAsRead = async (id: string) => {
    try {
      await apiService.markNotificationAsRead(id);
      setNotifications(notifications.map(n => n.id === id ? { ...n, read: true } : n));
      setUnreadCount(Math.max(0, unreadCount - 1));
    } catch (err) {
      console.error('Failed to mark as read');
    }
  };

  const markAllAsRead = async () => {
    try {
      await Promise.all(notifications.filter(n => !n.read).map(n => apiService.markNotificationAsRead(n.id)));
      setNotifications(notifications.map(n => ({ ...n, read: true })));
      setUnreadCount(0);
    } catch (err) {
      console.error('Failed to mark all as read');
    }
  };

  return (
    <div className="relative">
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="btn-icon relative"
        style={{ 
          backgroundColor: isOpen ? 'var(--brand-primary-soft)' : 'transparent',
          color: isOpen ? 'var(--brand-primary)' : 'var(--text-muted)'
        }}
      >
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
        </svg>
        {unreadCount > 0 && (
          <span className="absolute top-2 right-2 w-2.5 h-2.5 rounded-full border-2 border-white animate-pulse" style={{ backgroundColor: 'var(--brand-primary)' }} />
        )}
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-3 w-80 glass rounded-[2rem] shadow-2xl z-50 overflow-hidden animate-fade-scale origin-top-right">
          <div className="px-6 py-5 border-b flex justify-between items-center bg-slate-50/50 dark:bg-slate-800/20" style={{ borderColor: 'var(--border-subtle)' }}>
            <h3 className="text-sm font-bold tracking-tight" style={{ color: 'var(--text-heading)' }}>Activity</h3>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-widest" style={{ backgroundColor: 'var(--brand-primary-soft)', color: 'var(--brand-primary)' }}>
              {unreadCount} New
            </span>
          </div>
          <div className="max-h-96 overflow-y-auto custom-scrollbar">
            {notifications.length === 0 ? (
              <div className="px-6 py-12 text-center">
                <div className="w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-3" style={{ backgroundColor: 'var(--bg-app)' }}>
                  <svg className="w-6 h-6 text-[var(--text-muted)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
                  </svg>
                </div>
                <p className="text-[10px] font-bold uppercase tracking-widest" style={{ color: 'var(--text-muted)' }}>All caught up!</p>
              </div>
            ) : (
              notifications.map((n) => (
                <div 
                  key={n.id} 
                  className="px-6 py-5 border-b transition-colors cursor-pointer group"
                  style={{ 
                    backgroundColor: !n.read ? 'var(--brand-primary-soft)' : 'transparent',
                    borderColor: 'var(--border-subtle)'
                  }}
                  onClick={() => !n.read && markAsRead(n.id)}
                >
                  <div className="flex gap-4">
                    <div className="w-8 h-8 rounded-full flex-shrink-0 overflow-hidden bg-[var(--brand-primary-soft)] flex items-center justify-center">
                      {n.from_avatar_url ? (
                        <img src={n.from_avatar_url} alt={n.from_username} className="w-full h-full object-cover" />
                      ) : (
                        <span className="text-[10px] font-black text-[var(--brand-primary)]">
                          {n.from_username?.[0]?.toUpperCase() || 'S'}
                        </span>
                      )}
                    </div>
                    <div className="flex-1">
                      <p className="text-sm leading-snug" style={{ color: 'var(--text-body)' }}>{n.content}</p>
                      <div className="flex justify-between items-center mt-3">
                        <p className="text-[10px] font-bold uppercase tracking-tight" style={{ color: 'var(--brand-primary)' }}>
                          {n.from_username ? `@${n.from_username}` : 'System'}
                        </p>
                        <p className="text-[10px] font-bold uppercase tracking-tighter" style={{ color: 'var(--text-muted)' }}>
                          {new Date(n.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
          <div className="p-4 text-center bg-slate-50/50 dark:bg-slate-800/10 border-t" style={{ borderColor: 'var(--border-subtle)' }}>
            <button 
              onClick={markAllAsRead}
              className="text-[11px] font-bold uppercase tracking-widest text-[var(--text-muted)] hover:text-[var(--brand-primary)] transition-colors"
            >
              Mark all as read
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
