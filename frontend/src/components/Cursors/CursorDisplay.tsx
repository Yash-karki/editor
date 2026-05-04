import React from 'react';

interface ActiveUser {
  id: string;
  username: string;
  color: string;
  cursor_position: number;
}

interface CursorDisplayProps {
  cursors: ActiveUser[];
}

export const CursorDisplay: React.FC<CursorDisplayProps> = ({ cursors }) => {
  // Cursor overlay is handled by TipTap CollaborationCursor.
  // This component is intentionally kept empty or could be used for 
  // global cursor presence UI if not using TipTap.
  return null;
};
