import { useState } from 'react'
import type { VocabItem } from '../content'
import { checkWriting, type Grade } from '../srs'
import { RateButtons } from './Flashcard'

export default function WritingPractice({
  item,
  onRate,
}: {
  item: VocabItem
  onRate: (g: Grade) => void
}) {
  const [input, setInput] = useState('')
  const [result, setResult] = useState<boolean | null>(null)

  const hint =
    item.forms.length > 1
      ? `${item.forms.length} forms, separated by " ; "`
      : 'single form'

  const submit = (e: React.FormEvent) => {
    e.preventDefault()
    if (result === null) setResult(checkWriting(input, item.german))
  }

  return (
    <div className="space-y-4">
      <div className="rounded-xl border border-slate-200 bg-white p-8 shadow-sm">
        <div className="text-sm text-slate-400">Type the German ({hint})</div>
        <div className="mt-2 text-2xl font-semibold">{item.english}</div>

        <form onSubmit={submit} className="mt-6">
          <input
            autoFocus
            value={input}
            onChange={(e) => setInput(e.target.value)}
            disabled={result !== null}
            lang="de"
            className="w-full rounded-lg border border-slate-300 px-4 py-3 text-lg focus:border-blue-500 focus:outline-none disabled:bg-slate-50"
            placeholder="der Mann; die Männer"
          />
          {result === null && (
            <button
              type="submit"
              className="mt-3 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
            >
              Check
            </button>
          )}
        </form>

        {result !== null && (
          <div className="mt-6 border-t border-slate-100 pt-6">
            <div
              className={`font-semibold ${result ? 'text-green-600' : 'text-red-600'}`}
            >
              {result ? 'Correct!' : 'Not quite.'}
            </div>
            <div className="mt-2 whitespace-pre-line text-lg text-blue-700">
              {item.forms.join('\n')}
            </div>
            {item.example && <p className="mt-3 text-sm text-slate-500">{item.example}</p>}
          </div>
        )}
      </div>

      {result !== null && <RateButtons onRate={onRate} />}
    </div>
  )
}
