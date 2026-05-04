// @ts-nocheck
import React from 'react';
import { Editor } from '@tiptap/react';
import {
  FiBold,
  FiItalic,
  FiUnderline,
  FiImage,
  FiLayout,
  FiAlignLeft,
  FiAlignCenter
} from 'react-icons/fi';

interface ToolbarProps {
  editor: Editor | null;
}

export const Toolbar: React.FC<ToolbarProps> = ({ editor }) => {
  const [isOutlineOpen, setIsOutlineOpen] = React.useState(false);
  const [, forceUpdate] = React.useState({});
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  React.useEffect(() => {
    if (!editor) return;
    const handler = () => forceUpdate({});
    editor.on('transaction', handler);
    return () => {
      editor.off('transaction', handler);
    };
  }, [editor]);

  if (!editor) {
    return null;
  }

  const addImage = () => {
    fileInputRef.current?.click();
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const base64 = event.target?.result as string;
        editor.chain().focus().setImage({ src: base64 }).run();
      };
      reader.readAsDataURL(file);
    }
    // Reset input
    e.target.value = '';
  };

  const addTable = () => {
    editor.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run();
  };

  const addPage = () => {
    editor.commands.insertPage();
    // Scroll the scroll container to the bottom to show the new page
    setTimeout(() => {
      const scrollArea = document.querySelector('.rte-scroll-area');
      if (scrollArea) {
        scrollArea.scrollTo({ top: scrollArea.scrollHeight, behavior: 'smooth' });
      }
    }, 100);
  };

  // Count pages in the document
  let pageCount = 0;
  editor.state.doc.descendants((node) => {
    if (node.type.name === 'page') {
      pageCount++;
      return false; // Don't go deeper into page content
    }
    return true;
  });

  const headings = [];
  editor.state.doc.descendants((node, pos) => {
    if (node.type.name === 'heading') {
      headings.push({ level: node.attrs.level, text: node.textContent, pos });
    }
  });

  return (
    <div className="flex flex-wrap gap-4 p-3 border-b items-center sticky top-0 z-40 transition-all duration-300" style={{ backgroundColor: 'var(--bg-surface)', borderColor: 'var(--border-subtle)' }}>
      {/* Group: Navigation & Pages */}
      <div className="flex items-center gap-1 p-1 rounded-xl" style={{ backgroundColor: 'var(--bg-app)' }}>
        <div className="relative">
          <button
            onClick={() => setIsOutlineOpen(!isOutlineOpen)}
            className={`flex items-center gap-2 px-3 py-2 rounded-lg transition-all text-[10px] font-black uppercase tracking-widest ${isOutlineOpen ? 'bg-white text-[var(--brand-primary)] shadow-sm' : 'text-[var(--text-muted)] hover:text-[var(--text-body)]'}`}
          >
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M4 6h16M4 12h16M4 18h7" />
            </svg>
            Navigation
          </button>
          
          {isOutlineOpen && (
            <div className="absolute left-0 mt-2 w-64 glass rounded-2xl shadow-2xl z-50 p-4 border animate-fade-scale" style={{ borderColor: 'var(--border-subtle)' }}>
              <p className="text-[9px] font-black uppercase tracking-widest mb-4 opacity-50">Document Outline</p>
              <div className="space-y-1 max-h-60 overflow-y-auto custom-scrollbar">
                {headings.length === 0 ? (
                  <p className="text-[10px] italic py-2">No headings yet...</p>
                ) : (
                  headings.map((h, i) => (
                    <button
                      key={i}
                      onClick={() => {
                        editor.commands.focus();
                        editor.commands.setTextSelection(h.pos);
                        setIsOutlineOpen(false);
                      }}
                      className="w-full text-left px-3 py-2 rounded-lg text-[11px] font-bold hover:bg-[var(--brand-primary-soft)] hover:text-[var(--brand-primary)] transition-all truncate"
                      style={{ paddingLeft: `${(h.level - 1) * 12 + 12}px`, color: 'var(--text-body)' }}
                    >
                      {h.text}
                    </button>
                  ))
                )}
              </div>
            </div>
          )}
        </div>

        {/* Page count badge */}
        <span className="px-2 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest" style={{ backgroundColor: 'var(--brand-primary-soft)', color: 'var(--brand-primary)' }}>
          {pageCount}p
        </span>

        <button
          onClick={addPage}
          className="flex items-center gap-2 px-3 py-2 rounded-lg transition-all text-[10px] font-black uppercase tracking-widest text-[var(--text-muted)] hover:text-[var(--brand-primary)] hover:bg-white"
          title="Add a new A4 page"
        >
          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 4v16m8-8H4" />
          </svg>
          Add Page
        </button>
      </div>

      <div className="h-6 w-px" style={{ backgroundColor: 'var(--border-subtle)' }} />

      {/* Group: Text Formatting */}
      <div className="flex items-center gap-1 p-1 rounded-xl" style={{ backgroundColor: 'var(--bg-app)' }}>
        <button
          onClick={() => editor.chain().focus().toggleBold().run()}
          className={`p-2 rounded-lg transition-all ${editor.isActive('bold') ? 'bg-white text-[var(--brand-primary)] shadow-sm' : 'text-[var(--text-muted)]'}`}
        >
          <FiBold size={14} strokeWidth={3} />
        </button>
        <button
          onClick={() => editor.chain().focus().toggleItalic().run()}
          className={`p-2 rounded-lg transition-all ${editor.isActive('italic') ? 'bg-white text-[var(--brand-primary)] shadow-sm' : 'text-[var(--text-muted)]'}`}
        >
          <FiItalic size={14} strokeWidth={3} />
        </button>
        <button
          onClick={() => editor.chain().focus().toggleUnderline().run()}
          className={`p-2 rounded-lg transition-all ${editor.isActive('underline') ? 'bg-white text-[var(--brand-primary)] shadow-sm' : 'text-[var(--text-muted)]'}`}
        >
          <FiUnderline size={14} strokeWidth={3} />
        </button>
      </div>

      {/* Group: Headings */}
      <div className="flex items-center gap-1 p-1 rounded-xl" style={{ backgroundColor: 'var(--bg-app)' }}>
        {[1, 2].map((level) => (
          <button
            key={level}
            onClick={() => editor.chain().focus().toggleHeading({ level }).run()}
            className={`px-3 py-1.5 text-[10px] rounded-lg font-black tracking-tighter ${editor.isActive('heading', { level }) ? 'bg-white text-[var(--brand-primary)] shadow-sm' : 'text-[var(--text-muted)]'}`}
          >
            H{level}
          </button>
        ))}
      </div>

      {/* Group: Alignment */}
      <div className="flex items-center gap-1 p-1 rounded-xl" style={{ backgroundColor: 'var(--bg-app)' }}>
        <button
          onClick={() => editor.chain().focus().setTextAlign('left').run()}
          className={`p-2 rounded-lg ${editor.isActive({ textAlign: 'left' }) ? 'bg-white text-[var(--brand-primary)] shadow-sm' : 'text-[var(--text-muted)]'}`}
        >
          <FiAlignLeft size={14} strokeWidth={3} />
        </button>
        <button
          onClick={() => editor.chain().focus().setTextAlign('center').run()}
          className={`p-2 rounded-lg ${editor.isActive({ textAlign: 'center' }) ? 'bg-white text-[var(--brand-primary)] shadow-sm' : 'text-[var(--text-muted)]'}`}
        >
          <FiAlignCenter size={14} strokeWidth={3} />
        </button>
      </div>

      <div className="flex-1" />

      {/* Group: Insert Media */}
      <div className="flex items-center gap-2">
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileUpload}
          accept="image/*"
          className="hidden"
        />
        <button onClick={addImage} className="btn-icon !p-2" title="Local Image"><FiImage size={16} /></button>
        <button onClick={addTable} className="btn-icon !p-2" title="Table"><FiLayout size={16} /></button>
      </div>
    </div>
  );
};
