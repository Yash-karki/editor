import React, { useState, useEffect } from 'react';
import { apiService } from '../../services/apiService';
import { socketService } from '../../services/socketService';

interface Comment {
  id: string;
  content: string;
  username: string;
  user_full_name: string;
  created_at: string;
  parent_comment_id: string | null;
  avatar_url?: string;
}

interface CommentSidebarProps {
  documentId: string;
  onClose: () => void;
}

export const CommentSidebar: React.FC<CommentSidebarProps> = ({ documentId, onClose }) => {
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadComments();

    const socket = socketService.getSocket();
    if (socket) {
      socket.on('new-comment', (data) => {
        if (data.documentId === documentId) {
          loadComments();
        }
      });
    }

    return () => {
      socket?.off('new-comment');
    };
  }, [documentId]);

  const loadComments = async () => {
    try {
      const data = await apiService.getComments(documentId);
      setComments(data);
    } catch (err) {
      console.error('Failed to load comments');
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim()) return;

    try {
      const comment = await apiService.createComment({
        documentId,
        content: newComment,
      });
      setNewComment('');
      loadComments();
    } catch (err) {
      console.error('Failed to add comment');
    }
  };

  const threads = comments.filter(c => !c.parent_comment_id);

  return (
    <div className="w-80 border-l flex flex-col h-full shadow-2xl animate-slide-in relative z-20 transition-all duration-300" style={{ backgroundColor: 'var(--bg-surface)', borderColor: 'var(--border-subtle)' }}>
      <div className="p-6 border-b flex justify-between items-center bg-slate-50/50 dark:bg-slate-800/20" style={{ borderColor: 'var(--border-subtle)' }}>
        <h2 className="text-lg font-bold tracking-tight" style={{ color: 'var(--text-heading)' }}>Discussions</h2>
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
            <p className="text-[10px] font-bold uppercase tracking-widest" style={{ color: 'var(--text-muted)' }}>Loading history...</p>
          </div>
        ) : threads.length === 0 ? (
          <div className="text-center py-12 px-4 border-2 border-dashed rounded-2xl" style={{ borderColor: 'var(--border-subtle)' }}>
            <p className="text-sm font-medium italic" style={{ color: 'var(--text-muted)' }}>Start a conversation to collaborate better.</p>
          </div>
        ) : (
          threads.map(thread => (
            <div key={thread.id} className="group space-y-3">
              <div className="flex gap-3">
                <div className="flex-shrink-0 w-8 h-8 rounded-xl flex items-center justify-center text-white text-xs font-bold shadow-md overflow-hidden" style={{ backgroundColor: 'var(--brand-primary)' }}>
                  {thread.avatar_url ? (
                    <img src={thread.avatar_url} alt={thread.username} className="w-full h-full object-cover" />
                  ) : (
                    thread.username.charAt(0).toUpperCase()
                  )}
                </div>
                <div className="flex-1 space-y-1">
                  <div className="flex items-baseline justify-between">
                    <p className="text-sm font-bold" style={{ color: 'var(--text-heading)' }}>{thread.user_full_name || thread.username}</p>
                    <p className="text-[9px] font-bold uppercase tracking-tighter" style={{ color: 'var(--text-muted)' }}>{new Date(thread.created_at).toLocaleDateString()}</p>
                  </div>
                  <div className="p-3 rounded-2xl rounded-tl-none border transition-all group-hover:shadow-sm" style={{ backgroundColor: 'var(--bg-app)', borderColor: 'var(--border-subtle)' }}>
                    <p className="text-sm leading-relaxed" style={{ color: 'var(--text-body)' }}>{thread.content}</p>
                  </div>
                </div>
              </div>
              
              {/* Replies */}
              <div className="ml-11 space-y-4 border-l-2 pl-4" style={{ borderColor: 'var(--border-subtle)' }}>
                {comments.filter(c => c.parent_comment_id === thread.id).map(reply => (
                  <div key={reply.id} className="space-y-1">
                    <div className="flex items-baseline justify-between">
                      <p className="text-xs font-bold" style={{ color: 'var(--text-heading)' }}>{reply.user_full_name || reply.username}</p>
                    </div>
                    <p className="text-xs leading-relaxed" style={{ color: 'var(--text-muted)' }}>{reply.content}</p>
                  </div>
                ))}
              </div>
            </div>
          ))
        )}
      </div>

      <div className="p-6 border-t bg-slate-50/30 dark:bg-slate-800/10" style={{ borderColor: 'var(--border-subtle)' }}>
        <form onSubmit={handleAddComment} className="relative">
          <textarea
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            placeholder="Share your thoughts..."
            className="w-full p-4 text-sm border-none rounded-2xl ring-1 ring-slate-200 dark:ring-slate-700 focus:ring-2 focus:ring-[var(--brand-primary)] bg-[var(--bg-surface)] shadow-sm transition-all resize-none h-24 placeholder:text-[var(--text-muted)]"
            style={{ color: 'var(--text-body)' }}
          />
          <button
            type="submit"
            className="mt-3 w-full btn-primary"
          >
            Post Comment
          </button>
        </form>
      </div>
    </div>
  );
};
