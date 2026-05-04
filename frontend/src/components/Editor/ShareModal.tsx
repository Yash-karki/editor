import React, { useState, useEffect, useCallback } from 'react';
import { apiService } from '../../services/apiService';

interface Collaborator {
  id: string;
  username: string;
  full_name: string;
  email?: string;
  permission_level: string;
  avatar_url?: string;
}

interface ShareModalProps {
  documentId: string;
  isOpen: boolean;
  onClose: () => void;
}

export const ShareModal: React.FC<ShareModalProps> = ({ documentId, isOpen, onClose }) => {
  const [email, setEmail] = useState('');
  const [permissionLevel, setPermissionLevel] = useState('editor');
  const [collaborators, setCollaborators] = useState<Collaborator[]>([]);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const loadCollaborators = useCallback(async () => {
    try {
      const data = await apiService.getCollaborators(documentId);
      setCollaborators(data);
    } catch (err) {
      console.error('Failed to load collaborators:', err);
    }
  }, [documentId]);

  useEffect(() => {
    if (isOpen) {
      loadCollaborators();
    }
  }, [isOpen, loadCollaborators]);

  const handleShare = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setIsLoading(true);

    try {
      const result = await apiService.shareDocument(documentId, email, permissionLevel);
      setSuccess(`Shared with ${result.user.username} successfully!`);
      setEmail('');
      // Add to the local collaborators list
      setCollaborators(prev => {
        const exists = prev.find(c => c.id === result.user.id);
        if (exists) {
          return prev.map(c => c.id === result.user.id ? { ...c, permission_level: result.user.permission_level } : c);
        }
        return [...prev, result.user];
      });
      setTimeout(() => setSuccess(''), 3000);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to share document');
    } finally {
      setIsLoading(false);
    }
  };



  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm transition-opacity" onClick={onClose} />
      
      <div className="relative glass w-full max-w-xl rounded-[2.5rem] shadow-[0_32px_64px_-12px_rgba(0,0,0,0.14)] overflow-hidden animate-fade-scale">
        <div className="p-10">
          <div className="flex justify-between items-start mb-10">
            <div>
              <h2 className="text-3xl font-black tracking-tight mb-2" style={{ color: 'var(--text-heading)' }}>Share Access</h2>
              <p className="text-[var(--text-muted)] font-medium">Manage who can view or edit this project.</p>
            </div>
            <button onClick={onClose} className="btn-icon">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          <form onSubmit={handleShare} className="space-y-6 mb-12">
            <div className="flex gap-4">
              <div className="flex-1 relative">
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Collaborator's email address..."
                  className="w-full px-6 py-4 rounded-2xl border-none ring-1 ring-slate-200 dark:ring-slate-700 focus:ring-2 focus:ring-[var(--brand-primary)] bg-[var(--bg-app)] transition-all font-medium placeholder:text-[var(--text-muted)]"
                  style={{ color: 'var(--text-body)' }}
                  required
                />
              </div>
              <select
                value={permissionLevel}
                onChange={(e) => setPermissionLevel(e.target.value)}
                className="px-6 py-4 rounded-2xl border-none ring-1 ring-slate-200 dark:ring-slate-700 focus:ring-2 focus:ring-[var(--brand-primary)] bg-[var(--bg-app)] font-bold text-xs uppercase tracking-widest transition-all cursor-pointer"
                style={{ color: 'var(--text-heading)' }}
              >
                <option value="viewer">Viewer</option>
                <option value="commenter">Commenter</option>
                <option value="editor">Editor</option>
              </select>
            </div>
            <button
              type="submit"
              disabled={isLoading}
              className="w-full btn-primary py-4 text-lg"
            >
              {isLoading ? 'Sending Invitations...' : 'Invite Collaborator'}
            </button>
            {error && <p className="text-center text-xs font-bold text-rose-500 uppercase tracking-widest">{error}</p>}
            {success && <p className="text-center text-xs font-bold text-emerald-500 uppercase tracking-widest">{success}</p>}
          </form>

          <div className="space-y-6">
            <h3 className="text-[10px] font-black uppercase tracking-[0.2em]" style={{ color: 'var(--text-muted)' }}>Collaborators</h3>
            <div className="space-y-4 max-h-60 overflow-y-auto custom-scrollbar pr-2">
              {collaborators.length === 0 ? (
                <div className="text-center py-8 border-2 border-dashed rounded-3xl" style={{ borderColor: 'var(--border-subtle)' }}>
                  <p className="text-sm font-medium italic" style={{ color: 'var(--text-muted)' }}>No collaborators yet.</p>
                </div>
              ) : (
                collaborators.map((collab) => (
                  <div key={collab.id} className="flex items-center justify-between p-4 rounded-2xl border transition-colors hover:bg-slate-50/50 dark:hover:bg-slate-800/20" style={{ borderColor: 'var(--border-subtle)' }}>
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-xl flex items-center justify-center text-white font-bold text-xs shadow-md overflow-hidden" style={{ backgroundColor: 'var(--brand-primary)' }}>
                        {collab.avatar_url ? (
                          <img src={collab.avatar_url} alt={collab.username} className="w-full h-full object-cover" />
                        ) : (
                          (collab.full_name || collab.username).charAt(0).toUpperCase()
                        )}
                      </div>
                      <div>
                        <p className="text-sm font-bold" style={{ color: 'var(--text-heading)' }}>{collab.full_name || collab.username}</p>
                        <p className="text-[10px] font-medium" style={{ color: 'var(--text-muted)' }}>{collab.email || collab.username}</p>
                      </div>
                    </div>
                    <span className="text-[10px] font-black uppercase tracking-widest px-3 py-1 rounded-full" style={{ backgroundColor: 'var(--brand-primary-soft)', color: 'var(--brand-primary)' }}>
                      {collab.permission_level}
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="mt-12 pt-8 border-t flex gap-4" style={{ borderColor: 'var(--border-subtle)' }}>
            <button
              onClick={() => {
                navigator.clipboard.writeText(window.location.href);
                setSuccess('Link copied to clipboard!');
                setTimeout(() => setSuccess(''), 3000);
              }}
              className="flex-1 btn-icon flex items-center justify-center gap-2 py-4 font-bold text-xs uppercase tracking-widest"
              style={{ backgroundColor: 'var(--bg-app)' }}
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3" />
              </svg>
              Copy Link
            </button>
            <button
              onClick={onClose}
              className="flex-1 py-4 rounded-2xl font-black text-xs uppercase tracking-widest text-white shadow-xl hover:scale-[1.02] transition-all"
              style={{ backgroundColor: 'var(--brand-secondary)' }}
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
