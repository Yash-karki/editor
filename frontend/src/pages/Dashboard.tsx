import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { apiService } from '../services/apiService';
import { useSelector, useDispatch } from 'react-redux';
import { RootState, AppDispatch } from '../store/appStore';
import { ProfileModal } from '../components/Dashboard/ProfileModal';
import { logout } from '../store/slices/userSlice';

interface Document {
  id: string;
  title: string;
  updated_at: string;
}

export const Dashboard: React.FC = () => {
  const [documents, setDocuments] = useState<Document[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();
  const dispatch = useDispatch<AppDispatch>();
  const { currentUser } = useSelector((state: RootState) => state.user);
  const [isDarkMode, setIsDarkMode] = useState(() => localStorage.getItem('theme') === 'dark');
  const [isProfileOpen, setIsProfileOpen] = useState(false);

  useEffect(() => {
    loadDocuments();
  }, []);

  useEffect(() => {
    if (isDarkMode) {
      document.body.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      document.body.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  }, [isDarkMode]);

  const loadDocuments = async () => {
    try {
      setIsLoading(true);
      const docs = await apiService.listUserDocuments();
      setDocuments(docs);
    } catch (err) {
      console.error('Failed to load documents');
    } finally {
      setIsLoading(false);
    }
  };

  const createNewDoc = async () => {
    try {
      const doc = await apiService.createDocument('Untitled Document');
      navigate(`/docs/${doc.id}`);
    } catch (err) {
      console.error('Failed to create document');
    }
  };

  const filteredDocs = documents.filter(doc => 
    doc.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="min-h-screen font-sans transition-colors duration-300">
      {/* Refined Background with Brand Primary Soft */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden -z-10 bg-[var(--bg-app)]">
        <div className="absolute -top-[10%] -left-[10%] w-[40%] h-[40%] bg-[var(--brand-primary-soft)] blur-[120px] rounded-full opacity-50" />
      </div>

      <div className="max-w-7xl mx-auto px-8 py-12">
        {/* Header / Hero */}
        <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-16">
          <div className="space-y-2">
            <div className="flex items-center gap-4">
              <h1 className="text-5xl font-black tracking-tight" style={{ color: 'var(--text-heading)' }}>
                Welcome back, <span className="text-transparent bg-clip-text bg-gradient-to-r from-[var(--brand-primary)] to-[#8b5cf6]">{currentUser?.username || 'Writer'}</span>
              </h1>
              <button
                onClick={() => setIsDarkMode(!isDarkMode)}
                className="mt-2 p-3 rounded-2xl glass hover:scale-110 transition-all duration-300 shadow-xl"
                title="Toggle Theme"
              >
                {isDarkMode ? (
                  <svg className="w-6 h-6 text-amber-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364-6.364l-.707.707M6.343 17.657l-.707.707M16.243 17.657l.707.707M7.757 7.757l.707.707M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                ) : (
                  <svg className="w-6 h-6 text-slate-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
                  </svg>
                )}
              </button>
              <button
                onClick={() => setIsProfileOpen(true)}
                className="mt-2 p-1.5 rounded-2xl glass hover:scale-110 transition-all duration-300 shadow-xl overflow-hidden flex items-center justify-center w-12 h-12"
                title="Edit Profile"
              >
                {currentUser?.avatar_url ? (
                  <img src={currentUser.avatar_url} alt="Profile" className="w-full h-full object-cover rounded-xl" />
                ) : (
                  <div className="w-full h-full rounded-xl bg-[var(--brand-primary-soft)] flex items-center justify-center text-[var(--brand-primary)] font-bold">
                    {currentUser?.username?.[0]?.toUpperCase() || '?'}
                  </div>
                )}
              </button>
              <button
                onClick={() => {
                  dispatch(logout());
                  navigate('/login');
                }}
                className="mt-2 p-3 rounded-2xl glass hover:scale-110 transition-all duration-300 shadow-xl text-rose-500 hover:bg-rose-50"
                title="Logout"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                </svg>
              </button>
            </div>
            <p className="text-[var(--text-muted)] font-medium text-lg">Your creative hub for collaborative writing.</p>
          </div>
          <button 
            onClick={createNewDoc}
            className="group btn-primary px-8 py-4 text-lg"
          >
            <svg className="w-6 h-6 transition-transform group-hover:rotate-90" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
            </svg>
            Create Document
          </button>
        </header>

        {/* Stats & Search Bar */}
        <div className="flex flex-col md:flex-row gap-6 mb-12">
          <div className="flex-1 glass p-2 rounded-2xl flex items-center px-6">
            <svg className="w-5 h-5 text-[var(--text-muted)] mr-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input 
              type="text" 
              placeholder="Search your library..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="bg-transparent border-none outline-none w-full py-3 text-[var(--text-body)] font-medium placeholder:text-[var(--text-muted)]"
            />
          </div>
          <div className="flex gap-4">
            <div className="glass px-8 py-4 rounded-2xl flex flex-col justify-center">
              <span className="text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-widest">Documents</span>
              <span className="text-2xl font-black text-[var(--text-heading)]">{documents.length}</span>
            </div>
            <div className="glass px-8 py-4 rounded-2xl flex flex-col justify-center">
              <span className="text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-widest">Recent</span>
              <span className="text-2xl font-black text-emerald-500">{documents.filter(d => new Date(d.updated_at).getTime() > Date.now() - 86400000 * 7).length}</span>
            </div>
          </div>
        </div>

        {/* Documents Grid */}
        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-64 rounded-3xl animate-pulse" style={{ backgroundColor: 'var(--border-subtle)' }} />
            ))}
          </div>
        ) : filteredDocs.length === 0 ? (
          <div className="text-center py-24 glass rounded-[40px] border-2 border-dashed" style={{ borderColor: 'var(--border-strong)' }}>
            <div className="w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6" style={{ backgroundColor: 'var(--bg-app)' }}>
              <svg className="w-10 h-10 text-[var(--text-muted)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 13h6m-3-3v6m5 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <h2 className="text-2xl font-bold mb-2" style={{ color: 'var(--text-heading)' }}>No documents found</h2>
            <p className="text-[var(--text-muted)] mb-8">Start your journey by creating a new document above.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {filteredDocs.map((doc, index) => (
              <div 
                key={doc.id} 
                className="group premium-card p-1 cursor-pointer overflow-hidden animate-fade-scale"
                style={{ animationDelay: `${index * 50}ms` }}
                onClick={() => navigate(`/docs/${doc.id}`)}
              >
                <div className="p-8 h-full flex flex-col">
                  <div className="flex justify-between items-start mb-6">
                    <div className="w-12 h-12 rounded-2xl flex items-center justify-center text-[var(--brand-primary)] group-hover:bg-[var(--brand-primary)] group-hover:text-white transition-all duration-500" style={{ backgroundColor: 'var(--brand-primary-soft)' }}>
                      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.523.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                      </svg>
                    </div>
                    <span className="text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-widest px-2 py-1 rounded-md" style={{ backgroundColor: 'var(--bg-app)' }}>v{index + 1}</span>
                  </div>
                  <h3 className="text-xl font-bold mb-3 group-hover:text-[var(--brand-primary)] transition-colors line-clamp-2" style={{ color: 'var(--text-heading)' }}>{doc.title}</h3>
                  <div className="mt-auto pt-6 border-t flex items-center justify-between" style={{ borderColor: 'var(--border-subtle)' }}>
                    <div className="flex flex-col">
                      <span className="text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-tighter">Last Modified</span>
                      <span className="text-xs font-medium" style={{ color: 'var(--text-body)' }}>{new Date(doc.updated_at).toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' })}</span>
                    </div>
                    <div className="w-8 h-8 rounded-full border flex items-center justify-center text-[var(--text-muted)] group-hover:border-[var(--brand-primary)] group-hover:text-[var(--brand-primary)] transition-all" style={{ borderColor: 'var(--border-strong)' }}>
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
                      </svg>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {isProfileOpen && <ProfileModal onClose={() => setIsProfileOpen(false)} />}
    </div>
  );
};
