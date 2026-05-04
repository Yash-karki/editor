import React, { useState, useEffect } from 'react';
import { apiService } from '../../services/apiService';

interface Version {
  version_number: number;
  snapshot_at: string;
  username: string;
  change_summary: string | null;
  avatar_url?: string;
}

interface VersionHistoryModalProps {
  documentId: string;
  isOpen: boolean;
  onClose: () => void;
  onRestore: () => void;
}

export const VersionHistoryModal: React.FC<VersionHistoryModalProps> = ({ 
  documentId, 
  isOpen, 
  onClose,
  onRestore
}) => {
  const [versions, setVersions] = useState<Version[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (isOpen) {
      loadVersions();
    }
  }, [isOpen, documentId]);

  const loadVersions = async () => {
    try {
      const data = await apiService.getVersionHistory(documentId);
      setVersions(data);
    } catch (err) {
      console.error('Failed to load version history');
    } finally {
      setIsLoading(false);
    }
  };

  const handleRestore = async (versionNumber: number) => {
    if (!window.confirm(`Are you sure you want to restore version ${versionNumber}? Current changes will be overwritten.`)) {
      return;
    }

    try {
      await apiService.restoreVersion(documentId, versionNumber);
      onRestore();
      onClose();
    } catch (err) {
      alert('Failed to restore version');
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm transition-opacity" onClick={onClose} />
      
      <div className="relative glass w-full max-w-2xl rounded-[2.5rem] shadow-[0_32px_64px_-12px_rgba(0,0,0,0.14)] overflow-hidden animate-fade-scale">
        <div className="p-10">
          <div className="flex justify-between items-start mb-10">
            <div>
              <h2 className="text-3xl font-black tracking-tight mb-2" style={{ color: 'var(--text-heading)' }}>Version History</h2>
              <p className="text-[var(--text-muted)] font-medium">Review and restore previous states of this project.</p>
            </div>
            <button onClick={onClose} className="btn-icon">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          <div className="space-y-4 max-h-[400px] overflow-y-auto custom-scrollbar pr-4">
            {isLoading ? (
              <div className="flex flex-col items-center justify-center py-20 space-y-4">
                <div className="w-12 h-12 border-4 rounded-full animate-spin" style={{ borderColor: 'var(--brand-primary-soft)', borderTopColor: 'var(--brand-primary)' }} />
                <p className="text-[10px] font-black uppercase tracking-widest" style={{ color: 'var(--text-muted)' }}>Analyzing archives...</p>
              </div>
            ) : versions.length === 0 ? (
              <div className="text-center py-20 border-2 border-dashed rounded-[2rem]" style={{ borderColor: 'var(--border-subtle)' }}>
                <p className="text-sm font-medium italic" style={{ color: 'var(--text-muted)' }}>No previous versions recorded yet.</p>
              </div>
            ) : (
              versions.map((version) => (
                <div 
                  key={version.version_number} 
                  className="group flex items-center justify-between p-6 rounded-3xl border transition-all hover:translate-x-1" 
                  style={{ backgroundColor: 'var(--bg-app)', borderColor: 'var(--border-subtle)' }}
                >
                  <div className="flex items-center gap-6">
                    <div className="w-12 h-12 rounded-2xl flex items-center justify-center shadow-sm overflow-hidden" style={{ backgroundColor: 'var(--bg-surface)' }}>
                      {version.avatar_url ? (
                        <img src={version.avatar_url} alt={version.username} className="w-full h-full object-cover" />
                      ) : (
                        <span className="text-lg font-black text-[var(--brand-primary)]">v{version.version_number}</span>
                      )}
                    </div>
                    <div>
                      <p className="text-sm font-black" style={{ color: 'var(--text-heading)' }}>
                        {new Date(version.snapshot_at).toLocaleDateString([], { month: 'long', day: 'numeric', year: 'numeric' })}
                      </p>
                      <p className="text-xs font-bold" style={{ color: 'var(--text-muted)' }}>
                        {new Date(version.snapshot_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} • by {version.username}
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => handleRestore(version.version_number)}
                    className="px-6 py-2.5 rounded-xl font-black text-[10px] uppercase tracking-widest border transition-all hover:bg-[var(--brand-primary)] hover:text-white hover:border-[var(--brand-primary)]"
                    style={{ color: 'var(--brand-primary)', borderColor: 'var(--brand-primary)' }}
                  >
                    Restore State
                  </button>
                </div>
              ))
            )}
          </div>

          <div className="mt-10 pt-8 border-t flex justify-end" style={{ borderColor: 'var(--border-subtle)' }}>
            <button
              onClick={onClose}
              className="px-10 py-4 rounded-2xl font-black text-xs uppercase tracking-widest text-white shadow-xl hover:scale-[1.02] transition-all"
              style={{ backgroundColor: 'var(--brand-secondary)' }}
            >
              Close History
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
