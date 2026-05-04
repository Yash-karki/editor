import React, { forwardRef, useEffect, useImperativeHandle, useState } from 'react';
import { socketService } from '../../services/socketService';

export interface MentionListProps {
  items: any[];
  command: (props: any) => void;
  documentId?: string;
}

export const MentionList = forwardRef((props: MentionListProps, ref) => {
  const [selectedIndex, setSelectedIndex] = useState(0);

  const selectItem = (index: number) => {
    const item = props.items[index];
    if (item) {
      props.command({ id: item.id, label: item.username });
      
      if (socketService.getSocket()) {
        socketService.getSocket()?.emit('mention', {
          documentId: props.documentId || window.location.pathname.split('/').pop(),
          mentionedUserId: item.id,
          mentionedUsername: item.username,
        });
      }
    }
  };

  const upHandler = () => {
    setSelectedIndex((selectedIndex + props.items.length - 1) % props.items.length);
  };

  const downHandler = () => {
    setSelectedIndex((selectedIndex + 1) % props.items.length);
  };

  const enterHandler = () => {
    selectItem(selectedIndex);
  };

  useEffect(() => setSelectedIndex(0), [props.items]);

  useImperativeHandle(ref, () => ({
    onKeyDown: ({ event }: { event: KeyboardEvent }) => {
      if (event.key === 'ArrowUp') {
        upHandler();
        return true;
      }
      if (event.key === 'ArrowDown') {
        downHandler();
        return true;
      }
      if (event.key === 'Enter') {
        enterHandler();
        return true;
      }
      return false;
    },
  }));

  return (
    <div className="glass rounded-2xl shadow-2xl overflow-hidden min-w-[240px] z-50 border animate-fade-scale" style={{ borderColor: 'var(--border-subtle)' }}>
      {props.items.length > 0 ? (
        <div className="p-2 space-y-1">
          {props.items.map((item, index) => (
            <button
              key={item.id}
              onClick={() => selectItem(index)}
              className={`w-full text-left px-4 py-3 rounded-xl text-sm flex items-center gap-3 transition-all duration-200 ${
                index === selectedIndex ? 'shadow-lg scale-[1.02]' : 'hover:bg-[var(--brand-primary-soft)]'
              }`}
              style={{ 
                backgroundColor: index === selectedIndex ? 'var(--brand-primary)' : 'transparent',
                color: index === selectedIndex ? 'white' : 'var(--text-body)'
              }}
            >
              <div className="w-8 h-8 rounded-full flex items-center justify-center text-[10px] font-black shadow-sm overflow-hidden" style={{ backgroundColor: index === selectedIndex ? 'rgba(255,255,255,0.2)' : 'var(--brand-primary-soft)', color: index === selectedIndex ? 'white' : 'var(--brand-primary)' }}>
                {item.avatar_url ? (
                  <img src={item.avatar_url} alt={item.username} className="w-full h-full object-cover" />
                ) : (
                  (item.full_name || item.username).charAt(0).toUpperCase()
                )}
              </div>
              <div className="flex flex-col">
                <span className="font-black tracking-tight">{item.username}</span>
                {item.full_name && (
                  <span className={`text-[10px] font-bold uppercase tracking-widest ${index === selectedIndex ? 'text-indigo-100' : 'text-[var(--text-muted)]'}`}>
                    {item.full_name}
                  </span>
                )}
              </div>
            </button>
          ))}
        </div>
      ) : (
        <div className="px-6 py-8 text-center" style={{ backgroundColor: 'var(--bg-app)' }}>
          <p className="text-[10px] font-black uppercase tracking-[0.2em]" style={{ color: 'var(--text-muted)' }}>No collaborators found</p>
        </div>
      )}
    </div>
  );
});

MentionList.displayName = 'MentionList';
