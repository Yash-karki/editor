import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { apiService } from '../services/apiService';
import { setUser, setTokens } from '../store/slices/userSlice';

export const Login: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();
  const dispatch = useDispatch();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const response = await apiService.login(email, password);
      dispatch(setUser(response.user));
      dispatch(setTokens({ accessToken: response.accessToken, refreshToken: response.refreshToken }));
      navigate('/dashboard');
    } catch (err: any) {
      setError(err.response?.data?.error || 'Login failed');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[var(--bg-app)] transition-colors duration-500 overflow-hidden relative">
      {/* Decorative background elements */}
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full bg-[var(--brand-primary-soft)] blur-[120px] animate-pulse" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] rounded-full bg-[var(--brand-primary-soft)] blur-[120px] animate-pulse" style={{ animationDelay: '2s' }} />

      <div className="relative glass w-full max-w-lg p-12 rounded-[3rem] shadow-[0_32px_64px_-12px_rgba(0,0,0,0.14)] animate-fade-scale">
        <div className="text-center mb-12">
          <div className="w-20 h-20 bg-[var(--brand-primary)] rounded-[2rem] flex items-center justify-center mx-auto mb-6 shadow-2xl shadow-[var(--brand-primary-soft)]">
            <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
            </svg>
          </div>
          <h1 className="text-4xl font-black tracking-tight mb-3" style={{ color: 'var(--text-heading)' }}>Welcome Back</h1>
          <p className="text-[var(--text-muted)] font-medium">Continue your collaborative journey with us.</p>
        </div>

        {error && (
          <div className="mb-8 p-4 bg-rose-50 border border-rose-100 rounded-2xl animate-fade-scale">
            <p className="text-xs font-bold text-rose-600 text-center uppercase tracking-widest">{error}</p>
          </div>
        )}

        <form onSubmit={handleLogin} className="space-y-6">
          <div className="space-y-2">
            <label className="text-[10px] font-black uppercase tracking-[0.2em] ml-4" style={{ color: 'var(--text-muted)' }}>Email Address</label>
            <input 
              type="email" 
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-8 py-5 rounded-[2rem] border-none ring-1 ring-slate-200 dark:ring-slate-700 focus:ring-2 focus:ring-[var(--brand-primary)] bg-[var(--bg-app)] transition-all font-medium placeholder:text-[var(--text-muted)]"
              style={{ color: 'var(--text-body)' }}
              placeholder="name@company.com"
              required 
            />
          </div>

          <div className="space-y-2">
            <label className="text-[10px] font-black uppercase tracking-[0.2em] ml-4" style={{ color: 'var(--text-muted)' }}>Security Key</label>
            <input 
              type="password" 
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-8 py-5 rounded-[2rem] border-none ring-1 ring-slate-200 dark:ring-slate-700 focus:ring-2 focus:ring-[var(--brand-primary)] bg-[var(--bg-app)] transition-all font-medium placeholder:text-[var(--text-muted)]"
              style={{ color: 'var(--text-body)' }}
              placeholder="••••••••••••"
              required 
            />
          </div>

          <button type="submit" className="w-full btn-primary py-5 text-lg shadow-2xl shadow-[var(--brand-primary-soft)] hover:scale-[1.02]">
            Sign In
          </button>
        </form>

        <div className="mt-12 text-center">
          <p className="text-sm font-medium" style={{ color: 'var(--text-muted)' }}>
            New to the platform? <Link to="/register" className="font-black hover:underline" style={{ color: 'var(--brand-primary)' }}>Create an account</Link>
          </p>
        </div>
      </div>
    </div>
  );
};
