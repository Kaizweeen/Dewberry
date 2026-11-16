import type { Category } from './content';

export type DayView = {
  day: number;
  postId: string;
  open: boolean;
  todayPostId: string | null;
  prompt: string;
  category: Category;
  budget: number;
  entryCount: number;
  myEntry: string | null;
  myHearts: number;
  streak: number;
  heartsLeft: number;
};

export type SubmitResult =
  | { ok: true; entry: string; streak: number }
  | { ok: false; error: 'closed' | 'invalid'; reason: string };

export type GalleryPage = {
  entries: { id: string; entry: string }[];
  heartsLeft: number;
};

export type HeartResult =
  | { ok: true; heartsLeft: number }
  | {
      ok: false;
      error:
        | 'closed'
        | 'not-submitted'
        | 'own'
        | 'missing'
        | 'already'
        | 'none-left';
    };

export type Results = {
  count: number;
  myRank: number | null;
  top: { rank: number; username: string; entry: string; hearts: number }[];
};
