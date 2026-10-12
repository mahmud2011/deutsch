import { describe, it, expect } from 'vitest'
import {
  newCard,
  schedule,
  checkWriting,
  normalizeAnswer,
  buildQueue,
  type Store,
} from './srs'
import type { VocabItem } from './content'

const DAY = 86_400_000
const NOW = 1_000_000_000_000

describe('SM-2 interval progression', () => {
  it('ramps 1 → 6 → interval*ease on repeated Easy', () => {
    // Worked by hand from the SM-2 spec, ease starting at 2.5:
    //   Easy #1: ease 2.5→2.6, reps 1, interval 1
    //   Easy #2: ease 2.6→2.7, reps 2, interval 6
    //   Easy #3: ease 2.7→2.8, reps 3, interval round(6 * 2.8) = 17
    const c1 = schedule(newCard(), 'easy', NOW)
    expect(c1.interval).toBe(1)
    expect(c1.reps).toBe(1)
    expect(c1.ease).toBeCloseTo(2.6, 10)
    expect(c1.due).toBe(NOW + 1 * DAY)

    const c2 = schedule(c1, 'easy', NOW)
    expect(c2.interval).toBe(6)
    expect(c2.reps).toBe(2)

    const c3 = schedule(c2, 'easy', NOW)
    expect(c3.interval).toBe(17)
    expect(c3.reps).toBe(3)
    expect(c3.ease).toBeCloseTo(2.8, 10)
  })

  it('Medium (q=4) leaves ease unchanged', () => {
    const c = schedule(newCard(), 'medium', NOW)
    expect(c.ease).toBeCloseTo(2.5, 10)
    expect(c.interval).toBe(1)
  })

  it('Hard lapses: reps/interval reset, ease drops', () => {
    const mature = schedule(schedule(schedule(newCard(), 'easy', NOW), 'easy', NOW), 'easy', NOW)
    const lapsed = schedule(mature, 'hard', NOW)
    expect(lapsed.reps).toBe(0)
    expect(lapsed.interval).toBe(1)
    expect(lapsed.ease).toBeLessThan(mature.ease)
  })

  it('ease never falls below the 1.3 floor', () => {
    let c = newCard()
    for (let i = 0; i < 10; i++) c = schedule(c, 'hard', NOW)
    expect(c.ease).toBeGreaterThanOrEqual(1.3)
    expect(c.ease).toBeCloseTo(1.3, 10)
  })
})

describe('writing normalizer', () => {
  it('normalizes whitespace around the ; separator', () => {
    expect(normalizeAnswer('der Mann ;  die Männer ')).toBe('der Mann;die Männer')
    expect(checkWriting('der Mann;die Männer', 'der Mann; die Männer')).toBe(true)
  })

  it('rejects wrong case', () => {
    expect(checkWriting('der mann; die Männer', 'der Mann; die Männer')).toBe(false)
  })

  it('rejects a wrong umlaut', () => {
    expect(checkWriting('der Mann; die Manner', 'der Mann; die Männer')).toBe(false)
  })
})

describe('queue builder', () => {
  const mk = (german: string): VocabItem => ({
    unit: 'A1.1',
    level: 'A1',
    english: german,
    german,
    forms: [german],
    example: '',
  })

  it('orders most-overdue first, then appends unseen', () => {
    const a = mk('a')
    const b = mk('b')
    const unseen = mk('c')
    const store: Store = {
      'e2g:A1.1:a': { reps: 1, ease: 2.5, interval: 1, due: NOW - 1 * DAY },
      'e2g:A1.1:b': { reps: 1, ease: 2.5, interval: 1, due: NOW - 5 * DAY },
    }
    const queue = buildQueue(store, [a, b, unseen], 'e2g', NOW)
    expect(queue.map((i) => i.german)).toEqual(['b', 'a', 'c'])
  })

  it('excludes not-yet-due reviews', () => {
    const a = mk('a')
    const store: Store = {
      'e2g:A1.1:a': { reps: 2, ease: 2.5, interval: 6, due: NOW + 3 * DAY },
    }
    expect(buildQueue(store, [a], 'e2g', NOW)).toEqual([])
  })
})
