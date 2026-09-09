import { useState, type FormEvent } from 'react'
import { Button } from '../../components/Button'
import { Input } from '../../components/Input'
import { GlassCard } from '../../components/GlassCard'
import { PillTabs } from '../../components/PillTabs'
import { Reveal } from '../../components/Reveal'
import { useToast } from '../../components/Toast'
import { useDashboard } from './DashboardContext'
import { PageHeader } from './PageHeader'

export function SettingsPage() {
  const { nickname, email, setNickname } = useDashboard()
  const toast = useToast()
  const [nameDraft, setNameDraft] = useState(nickname)
  const [language, setLanguage] = useState<'en' | 'ru'>('en')
  const [currentPw, setCurrentPw] = useState('')
  const [newPw, setNewPw] = useState('')

  const saveProfile = (e: FormEvent) => {
    e.preventDefault()
    const name = nameDraft.trim()
    if (!name) return
    setNickname(name)
    toast('Profile updated')
  }

  const savePassword = (e: FormEvent) => {
    e.preventDefault()
    if (!currentPw || !newPw) return
    setCurrentPw('')
    setNewPw('')
    toast('Password updated')
  }

  return (
    <div className="flex max-w-2xl flex-col gap-6">
      <Reveal>
        <PageHeader title="Settings" sub="Account, language and security." />
      </Reveal>

      <Reveal delay={0.05}>
        <GlassCard className="p-6 lg:p-7">
          <form onSubmit={saveProfile} className="flex flex-col gap-4">
            <h2 className="text-sm font-medium">Profile</h2>
            <Input
              label="Nickname"
              value={nameDraft}
              onChange={(e) => setNameDraft(e.target.value)}
              maxLength={24}
            />
            <Input label="Email" value={email} disabled />
            <div>
              <Button type="submit" variant="secondary" disabled={nameDraft.trim() === nickname}>
                Save
              </Button>
            </div>
          </form>
        </GlassCard>
      </Reveal>

      <Reveal delay={0.1}>
        <GlassCard className="p-6 lg:p-7">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <h2 className="text-sm font-medium">Language</h2>
              <p className="mt-1 text-xs text-fg-muted">
                Interface language
              </p>
            </div>
            <PillTabs
              value={language}
              onChange={(lang) => {
                setLanguage(lang)
                if (lang === 'ru') toast('Russian is not ready yet.')
              }}
              options={[
                { id: 'en', label: 'en' },
                { id: 'ru', label: 'ru' },
              ]}
              ariaLabel="Language"
              tabClassName="px-4 py-1.5 font-mono text-xs uppercase"
            />
          </div>
        </GlassCard>
      </Reveal>

      <Reveal delay={0.15}>
        <GlassCard className="p-6 lg:p-7">
          <form onSubmit={savePassword} className="flex flex-col gap-4">
            <h2 className="text-sm font-medium">Change password</h2>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <Input
                label="Current password"
                type="password"
                value={currentPw}
                onChange={(e) => setCurrentPw(e.target.value)}
                autoComplete="current-password"
              />
              <Input
                label="New password"
                type="password"
                value={newPw}
                onChange={(e) => setNewPw(e.target.value)}
                autoComplete="new-password"
              />
            </div>
            <div className="mt-4">
              <Button type="submit" variant="secondary" disabled={!currentPw || !newPw}>
                Update password
              </Button>
            </div>
          </form>
        </GlassCard>
      </Reveal>
    </div>
  )
}
