import type { ReactNode } from 'react'

/** Общая шапка страниц dashboard. */
export function PageHeader({ title, sub }: { title: string; sub?: ReactNode }) {
  return (
    <header className="px-2.5">
      <h1 className="text-2xl font-semibold tracking-tight lg:text-3xl">{title}</h1>
      {sub && <p className="mt-1.5 text-sm text-fg-muted lg:text-base">{sub}</p>}
    </header>
  )
}
