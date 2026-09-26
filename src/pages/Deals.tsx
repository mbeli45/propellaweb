import React, { useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { HeartHandshake as Handshake, Plus, X } from 'lucide-react'
import { useDeals } from '@/hooks/useDeals'
import { dealNeedsAction } from '@/hooks/useReservationDeals'
import { useLanguage } from '@/contexts/I18nContext'
import { DealForm, applicationForm, groupFields, requestForm, statusLabel } from '@/lib/deals'
import {
  AgencyVerificationNotice,
  DocumentUploadRow,
  FormSection,
  useAgencyFieldLabel,
} from '@/components/deals/AgencyVerification'
import SectionSwitch from '@/components/SectionSwitch'
import { ListItemSkeleton } from '@/components/skeletons'
import {
  Banner,
  CardButton,
  Hint,
  ReservationToolbar,
  ReservationsHeader,
  ReservationsPage,
} from '@/components/reservations/ReservationUI'
import { DealCard, PartnerCard, RequestCard, dealRef } from '@/components/deals/DealCard'

type Workspace = 'admin' | 'agent' | 'customer'
type Tab = 'deals' | 'waiting' | 'requests' | 'partners'

export default function Deals({ workspace = 'customer' }: { workspace?: Workspace }) {
  const loaded = useDeals()
  const { t } = useLanguage()
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const reservation = searchParams.get('reservation')
  const requestParam = searchParams.get('request')

  // Each workspace sees only its own side of a deal. Admins manage everyone
  // else's deals: an admin who is also an agent (or customer) works their own
  // deals from that workspace, so they're left out here.
  const admin = workspace === 'admin' && loaded.admin
  const deals = loaded.deals.filter((d) =>
    admin
      ? d.agent_id !== loaded.userId && d.customer_id !== loaded.userId
      : workspace === 'agent'
        ? d.agent_id === loaded.userId
        : d.customer_id === loaded.userId,
  )
  const partners = loaded.partners.filter((p) => admin || p.owner_id === loaded.userId || deals.some((d) => d.partner_id === p.id))
  const requests = loaded.requests.filter((r) =>
    admin || (workspace === 'agent' ? deals.some((d) => d.request_id === r.id) : r.customer_id === loaded.userId),
  )

  const [tab, setTab] = useState<Tab>('deals')
  const [uploading, setUploading] = useState(false)
  const [query, setQuery] = useState('')
  const [form, setForm] = useState<DealForm | null>(null)
  const [values, setValues] = useState<Record<string, string | boolean>>({})
  const dialogRef = useRef<HTMLElement>(null)

  const open = (next: DealForm) => {
    setValues(Object.fromEntries(next.fields.map((f) => [f.key, f.type === 'checkbox' ? false : f.value ?? f.options?.[0]?.value ?? ''])))
    setForm(next)
  }

  // Deep link from the reservations page: ?request=1 opens the request form once.
  const openedRequest = useRef(false)
  useEffect(() => {
    if (requestParam && workspace === 'customer' && !loaded.loading && !openedRequest.current) {
      openedRequest.current = true
      open(requestForm(false))
    }
  }, [requestParam, workspace, loaded.loading])

  // Dialog: lock page scroll, focus the first control, restore focus on close.
  useEffect(() => {
    if (!form) return
    const previous = document.activeElement as HTMLElement | null
    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    dialogRef.current?.querySelector<HTMLElement>('input, select, textarea, button')?.focus()
    return () => {
      document.body.style.overflow = previousOverflow
      previous?.focus()
    }
  }, [form])

  const dialogKeys = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape' && !loaded.busy && !uploading) {
      e.preventDefault()
      setForm(null)
    }
    if (e.key !== 'Tab') return
    const controls = dialogRef.current?.querySelectorAll<HTMLElement>(
      'button:not(:disabled),input:not(:disabled),select:not(:disabled),textarea:not(:disabled)',
    )
    if (!controls?.length) return
    const first = controls[0]
    const last = controls[controls.length - 1]
    if (e.shiftKey && document.activeElement === first) {
      e.preventDefault()
      last.focus()
    } else if (!e.shiftKey && document.activeElement === last) {
      e.preventDefault()
      first.focus()
    }
  }

  const reportsOpenFor = (dealId: string) => loaded.reports.some((r) => r.deal_id === dealId && r.status === 'open')
  const needsAction = (deal: (typeof deals)[number]) =>
    admin ? deal.status === 'paid' || reportsOpenFor(deal.id) : dealNeedsAction(deal, loaded.userId)
  const waiting = deals.filter(needsAction)

  const visibleDeals = useMemo(() => {
    const source = tab === 'waiting' ? waiting : deals
    const q = query.trim().toLowerCase()
    return source
      .filter((d) =>
        !q ||
        [d.title, d.property?.title, d.property?.location, statusLabel(d.status), d.id, dealRef(d.id)].some((value) =>
          value?.toLowerCase().includes(q),
        ),
      )
      // A deal opened from a reservation goes first.
      .sort((a, b) => Number(b.reservation_id === reservation) - Number(a.reservation_id === reservation))
  }, [tab, waiting, deals, query, reservation])

  const tabs = [
    { key: 'deals', label: t('deals.tabDeals'), count: deals.length },
    { key: 'waiting', label: t('deals.tabWaiting'), count: waiting.length },
    { key: 'requests', label: t('deals.tabRequests'), count: requests.length },
    ...(partners.length ? [{ key: 'partners', label: t('deals.tabPartners'), count: partners.length }] : []),
  ]

  const titleKey = workspace === 'admin' ? 'Admin' : workspace === 'agent' ? 'Agent' : 'Customer'
  const ownPartner = partners.find((p) => p.owner_id === loaded.userId)
  const agencyFieldLabel = useAgencyFieldLabel()
  // Company-verification forms show translated labels; other deal forms keep theirs.
  const isAgencyForm = form?.action === 'register_partner' || form?.action === 'review_partner'
  const labelOf = (field: DealForm['fields'][number]) => (isAgencyForm ? agencyFieldLabel(field) : field.label)
  const submitLabel = !form
    ? ''
    : form.action === 'pay'
      ? t('deals.requestPayment')
      : form.action === 'review_partner'
        ? values.decision === 'approved'
          ? t('agencyVerify.approve')
          : t('agencyVerify.requestChanges')
        : t('deals.confirm')
  const headerAction =
    workspace === 'agent'
      ? undefined
      : { label: t('deals.requestProperty'), icon: Plus, onClick: () => open(requestForm(admin)) }
  const showSkeleton = loaded.loading && deals.length === 0

  const renderDeals = () =>
    visibleDeals.length === 0 ? (
      <div className="rsv-empty">
        <p>{query ? t('deals.noMatches') : tab === 'waiting' ? t('deals.emptyWaiting') : t('deals.emptyDeals')}</p>
      </div>
    ) : (
      <div className="rsv-grid" style={{ marginTop: 16 }}>
        {visibleDeals.map((deal) => (
          <DealCard
            key={deal.id}
            deal={deal}
            workspace={workspace}
            userId={loaded.userId}
            admin={admin}
            partners={loaded.partners}
            reports={loaded.reports}
            events={loaded.events}
            busy={loaded.busy}
            highlighted={!!reservation && deal.reservation_id === reservation}
            needsAction={needsAction(deal)}
            onForm={open}
            onMessage={(id) => navigate(`/chat/${id}`)}
            onViewProperty={(id) => navigate(`/property/${id}`)}
          />
        ))}
      </div>
    )

  return (
    <ReservationsPage label={t(`deals.title${titleKey}`)}>
      <ReservationsHeader
        title={t(`deals.title${titleKey}`)}
        count={deals.length}
        subtitle={t(`deals.subtitle${titleKey}`)}
        action={headerAction}
        onBack={workspace === 'customer' ? () => navigate(-1) : undefined}
        backLabel={t('common.back')}
      >
        {workspace === 'agent' && (
          <SectionSwitch
            label={t('navigation.bookings')}
            items={[
              { to: '/agent/reservations', label: t('navigation.bookings') },
              { to: '/agent/deals', label: t('reservations.dealsButton') },
            ]}
          />
        )}
      </ReservationsHeader>

      {workspace === 'agent' && (
        <AgencyVerificationNotice partner={ownPartner} onApply={() => open(applicationForm(ownPartner))} />
      )}

      <ReservationToolbar
        search={query}
        onSearch={setQuery}
        placeholder={t('deals.searchPlaceholder')}
        options={tabs}
        value={tab}
        onChange={(key) => setTab(key as Tab)}
        label={t(`deals.title${titleKey}`)}
      />

      {workspace !== 'admin' && (
        <div style={{ marginTop: 12 }}>
          <Hint text={t('deals.feesNote')} />
        </div>
      )}

      {loaded.error && !form && (
        <p className="rsv-error" role="alert">
          {loaded.error}
        </p>
      )}
      {loaded.message && (
        <p className="rsv-muted" role="status" style={{ marginTop: 12 }}>
          {loaded.message}
        </p>
      )}

      {showSkeleton ? (
        <div style={{ marginTop: 16 }}>
          <ListItemSkeleton count={3} lines={3} leading="thumbnail" appearance="card" flush />
        </div>
      ) : tab === 'requests' ? (
        requests.length === 0 ? (
          <div className="rsv-empty">
            <p>{t('deals.emptyRequests')}</p>
          </div>
        ) : (
          <div className="rsv-grid" style={{ marginTop: 16 }}>
            {requests.map((r) => (
              <RequestCard
                key={r.id}
                request={r}
                partners={loaded.partners}
                assigned={loaded.deals.some((d) => d.request_id === r.id && d.status !== 'cancelled')}
                admin={admin}
                busy={loaded.busy}
                onForm={open}
              />
            ))}
          </div>
        )
      ) : tab === 'partners' ? (
        partners.length === 0 ? (
          <div className="rsv-empty">
            <p>{t('deals.emptyPartners')}</p>
          </div>
        ) : (
          <div className="rsv-grid" style={{ marginTop: 16 }}>
            {partners.map((p) => (
              <PartnerCard key={p.id} partner={p} admin={admin} busy={loaded.busy} onForm={open} />
            ))}
          </div>
        )
      ) : (
        renderDeals()
      )}

      {workspace === 'customer' && loaded.userId && (
        <p className="rsv-note">{t('deals.accountId', { id: loaded.userId })}</p>
      )}

      {form && (
        <div className="rsv-dialog-backdrop" onMouseDown={(e) => e.target === e.currentTarget && !loaded.busy && !uploading && setForm(null)}>
          <section
            ref={dialogRef}
            onKeyDown={dialogKeys}
            role="dialog"
            aria-modal="true"
            aria-labelledby="deal-form-title"
            className="rsv-dialog"
          >
            <div className="rsv-dialog-head">
              <span className="rsv-banner-icon" style={{ background: 'var(--rsv-primary-tint)' }} aria-hidden="true">
                <Handshake size={20} />
              </span>
              <h2 id="deal-form-title">{form.action === 'register_partner' ? t('agencyVerify.applyTitle') : form.title}</h2>
              <button type="button" className="rsv-back" disabled={loaded.busy || uploading} aria-label={t('deals.close')} onClick={() => setForm(null)}>
                <X size={20} />
              </button>
            </div>
            {form.description && (
              <p className="rsv-muted">{form.action === 'register_partner' ? t('agencyVerify.applyDescription') : form.description}</p>
            )}
            <form
              style={{ display: 'flex', flexDirection: 'column', gap: 18 }}
              onSubmit={async (e) => {
                e.preventDefault()
                if (uploading) return
                if (await loaded.submit(form, values)) setForm(null)
              }}
            >
              <fieldset disabled={uploading || loaded.busy} className="av-fields">
                {groupFields(form.fields).map((group, index) => (
                  <FormSection key={group.section || index} section={group.section}>
                    {group.fields.map((f) =>
                      f.type === 'checkbox' ? (
                        <label key={f.key} className="rsv-check">
                          <input
                            type="checkbox"
                            checked={values[f.key] === true}
                            required={!f.optional}
                            onChange={(e) => setValues({ ...values, [f.key]: e.target.checked })}
                          />
                          <span>{labelOf(f)}</span>
                        </label>
                      ) : f.type === 'file' ? (
                        <DocumentUploadRow
                          key={f.key}
                          userId={loaded.userId}
                          field={f}
                          value={String(values[f.key] || '')}
                          onChange={(path) => setValues((v) => ({ ...v, [f.key]: path }))}
                          onBusy={setUploading}
                        />
                      ) : (
                        <label key={f.key} className="rsv-field">
                          <span>{labelOf(f)}</span>
                          {f.type === 'select' ? (
                            <select
                              required={!f.optional}
                              value={String(values[f.key] ?? '')}
                              onChange={(e) => setValues({ ...values, [f.key]: e.target.value })}
                              style={{ width: '100%', minHeight: 46, border: '1px solid var(--rsv-line)', borderRadius: 12, padding: '0 12px', font: 'inherit', color: 'var(--rsv-ink)', background: 'var(--rsv-surface)' }}
                            >
                              {!f.options?.length && <option value="">—</option>}
                              {f.options?.map((o) => (
                                <option key={o.value} value={o.value}>
                                  {o.label}
                                </option>
                              ))}
                            </select>
                          ) : f.type === 'multiline' ? (
                            <textarea
                              required={!f.optional}
                              maxLength={4000}
                              rows={4}
                              value={String(values[f.key] ?? '')}
                              onChange={(e) => setValues({ ...values, [f.key]: e.target.value })}
                            />
                          ) : (
                            <input
                              required={!f.optional}
                              type={f.type === 'number' ? 'number' : 'text'}
                              min={f.type === 'number' ? 1 : undefined}
                              step={f.type === 'number' ? 1 : undefined}
                              value={String(values[f.key] ?? '')}
                              onChange={(e) => setValues({ ...values, [f.key]: e.target.value })}
                            />
                          )}
                        </label>
                      ),
                    )}
                  </FormSection>
                ))}
              </fieldset>
              {loaded.error && (
                <p className="rsv-error" role="alert" style={{ margin: 0 }}>
                  {loaded.error}
                </p>
              )}
              <div className="rsv-actions">
                <CardButton label={t('common.cancel')} tone="neutral" onClick={() => setForm(null)} disabled={loaded.busy || uploading} />
                <button type="submit" className="rsv-btn rsv-btn--primary" disabled={loaded.busy || uploading} aria-busy={loaded.busy || undefined}>
                  {submitLabel}
                </button>
              </div>
            </form>
          </section>
        </div>
      )}
    </ReservationsPage>
  )
}
