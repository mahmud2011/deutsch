// SM-2 spaced repetition, tracked independently per (item, mode).
import type { VocabItem } from './content'

export type Mode = 'e2g' | 'g2e' | 'write'
export type Grade = 'easy' | 'medium' | 'hard'

export const MODES: { mode: Mode; label: string; desc: string }[] = [
  { mode: 'e2g', label: 'English → German', desc: 'Recall the German from English.' },
  { mode: 'g2e', label: 'German → English', desc: 'Recall the English meaning.' },
  { mode: 'write', label: 'Writing', desc: 'Type the full German field.' },
]

export interface Card {
  reps: number // consecutive successful reviews
  ease: number // SM-2 ease factor (EF)
  interval: number // days until next review
  due: number // epoch ms
}

export type Store = Record<string, Card> // key = `${mode}:${itemKey}`

export interface Counts {
  learned: number
  due: number
  mastered: number
}

const DAY = 86_400_000
const MIN_EASE = 1.3
const MASTERED_DAYS = 21 // Anki "mature"
const QUALITY: Record<Grade, number> = { easy: 5, medium: 4, hard: 2 }

export function newCard(): Card {
  return { reps: 0, ease: 2.5, interval: 0, due: 0 }
}

// SM-2: update ease, then interval. Hard (q<3) lapses to interval 1, reps 0.
export function schedule(card: Card, grade: Grade, now: number = Date.now()): Card {
  const q = QUALITY[grade]
  const ease = Math.max(MIN_EASE, card.ease + (0.1 - (5 - q) * (0.08 + (5 - q) * 0.02)))
  let reps: number
  let interval: number
  if (q < 3) {
    reps = 0
    interval = 1
  } else {
    reps = card.reps + 1
    interval = reps === 1 ? 1 : reps === 2 ? 6 : Math.round(card.interval * ease)
  }
  return { reps, ease, interval, due: now + interval * DAY }
}

export function itemKey(item: Pick<VocabItem, 'unit' | 'german'>): string {
  return `${item.unit}:${item.german}`
}

export function cardKey(mode: Mode, key: string): string {
  return `${mode}:${key}`
}

// Writing check: whole German field must match exactly, except whitespace
// around the `;` form-separator (and leading/trailing) is normalized.
// Umlauts, ß, case, and articles stay significant.
export function normalizeAnswer(s: string): string {
  return s
    .trim()
    .split(';')
    .map((p) => p.trim())
    .filter(Boolean)
    .join(';')
}

export function checkWriting(input: string, expected: string): boolean {
  return normalizeAnswer(input) === normalizeAnswer(expected)
}

// Queue = overdue reviews (most overdue first) + unseen items, no cap.
export function buildQueue(
  store: Store,
  items: VocabItem[],
  mode: Mode,
  now: number = Date.now(),
): VocabItem[] {
  const due: { it: VocabItem; due: number }[] = []
  const unseen: VocabItem[] = []
  for (const it of items) {
    const c = store[cardKey(mode, itemKey(it))]
    if (!c) unseen.push(it)
    else if (c.due <= now) due.push({ it, due: c.due })
  }
  due.sort((a, b) => a.due - b.due)
  return [...due.map((d) => d.it), ...unseen]
}

export function counts(
  store: Store,
  items: VocabItem[],
  mode: Mode,
  now: number = Date.now(),
): Counts {
  let learned = 0
  let due = 0
  let mastered = 0
  for (const it of items) {
    const c = store[cardKey(mode, itemKey(it))]
    if (!c) {
      due++ // unseen is part of the queue
      continue
    }
    learned++
    if (c.due <= now) due++
    if (c.interval >= MASTERED_DAYS) mastered++
  }
  return { learned, due, mastered }
}

const STORAGE_KEY = 'deutsch-srs-v1'

export function loadStore(): Store {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) ?? '{}') as Store
  } catch {
    return {}
  }
}

export function saveStore(store: Store): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(store))
}
