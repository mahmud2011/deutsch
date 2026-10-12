import { useState } from 'react'
import ReactMarkdown from 'react-markdown'
import { conversations, groupByLevel } from '../content'

export default function ConversationReader() {
  const [sel, setSel] = useState<{ unit: string; section: number }>(() =>
    conversations[0] ? { unit: conversations[0].unit, section: 0 } : { unit: '', section: 0 },
  )

  if (conversations.length === 0)
    return <p className="text-slate-500">No conversation files found in conversation/.</p>

  const convo = conversations.find((c) => c.unit === sel.unit) ?? conversations[0]
  const section = convo.sections[sel.section]

  return (
    <div className="grid gap-6 md:grid-cols-[14rem_1fr]">
      <aside className="space-y-4">
        {groupByLevel(conversations).map(([level, cs]) => (
          <div key={level}>
            <h3 className="mb-1 text-xs font-semibold uppercase tracking-wide text-slate-400">
              {level}
            </h3>
            {cs.map((c) => (
              <div key={c.unit} className="mb-2">
                <div className="text-sm font-medium text-slate-700">{c.unit}</div>
                <ul className="mt-1 space-y-0.5">
                  {c.sections.map((s, idx) => {
                    const active = c.unit === sel.unit && idx === sel.section
                    return (
                      <li key={idx}>
                        <button
                          onClick={() => setSel({ unit: c.unit, section: idx })}
                          className={`block w-full rounded px-2 py-1 text-left text-sm ${
                            active
                              ? 'bg-blue-600 text-white'
                              : 'text-slate-600 hover:bg-slate-100'
                          }`}
                        >
                          {s.title}
                        </button>
                      </li>
                    )
                  })}
                </ul>
              </div>
            ))}
          </div>
        ))}
      </aside>

      <article className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        {section ? (
          <>
            <h2 className="mb-4 text-xl font-semibold">{section.title}</h2>
            <div className="prose prose-slate max-w-none prose-p:my-2">
              <ReactMarkdown>{section.body}</ReactMarkdown>
            </div>
          </>
        ) : (
          <p className="text-slate-500">Select a topic.</p>
        )}
      </article>
    </div>
  )
}
