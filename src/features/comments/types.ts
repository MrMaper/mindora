export interface CommentRow {
  id: string;
  body: string;
  createdAt: Date;
  updatedAt: Date;
  edited: boolean;
  user: {
    id: string;
    name: string;
    avatar: string | null;
  };
}

export const EDIT_WINDOW_MS = 5 * 60 * 1000;
