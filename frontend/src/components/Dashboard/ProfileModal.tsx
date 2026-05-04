import React, { useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { RootState } from '../../store/appStore';
import { setUser } from '../../store/slices/userSlice';
import { apiService } from '../../services/apiService';

interface ProfileModalProps {
  onClose: () => void;
}

export const ProfileModal: React.FC<ProfileModalProps> = ({ onClose }) => {
  const { currentUser } = useSelector((state: RootState) => state.user);
  const dispatch = useDispatch();

  const [username, setUsername] = useState(currentUser?.username || '');
  const [fullName, setFullName] = useState(currentUser?.full_name || '');
  const [avatarUrl, setAvatarUrl] = useState(currentUser?.avatar_url || '');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    setSuccess(false);

    try {
      const updatedUser = await apiService.updateProfile({
        username,
        fullName,
        avatarUrl,
      });
      dispatch(setUser({ ...updatedUser, color: currentUser?.color }));
      setSuccess(true);
      setTimeout(() => onClose(), 1500);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to update profile');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="bg-[var(--bg-surface)] text-[var(--text-body)] rounded-2xl p-8 max-w-md w-full shadow-2xl relative border border-[var(--border-strong)]">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-[var(--text-muted)] hover:text-[var(--brand-primary)] transition-colors"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        <h2 className="text-2xl font-bold text-[var(--text-heading)] mb-6 text-center">Your Profile</h2>

        <div className="flex flex-col items-center mb-8">
          <div className="w-24 h-24 rounded-full overflow-hidden border-4 border-[var(--brand-primary-soft)] mb-4 bg-[var(--bg-app)] flex items-center justify-center shadow-inner">
            {avatarUrl ? (
              <img src={avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
            ) : (
              <span className="text-4xl font-bold text-[var(--brand-primary)]">
                {currentUser?.username?.[0]?.toUpperCase() || '?'}
              </span>
            )}
          </div>
          <p className="text-sm text-[var(--text-muted)]">{currentUser?.email}</p>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-100 text-red-700 text-sm rounded-lg text-center">
            {error}
          </div>
        )}
        {success && (
          <div className="mb-4 p-3 bg-green-100 text-green-700 text-sm rounded-lg text-center">
            Profile updated successfully!
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-[var(--text-heading)] mb-1">Full Name</label>
            <input
              type="text"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              className="w-full px-4 py-2 rounded-xl bg-[var(--bg-app)] border border-[var(--border-strong)] focus:outline-none focus:ring-2 focus:ring-[var(--brand-primary)] transition-all"
              placeholder="e.g. Yash"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-[var(--text-heading)] mb-1">Username</label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full px-4 py-2 rounded-xl bg-[var(--bg-app)] border border-[var(--border-strong)] focus:outline-none focus:ring-2 focus:ring-[var(--brand-primary)] transition-all"
              placeholder="e.g. yash123"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-[var(--text-heading)] mb-1">Avatar URL</label>
            <input
              type="text"
              value={avatarUrl}
              onChange={(e) => setAvatarUrl(e.target.value)}
              className="w-full px-4 py-2 rounded-xl bg-[var(--bg-app)] border border-[var(--border-strong)] focus:outline-none focus:ring-2 focus:ring-[var(--brand-primary)] transition-all"
              placeholder="https://example.com/avatar.png"
            />
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-3 mt-6 bg-[var(--brand-primary)] hover:opacity-90 text-white rounded-xl font-semibold transition-all shadow-md disabled:opacity-50"
          >
            {isLoading ? 'Saving...' : 'Save Changes'}
          </button>
        </form>
      </div>
    </div>
  );
};
