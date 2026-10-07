import React, { useRef, useState } from 'react'
import { CheckCircle2, ChevronDown, ChevronUp, ExternalLink, FileText, HeartHandshake, Upload } from 'lucide-react'
import { useLanguage } from '@/contexts/I18nContext'
import {
  agencyFileFields,
  agencyStatus,
  dealDb,
  partnerForm,
  uploadAgencyDocument,
  type Field,
  type FieldSection,
  type Partner,
} from '@/lib/deals'
import { Banner, Hint } from '@/components/reservations/ReservationUI'
import './AgencyVerification.css'

const MAX_BYTES = 10 * 1024 * 1024

/** Translated label for an agency-verification field, falling back to the form's English label. */
export function useAgencyFieldLabel() {
  const { t } = useLanguage()
  return (field: Field) => t(`agencyVerify.fields.${field.key}`, field.label)
}

const SECTION_KEYS: Record<FieldSection, string> = {
  company: 'agencyVerify.sectionCompany',
  representative: 'agencyVerify.sectionRepresentative',
  documents: 'agencyVerify.sectionDocuments',
  declaration: 'agencyVerify.sectionDeclaration',
}

/** One labelled surface per form section (design language: grouped surfaces, uppercase label). */
export function FormSection({ section, children }: { section?: FieldSection; children: React.ReactNode }) {
  const { t } = useLanguage()
  if (!section) return <>{children}</>
  return (
    <fieldset className="av-section">
      <legend className="av-section-title">{t(SECTION_KEYS[section])}</legend>
      <div className="av-section-body">
        {children}
        {section === 'documents' && <p className="av-note">{t('agencyVerify.documentsNote')}</p>}
      </div>
    </fieldset>
  )
}

/** A document the agency must provide: name, state, and one Upload / Replace action. */
export function DocumentUploadRow({
  userId,
  field,
  value,
  onChange,
  onBusy,
  store = (file) => uploadAgencyDocument(userId, field.key, file, file.type, file.size),
}: {
  userId: string
  field: Field
  value: string
  onChange: (path: string) => void
  onBusy: (busy: boolean) => void
  /** Stores the file and returns its path; defaults to the agency-verification bucket. */
  store?: (file: File) => Promise<string>
}) {
  const { t } = useLanguage()
  const labelOf = useAgencyFieldLabel()
  const inputRef = useRef<HTMLInputElement>(null)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const uploaded = !!value
  const label = labelOf(field)
  const inputId = `agency-doc-${field.key}`

  const upload = async (file: File) => {
    setBusy(true)
    onBusy(true)
    setError('')
    try {
      if (file.size > MAX_BYTES) throw new Error(t('agencyVerify.fileTooLarge'))
      onChange(await store(file))
    } catch (e) {
      const message = (e as Error).message || ''
      setError(message.startsWith('Choose a PDF') ? t('agencyVerify.fileTooLarge') : message)
    } finally {
      setBusy(false)
      onBusy(false)
      if (inputRef.current) inputRef.current.value = ''
    }
  }

  return (
    <div className="av-doc">
      <span className={`av-doc-icon${uploaded ? ' is-done' : ''}`} aria-hidden="true">
        {uploaded ? <CheckCircle2 size={18} /> : <FileText size={18} strokeWidth={1.5} />}
      </span>
      <span className="av-doc-text">
        <label htmlFor={inputId} className="av-doc-label">
          {label}
        </label>
        <span className={`av-doc-state${uploaded ? ' is-done' : ''}`}>
          {uploaded ? t('agencyVerify.uploaded') : field.optional ? t('agencyVerify.conditional') : t('agencyVerify.required')}
        </span>
      </span>
      <input
        ref={inputRef}
        id={inputId}
        type="file"
        accept="application/pdf,image/jpeg,image/png"
        className="av-doc-input"
        disabled={busy}
        onChange={(e) => {
          const file = e.target.files?.[0]
          if (file) void upload(file)
        }}
      />
      <button
        type="button"
        className={`av-doc-btn${uploaded ? ' is-done' : ''}`}
        disabled={busy}
        aria-label={`${uploaded ? t('agencyVerify.replace') : t('agencyVerify.upload')}: ${label}`}
        onClick={() => inputRef.current?.click()}
      >
        <Upload size={15} aria-hidden="true" />
        {busy ? t('agencyVerify.uploading') : uploaded ? t('agencyVerify.replace') : t('agencyVerify.upload')}
      </button>
      {error && (
        <p role="alert" className="av-doc-error">
          {error}
        </p>
      )}
    </div>
  )
}

/** Verification state as a pill: neutral / in progress / needs you (amber) / done. */
export function AgencyStatusPill({ partner }: { partner?: Partner }) {
  const { t } = useLanguage()
  const status = agencyStatus(partner)
  const label = {
    missing: t('agencyVerify.statusMissing'),
    pending: t('agencyVerify.statusPending'),
    changes_requested: t('agencyVerify.statusChanges'),
    approved: t('agencyVerify.statusApproved'),
  }[status]
  return (
    <span className={`av-pill av-pill--${status}`}>
      <span className="av-pill-dot" aria-hidden="true" />
      {t('agencyVerify.verification')} · {label}
    </span>
  )
}

/**
 * What the agency sees on Deals about its verification: a banner only when there is
 * something to do (start, or fix corrections), otherwise a one-line hint.
 */
export function AgencyVerificationNotice({ partner, onApply }: { partner?: Partner; onApply: () => void }) {
  const { t } = useLanguage()
  const status = agencyStatus(partner)
  if (status === 'missing') {
    return (
      <Banner
        icon={HeartHandshake}
        title={t('agencyVerify.bannerTitle')}
        body={t('agencyVerify.bannerBody')}
        primary={{ label: t('agencyVerify.start'), onClick: onApply }}
      />
    )
  }
  if (status === 'changes_requested') {
    return (
      <Banner
        icon={HeartHandshake}
        title={t('agencyVerify.changesTitle')}
        body={partner?.verification_note || t('agencyVerify.changesBody')}
        attention={t('agencyVerify.changesAttention')}
        primary={{ label: t('agencyVerify.update'), onClick: onApply }}
      />
    )
  }
  const hint = status === 'pending' ? t('agencyVerify.underReview') : partner?.status !== 'active' ? t('agencyVerify.approvedInactive') : null
  return hint ? <Hint text={hint} /> : null
}

/** Opens a private document through a short-lived signed link (5 minutes). */
function DocumentOpenRow({ field, path }: { field: Field; path: string }) {
  const { t } = useLanguage()
  const labelOf = useAgencyFieldLabel()
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const open = async () => {
    // Open the tab synchronously so popup blockers allow it, then point it at the link.
    const tab = window.open('', '_blank')
    if (tab) tab.opener = null
    setBusy(true)
    setError('')
    const { data, error: linkError } = await dealDb.storage.from('agency-verification').createSignedUrl(path, 300)
    setBusy(false)
    if (linkError || !data?.signedUrl) {
      tab?.close()
      setError(linkError?.message || 'Unable to open document')
      return
    }
    if (tab) tab.location.href = data.signedUrl
    else window.open(data.signedUrl, '_blank', 'noopener')
  }
  return (
    <li className="av-open-row">
      <span className="av-doc-icon" aria-hidden="true">
        <FileText size={18} strokeWidth={1.5} />
      </span>
      <span className="av-open-label">{labelOf(field)}</span>
      <button type="button" className="av-doc-btn is-done" onClick={open} disabled={busy}>
        <ExternalLink size={15} aria-hidden="true" />
        {busy ? t('agencyVerify.opening') : t('agencyVerify.open')}
      </button>
      {error && (
        <p role="alert" className="av-doc-error">
          {error}
        </p>
      )}
    </li>
  )
}

/** Admin: submitted company details and private documents, collapsed by default. */
export function AgencyVerificationDetails({ partner }: { partner: Partner }) {
  const { t } = useLanguage()
  const labelOf = useAgencyFieldLabel()
  const [open, setOpen] = useState(false)
  const data = partner.verification_data || {}
  const details = partnerForm.fields.filter((f) => f.type !== 'file' && f.type !== 'checkbox' && data[f.key])
  const documents = agencyFileFields.filter((f) => data[f.key])
  if (!details.length && !documents.length) return null
  return (
    <div className="av-details">
      <button type="button" className="rsv-toggle" aria-expanded={open} onClick={() => setOpen((v) => !v)}>
        {open ? t('agencyVerify.hideDetails') : t('agencyVerify.showDetails')}
        {open ? <ChevronUp size={16} aria-hidden="true" /> : <ChevronDown size={16} aria-hidden="true" />}
      </button>
      {open && (
        <>
          {details.length > 0 && (
            <>
              <h4 className="ds-set-title">{t('agencyVerify.details')}</h4>
              <dl className="av-dl">
                {details.map((f) => (
                  <div key={f.key}>
                    <dt>{labelOf(f)}</dt>
                    <dd>{String(data[f.key])}</dd>
                  </div>
                ))}
              </dl>
            </>
          )}
          {documents.length > 0 && (
            <>
              <h4 className="ds-set-title">{t('agencyVerify.documents')}</h4>
              <ul className="av-open-list">
                {documents.map((f) => (
                  <DocumentOpenRow key={f.key} field={f} path={String(data[f.key])} />
                ))}
              </ul>
            </>
          )}
        </>
      )}
    </div>
  )
}
