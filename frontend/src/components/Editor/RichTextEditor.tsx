// @ts-nocheck
import React from 'react';
import Document from '@tiptap/extension-document';
import { useEditor, EditorContent } from '@tiptap/react';
import { StarterKit } from '@tiptap/starter-kit';
import { Underline } from '@tiptap/extension-underline';
import { Link } from '@tiptap/extension-link';
import { Image } from '@tiptap/extension-image';
import { Table } from '@tiptap/extension-table';
import { TableRow } from '@tiptap/extension-table-row';
import { TableHeader } from '@tiptap/extension-table-header';
import { TableCell } from '@tiptap/extension-table-cell';
import { Collaboration } from '@tiptap/extension-collaboration';
import { Extension, Node } from '@tiptap/core';
import { Mention } from '@tiptap/extension-mention';
import { ReactRenderer } from '@tiptap/react';
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
      Image.configure({ allowBase64: true }),
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
        // This avoids recursive page creation if an earlier page is temporarily "overflowing" during layout
        if (lastPage && lastPage.scrollHeight > lastPage.clientHeight + 20) {
          // Additional check: make sure last page isn't empty (avoids infinite empty pages)
          if (lastPage.textContent.trim().length > 0) {
            isPaginating.current = true;
            editor.commands.insertPage();
            setTimeout(() => {
              isPaginating.current = false;
              const allPages = document.querySelectorAll('.a4-page');
              const last = allPages[allPages.length - 1];
              if (last) {
                last.scrollIntoView({ behavior: 'smooth', block: 'start' });
              }
            }, 500);
          }
        }
      }, 1000);
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
