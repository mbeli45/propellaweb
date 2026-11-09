import { useState } from 'react'
import { useLanguage } from '@/contexts/I18nContext'
import { CardButton } from '@/components/reservations/ReservationUI'
import { MobileMoneyService, StayBooking, guessService, payStayDeposit, stayErrorMessage } from '@/lib/stays'
import { StayDialog, formatFcfa } from './StayUI'

/** Guest pays the stay deposit by MTN or Orange mobile money. */
export function DepositDialog({
  booking,
  defaultPhone,
  onClose,
  onSent,
}: {
  booking: StayBooking
  defaultPhone?: string | null
  onClose: () => void
  onSent: (message: string) => void
}) {
  const { t } = useLanguage()
  const [phone, setPhone] = useState((defaultPhone || '').replace(/^\+?237/, ''))
  const [service, setService] = useState<MobileMoneyService>(guessService(defaultPhone || ''))
  const [sending, setSending] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const digits = phone.replace(/\D/g, '').replace(/^237/, '')
  const valid = /^[69]\d{8}$/.test(digits)
  const rest = Number(booking.total_amount) - Number(booking.deposit_amount)

  const send = async () => {
    if (!valid) return setError(t('stays.deposit.invalidPhone'))
    setSending(true)
    setError(null)
    try {
      const result = await payStayDeposit(booking.id, digits, service)
      onSent(result.message)
    } catch (e) {
      setError(stayErrorMessage(e, t('stays.errors.generic')))
    } finally {
      setSending(false)
    }
  }

  return (
    <StayDialog
      title={t('stays.deposit.sheetTitle')}
      onClose={onClose}
      closeLabel={t('common.close')}
      footer={
        <>
          <CardButton label={t('common.cancel')} tone="neutral" onClick={onClose} />
          <CardButton label={t('stays.deposit.send')} tone="primary" onClick={send} busy={sending} disabled={!valid} />
        </>
      }
    >
      <div className="stay-panel">
        <p className="stay-pay-amount">{formatFcfa(booking.deposit_amount)}</p>
        <p className="stay-policy" style={{ fontSize: 13 }}>{t('stays.deposit.sheetBody', { amount: formatFcfa(booking.deposit_amount) })}</p>
        {rest > 0 && (
          <p className="stay-policy" style={{ fontSize: 13 }}>
            {t('stays.deposit.atProperty')}: {formatFcfa(rest)}
          </p>
        )}
      </div>
      <fieldset style={{ border: 0, padding: 0, margin: '16px 0 0', display: 'grid', gap: 8 }}>
        <legend className="stay-label" style={{ marginBottom: 8 }}>{t('stays.deposit.network')}</legend>
        <div className="stay-networks" role="radiogroup">
          {(['MTN', 'ORANGE'] as const).map((value) => (
            <button
              key={value}
              type="button"
              role="radio"
              aria-checked={service === value}
              className={`stay-network${service === value ? ' is-active' : ''}`}
              onClick={() => setService(value)}
            >
              {value === 'MTN' ? t('stays.deposit.mtn') : t('stays.deposit.orange')}
            </button>
          ))}
        </div>
      </fieldset>
      <label style={{ display: 'grid', gap: 8, marginTop: 16, fontSize: 14, fontWeight: 600 }}>
        {t('stays.deposit.phone')}
        <span className="stay-phone">
          <span>+237</span>
          <input
            type="tel"
            inputMode="tel"
            autoComplete="tel-national"
            value={phone}
            placeholder={t('stays.deposit.phonePlaceholder')}
            onChange={(e) => {
              setPhone(e.target.value)
              const d = e.target.value.replace(/\D/g, '')
              if (d.length >= 3) setService(guessService(d))
            }}
            onKeyDown={(e) => e.key === 'Enter' && valid && send()}
          />
        </span>
      </label>
      {error && <p className="stay-error" role="alert" style={{ marginTop: 12 }}>{error}</p>}
    </StayDialog>
  )
}
