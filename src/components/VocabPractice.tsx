import { useMemo, useState } from 'react'
import { groupByLevel, units, type Unit, type VocabItem } from '../content'
import { buildQueue, MODES, type Grade, type Mode, type Store } from '../srs'
import Flashcard from './Flashcard'
import WritingPractice from './WritingPractice'

export default function VocabPractice({
  store,
  onGrade,
}: {
  store: Store
  onGrade: (item: VocabItem, mode: Mode, g: Grade) => void
}) {
  const [unit, setUnit] = useState<Unit | null>(null)
  const [mode, setMode] = useState<Mode | null>(null)

  if (!unit) return <UnitPicker onPick={setUnit} />
  if (!mode)
    return (
      <ModePicker
        unit={unit}
        onBack={() => setUnit(null)}
        onPick={setMode}
      />
    )
  return (
    <Session
      unit={unit}
      mode={mode}
      store={store}
      onGrade={onGrade}
      onDone={() => setMode(null)}
    />
  )
}

function UnitPicker({ onPick }: { onPick: (u: Unit) => void }) {
  if (units.length === 0)
    return <p className="text-slate-500">No vocabulary files found in vocabulary/.</p>
  return (
    <div className="space-y-6">
      <h2 className="text-xl font-semibold">Choose a unit</h2>
      {groupByLevel(units).map(([level, us]) => (
        <div key={level}>
          <h3 className="mb-2 text-sm font-semibold uppercase tracking-wide text-slate-500">
            {level}
          </h3>
          <div className="flex flex-wrap gap-2">
            {us.map((u) => (
              <button
                key={u.unit}
                onClick={() => onPick(u)}
                className="rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-medium shadow-sm hover:border-blue-400"
              >
                {u.unit}
                <span className="ml-2 text-slate-400">{u.items.length}</span>
              </button>
            ))}
          </div>
        </div>
      ))}
    </div>
  )
}

function ModePicker({
  unit,
  onPick,
  onBack,
}: {
  unit: Unit
  onPick: (m: Mode) => void
  onBack: () => void
}) {
  return (
    <div className="space-y-4">
      <button onClick={onBack} className="text-sm text-blue-600 hover:underline">
        ← Units
      </button>
      <h2 className="text-xl font-semibold">{unit.unit} — choose a mode</h2>
      <div className="grid gap-3 sm:grid-cols-3">
        {MODES.map(({ mode, label, desc }) => (
          <button
            key={mode}
            onClick={() => onPick(mode)}
            className="rounded-xl border border-slate-200 bg-white p-4 text-left shadow-sm hover:border-blue-400"
          >
            <div className="font-medium">{label}</div>
            <div className="mt-1 text-sm text-slate-500">{desc}</div>
          </button>
        ))}
      </div>
    </div>
  )
}

function Session({
  unit,
  mode,
  store,
  onGrade,
  onDone,
}: {
  unit: Unit
  mode: Mode
  store: Store
  onGrade: (item: VocabItem, mode: Mode, g: Grade) => void
  onDone: () => void
}) {
  // Freeze the queue when the session starts; grading reschedules in the store
  // but shouldn't reshuffle the cards we're working through right now.
  const queue = useMemo(
    () => buildQueue(store, unit.items, mode),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [unit, mode],
  )
  const [i, setI] = useState(0)

  if (queue.length === 0)
    return (
      <Done onBack={onDone} message="Nothing due in this unit — come back later." />
    )
  if (i >= queue.length)
    return <Done onBack={onDone} message={`Finished ${queue.length} cards. Gut gemacht!`} />

  const item = queue[i]
  const rate = (g: Grade) => {
    onGrade(item, mode, g)
    setI((n) => n + 1)
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between text-sm text-slate-500">
        <button onClick={onDone} className="text-blue-600 hover:underline">
          ← Modes
        </button>
        <span>
          {i + 1} / {queue.length}
        </span>
      </div>
      {mode === 'write' ? (
        <WritingPractice key={i} item={item} onRate={rate} />
      ) : (
        <Flashcard key={i} item={item} mode={mode} onRate={rate} />
      )}
    </div>
  )
}

function Done({ message, onBack }: { message: string; onBack: () => void }) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-8 text-center shadow-sm">
      <p className="text-lg">{message}</p>
      <button
        onClick={onBack}
        className="mt-4 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
      >
        Back
      </button>
    </div>
  )
}
