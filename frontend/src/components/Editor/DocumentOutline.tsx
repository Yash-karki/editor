import React from 'react';
import { Editor } from '@tiptap/react';

interface DocumentOutlineProps {
  editor: Editor | null;
}

interface Heading {
  level: number;
  text: string;
  pos: number;
}

export const DocumentOutline: React.FC<DocumentOutlineProps> = ({ editor }) => {
  if (!editor) return null;

  const headings: Heading[] = [];
  editor.state.doc.descendants((node, pos) => {
    if (node.type.name === 'heading') {
      headings.push({
        level: node.attrs.level,
        text: node.textContent,
        pos,
      });
    }
  });

  const scrollToHeading = (pos: number) => {
    editor.commands.focus();
    editor.commands.setTextSelection(pos);
    const element = editor.view.domAtPos(pos).node as HTMLElement;
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  };

  const addPage = () => {
    editor.chain().focus().insertContentAt(editor.state.doc.content.size, { type: 'horizontalRule' }).run();
  };

  return (
    <div className="w-64 border-r flex flex-col h-full transition-all duration-300" style={{ backgroundColor: 'var(--bg-sidebar)', borderColor: 'var(--border-subtle)' }}>
      <div className="p-6 border-b flex flex-col gap-4">
        <h2 className="text-xs font-black uppercase tracking-[0.2em]" style={{ color: 'var(--text-muted)' }}>Document Outline</h2>
        <button 
          onClick={addPage}
          className="w-full py-3 px-4 rounded-xl border-2 border-dashed flex items-center justify-center gap-2 hover:bg-[var(--brand-primary-soft)] hover:border-[var(--brand-primary)] transition-all group"
          style={{ borderColor: 'var(--border-subtle)' }}
        >
          <svg className="w-4 h-4 text-[var(--text-muted)] group-hover:text-[var(--brand-primary)] transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 4v16m8-8H4" />
          </svg>
          <span className="text-[10px] font-black uppercase tracking-widest text-[var(--text-muted)] group-hover:text-[var(--brand-primary)] transition-colors">Add New Page</span>
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-6 space-y-4 custom-scrollbar">
        {headings.length === 0 ? (
          <p className="text-[10px] font-bold uppercase tracking-widest leading-loose" style={{ color: 'var(--text-muted)' }}>
            Start using headings to build your outline.
          </p>
        ) : (
          <div className="space-y-1">
            {headings.map((h, i) => (
              <button
                key={i}
                onClick={() => scrollToHeading(h.pos)}
                className="w-full text-left px-3 py-2 rounded-lg text-xs font-medium hover:bg-[var(--brand-primary-soft)] hover:text-[var(--brand-primary)] transition-all truncate"
                style={{ 
                  color: 'var(--text-body)',
                  paddingLeft: `${(h.level - 1) * 12 + 12}px`
                }}
              >
                {h.text || 'Untitled Section'}
              </button>
            ))}
          </div>
        )}
      </div>

      <div className="p-6 border-t bg-slate-50/30 dark:bg-slate-800/10">
        <div className="flex items-center justify-between text-[9px] font-black uppercase tracking-widest" style={{ color: 'var(--text-muted)' }}>
          <span>Word Count</span>
          <span style={{ color: 'var(--text-heading)' }}>{editor.storage.characterCount?.words() || 0}</span>
        </div>
      </div>
    </div>
  );
};
