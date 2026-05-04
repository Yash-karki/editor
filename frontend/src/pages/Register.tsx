import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { apiService } from '../services/apiService';
import { setUser, setTokens } from '../store/slices/userSlice';

export const Register: React.FC = () => {
  const [username, setUsername] = useState('');
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();
  const dispatch = useDispatch();

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const response = await apiService.register({ username, fullName, email, password });
      dispatch(setUser(response.user));
      dispatch(setTokens({ accessToken: response.accessToken, refreshToken: response.refreshToken }));
      navigate('/dashboard');
    } catch (err: any) {
      setError(err.response?.data?.error || 'Registration failed');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[var(--bg-app)] transition-colors duration-500 overflow-hidden relative">
      {/* Decorative background elements */}
      <div className="absolute top-[-10%] right-[-10%] w-[40%] h-[40%] rounded-full bg-[var(--brand-primary-soft)] blur-[120px] animate-pulse" />
      <div className="absolute bottom-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full bg-[var(--brand-primary-soft)] blur-[120px] animate-pulse" style={{ animationDelay: '2s' }} />

      <div className="relative glass w-full max-w-xl p-12 rounded-[3.5rem] shadow-[0_32px_64px_-12px_rgba(0,0,0,0.14)] animate-fade-scale">
        <div className="text-center mb-10">
          <h1 className="text-4xl font-black tracking-tight mb-3" style={{ color: 'var(--text-heading)' }}>Join the Future</h1>
          <p className="text-[var(--text-muted)] font-medium">Create your collaborative workstation in seconds.</p>
        </div>

        {error && (
          <div className="mb-8 p-4 bg-rose-50 border border-rose-100 rounded-2xl animate-fade-scale">
            <p className="text-xs font-bold text-rose-600 text-center uppercase tracking-widest">{error}</p>
          </div>
        )}

        <form onSubmit={handleRegister} className="space-y-5">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-[0.2em] ml-4" style={{ color: 'var(--text-muted)' }}>Handle</label>
              <input 
                type="text" 
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full px-6 py-4 rounded-[1.5rem] border-none ring-1 ring-slate-200 dark:ring-slate-700 focus:ring-2 focus:ring-[var(--brand-primary)] bg-[var(--bg-app)] transition-all font-medium text-sm placeholder:text-[var(--text-muted)]"
                style={{ color: 'var(--text-body)' }}
                placeholder="johndoe"
                required 
              />
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-[0.2em] ml-4" style={{ color: 'var(--text-muted)' }}>Identity</label>
              <input 
                type="text" 
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                className="w-full px-6 py-4 rounded-[1.5rem] border-none ring-1 ring-slate-200 dark:ring-slate-700 focus:ring-2 focus:ring-[var(--brand-primary)] bg-[var(--bg-app)] transition-all font-medium text-sm placeholder:text-[var(--text-muted)]"
                style={{ color: 'var(--text-body)' }}
                placeholder="John Doe"
                required 
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-[10px] font-black uppercase tracking-[0.2em] ml-4" style={{ color: 'var(--text-muted)' }}>Email Access</label>
            <input 
              type="email" 
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-8 py-4 rounded-[1.5rem] border-none ring-1 ring-slate-200 dark:ring-slate-700 focus:ring-2 focus:ring-[var(--brand-primary)] bg-[var(--bg-app)] transition-all font-medium text-sm placeholder:text-[var(--text-muted)]"
              style={{ color: 'var(--text-body)' }}
              placeholder="name@company.com"
              required 
            />
          </div>

          <div className="space-y-2">
            <label className="text-[10px] font-black uppercase tracking-[0.2em] ml-4" style={{ color: 'var(--text-muted)' }}>Secret Passphrase</label>
            <input 
              type="password" 
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-8 py-4 rounded-[1.5rem] border-none ring-1 ring-slate-200 dark:ring-slate-700 focus:ring-2 focus:ring-[var(--brand-primary)] bg-[var(--bg-app)] transition-all font-medium text-sm placeholder:text-[var(--text-muted)]"
              style={{ color: 'var(--text-body)' }}
              placeholder="••••••••••••"
              required 
            />
          </div>

          <button type="submit" className="w-full btn-primary py-5 text-lg shadow-2xl shadow-[var(--brand-primary-soft)] hover:scale-[1.02] mt-4">
            Initialize Account
          </button>
        </form>

        <div className="mt-10 text-center">
          <p className="text-sm font-medium" style={{ color: 'var(--text-muted)' }}>
            Already a member? <Link to="/login" className="font-black hover:underline" style={{ color: 'var(--brand-primary)' }}>Sign In instead</Link>
          </p>
        </div>
      </div>
    </div>
  );
};
