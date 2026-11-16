import { useEffect, type ReactNode } from 'react'
import { ArrowLeft } from 'lucide-react'
import { Header } from '../landing/Header'
import { Footer } from '../landing/footer/Footer'

export type LegalSection = {
  id: string
  title: string
  paragraphs: string[]
}

export const legalLinkStyle =
  'link-glow inline-flex items-center gap-2 rounded-sm text-sm text-fg-muted hover:text-fg focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-fg'

/**
 * Каркас текстовых страниц (Plan terms, Privacy policy, Terms of service):
 * оглавление со sticky-навигацией слева и пронумерованные разделы справа.
 */
export function LegalDocument({
  title,
  lead,
  documentTitle,
  updated,
  back,
  sections,
  children,
}: {
  title: string
  lead: string
  /** Заголовок вкладки браузера */
  documentTitle: string
  /** Дата редакции, показывается моно-строкой под заголовком */
  updated?: string
  back: { href: string; label: string }
  sections: LegalSection[]
  /** Дополнительное содержимое после последнего раздела */
  children?: ReactNode
}) {
  useEffect(() => {
    const previousTitle = document.title
    document.title = documentTitle
    window.scrollTo(0, 0)
    return () => {
      document.title = previousTitle
    }
  }, [documentTitle])

  return (
    <>
      <Header />
      <main className="landing-container pt-28 pb-16 sm:pt-36 sm:pb-24">
        <div>
          <a href={back.href} className={legalLinkStyle}>
            <ArrowLeft size={15} aria-hidden /> {back.label}
          </a>
          <div className="mt-8">
            <h1 className="text-3xl font-medium tracking-tight">{title}</h1>
            <p className="mt-3 text-base leading-7 text-fg-muted">{lead}</p>
            {updated && (
              <p className="mt-4 font-mono text-xs tracking-[0.08em] text-white/40 uppercase">
                Last updated {updated}
              </p>
            )}
          </div>

          <div className="mt-10 grid gap-10 border-t border-white/10 pt-10 lg:grid-cols-[200px_1fr] lg:gap-16">
            <nav aria-label={`${title} sections`} className="lg:sticky lg:top-24 lg:self-start">
              <p className="mb-5 text-xs font-medium tracking-[0.14em] text-fg-muted uppercase">
                On this page
              </p>
              <ol className="space-y-4">
                {sections.map((section, index) => (
                  <li key={section.id}>
                    <a
                      href={`#${section.id}`}
                      className={`${legalLinkStyle} items-baseline! leading-5`}
                    >
                      <span className="font-mono text-xs text-white/40">
                        {String(index + 1).padStart(2, '0')}
                      </span>
                      {section.title}
                    </a>
                  </li>
                ))}
              </ol>
            </nav>
            <div>
              {sections.map((section, index) => (
                <section
                  key={section.id}
                  id={section.id}
                  aria-labelledby={`${section.id}-title`}
                  className="scroll-mt-24 border-b border-white/10 pb-10 not-first:pt-10 sm:pb-12 sm:not-first:pt-12"
                >
                  <p className="mb-3 font-mono text-xs text-fg-muted">
                    {String(index + 1).padStart(2, '0')}
                  </p>
                  <h2
                    id={`${section.id}-title`}
                    className="text-2xl font-medium tracking-tight sm:text-[28px]"
                  >
                    {section.title}
                  </h2>
                  <div className="mt-5 space-y-4 text-base leading-7 font-light text-white/70">
                    {section.paragraphs.map((paragraph) => (
                      <p key={paragraph}>{paragraph}</p>
                    ))}
                  </div>
                </section>
              ))}
              {children}
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </>
  )
}
