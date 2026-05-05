// @ts-nocheck
import React from 'react';
import Document from '@tiptap/extension-document';
import { useEditor, EditorContent } from '@tiptap/react';
import { StarterKit } from '@tiptap/starter-kit';
import { Underline } from '@tiptap/extension-underline';
import { Link } from '@tiptap/extension-link';
import { Table } from '@tiptap/extension-table';
import { TableRow } from '@tiptap/extension-table-row';
import { TableHeader } from '@tiptap/extension-table-header';
import { TableCell } from '@tiptap/extension-table-cell';
import { Collaboration } from '@tiptap/extension-collaboration';
import { Extension, Node, mergeAttributes } from '@tiptap/core';
import { Mention } from '@tiptap/extension-mention';
import { ReactRenderer, NodeViewWrapper, ReactNodeViewRenderer } from '@tiptap/react';
import { TextAlign } from '@tiptap/extension-text-align';
import { Typography } from '@tiptap/extension-typography';
import { CharacterCount } from '@tiptap/extension-character-count';
import { yCursorPlugin } from '@tiptap/y-tiptap';
import * as Y from 'yjs';
import { WebsocketProvider } from 'y-websocket';
import tippy from 'tippy.js';
import { Toolbar } from './Toolbar';
import { MentionList } from './MentionList';
import { apiService } from '../../services/apiService';

// --- Custom Resizable Image Extension ---
const ResizableImageComponent = (props: any) => {
  const { node, updateAttributes, selected, editor, getPos } = props;
  const imageRef = React.useRef<HTMLImageElement>(null);
  const containerRef = React.useRef<HTMLDivElement>(null);
  const [resizing, setResizing] = React.useState(false);
  const [showZoom, setShowZoom] = React.useState(false);

  // Global click listener to unselect image when clicking outside
  React.useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (selected && containerRef.current && !containerRef.current.contains(event.target as Node)) {
        // Move selection to after the image to deselect it
        editor.commands.setTextSelection(getPos() + 1);
        editor.commands.focus();
      }
    };

    if (selected) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [selected, editor, getPos]);

  const onMouseDown = (event: React.MouseEvent) => {
    event.preventDefault();
    setResizing(true);

    const onMouseMove = (moveEvent: MouseEvent) => {
      if (imageRef.current) {
        const newWidth = moveEvent.clientX - imageRef.current.getBoundingClientRect().left;
        updateAttributes({ width: Math.max(50, newWidth) });
      }
    };

    const onMouseUp = () => {
      setResizing(false);
      document.removeEventListener('mousemove', onMouseMove);
      document.removeEventListener('mouseup', onMouseUp);
    };

    document.addEventListener('mousemove', onMouseMove);
    document.addEventListener('mouseup', onMouseUp);
  };

  return (
    <NodeViewWrapper 
      as="div"
      className={`resizable-image-container ${selected ? 'selected' : ''}`}
      draggable="true"
      contentEditable={false}
      ref={containerRef}
    >
      <div className="relative inline-block group">
        {/* Advanced Floating Edit Menu */}
        {selected && (
          <div className="absolute -top-16 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 z-[1000] animate-fade-scale">
            <div className="flex items-center gap-1 p-2 bg-slate-900 shadow-2xl rounded-2xl border-2 border-white/20">
              {/* Drag Handle - HIGH VISIBILITY */}
              <div 
                className="p-2 text-white bg-white/10 rounded-lg cursor-grab active:cursor-grabbing hover:bg-white/20 transition-all"
                title="Drag to move image"
                data-drag-handle
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M4 8h16M4 12h16M4 16h16" /></svg>
              </div>

              <div className="w-px h-4 bg-white/10 mx-1" />

              <button 
                onClick={() => updateAttributes({ textAlign: 'left' })}
                className={`p-2 rounded-xl transition-all ${node.attrs.textAlign === 'left' ? 'bg-white/20 text-[var(--brand-primary)]' : 'text-white/70 hover:bg-white/10'}`}
                title="Align Left"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M4 6h16M4 12h10M4 18h16" /></svg>
              </button>
              <button 
                onClick={() => updateAttributes({ textAlign: 'center' })}
                className={`p-2 rounded-xl transition-all ${node.attrs.textAlign === 'center' ? 'bg-white/20 text-[var(--brand-primary)]' : 'text-white/70 hover:bg-white/10'}`}
                title="Align Center"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M4 6h16M7 12h10M4 18h16" /></svg>
              </button>
              <button 
                onClick={() => updateAttributes({ textAlign: 'right' })}
                className={`p-2 rounded-xl transition-all ${node.attrs.textAlign === 'right' ? 'bg-white/20 text-[var(--brand-primary)]' : 'text-white/70 hover:bg-white/10'}`}
                title="Align Right"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M4 6h16M10 12h10M4 18h16" /></svg>
              </button>

              <div className="w-px h-4 bg-white/10 mx-1" />

              <button 
                onClick={() => setShowZoom(!showZoom)}
                className={`p-2 rounded-xl transition-all ${showZoom ? 'bg-white/20 text-[var(--brand-primary)]' : 'text-white/70 hover:bg-white/10'}`}
                title="Crop / Zoom"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v3m0 0v3m0-3h3m-3 0H7" /></svg>
              </button>

              <div className="w-px h-4 bg-white/10 mx-1" />

              <button 
                onClick={() => props.deleteNode()}
                className="p-2 hover:bg-red-500/80 rounded-xl text-white transition-colors"
                title="Delete Image"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
              </button>

              <div className="w-px h-4 bg-white/10 mx-1" />

              <button 
                onClick={() => {
                  // Force selection to the position after the image to deselect it
                  const pos = props.getPos();
                  props.editor.commands.setTextSelection(pos + 1);
                  props.editor.commands.focus();
                }}
                className="p-2 hover:bg-white/20 rounded-xl text-white transition-colors"
                title="Done Editing"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>

            {/* Full 4-Side Crop Sliders Popup */}
            {showZoom && (
              <div 
                className="p-4 bg-slate-900/95 backdrop-blur-xl rounded-2xl shadow-2xl border border-white/20 w-64 animate-fade-scale space-y-4"
                onMouseDown={(e) => e.stopPropagation()} // CRITICAL: Prevent Tiptap from stealing clicks
              >
                <div>
                  <p className="text-[10px] font-black uppercase tracking-widest text-white/50 mb-2">Overall Zoom</p>
                  <input 
                    type="range" min="1" max="3" step="0.1" 
                    value={node.attrs.zoom || 1}
                    onChange={(e) => updateAttributes({ zoom: parseFloat(e.target.value) })}
                    className="w-full accent-[var(--brand-primary)]"
                  />
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-[10px] font-black uppercase tracking-widest text-white/50 mb-1">Top</p>
                    <input 
                      type="range" min="0" max="40" step="1" 
                      value={node.attrs.cropTop || 0}
                      onChange={(e) => updateAttributes({ cropTop: parseInt(e.target.value) })}
                      className="w-full accent-[var(--brand-primary)]"
                    />
                  </div>
                  <div>
                    <p className="text-[10px] font-black uppercase tracking-widest text-white/50 mb-1">Bottom</p>
                    <input 
                      type="range" min="0" max="40" step="1" 
                      value={node.attrs.cropBottom || 0}
                      onChange={(e) => updateAttributes({ cropBottom: parseInt(e.target.value) })}
                      className="w-full accent-[var(--brand-primary)]"
                    />
                  </div>
                  <div>
                    <p className="text-[10px] font-black uppercase tracking-widest text-white/50 mb-1">Left</p>
                    <input 
                      type="range" min="0" max="40" step="1" 
                      value={node.attrs.cropLeft || 0}
                      onChange={(e) => updateAttributes({ cropLeft: parseInt(e.target.value) })}
                      className="w-full accent-[var(--brand-primary)]"
                    />
                  </div>
                  <div>
                    <p className="text-[10px] font-black uppercase tracking-widest text-white/50 mb-1">Right</p>
                    <input 
                      type="range" min="0" max="40" step="1" 
                      value={node.attrs.cropRight || 0}
                      onChange={(e) => updateAttributes({ cropRight: parseInt(e.target.value) })}
                      className="w-full accent-[var(--brand-primary)]"
                    />
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        <div className="overflow-hidden rounded-xl">
          <img
            ref={imageRef}
            src={node.attrs.src}
            style={{ 
              width: node.attrs.width ? `${node.attrs.width}px` : 'auto', 
              height: 'auto',
              transform: `scale(${node.attrs.zoom || 1})`,
              clipPath: `inset(${node.attrs.cropTop || 0}% ${node.attrs.cropRight || 0}% ${node.attrs.cropBottom || 0}% ${node.attrs.cropLeft || 0}%)`,
            }}
            className="transition-all duration-300 origin-center"
            alt={node.attrs.alt}
          />
        </div>
        
        {selected && (
          <div
            onMouseDown={onMouseDown}
            className="absolute bottom-2 right-2 w-6 h-6 bg-[var(--brand-primary)] rounded-full cursor-nwse-resize shadow-lg border-2 border-white z-[110] hover:scale-125 transition-transform flex items-center justify-center"
          >
            <div className="w-2 h-2 bg-white rounded-full animate-pulse" />
          </div>
        )}
      </div>
    </NodeViewWrapper>
  );
};

const ResizableImage = Node.create({
  name: 'image',
  group: 'block',
  selectable: true,
  draggable: true,
  atom: true,
  addAttributes() {
    return {
      src: { default: null },
      alt: { default: null },
      title: { default: null },
      width: { default: 400 },
      textAlign: { default: 'center' },
      zoom: { default: 1 },
      cropLeft: { default: 0 },
      cropRight: { default: 0 },
      cropTop: { default: 0 },
      cropBottom: { default: 0 },
    };
  },
  parseHTML() {
    return [{ tag: 'img[src]' }];
  },
  renderHTML({ HTMLAttributes }) {
    const { width, zoom, cropTop, cropRight, cropBottom, cropLeft, textAlign } = HTMLAttributes;
    
    // Generate inline styles for export
    const style = [
      width ? `width: ${width}px` : 'width: auto',
      'height: auto',
      zoom ? `transform: scale(${zoom})` : '',
      (cropTop || cropRight || cropBottom || cropLeft) ? 
        `clip-path: inset(${cropTop || 0}% ${cropRight || 0}% ${cropBottom || 0}% ${cropLeft || 0}%)` : '',
      textAlign === 'center' ? 'margin-left: auto; margin-right: auto; display: block;' : 
      textAlign === 'right' ? 'margin-left: auto; display: block;' : 'display: block;'
    ].filter(Boolean).join('; ');

    return ['img', mergeAttributes(HTMLAttributes, { style })];
  },
  addCommands() {
    return {
      setImage: options => ({ commands }) => {
        return commands.insertContent([
          {
            type: this.name,
            attrs: options,
          },
          {
            type: 'paragraph',
          }
        ])
      },
    }
  },
  addNodeView() {
    return ReactNodeViewRenderer(ResizableImageComponent);
  },
  stopEvent({ event }) {
    // Allow slider and buttons to receive events without Tiptap intercepting
    const target = event.target as HTMLElement;
    return target.closest('input') !== null || target.closest('button') !== null;
  },
});
// ------------------------------------------

const suggestion = {
  items: async ({ query }: { query: string }) => {
    return await apiService.searchUsers(query);
  },
  render: () => {
    let component: any;
    let popup: any;

    return {
      onStart: (props: any) => {
        component = new ReactRenderer(MentionList, {
          props: { ...props, documentId: (props.editor as any).options.documentId },
          editor: props.editor,
        });
        if (!props.clientRect) return;
        popup = tippy('body', {
          getReferenceClientRect: props.clientRect,
          appendTo: () => document.body,
          content: component.element,
          showOnCreate: true,
          interactive: true,
          trigger: 'manual',
          placement: 'bottom-start',
        });
      },
      onUpdate(props: any) {
        component.updateProps({ ...props, documentId: (props.editor as any).options.documentId });
        if (!props.clientRect) return;
        popup[0].setProps({ getReferenceClientRect: props.clientRect });
      },
      onKeyDown(props: any) {
        if (props.event.key === 'Escape') {
          popup[0].hide();
          return true;
        }
        return component.ref?.onKeyDown(props);
      },
      onExit() {
        popup[0].destroy();
        component.destroy();
      },
    };
  },
};

const CustomDocument = Document.extend({
  content: '(block|page)+',
});

const Page = Node.create({
  name: 'page',
  group: 'block',
  content: 'block+',
  parseHTML() {
    return [{ tag: 'div.a4-page' }];
  },
  renderHTML() {
    return ['div', { class: 'a4-page' }, 0];
  },
  addCommands() {
    return {
      insertPage: () => ({ chain, state }) => {
        // Don't add a new page if the last one is already empty
        const lastNode = state.doc.lastChild;
        if (lastNode && lastNode.type.name === 'page' && lastNode.content.size <= 2) {
          return false;
        }

        return chain()
          .insertContentAt(state.doc.content.size, {
            type: 'page',
            content: [{ type: 'paragraph' }],
          })
          .run();
      },
      deletePage: () => ({ state, dispatch }) => {
        // Find which page the cursor is currently inside
        const { selection } = state;
        let pagePos: number | null = null;
        let pageNode: any = null;

        state.doc.forEach((node, offset) => {
          if (node.type.name === 'page') {
            if (offset <= selection.from && selection.from <= offset + node.nodeSize) {
              pagePos = offset;
              pageNode = node;
            }
          }
        });

        // Don't delete if it's the only page
        const pageCount = state.doc.content.childCount;
        if (pagePos === null || pageCount <= 1) return false;

        if (dispatch) {
          const tr = state.tr.delete(pagePos, pagePos + pageNode.nodeSize);
          dispatch(tr);
        }
        return true;
      },
    };
  },
});

const CollaborationCursor = Extension.create({
  name: 'collaborationCursor',
  addOptions() {
    return {
      provider: null,
      user: { name: 'Anonymous', color: '#fce83a' },
    };
  },
  addProseMirrorPlugins() {
    return [yCursorPlugin(this.options.provider.awareness)];
  },
});

interface RichTextEditorProps {
  documentId: string;
  ydoc: Y.Doc;
  provider: WebsocketProvider;
  user: {
    id: string;
    username: string;
    avatar_url?: string;
    color: string;
  };
  editable?: boolean;
}

export const RichTextEditor: React.FC<RichTextEditorProps> = ({
  documentId,
  ydoc,
  provider,
  user,
  editable = true,
}) => {
  // Set Yjs awareness for collaborative cursors
  React.useEffect(() => {
    provider.awareness.setLocalStateField('user', {
      name: user.username,
      color: user.color,
      avatar_url: user.avatar_url,
    });
  }, [provider.awareness, user.username, user.color, user.avatar_url]);

  // Guard to prevent auto-pagination from triggering itself in a loop
  const isPaginating = React.useRef(false);
  const autoPaginationTimer = React.useRef<any>(null);

  const editor = useEditor({
    documentId,
    editable,
    extensions: [
      StarterKit.configure({ document: false, history: false }),
      CustomDocument,
      Page,
      Underline,
      Link.configure({ openOnClick: false }),
      ResizableImage,
      Table,
      TableRow,
      TableHeader,
      TableCell,
      Collaboration.configure({ document: ydoc, provider }),
      CollaborationCursor.configure({
        provider,
        user: { name: user.username, color: user.color },
      }),
      TextAlign.configure({ types: ['heading', 'paragraph'] }),
      Typography,
      CharacterCount,
      Mention.configure({
        HTMLAttributes: { class: 'mention' },
        suggestion,
      }),
    ],
    onUpdate: ({ editor }) => {
      // Debounced auto-save of HTML content for Export functionality
      const html = editor.getHTML();
      const documentId = props.documentId;
      
      // Simple debounce simulation
      if ((window as any).saveTimeout) clearTimeout((window as any).saveTimeout);
      (window as any).saveTimeout = setTimeout(async () => {
        try {
          await apiService.put(`/documents/${documentId}`, { content: { html } });
        } catch (error) {
          console.error('Failed to auto-save for export:', error);
        }
      }, 2000);
    },
    editorProps: {
      handleDrop: (view, event, slice, moved) => {
        if (!moved && event.dataTransfer && event.dataTransfer.files && event.dataTransfer.files[0]) {
          const file = event.dataTransfer.files[0];
          const type = file.type;

          if (type.startsWith('image/')) {
            const reader = new FileReader();
            reader.onload = (e) => {
              const base64 = e.target?.result as string;
              const { schema } = view.state;
              const coordinates = view.posAtCoords({ left: event.clientX, top: event.clientY });
              
              if (coordinates) {
                const node = schema.nodes.image.create({ src: base64 });
                const transaction = view.state.tr.insert(coordinates.pos, node);
                view.dispatch(transaction);
              }
            };
            reader.readAsDataURL(file);
            return true; // handled
          }
        }
        return false;
      },
      attributes: {
        class: 'prose prose-sm sm:prose lg:prose-lg xl:prose-2xl mx-auto focus:outline-none min-h-[1056px] p-[2cm]',
      },
    },
    onUpdate: ({ editor }) => {
      // Bail out if we triggered this update ourselves (anti double-page guard)
      if (isPaginating.current) return;

      if (autoPaginationTimer.current) clearTimeout(autoPaginationTimer.current);

      autoPaginationTimer.current = setTimeout(() => {
        if (editor.isDestroyed || !editor.view) return;

        const pages = editor.view.dom.querySelectorAll('.a4-page');
        if (pages.length === 0) return;

        const lastPage = pages[pages.length - 1];
        
        // Only trigger auto-pagination if the LAST page is overflowing
        if (lastPage && lastPage.scrollHeight > lastPage.clientHeight + 40) {
          // Robust content check: text OR images
          const hasText = lastPage.textContent.trim().length > 0;
          const hasImages = lastPage.querySelector('img') !== null;
          
          if ((hasText || hasImages) && !isPaginating.current) {
            isPaginating.current = true;
            editor.commands.insertPage();
            
            // Allow time for DOM and Yjs to sync before allowing another page
            setTimeout(() => {
              isPaginating.current = false;
              const allPages = document.querySelectorAll('.a4-page');
              const last = allPages[allPages.length - 1];
              if (last) {
                last.scrollIntoView({ behavior: 'smooth', block: 'end' });
              }
            }, 2000);
          }
        }
      }, 1500);
    },
  });

  return (
    <div className="rte-wrapper">
      <Toolbar editor={editor} />
      <div className="rte-scroll-area custom-scrollbar">
        <div className="rte-content-area">
          <EditorContent editor={editor} />
        </div>
      </div>
    </div>
  );
};
