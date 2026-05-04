import io, { Socket } from 'socket.io-client';
import { store } from '../store/appStore';
import { addActiveUser, removeActiveUser } from '../store/slices/documentSlice';

class SocketService {
  private socket: Socket | null = null;
  private documentId: string | null = null;
  private userId: string | null = null;
  private username: string | null = null;
  private avatarUrl: string | null = null;

  connect(
    userId: string,
    username: string,
    documentId: string,
    onRemoteUpdate: (data: any) => void,
    onCursorChanged: (data: any) => void,
    onNewComment: (data: any) => void,
    avatarUrl?: string
  ) {
    this.userId = userId;
    this.username = username;
    this.documentId = documentId;
    this.avatarUrl = avatarUrl || null;

    const wsUrl = (process.env.REACT_APP_WS_URL || 'ws://localhost:3001').replace('ws://', 'http://').replace('wss://', 'https://');
    this.socket = io(wsUrl, {
      auth: { userId: this.userId },
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      reconnectionAttempts: 5,
      transports: ['websocket', 'polling'],
    });

    this.socket.on('connect', () => {
      console.log('Connected to server');
      this.joinDocument();
    });

    this.socket.on('disconnect', () => {
      console.log('Disconnected from server');
    });

    this.socket.on('user-joined', (data) => {
      console.log('User joined:', data);
      store.dispatch(addActiveUser({
        id: data.userId,
        username: data.username,
        avatar_url: data.avatar_url,
        color: data.color || '#45B7D1',
        cursor_position: 0,
      }));
    });

    this.socket.on('user-left', (data) => {
      console.log('User left');
      store.dispatch(removeActiveUser(data.userId));
    });

    this.socket.on('remote-update', onRemoteUpdate);
    this.socket.on('sync-update', onRemoteUpdate);
    this.socket.on('cursor-changed', onCursorChanged);
    this.socket.on('new-comment', onNewComment);

    this.socket.on('active-cursors', (cursors) => {
      console.log('Active cursors:', cursors);
    });
  }

  private joinDocument() {
    if (this.socket && this.documentId && this.userId && this.username) {
      this.socket.emit('join-document', {
        documentId: this.documentId,
        userId: this.userId,
        username: this.username,
        avatar_url: this.avatarUrl,
      });
    }
  }

  sendSyncUpdate(update: number[]) {
    if (this.socket && this.documentId && this.userId) {
      this.socket.emit('sync-update', {
        documentId: this.documentId,
        update,
        userId: this.userId,
      });
    }
  }

  sendCursorPosition(position: number, selection?: { start: number; end: number }) {
    if (this.socket && this.documentId && this.userId) {
      this.socket.emit('cursor-position', {
        documentId: this.documentId,
        userId: this.userId,
        position,
        selection,
      });
    }
  }

  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
  }

  getSocket(): Socket | null {
    return this.socket;
  }
}

export const socketService = new SocketService();
