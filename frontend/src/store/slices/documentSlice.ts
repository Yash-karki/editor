import { createSlice, PayloadAction } from '@reduxjs/toolkit';

interface Document {
  id: string;
  title: string;
  description?: string;
  owner_id: string;
  visibility: 'private' | 'shared' | 'public';
  created_at: string;
  updated_at: string;
  last_edited_at?: string;
  permission_level?: string;
}

interface ActiveUser {
  id: string;
  username: string;
  avatar_url?: string;
  color: string;
  cursor_position: number;
}

interface DocumentState {
  currentDocument: Document | null;
  activeUsers: ActiveUser[];
  isLoading: boolean;
  error: string | null;
  isSaved: boolean;
}

const initialState: DocumentState = {
  currentDocument: null,
  activeUsers: [],
  isLoading: false,
  error: null,
  isSaved: true,
};

const documentSlice = createSlice({
  name: 'document',
  initialState,
  reducers: {
    setDocument: (state, action: PayloadAction<Document>) => {
      state.currentDocument = action.payload;
      state.isSaved = true;
    },
    setActiveUsers: (state, action: PayloadAction<ActiveUser[]>) => {
      state.activeUsers = action.payload;
    },
    addActiveUser: (state, action: PayloadAction<ActiveUser>) => {
      const exists = state.activeUsers.find(u => u.id === action.payload.id);
      if (!exists) {
        state.activeUsers.push(action.payload);
      }
    },
    removeActiveUser: (state, action: PayloadAction<string>) => {
      state.activeUsers = state.activeUsers.filter(u => u.id !== action.payload);
    },
    setDocumentLoading: (state, action: PayloadAction<boolean>) => {
      state.isLoading = action.payload;
    },
    setDocumentError: (state, action: PayloadAction<string | null>) => {
      state.error = action.payload;
    },
    setSaved: (state, action: PayloadAction<boolean>) => {
      state.isSaved = action.payload;
    },
  },
});

export const {
  setDocument,
  setActiveUsers,
  addActiveUser,
  removeActiveUser,
  setDocumentLoading,
  setDocumentError,
  setSaved,
} = documentSlice.actions;
export default documentSlice.reducer;
