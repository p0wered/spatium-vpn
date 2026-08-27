import { Check } from 'lucide-react'
import { Flag } from '../../components/Flag'
import type { Server } from '../../data/mock'

/**
 * Строка сервера — общая для шторки на Home и для вкладки Servers.
 * Пинг и нагрузка моноширинные: в списке цифры
 * стоят колонкой, пропорциональный шрифт её разваливает.
 */
export function ServerRow({
  server,
  selected,
  onSelect,
}: {
  server: Server
  selected: boolean
  onSelect: (s: Server) => void
}) {
  return (
    <button
      type="button"
      onClick={() => onSelect(server)}
      aria-pressed={selected}
      className={`flex w-full cursor-pointer items-center gap-3 rounded-2xl px-3 py-2.5 text-left transition-colors ${
        selected ? 'bg-white/8' : 'hover:bg-white/4'
      }`}
    >
      <Flag code={server.code} size={26} />

      <span className="min-w-0 flex-1">
        <span className="flex items-center gap-1.5">
          <span className="truncate text-[14px] font-medium text-fg">{server.city}</span>
          {server.type === 'gaming' && (
            <span className="shrink-0 rounded-[5px] border border-white/12 px-1 font-mono text-[8px] leading-[1.5] tracking-wider text-fg-muted uppercase">
              Game
            </span>
          )}
        </span>
        <span className="block truncate text-[11px] text-fg-muted">{server.country}</span>
      </span>

      <span className="flex shrink-0 flex-col items-end gap-1">
        <span className="font-mono text-[12px] text-fg tabular-nums">{server.ping} ms</span>
        {/* Нагрузка — полоска, а не число: точное значение тут никому не нужно */}
        <span aria-label={`Load ${server.load}%`} className="block h-[3px] w-9 rounded-full bg-white/10">
          <span
            className="block h-full rounded-full bg-fg-muted"
            style={{ width: `${server.load}%` }}
          />
        </span>
      </span>

      <span className="w-4 shrink-0">
        {selected && <Check size={16} strokeWidth={2.4} className="text-fg" />}
      </span>
    </button>
  )
}
