import { Link } from 'react-router'

/**
 * Логотип SpatiumVPN. Один компонент на лендинг, логин и dashboard —
 * чтобы начертание и размер не разъезжались между разделами.
 */
export function Wordmark({ className = '', onClick }: { className?: string; onClick?: () => void }) {
  return (
    <Link to="/" onClick={onClick} className={`flex items-center gap-2 text-fg ${className}`}>
      <img
        src="/spatium-mark.svg"
        alt=""
        aria-hidden="true"
        className="h-[18px] w-[35px] shrink-0"
      />
      <span className="text-[17px] font-semibold tracking-tight">
        Spatium
      </span>
    </Link>
  )
}
