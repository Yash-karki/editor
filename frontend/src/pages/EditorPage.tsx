import React, { useEffect, useRef, useState, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import * as Y from 'yjs';
import { WebsocketProvider } from 'y-websocket';
import { IndexeddbPersistence } from 'y-indexeddb';
import { RootState, AppDispatch } from '../store/appStore';
import { apiService } from '../services/apiService';
import { socketService } from '../services/socketService';
import { setDocument, setSaved, addActiveUser, setActiveUsers } from '../store/slices/documentSlice';
import { RichTextEditor } from '../components/Editor/RichTextEditor';
import { ActiveUsers } from '../components/Navbar/ActiveUsers';
import { ShareModal } from '../components/Editor/ShareModal';
import { CommentSidebar } from '../components/Editor/CommentSidebar';
import { VersionHistoryModal } from '../components/Editor/VersionHistoryModal';
import { NotificationPanel } from '../components/Navbar/NotificationPanel';
import { ActivityLogSidebar } from '../components/Editor/ActivityLogSidebar';

export const EditorPage: React.FC = () => {
  const { documentId } = useParams<{ documentId: string }>();
  const navigate = useNavigate();
  const dispatch = useDispatch<AppDispatch>();
  const { currentUser, accessToken } = useSelector((state: RootState) => state.user);
  const { currentDocument, activeUsers } = useSelector((state: RootState) => state.document);

  const ydocRef = useRef<Y.Doc | null>(null);
  const providerRef = useRef<WebsocketProvider | null>(null);
  const indexeddbProviderRef = useRef<IndexeddbPersistence | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isProviderReady, setIsProviderReady] = useState(false);
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const [isCommentSidebarOpen, setIsCommentSidebarOpen] = useState(false);
  const [isVersionHistoryOpen, setIsVersionHistoryOpen] = useState(false);
  const [isActivityLogOpen, setIsActivityLogOpen] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(() => localStorage.getItem('theme') === 'dark');

  const handleRemoteUpdate = useCallback((data: any) => {
    dispatch(setSaved(false));
  }, [dispatch]);

  const handleCursorChanged = useCallback((data: any) => {
    dispatch(addActiveUser({
      id: data.userId,
      username: data.username,
      color: data.color || '#45B7D1',
      cursor_position: data.position,
    }));
  }, [dispatch]);

  const handleNewComment = useCallback((data: any) => {
    console.log('New comment:', data);
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

  useEffect(() => {
    if (!documentId || !currentUser) return;

    const initializeEditor = async () => {
      try {
        const doc = await apiService.getDocument(documentId);
        dispatch(setDocument(doc));

        const ydoc = new Y.Doc();
        ydocRef.current = ydoc;

        // Setup offline persistence
        const indexeddbProvider = new IndexeddbPersistence(`doc-${documentId}`, ydoc);
        indexeddbProviderRef.current = indexeddbProvider;

        const wsUrl = process.env.REACT_APP_WS_URL || 'ws://localhost:3001';
        const provider = new WebsocketProvider(
          wsUrl,
          `doc-${documentId}`,
          ydoc,
          { connect: true }
        );
        providerRef.current = provider;

        // Wait for the WebSocket provider to sync before rendering the editor
        provider.on('sync', (isSynced: boolean) => {
          if (isSynced) {
            setIsProviderReady(true);
          }
        });

        // Also set ready on connect in case sync fires before we listen
        provider.on('status', ({ status }: { status: string }) => {
          if (status === 'connected') {
            setIsProviderReady(true);
          }
        });

        // Fallback: if provider doesn't connect within 3 seconds, render editor anyway
        setTimeout(() => setIsProviderReady(true), 3000);

        // Sync Yjs awareness → Redux activeUsers whenever any collaborator updates their state
        const awarenessChangeHandler = () => {
          const states = Array.from(provider.awareness.getStates().entries()) as [number, any][];
          const users = states
            .filter(([clientId, state]) => state?.user && clientId !== provider.awareness.clientID)
            .map(([, state]) => ({
              id: state.user.name || String(Math.random()),
              username: state.user.name,
              avatar_url: state.user.avatar_url || null,
              color: state.user.color || '#45B7D1',
              cursor_position: 0,
            }));
          dispatch(setActiveUsers(users));
        };

        provider.awareness.on('change', awarenessChangeHandler);

        socketService.connect(
          currentUser.id,
          currentUser.username,
          documentId,
          handleRemoteUpdate,
          handleCursorChanged,
          handleNewComment,
          currentUser.avatar_url
        );

        setIsLoading(false);
      } catch (error) {
        console.error('Failed to initialize editor:', error);
        setIsLoading(false);
      }
    };

    initializeEditor();

    return () => {
      socketService.disconnect();
      if (providerRef.current) {
        // Remove the awareness listener before destroying
        providerRef.current.awareness.off('change', () => {});
        providerRef.current.destroy();
      }
      if (indexeddbProviderRef.current) {
        indexeddbProviderRef.current.destroy();
      }
      if (ydocRef.current) {
        ydocRef.current.destroy();
      }
      dispatch(setActiveUsers([]));
      setIsProviderReady(false);
    };
  }, [documentId, currentUser, dispatch, handleRemoteUpdate, handleCursorChanged, handleNewComment]);

  const [isExportOpen, setIsExportOpen] = useState(false);

  if (isLoading) {
    return <div className="flex items-center justify-center h-screen">Loading...</div>;
  }

  return (
    <div className="flex h-screen overflow-hidden transition-colors duration-300" style={{ backgroundColor: 'var(--bg-app)' }}>
      <div className="flex-1 flex flex-col min-w-0 min-h-0">
        <header className="h-20 px-8 flex items-center justify-between border-b relative z-30 transition-all duration-300" style={{ backgroundColor: 'var(--bg-surface)', borderColor: 'var(--border-subtle)' }}>
          <div className="flex items-center gap-6">
            <button
              onClick={() => navigate('/dashboard')}
              className="btn-icon"
              title="Back to Workspace"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
            </button>
            <div className="h-8 w-px" style={{ backgroundColor: 'var(--border-subtle)' }} />
            <div className="flex flex-col">
              <h1 className="text-xl font-black truncate max-w-md tracking-tight" style={{ color: 'var(--text-heading)' }}>
                {currentDocument?.title || 'Untitled Document'}
              </h1>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                <p className="text-[9px] font-black uppercase tracking-[0.2em]" style={{ color: 'var(--text-muted)' }}>
                  Live Editing
                </p>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <ActiveUsers users={activeUsers} />
            <div className="h-8 w-px mx-2" style={{ backgroundColor: 'var(--border-subtle)' }} />
            
            <button
              onClick={() => setIsDarkMode(!isDarkMode)}
              className="btn-icon"
              title="Toggle Theme"
            >
              {isDarkMode ? (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364-6.364l-.707.707M6.343 17.657l-.707.707M16.243 17.657l.707.707M7.757 7.757l.707.707M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              ) : (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
                </svg>
              )}
            </button>

            <NotificationPanel />

            <button
              onClick={() => setIsActivityLogOpen(!isActivityLogOpen)}
              className="btn-icon"
              title="Audit Logs"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </button>

            <button
              onClick={() => setIsVersionHistoryOpen(true)}
              className="btn-icon"
              title="Version History"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 10h10a8 8 0 018 8v2M3 10l4 4m-4-4l4-4" />
              </svg>
            </button>

            <button
              onClick={() => setIsCommentSidebarOpen(!isCommentSidebarOpen)}
              className="btn-icon"
              title="Discussions"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z" />
              </svg>
            </button>

            <div className="relative h-full flex items-center">
              <button 
                onClick={(e) => {
                  e.stopPropagation();
                  setIsExportOpen(!isExportOpen);
                }}
                className={`btn-icon ${isExportOpen ? 'bg-slate-100 dark:bg-slate-800 ring-2 ring-[var(--brand-primary-soft)]' : ''}`} 
                title="Export"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                </svg>
              </button>
              
              {isExportOpen && (
                <>
                  {/* Invisible backdrop to close on click outside */}
                  <div className="fixed inset-0 z-40" onClick={() => setIsExportOpen(false)} />
                  
                  <div className="absolute right-0 top-[80%] mt-2 w-56 glass rounded-[1.5rem] shadow-2xl overflow-hidden border z-50 animate-fade-scale" style={{ borderColor: 'var(--border-subtle)' }}>
                    <div className="px-5 py-3 border-b bg-slate-50/50 dark:bg-slate-800/20" style={{ borderColor: 'var(--border-subtle)' }}>
                      <p className="text-[9px] font-black uppercase tracking-widest" style={{ color: 'var(--text-muted)' }}>Choose Format</p>
                    </div>
                    <button 
                      onClick={() => {
                        window.open(`${process.env.REACT_APP_API_URL}/export/documents/${documentId}?format=markdown&token=${accessToken}`, '_blank');
                        setIsExportOpen(false);
                      }}
                      className="w-full text-left px-5 py-4 text-xs font-bold uppercase tracking-widest hover:bg-[var(--brand-primary-soft)] hover:text-[var(--brand-primary)] transition-colors"
                      style={{ color: 'var(--text-body)' }}
                    >
                      Markdown (.md)
                    </button>
                    <button 
                      onClick={() => {
                        window.open(`${process.env.REACT_APP_API_URL}/export/documents/${documentId}?format=pdf&token=${accessToken}`, '_blank');
                        setIsExportOpen(false);
                      }}
                      className="w-full text-left px-5 py-4 text-xs font-bold uppercase tracking-widest hover:bg-[var(--brand-primary-soft)] hover:text-[var(--brand-primary)] transition-colors flex justify-between items-center"
                      style={{ color: 'var(--text-body)' }}
                    >
                      PDF Document
                    </button>
                    <button 
                      onClick={() => {
                        window.open(`${process.env.REACT_APP_API_URL}/export/documents/${documentId}?format=docx&token=${accessToken}`, '_blank');
                        setIsExportOpen(false);
                      }}
                      className="w-full text-left px-5 py-4 text-xs font-bold uppercase tracking-widest hover:bg-[var(--brand-primary-soft)] hover:text-[var(--brand-primary)] transition-colors flex justify-between items-center"
                      style={{ color: 'var(--text-body)' }}
                    >
                      Word (.docx)
                    </button>
                  </div>
                </>
              )}
            </div>

            <button
              onClick={() => setIsShareModalOpen(true)}
              className="btn-primary"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
              </svg>
              Share
            </button>
          </div>
        </header>

        <div className="flex-1 flex min-h-0">
          <div className="flex-1 min-h-0 flex flex-col">
            {ydocRef.current && providerRef.current && currentUser && isProviderReady ? (
              <RichTextEditor
                documentId={documentId!}
                ydoc={ydocRef.current}
                provider={providerRef.current}
                user={{
                  id: currentUser.id,
                  username: currentUser.username,
                  avatar_url: currentUser.avatar_url,
                  color: currentUser.color || '#4f46e5',
                }}
                editable={['owner', 'editor'].includes(currentDocument?.permission_level || 'viewer')}
              />
            ) : (
              <div className="flex flex-col items-center justify-center flex-1 space-y-4">
                <div className="w-12 h-12 border-4 rounded-full animate-spin" style={{ borderColor: 'var(--brand-primary-soft)', borderTopColor: 'var(--brand-primary)' }} />
                <p className="font-bold uppercase tracking-widest text-[10px]" style={{ color: 'var(--text-muted)' }}>Synchronizing workspace...</p>
              </div>
            )}
          </div>
          {isCommentSidebarOpen && documentId && (
            <CommentSidebar 
              documentId={documentId} 
              onClose={() => setIsCommentSidebarOpen(false)} 
            />
          )}
          {isActivityLogOpen && documentId && (
            <ActivityLogSidebar 
              documentId={documentId} 
              onClose={() => setIsActivityLogOpen(false)} 
            />
          )}
        </div>
      </div>

      {documentId && (
        <>
          <ShareModal
            documentId={documentId}
            isOpen={isShareModalOpen}
            onClose={() => setIsShareModalOpen(false)}
          />
          <VersionHistoryModal
            documentId={documentId}
            isOpen={isVersionHistoryOpen}
            onClose={() => setIsVersionHistoryOpen(false)}
            onRestore={() => window.location.reload()}
          />
        </>
      )}
    </div>
  );
};
