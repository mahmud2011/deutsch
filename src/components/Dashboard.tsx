import { units } from '../content'
import { counts, MODES, type Store } from '../srs'
import type { View } from '../App'

export default function Dashboard({
  store,
  onPick,
}: {
  store: Store
  onPick: (v: View) => void
}) {
  const allItems = units.flatMap((u) => u.items)

  return (
    <div className="space-y-8">
      <section className="grid gap-4 sm:grid-cols-2">
        <button
          onClick={() => onPick('vocab')}
          className="rounded-xl border border-slate-200 bg-white p-6 text-left shadow-sm transition hover:border-blue-400 hover:shadow"
        >
          <h2 className="text-xl font-semibold">Vocabulary Practice</h2>
          <p className="mt-1 text-sm text-slate-500">
            Flashcards and writing drills with spaced repetition.
          </p>
        </button>
        <button
          onClick={() => onPick('convo')}
          className="rounded-xl border border-slate-200 bg-white p-6 text-left shadow-sm transition hover:border-blue-400 hover:shadow"
        >
          <h2 className="text-xl font-semibold">Conversation Reading</h2>
          <p className="mt-1 text-sm text-slate-500">
            Read German dialogues organized by lesson and topic.
          </p>
        </button>
      </section>

      <section>
        <h3 className="mb-3 text-sm font-semibold uppercase tracking-wide text-slate-500">
          Progress by mode
        </h3>
        <div className="grid gap-4 sm:grid-cols-3">
          {MODES.map(({ mode, label }) => {
            const c = counts(store, allItems, mode)
            return (
              <div
                key={mode}
                className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm"
              >
                <div className="text-sm font-medium">{label}</div>
                <dl className="mt-3 flex justify-between text-center text-sm">
                  <Stat label="Due" value={c.due} accent="text-blue-600" />
                  <Stat label="Learned" value={c.learned} />
                  <Stat label="Mastered" value={c.mastered} accent="text-green-600" />
                </dl>
              </div>
            )
          })}
        </div>
      </section>
    </div>
  )
}

function Stat({ label, value, accent }: { label: string; value: number; accent?: string }) {
  return (
    <div className="flex-1">
      <div className={`text-2xl font-bold ${accent ?? 'text-slate-800'}`}>{value}</div>
      <div className="text-xs text-slate-500">{label}</div>
    </div>
  )
}
