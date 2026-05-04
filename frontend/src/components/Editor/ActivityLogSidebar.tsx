import React, { useState, useEffect, useCallback } from 'react';
import { apiService } from '../../services/apiService';

interface ActivityLog {
  id: string;
  action: string;
  details: any;
  created_at: string;
  username: string;
  full_name: string;
  avatar_url?: string;
}

interface ActivityLogSidebarProps {
  documentId: string;
  onClose: () => void;
}

export const ActivityLogSidebar: React.FC<ActivityLogSidebarProps> = ({ documentId, onClose }) => {
  const [logs, setLogs] = useState<ActivityLog[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const loadLogs = useCallback(async () => {
    try {
      const data = await apiService.getActivityLogs(documentId);
      setLogs(data);
    } catch (err) {
      console.error('Failed to load activity logs');
    } finally {
      setIsLoading(false);
    }
  }, [documentId]);

  useEffect(() => {
    loadLogs();
  }, [loadLogs]);

  const getActionIcon = (action: string) => {
    switch (action) {
      case 'EDIT': return '📝';
      case 'SHARE': return '🔗';
      case 'RESTORE': return '⏪';
      case 'COMMENT': return '💬';
      default: return '📍';
    }
  };

  return (
    <div className="w-80 border-l flex flex-col h-full shadow-2xl animate-slide-in relative z-20 transition-all duration-300" style={{ backgroundColor: 'var(--bg-surface)', borderColor: 'var(--border-subtle)' }}>
      <div className="p-6 border-b flex justify-between items-center bg-slate-50/50 dark:bg-slate-800/20" style={{ borderColor: 'var(--border-subtle)' }}>
        <h2 className="text-lg font-bold tracking-tight" style={{ color: 'var(--text-heading)' }}>Activity Log</h2>
        <button 
          onClick={onClose} 
          className="btn-icon"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar">
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-12 space-y-3">
            <div className="w-8 h-8 border-4 rounded-full animate-spin" style={{ borderColor: 'var(--brand-primary-soft)', borderTopColor: 'var(--brand-primary)' }} />
            <p className="text-[10px] font-bold uppercase tracking-widest" style={{ color: 'var(--text-muted)' }}>Fetching logs...</p>
          </div>
        ) : logs.length === 0 ? (
          <div className="text-center py-12 px-4 border-2 border-dashed rounded-3xl" style={{ borderColor: 'var(--border-subtle)' }}>
            <p className="text-sm font-medium italic" style={{ color: 'var(--text-muted)' }}>No activity recorded yet.</p>
          </div>
        ) : (
          <div className="relative space-y-8 before:absolute before:inset-0 before:ml-4 before:-translate-x-px before:h-full before:w-0.5 before:bg-gradient-to-b before:from-transparent before:via-slate-100 dark:before:via-slate-800 before:to-transparent">
            {logs.map((log) => (
              <div key={log.id} className="relative flex items-center justify-between group">
                <div className="flex items-center w-full">
                  <div className="flex h-8 w-8 items-center justify-center rounded-full border shadow-sm z-10 transition-transform group-hover:scale-110 overflow-hidden" style={{ backgroundColor: 'var(--bg-surface)', borderColor: 'var(--border-subtle)' }}>
                    {log.avatar_url ? (
                      <img src={log.avatar_url} alt={log.username} className="w-full h-full object-cover" />
                    ) : (
                      <span className="text-xs">{getActionIcon(log.action)}</span>
                    )}
                  </div>
                  <div className="ml-4 w-full">
                    <div className="flex items-center justify-between">
                      <p className="text-xs font-bold" style={{ color: 'var(--text-heading)' }}>
                        {log.full_name || log.username}
                      </p>
                      <time className="text-[9px] font-bold uppercase tracking-tighter" style={{ color: 'var(--text-muted)' }}>
                        {new Date(log.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </time>
                    </div>
                    <p className="text-[11px] mt-0.5 leading-relaxed" style={{ color: 'var(--text-muted)' }}>
                      {log.action}d the document
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
