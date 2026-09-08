import { InputHalo } from '../../components/Input'
import { useMemo, useState } from 'react'
import { Gamepad2, Search } from 'lucide-react'
import { Flag } from '../../components/Flag'
import { GlassCard } from '../../components/GlassCard'
import { PillTabs } from '../../components/PillTabs'
import { Reveal } from '../../components/Reveal'
import { servers } from '../../data/mock'
import { PageHeader } from './PageHeader'

type Filter = 'all' | 'standard' | 'gaming'

const filters: { id: Filter; label: string }[] = [
  { id: 'all', label: 'All' },
  { id: 'standard', label: 'Standard' },
  { id: 'gaming', label: 'Gaming' },
]

export function ServersPage() {
  const [filter, setFilter] = useState<Filter>('all')
  const [query, setQuery] = useState('')

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase()
    return [...servers]
      .sort((a, b) => a.ping - b.ping)
      .filter((s) => filter === 'all' || s.type === filter)
      .filter((s) => !q || s.city.toLowerCase().includes(q) || s.country.toLowerCase().includes(q))
  }, [filter, query])

  return (
    <div className="flex flex-col gap-6">
      <Reveal>
        <PageHeader
          title="Servers"
          sub="Sorted by estimated ping — nearest first. Gaming servers skip throttling entirely."
        />
      </Reveal>

      <Reveal delay={0.05}>
        <div className="flex flex-wrap items-center gap-3">
          <PillTabs value={filter} onChange={setFilter} options={filters} ariaLabel="Server type" />
          <label className="input-halo-frame flex-1 rounded-full sm:max-w-64">
            <Search
              size={15}
              strokeWidth={1.75}
              className="pointer-events-none absolute top-1/2 left-3.5 -translate-y-1/2 text-fg-muted"
              aria-hidden
            />
            <input
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search city or country"
              className="input-halo w-full rounded-full bg-surface-1 py-2 pr-4 pl-9.5 text-sm placeholder:text-fg-muted"
            />
            <InputHalo />
          </label>
        </div>
      </Reveal>

      <Reveal delay={0.1}>
        <GlassCard>
          {visible.length > 0 ? (
            <ul>
              {visible.map((s) => (
                <li
                  key={s.id}
                  className="flex items-center gap-4 border-b border-white/5 px-5 py-3.5 last:border-none lg:px-6"
                >
                  <Flag code={s.code} size={22} />
                  <span className="min-w-0 flex-1">
                    <span className="flex items-center gap-2 text-sm">
                      <span className="truncate">{s.city}</span>
                      {s.type === 'gaming' && (
                        <span className="flex items-center gap-1 rounded-full bg-surface-2 px-2 py-0.5 font-mono text-[10px] tracking-wide text-fg-muted uppercase">
                          <Gamepad2 size={11} strokeWidth={1.75} aria-hidden /> gaming
                        </span>
                      )}
                    </span>
                    <span className="block text-xs text-fg-muted">{s.country}</span>
                  </span>
                  <span className="hidden w-32 items-center gap-2.5 sm:flex" title={`Load ${s.load}%`}>
                    <span className="h-[3px] flex-1 overflow-hidden rounded-full bg-white/8">
                      <span
                        className={`block h-full rounded-full ${s.load > 70 ? 'bg-white/30' : 'bg-white/55'}`}
                        style={{ width: `${s.load}%` }}
                      />
                    </span>
                    <span className="w-9 text-right font-mono text-xs text-fg-muted">{s.load}%</span>
                  </span>
                  <span className={`w-16 text-right font-mono text-sm`}>{s.ping} ms</span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="px-6 py-12 text-center text-sm text-fg-muted">
              No servers match “{query}”.
            </p>
          )}
        </GlassCard>
      </Reveal>
    </div>
  )
}
