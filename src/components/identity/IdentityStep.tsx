import React, { useState } from 'react'
import { ShieldCheck } from 'lucide-react'
import { useLanguage } from '@/contexts/I18nContext'
import { useAuth } from '@/contexts/AuthContext'
import { identityCommand, identityStage, uploadIdentityDocument, type IdentityState } from '@/lib/identity'
import { DocumentUploadRow } from '@/components/deals/AgencyVerification'
import { CardButton, EmptyState, Hint } from '@/components/reservations/ReservationUI'
import './IdentityStep.css'

/**
 * The ID check new agents and landlords complete before their first listing:
 * both sides of an ID, then Submit. Posting opens right away; listings show to
 * clients once the team approves the ID.
 */
export function IdentityStep({
  state,
  onChange,
  onDone,
  later,
  lead,
  onRetry,
}: {
  state: IdentityState | null
  onChange: (state: IdentityState) => void
  /** After submitting, or from the "ID received" state. */
  onDone: () => void
  later?: { label: string; onClick: () => void }
  /** Short reason shown above the form when it interrupts another task. */
  lead?: string
  onRetry?: () => void
}) {
  const { t } = useLanguage()
  const { user } = useAuth()
  const [uploading, setUploading] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  const stage = identityStage(state)
  if (stage === 'unavailable') {
    return <EmptyState icon={ShieldCheck} title={t('identity.unavailableTitle')} body={t('identity.unavailableBody')}
      action={onRetry ? { label: t('identity.retry'), onClick: onRetry } : undefined} />
  }
  if (stage !== 'needed') {
    return (
      <EmptyState
        icon={ShieldCheck}
        title={stage === 'review' ? t('identity.receivedTitle') : t('identity.clearTitle')}
        body={stage === 'review' ? t('identity.receivedBody') : t('identity.clearBody')}
        action={{ label: t('identity.dashboard'), onClick: onDone }}
      />
    )
  }

  const userId = user?.id || ''
  const store = (side: 'front' | 'back') => async (file: File) => {
    const path = await uploadIdentityDocument(userId, side, file, file.type, file.size)
    onChange(await identityCommand('save', side, path))
    return path
  }
  const submit = async () => {
    setSubmitting(true)
    setError('')
    try {
      onChange(await identityCommand('submit'))
      onDone()
    } catch (e) {
      setError((e as Error).message)
    } finally {
      setSubmitting(false)
    }
  }
  const ready = !!state?.front && !!state?.back

  return (
    <div className="idv-step">
      {lead && <p className="idv-lead">{lead}</p>}
      {state?.status === 'rejected' && (
        <div className="idv-rejected" role="status">
          <p className="idv-rejected-title">{t('identity.rejectedTitle')}</p>
          <p className="idv-rejected-body">{state.rejection_reason || t('identity.rejectedBody')}</p>
        </div>
      )}

      <fieldset className="av-section">
        <legend className="av-section-title">{t('identity.sectionTitle')}</legend>
        <div className="av-section-body">
          <DocumentUploadRow
            userId={userId}
            field={{ key: 'identity_front', label: t('identity.front'), type: 'file' }}
            value={state?.front ? 'uploaded' : ''}
            onChange={() => {}}
            onBusy={setUploading}
            store={store('front')}
          />
          <DocumentUploadRow
            userId={userId}
            field={{ key: 'identity_back', label: t('identity.back'), type: 'file' }}
            value={state?.back ? 'uploaded' : ''}
            onChange={() => {}}
            onBusy={setUploading}
            store={store('back')}
          />
          <p className="av-note">{t('identity.privateNote')}</p>
        </div>
      </fieldset>

      <Hint text={t('identity.reviewHint')} />

      {error && (
        <p className="rsv-error" role="alert">
          {error}
        </p>
      )}

      <div className="rsv-actions">
        <CardButton label={t('identity.submit')} tone="primary" onClick={submit} disabled={!ready || uploading} busy={submitting} />
        {later && <CardButton label={later.label} tone="neutral" onClick={later.onClick} disabled={submitting} />}
      </div>
    </div>
  )
}
