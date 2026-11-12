import { BedDouble, Home } from 'lucide-react'
import { useLanguage } from '@/contexts/I18nContext'
import { useMarket, Market } from '@/contexts/MarketContext'
import './MarketSwitch.css'

/**
 * Top of Home: Properties (rent & sale) | Stays (nightly).
 * `tabs` is the quiet underlined header style; `overlay` the dark variant for the video feed.
 */
export default function MarketSwitch({ overlay = false, tabs = false }: { overlay?: boolean; tabs?: boolean }) {
  const { t } = useLanguage()
  const { market, setMarket } = useMarket()
  const options: { value: Market; label: string; Icon: typeof Home }[] = [
    { value: 'properties', label: t('market.properties'), Icon: Home },
    { value: 'stays', label: t('market.stays'), Icon: BedDouble },
  ]
  return (
    <div className={`market-switch${overlay ? ' market-switch--overlay' : ''}${tabs ? ' market-switch--tabs' : ''}`} role="tablist" aria-label={t('market.label')}>
      {options.map(({ value, label, Icon }) => (
        <button
          key={value}
          type="button"
          role="tab"
          aria-selected={market === value}
          className={`market-switch-item${market === value ? ' is-active' : ''}`}
          onClick={() => setMarket(value)}
        >
          <Icon size={tabs ? 18 : 16} aria-hidden="true" />
          {label}
        </button>
      ))}
    </div>
  )
}
