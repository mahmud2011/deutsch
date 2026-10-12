import { useState } from 'react'
import type { VocabItem } from '../content'
import type { Grade, Mode } from '../srs'

export function RateButtons({ onRate }: { onRate: (g: Grade) => void }) {
  const buttons: { g: Grade; label: string; cls: string }[] = [
    { g: 'hard', label: 'Hard', cls: 'bg-red-100 text-red-700 hover:bg-red-200' },
    { g: 'medium', label: 'Medium', cls: 'bg-amber-100 text-amber-700 hover:bg-amber-200' },
    { g: 'easy', label: 'Easy', cls: 'bg-green-100 text-green-700 hover:bg-green-200' },
  ]
  return (
    <div className="grid grid-cols-3 gap-2">
      {buttons.map(({ g, label, cls }) => (
        <button
          key={g}
          onClick={() => onRate(g)}
          className={`rounded-lg px-4 py-3 text-sm font-semibold transition ${cls}`}
        >
          {label}
        </button>
      ))}
    </div>
  )
}

export default function Flashcard({
  item,
  mode,
  onRate,
}: {
  item: VocabItem
  mode: Mode // 'e2g' | 'g2e'
  onRate: (g: Grade) => void
}) {
  const [flipped, setFlipped] = useState(false)
  const prompt = mode === 'e2g' ? item.english : item.forms.join('\n')

  return (
    <div className="space-y-4">
      <div
        onClick={() => setFlipped(true)}
        className="flex min-h-48 cursor-pointer flex-col items-center justify-center rounded-xl border border-slate-200 bg-white p-8 text-center shadow-sm"
      >
        <div className="whitespace-pre-line text-2xl font-semibold">{prompt}</div>
        {!flipped && <p className="mt-4 text-sm text-slate-400">Tap to reveal</p>}
        {flipped && (
          <div className="mt-6 w-full border-t border-slate-100 pt-6">
            <div className="whitespace-pre-line text-xl text-blue-700">
              {mode === 'e2g' ? item.forms.join('\n') : item.english}
            </div>
            {item.example && (
              <p className="mt-4 text-sm text-slate-500">{item.example}</p>
            )}
          </div>
        )}
      </div>
      {flipped && <RateButtons onRate={onRate} />}
    </div>
  )
}
