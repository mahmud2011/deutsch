import { useCallback, useState } from 'react'
import type { VocabItem } from './content'
import {
  cardKey,
  itemKey,
  loadStore,
  newCard,
  saveStore,
  schedule,
  type Grade,
  type Mode,
  type Store,
} from './srs'
import Dashboard from './components/Dashboard'
import VocabPractice from './components/VocabPractice'
import ConversationReader from './components/ConversationReader'

export type View = 'dashboard' | 'vocab' | 'convo'

export default function App() {
  const [view, setView] = useState<View>('dashboard')
  const [store, setStore] = useState<Store>(loadStore)

  const grade = useCallback((item: VocabItem, mode: Mode, g: Grade) => {
    setStore((prev) => {
      const key = cardKey(mode, itemKey(item))
      const next = { ...prev, [key]: schedule(prev[key] ?? newCard(), g) }
      saveStore(next)
      return next
    })
  }, [])

  return (
    <div className="min-h-screen">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-5xl items-center gap-3 px-4 py-3">
          <button
            onClick={() => setView('dashboard')}
            className="text-lg font-bold tracking-tight hover:text-blue-600"
          >
            Deutsch
          </button>
          <span className="text-sm text-slate-400">German practice</span>
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-4 py-6">
        {view === 'dashboard' && <Dashboard store={store} onPick={setView} />}
        {view === 'vocab' && <VocabPractice store={store} onGrade={grade} />}
        {view === 'convo' && <ConversationReader />}
      </main>
    </div>
  )
}
