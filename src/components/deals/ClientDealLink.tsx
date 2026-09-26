import React, { useState } from 'react'
import { Copy, Check, RefreshCw } from 'lucide-react'
import { useLanguage } from '@/contexts/I18nContext'
import { dealDb } from '@/lib/deals'
import { CardButton } from '@/components/reservations/ReservationUI'
import { getCanonicalBaseUrl } from '@/utils/seoUtils'

/** Admin: issue a private invitation link that opens this deal for the client after sign-in. */
export function useClientDealLink(dealId: string) {
  const [link, setLink] = useState('')
  const [expiresAt, setExpiresAt] = useState('')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)
  const [copied, setCopied] = useState(false)

  const issue = async () => {
    setBusy(true)
    setError('')
    setCopied(false)
    try {
      const { data, error: rpcError } = await dealDb.rpc('deal_client_link', { p_action: 'issue', p_deal: dealId })
      if (rpcError) throw rpcError
      setLink(`${getCanonicalBaseUrl()}/deal-invite#invite=${data.token}`)
      setExpiresAt(data.expires_at)
    } catch (e) {
      setError((e as Error).message)
    } finally {
      setBusy(false)
    }
  }

  return { link, expiresAt, error, busy, copied, setCopied, setError, issue }
}

/** The issued link, with Copy as the one next step and New link to revoke and reissue. */
export function ClientLinkPanel({ state }: { state: ReturnType<typeof useClientDealLink> }) {
  const { t, currentLanguage } = useLanguage()
  const { link, expiresAt, error, busy, copied, setCopied, setError, issue } = state
  if (!link) return error ? <p className="rsv-error" role="alert">{error}</p> : null

  const date = new Date(expiresAt).toLocaleDateString(currentLanguage === 'fr' ? 'fr-FR' : 'en-US', { day: 'numeric', month: 'short' })
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(link)
      setCopied(true)
    } catch {
      setError(t('deals.clientLinkCopyFallback'))
    }
  }

  return (
    <div className="dc-client-link">
      <label className="rsv-field">
        <span>{t('deals.clientLinkLabel')}</span>
        <input readOnly value={link} onFocus={(e) => e.target.select()} />
      </label>
      <div className="rsv-actions">
        <CardButton label={copied ? t('deals.clientLinkCopied') : t('deals.clientLinkCopy')} icon={copied ? Check : Copy} tone="primary" onClick={copy} />
        <CardButton label={t('deals.clientLinkNew')} icon={RefreshCw} tone="neutral" onClick={issue} busy={busy} />
      </div>
      <p className="rsv-muted">{t('deals.clientLinkNote', { date })}</p>
      {error && (
        <p className="rsv-error" role="alert">
          {error}
        </p>
      )}
    </div>
  )
}
