import { useRef, useState, type KeyboardEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { ArrowRight, BedDouble, Briefcase, Check, ChevronLeft, KeyRound, SearchCheck, type LucideIcon } from 'lucide-react'
import { useLanguage } from '@/contexts/I18nContext'
import './ChooseRole.css'

export type SignupRole = 'normal' | 'agent' | 'landlord' | 'host'

const ROLES: { role: SignupRole; Icon: LucideIcon }[] = [
  { role: 'normal', Icon: SearchCheck },
  { role: 'agent', Icon: Briefcase },
  { role: 'landlord', Icon: KeyRound },
  { role: 'host', Icon: BedDouble },
]

/**
 * Step before sign-up: pick how you'll use Propella from four square tiles,
 * see what that account can do, then continue to /auth/signup?role=….
 */
export default function ChooseRole() {
  const { t } = useLanguage()
  const navigate = useNavigate()
  const [selected, setSelected] = useState<SignupRole | null>(null)
  const refs = useRef<(HTMLButtonElement | null)[]>([])

  // Radio-group keys: arrows move and select, like native radios (2 × 2 grid).
  const onKey = (e: KeyboardEvent, index: number) => {
    const step: Record<string, number> = { ArrowRight: 1, ArrowLeft: -1, ArrowDown: 2, ArrowUp: -2 }
    const delta = step[e.key]
    if (!delta) return
    e.preventDefault()
    const next = (index + delta + ROLES.length) % ROLES.length
    setSelected(ROLES[next].role)
    refs.current[next]?.focus()
  }

  return (
    <div className="choose-role">
      <div className="choose-role-inner">
        <div className="choose-role-top">
          <button type="button" className="choose-role-back" onClick={() => navigate(-1)} aria-label={t('common.back', 'Back')}>
            <ChevronLeft size={20} />
          </button>
          <Link to="/" className="choose-role-brand">
            <img src="/app-icon.png" alt="" />
            <span>Propella</span>
          </Link>
          <span className="choose-role-step">{t('chooseRole.step')}</span>
        </div>

        <h1 className="choose-role-title">{t('chooseRole.title')}</h1>
        <p className="choose-role-subtitle">{t('chooseRole.subtitle')}</p>

        <div className="choose-role-grid" role="radiogroup" aria-label={t('chooseRole.title')}>
          {ROLES.map(({ role, Icon }, i) => {
            const active = selected === role
            return (
              <button
                key={role}
                ref={(el) => { refs.current[i] = el }}
                type="button"
                role="radio"
                aria-checked={active}
                tabIndex={active || (!selected && i === 0) ? 0 : -1}
                className={`choose-role-tile${active ? ' is-active' : ''}`}
                onClick={() => setSelected(role)}
                onDoubleClick={() => navigate(`/auth/signup?role=${role}`)}
                onKeyDown={(e) => onKey(e, i)}
              >
                <Icon className="choose-role-icon" size={40} strokeWidth={1.75} aria-hidden="true" />
                <span className="choose-role-name">{t(`chooseRole.${role}.title`)}</span>
                <span className="choose-role-line">{t(`chooseRole.${role}.line`)}</span>
              </button>
            )
          })}
        </div>

        {/* What the chosen account can do */}
        <div className="choose-role-perks" aria-live="polite">
          {selected ? (
            [1, 2, 3].map((n) => (
              <span key={`${selected}-${n}`} className="choose-role-perk">
                <Check size={14} aria-hidden="true" />
                {t(`chooseRole.${selected}.perk${n}`)}
              </span>
            ))
          ) : (
            <span className="choose-role-hint">{t('chooseRole.pickOne')}</span>
          )}
        </div>

        <button
          type="button"
          className="choose-role-continue"
          onClick={() => selected && navigate(`/auth/signup?role=${selected}`)}
          disabled={!selected}
        >
          {selected ? t('chooseRole.continueAs', { role: t(`chooseRole.${selected}.short`) }) : t('chooseRole.pickOne')}
          <ArrowRight size={18} aria-hidden="true" />
        </button>
        <p className="choose-role-login">
          {t('chooseRole.haveAccount')} <Link to="/auth/login">{t('chooseRole.login')}</Link>
        </p>
        <p className="choose-role-note">{t('chooseRole.note')}</p>
      </div>
    </div>
  )
}
