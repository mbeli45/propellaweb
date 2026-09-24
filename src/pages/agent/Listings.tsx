import React, { useState, useEffect, useMemo, useRef } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { useThemeMode } from '@/contexts/ThemeContext'
import { useLanguage } from '@/contexts/I18nContext'
import { getColors } from '@/constants/Colors'
import { useProperties } from '@/hooks/useProperties'
import { useAgentPropertyReservations } from '@/hooks/useReservations'
import { usePropertyViews } from '@/hooks/usePropertyViews'
import { useStorage } from '@/hooks/useStorage'
import { useDialog } from '@/contexts/DialogContext'
import PropertyCard from '@/components/PropertyCard'
import { Plus, BarChart3, Home, RefreshCw, Wallet, AlertCircle, HeartHandshake } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { confirmPropertyAvailability } from '@/hooks/usePropertyAvailability'
import './Listings.css'
import { PropertyCardSkeleton } from '@/components/skeletons'
import {
  CardButton,
  EmptyState,
  ReservationToolbar,
  ReservationsHeader,
  ReservationsPage,
  StatStrip,
} from '@/components/reservations/ReservationUI'

export default function AgentListings() {
  const { user } = useAuth()
  const { colorScheme } = useThemeMode()
  const { t } = useLanguage()
  const Colors = getColors(colorScheme)
  const navigate = useNavigate()
  const { getAgentTotalViews } = usePropertyViews()
  const { pendingUploads, retryPendingUpload } = useStorage()
  const [retryingPendingId, setRetryingPendingId] = useState<string | null>(null)
  const previousPendingCountRef = useRef<number>(pendingUploads.length)

  const { properties, loading, error, refetch, deleteProperty } = useProperties(user?.id || '')
  const { reservations: agentReservations } = useAgentPropertyReservations(user?.id || '')
  const { confirm, alert } = useDialog()
  const [totalViews, setTotalViews] = useState(0)
  const [activeTab, setActiveTab] = useState<'active' | 'reserved' | 'sold'>('active')
  const [search, setSearch] = useState('')
  const [deletingPropertyId, setDeletingPropertyId] = useState<string | null>(null)
  const [confirmingAvailabilityId, setConfirmingAvailabilityId] = useState<string | null>(null)
  // Keeps the freshly stamped date on screen without refetching the whole list.
  const [confirmedOverrides, setConfirmedOverrides] = useState<Record<string, string>>({})

  const handleConfirmAvailability = async (propertyId: string) => {
    if (!user?.id || confirmingAvailabilityId) return

    setConfirmingAvailabilityId(propertyId)
    const result = await confirmPropertyAvailability(propertyId, user.id)
    setConfirmingAvailabilityId(null)

    if (result.ok) {
      setConfirmedOverrides((prev) => ({ ...prev, [propertyId]: result.confirmedAt }))
    } else {
      alert(
        result.reason === 'missing_media'
          ? t('availability.confirmNeedsPhoto', 'Add at least one photo to this listing before confirming it.')
          : t('availability.confirmFailed', 'Could not confirm availability. Please try again.')
      )
    }
  }

  useEffect(() => {
    const fetchTotalViews = async () => {
      if (user?.id) {
        const views = await getAgentTotalViews(user.id)
        setTotalViews(views)
      }
    }
    fetchTotalViews()
  }, [user?.id, getAgentTotalViews])

  const filteredProperties = useMemo(() => {
    if (!properties) return []
    const q = search.trim().toLowerCase()
    const matches = (p: any) => !q || `${p.title || ''} ${p.location || ''} ${p.town || ''}`.toLowerCase().includes(q)
    
    switch (activeTab) {
      case 'active':
        return properties.filter(p => p.status === 'available' && matches(p))
      case 'reserved':
        return properties.filter(p => p.status === 'reserved' && matches(p))
      case 'sold':
        return properties.filter(p => p.status === 'sold' && matches(p))
      default:
        return properties.filter(matches)
    }
  }, [properties, activeTab, search])

  const handleEdit = (propertyId: string) => {
    navigate(`/property/edit/${propertyId}`)
  }

  const handleDelete = async (propertyId: string) => {
    const confirmed = await confirm({
      title: t('property.deleteProperty') || 'Delete Property',
      message: t('agent.deletePropertyMessage') || t('property.deletePropertyMessage') || 'Are you sure you want to delete this property? This action cannot be undone.',
      confirmText: t('common.delete') || 'Delete',
      cancelText: t('common.cancel') || 'Cancel',
      variant: 'danger',
    })

    if (!confirmed) {
      return
    }

    setDeletingPropertyId(propertyId)
    try {
      const success = await deleteProperty(propertyId)
      if (success) {
        // Property will be removed from list automatically via refetch
        refetch()
      } else {
        alert(t('agent.failedToDeleteProperty') || t('property.failedToDeleteProperty') || 'Failed to delete property. Please try again.', 'error')
      }
    } catch (err: any) {
      console.error('Delete property error:', err)
      alert(err.message || t('agent.failedToDeleteProperty') || t('property.failedToDeleteProperty') || 'Failed to delete property.', 'error')
    } finally {
      setDeletingPropertyId(null)
    }
  }

  const handleRetryOutboxItem = async (pendingId: string) => {
    setRetryingPendingId(pendingId)
    const result = await retryPendingUpload(pendingId)
    setRetryingPendingId(null)
    if (result && !result.error) {
      alert('Upload retried successfully.', 'success')
      return
    }
    alert(result?.error || 'Retry failed.', 'error')
  }

  const hasPendingCards = activeTab === 'active' && pendingUploads.length > 0

  const getPendingCardImageSrc = (item: { previewUrl?: string; file: File | string }) => {
    if (item.previewUrl) return item.previewUrl
    if (
      typeof item.file === 'string' &&
      (item.file.startsWith('blob:') || item.file.startsWith('data:'))
    ) {
      return item.file
    }
    return '/placeholder-property.jpg'
  }

  useEffect(() => {
    const previousPendingCount = previousPendingCountRef.current
    if (pendingUploads.length < previousPendingCount) {
      refetch()
    }
    previousPendingCountRef.current = pendingUploads.length
  }, [pendingUploads.length, refetch])

  const counts = {
    active: properties?.filter((p) => p.status === 'available').length || 0,
    reserved: properties?.filter((p) => p.status === 'reserved').length || 0,
    sold: properties?.filter((p) => p.status === 'sold').length || 0,
  }
  const total = properties?.length || 0

  return (
    <ReservationsPage label={t('agentDashboard.title')}>
      <ReservationsHeader
        title={t('agentDashboard.title')}
        count={total}
        subtitle={t('agent.manageListings')}
        action={{ label: t('agent.addProperty'), icon: Plus, onClick: () => navigate('/property/add') }}
      />

      <StatStrip
        items={[
          { label: t('agentDashboard.listings'), value: total },
          { label: t('agent.available'), value: counts.active },
          { label: t('agent.views'), value: totalViews, onClick: () => navigate('/agent/analytics') },
          { label: t('agent.statBookings'), value: agentReservations?.length || 0, onClick: () => navigate('/agent/reservations') },
        ]}
      />

      <div className="ds-shortcuts">
        <CardButton label={t('reservations.dealsButton')} icon={HeartHandshake} tone="neutral" onClick={() => navigate('/agent/deals')} />
        <CardButton label={t('profileMenu.analytics')} icon={BarChart3} tone="neutral" onClick={() => navigate('/agent/analytics')} />
        <CardButton label={t('navigation.wallet')} icon={Wallet} tone="neutral" onClick={() => navigate('/agent/wallet')} />
      </div>

      {total > 0 && (
        <ReservationToolbar
          search={search}
          onSearch={setSearch}
          placeholder={t('reservations.searchPlaceholder', 'Search property, location or reference')}
          options={[
            { key: 'active', label: t('agent.available'), count: counts.active },
            { key: 'reserved', label: t('agentDashboard.reserved'), count: counts.reserved },
            { key: 'sold', label: t('agentDashboard.sold'), count: counts.sold },
          ]}
          value={activeTab}
          onChange={(key) => setActiveTab(key as 'active' | 'reserved' | 'sold')}
          label={t('agentDashboard.listings')}
        />
      )}

      {loading && filteredProperties.length === 0 && !hasPendingCards && <PropertyCardSkeleton count={6} />}

      {error && (
        <EmptyState
          icon={AlertCircle}
          title={t('agent.errorLoadingProperties')}
          body={t('agent.pleaseTryRefreshing')}
          action={{ label: t('agent.refresh'), icon: RefreshCw, onClick: () => refetch() }}
        />
      )}

      {!loading && !error && filteredProperties.length === 0 && !hasPendingCards && (
        total === 0 ? (
          <EmptyState
            icon={Home}
            title={t('agent.noAvailableProperties')}
            body={t('agent.startByAddingFirstProperty')}
            action={{ label: t('agent.addProperty'), icon: Plus, onClick: () => navigate('/property/add') }}
          />
        ) : (
          <EmptyState
            compact
            icon={Home}
            title={
              search.trim()
                ? t('agentDashboard.noResults')
                : activeTab === 'active'
                  ? t('agent.noAvailableProperties')
                  : activeTab === 'reserved'
                    ? t('agent.noReservedProperties')
                    : t('agent.noSoldProperties')
            }
          />
        )
      )}

      {!error && (filteredProperties.length > 0 || hasPendingCards) && (
        <div className="properties-list" style={{
          paddingTop: '16px',
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(min(100%, 280px), 1fr))',
          gap: '16px'
        }}>
          {activeTab === 'active' && pendingUploads.map((item: any) => (
            <div key={`pending-${item.id}`} style={{ position: 'relative' }}>
              <PropertyCard
                property={{
                  id: `pending-${item.id}`,
                  title: item.propertyDraft?.title || 'Uploading property...',
                  price: item.propertyDraft?.price || 0,
                  location: item.propertyDraft?.location || 'Background upload in progress',
                  image: getPendingCardImageSrc(item),
                  images: [getPendingCardImageSrc(item)],
                  type: item.propertyDraft?.type || 'rent',
                  category: item.propertyDraft?.category || 'standard',
                  status: 'available',
                  owner_id: user?.id || 'pending',
                }}
                isOwner
                onClick={() => {}}
              />
              <div style={{
                position: 'absolute',
                top: '12px',
                left: '12px',
                padding: '4px 10px',
                borderRadius: '12px',
                backgroundColor: item.status === 'failed' ? Colors.error[600] : Colors.warning[600],
                color: '#fff',
                fontSize: '11px',
                fontWeight: 700,
                zIndex: 10,
              }}>
                {item.status === 'failed' ? t('agentDashboard.uploadFailed') : t('agentDashboard.uploading')}
              </div>
              {item.status === 'failed' && (
                <button
                  onClick={() => handleRetryOutboxItem(item.id)}
                  disabled={retryingPendingId === item.id}
                  style={{
                    position: 'absolute',
                    right: '12px',
                    bottom: '12px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    borderRadius: '10px',
                    border: `1px solid ${Colors.warning[300]}`,
                    backgroundColor: Colors.warning[100],
                    color: Colors.warning[800],
                    padding: '6px 10px',
                    fontSize: '12px',
                    fontWeight: 700,
                    cursor: retryingPendingId === item.id ? 'default' : 'pointer',
                    zIndex: 10,
                  }}
                >
                  <RefreshCw size={14} color={Colors.warning[700]} />
                  {retryingPendingId === item.id ? t('agentDashboard.retrying') : t('agentDashboard.retry')}
                </button>
              )}
            </div>
          ))}
          {filteredProperties.map((property) => {
            const confirmedAt = confirmedOverrides[property.id] ?? property.availability_confirmed_at

            return (
              <PropertyCard
                key={property.id}
                property={{ ...property, availability_confirmed_at: confirmedAt }}
                isOwner
                onEdit={() => handleEdit(property.id)}
                onDelete={() => handleDelete(property.id)}
                onConfirmAvailability={() => handleConfirmAvailability(property.id)}
                confirmingAvailability={confirmingAvailabilityId === property.id}
              />
            )
          })}
        </div>
      )}
    </ReservationsPage>
  )
}
