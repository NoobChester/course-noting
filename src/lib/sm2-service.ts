import { SM2Data, SM2Rating } from "./types";

const DEFAULT_EASE_FACTOR = 2.5;
const MIN_EASE_FACTOR = 1.3;

export function getTodayDateString(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function isDueToday(dueDate?: string): boolean {
  if (!dueDate) return false;
  const today = getTodayDateString();
  return dueDate <= today;
}

export function calculateNextSM2(current: SM2Data | undefined, rating: SM2Rating): SM2Data {
  const easeFactor = current?.easeFactor ?? DEFAULT_EASE_FACTOR;
  const repetition = current?.repetition ?? 0;
  const previousInterval = current?.interval ?? 0;

  let newRepetition = repetition;
  let newInterval = 1;
  let newEaseFactor = easeFactor;

  switch (rating) {
    case "again":
      newRepetition = 0;
      newInterval = 1;
      newEaseFactor = Math.max(MIN_EASE_FACTOR, easeFactor - 0.2);
      break;

    case "hard":
      newInterval = Math.max(1, Math.round(previousInterval > 1 ? previousInterval * 1.2 : 2));
      newEaseFactor = Math.max(MIN_EASE_FACTOR, easeFactor - 0.15);
      newRepetition = Math.max(1, repetition);
      break;

    case "good":
      if (repetition === 0) {
        newInterval = 1;
      } else if (repetition === 1) {
        newInterval = 6;
      } else {
        newInterval = Math.max(1, Math.round(previousInterval * easeFactor));
      }
      newRepetition = repetition + 1;
      break;

    case "easy":
      if (repetition === 0) {
        newInterval = 4;
      } else if (repetition === 1) {
        newInterval = 8;
      } else {
        newInterval = Math.max(1, Math.round(previousInterval * easeFactor * 1.3));
      }
      newEaseFactor = easeFactor + 0.15;
      newRepetition = repetition + 1;
      break;
  }

  // Calculate next due date
  const now = new Date();
  now.setDate(now.getDate() + newInterval);
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  const dueDate = `${year}-${month}-${day}`;

  return {
    repetition: newRepetition,
    interval: newInterval,
    easeFactor: Math.round(newEaseFactor * 100) / 100,
    dueDate,
    lastReviewedAt: new Date().toISOString()
  };
}

export function getIntervalPreview(current: SM2Data | undefined, rating: SM2Rating): string {
  const next = calculateNextSM2(current, rating);
  if (next.interval === 1) return "1d";
  if (next.interval < 30) return `${next.interval}d`;
  const months = Math.round((next.interval / 30) * 10) / 10;
  return `${months}m`;
}
