import type { Category } from './content';
import type { PetId } from './pets';

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
  pet: PetId | null;
  petName: string;
  fed: boolean;
  placed: Placed;
  claim: Claim | null;
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

export type Item = {
  id: string;
  day: number;
  rank: number;
  category: Category;
  entry: string;
  maker: string;
};

export type Placed = {
  food: Item | null;
  clothes: Item | null;
  sceneryBack: Item | null;
  sceneryFront: Item | null;
};

export type Claim = {
  days: { day: number; rank: number | null; count: number }[];
  items: Item[];
};

export type PetView = {
  pet: PetId | null;
  name: string;
  unlocked: PetId[];
  slots: number;
  placed: Placed;
  items: Item[];
};

export type PetAction =
  | { type: 'pick'; pet: PetId }
  | { type: 'name'; name: string }
  | { type: 'toggle'; itemId: string };

export type PetResult =
  { ok: true; pet: PetView } | { ok: false; reason: string };
