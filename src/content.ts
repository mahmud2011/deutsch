// Build-time content loading. Vite inlines the vocabulary/ and conversation/
// files as raw strings, so adding content needs only a rebuild — no manifest,
// no runtime fetch, content stays fully separate from source.
import Papa from 'papaparse'

export interface VocabItem {
  unit: string // "A1.1"
  level: string // "A1"
  english: string
  german: string // raw German cell; forms are `;`-separated
  forms: string[] // german split on `;`, trimmed
  example: string
}

export interface Unit {
  unit: string
  level: string
  items: VocabItem[]
}

export interface ConvoSection {
  title: string // from a `##` heading
  body: string // markdown of that section
}

export interface Conversation {
  unit: string
  level: string
  sections: ConvoSection[]
}

// a_1_1 → { level: "A1", unit: "A1.1" }
function parseUnit(path: string): { unit: string; level: string } {
  const name = path.split('/').pop()!.replace(/\.(csv|md)$/, '')
  const m = name.match(/^([a-z])_(\d+)_(\d+)$/)
  if (!m) return { unit: name, level: name }
  const level = `${m[1].toUpperCase()}${m[2]}`
  return { unit: `${level}.${m[3]}`, level }
}

const vocabRaw = import.meta.glob('/vocabulary/*.csv', {
  query: '?raw',
  import: 'default',
  eager: true,
}) as Record<string, string>

const convoRaw = import.meta.glob('/conversation/*.md', {
  query: '?raw',
  import: 'default',
  eager: true,
}) as Record<string, string>

export const units: Unit[] = Object.entries(vocabRaw)
  .map(([path, raw]) => {
    const { unit, level } = parseUnit(path)
    const parsed = Papa.parse<Record<string, string>>(raw, {
      header: true,
      skipEmptyLines: true,
    })
    const items: VocabItem[] = parsed.data
      .map((row) => {
        const german = (row.German ?? '').trim()
        return {
          unit,
          level,
          english: (row.English ?? '').trim(),
          german,
          forms: german.split(';').map((s) => s.trim()).filter(Boolean),
          example: (row.Example ?? '').trim(),
        }
      })
      .filter((it) => it.german && it.english)
    return { unit, level, items }
  })
  .sort((a, b) => a.unit.localeCompare(b.unit))

export const conversations: Conversation[] = Object.entries(convoRaw)
  .map(([path, raw]) => {
    const { unit, level } = parseUnit(path)
    const sections: ConvoSection[] = raw
      .split(/^## /m)
      .slice(1) // drop the preamble before the first `##` (the `#` lesson heading)
      .map((part) => {
        const nl = part.indexOf('\n')
        const title = (nl === -1 ? part : part.slice(0, nl)).trim()
        const body = nl === -1 ? '' : part.slice(nl + 1).trim()
        return { title, body }
      })
    return { unit, level, sections }
  })
  .sort((a, b) => a.unit.localeCompare(b.unit))

export function groupByLevel<T extends { level: string }>(xs: T[]): [string, T[]][] {
  const g: Record<string, T[]> = {}
  for (const x of xs) (g[x.level] ??= []).push(x)
  return Object.entries(g).sort(([a], [b]) => a.localeCompare(b))
}
