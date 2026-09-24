import { useEffect, useMemo, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { AlertCircle, ChevronLeft, BadgeCheck, Home as HomeIcon, Star, UserX } from 'lucide-react'
import { useLanguage } from '@/contexts/I18nContext'
import { useAuth } from '@/contexts/AuthContext'
import { useAgentProfile } from '@/hooks/useAgentProfile'
import { supabase } from '@/lib/supabase'
import PropertyCard from '@/components/PropertyCard'
import SEO from '@/components/SEO'
import { generateAgentStructuredData, getCanonicalBaseUrl } from '@/utils/seoUtils'
import ModerationActions from '@/components/moderation/ModerationActions'
import { AgentProfileSkeleton } from '@/components/skeletons'
import { EmptyState } from '@/components/reservations/ReservationUI'
import './AgentProfile.css'

const initialsOf = (name: string) =>
  name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join('')

export default function AgentProfile() {
  const { id: agentId } = useParams<{ id: string }>()
  const { t, currentLanguage } = useLanguage()
  const locale = currentLanguage === 'fr' ? 'fr-FR' : 'en-US'
  const navigate = useNavigate()
  const { user } = useAuth()

  const { agent, reviews, properties, averageRating, loading, error, refetch } = useAgentProfile(agentId || '')

  const [showAllReviews, setShowAllReviews] = useState(false)
  const [showAllProperties, setShowAllProperties] = useState(false)
  // True when the viewer completed a visit with this agent and hasn't reviewed it.
  const [canRate, setCanRate] = useState(false)
  const isSelf = !!user && user.id === agentId

  const structuredData = useMemo(() => {
    if (!agent) return undefined
    return generateAgentStructuredData({ ...agent, phone: undefined, email: undefined }, properties.length, reviews.length, averageRating)
  }, [agent, properties.length, reviews.length, averageRating])

  // Reviews come only from completed visits: offer "Rate your visit" when the
  // viewer has one with this agent that isn't reviewed yet.
  useEffect(() => {
    if (!user?.id || !agentId || isSelf) {
      setCanRate(false)
      return
    }
    let active = true
    ;(async () => {
      try {
        const [{ data: visits }, { data: written }] = await Promise.all([
          supabase
            .from('reservations')
            .select('id, property:property_id!inner(owner_id)')
            .eq('user_id', user.id)
            .eq('status', 'completed')
            .eq('property.owner_id', agentId),
          supabase.from('agent_reviews').select('reservation_id').eq('user_id', user.id).eq('agent_id', agentId),
        ])
        const reviewed = new Set((written || []).map((r: any) => r.reservation_id))
        if (active) setCanRate((visits || []).some((v: any) => !reviewed.has(v.id)))
      } catch {
        if (active) setCanRate(false)
      }
    })()
    return () => {
      active = false
    }
  }, [user?.id, agentId, isSelf, reviews.length])

  const header = (
    <header className="ap-header">
      <button type="button" className="ap-icon-btn" onClick={() => navigate(-1)} aria-label={t('common.back')}>
        <ChevronLeft size={22} />
      </button>
      <h1 className="ap-header-title">{t('agentProfile.title')}</h1>
      {agent && !isSelf && (
        <ModerationActions
          targetUserId={agentId}
          targetUserName={agent.full_name}
          contentType="profile"
          contentId={agentId}
          size="compact"
          onBlocked={() => navigate(-1)}
        />
      )}
    </header>
  )

  if (loading) {
    return (
      <div className="ap-page">
        {header}
        <AgentProfileSkeleton />
      </div>
    )
  }

  if (error || !agent) {
    return (
      <div className="ap-page">
        {header}
        <EmptyState
          icon={error ? AlertCircle : UserX}
          title={error ? t('agentProfile.loadErrorTitle') : t('agentProfile.notFoundTitle')}
          body={error ? t('agentProfile.loadErrorBody') : t('agentProfile.notFoundBody')}
          action={error ? { label: t('common.retry'), onClick: () => refetch() } : { label: t('common.back'), onClick: () => navigate(-1) }}
        />
      </div>
    )
  }

  const name = agent.full_name || t('agentProfile.anonymous')
  const createdAt = (agent as any).created_at as string | undefined
  const roleLabel = agent.is_verified_agent
    ? t('agentProfile.verifiedAgent')
    : agent.role === 'agent'
      ? t('propertyDetails.roleAgent')
      : agent.role === 'landlord'
        ? t('propertyDetails.roleLandlord')
        : t('property.owner')
  const shownProperties = showAllProperties ? properties : properties.slice(0, 6)
  const shownReviews = showAllReviews ? reviews : reviews.slice(0, 4)

  // Language-aware SEO content
  const seoTitle = currentLanguage === 'fr'
    ? `${agent.full_name || 'Agent'} - Agent Immobilier au Cameroun | Propella`
    : `${agent.full_name || 'Agent'} - Real Estate Agent in Cameroon | Propella`
  const seoDescription = currentLanguage === 'fr'
    ? `${agent.full_name || 'Agent'} est un agent immobilier professionnel au Cameroun. ${agent.bio || `Découvrez ${properties.length} propriété${properties.length > 1 ? 's' : ''} listée${properties.length > 1 ? 's' : ''} par cet agent.`}`
    : `${agent.full_name || 'Agent'} is a professional real estate agent in Cameroon. ${agent.bio || `Discover ${properties.length} propert${properties.length === 1 ? 'y' : 'ies'} listed by this agent.`}`
  const seoKeywords = currentLanguage === 'fr'
    ? `${agent.full_name}, agent immobilier Cameroun, agence immobilière ${(agent as any).location || 'Cameroun'}, Propella`
    : `${agent.full_name}, real estate agent Cameroon, real estate agency ${(agent as any).location || 'Cameroon'}, Propella`
  const baseUrl = getCanonicalBaseUrl()

  return (
    <>
      <SEO
        title={seoTitle}
        description={seoDescription}
        keywords={seoKeywords}
        image={agent.avatar_url || '/app-icon.png'}
        url={`${baseUrl}/agents/${agentId}`}
        type="profile"
        structuredData={structuredData}
      />
      <div className="ap-page">
        {header}

        <div className="ap-layout">
          {/* Profile */}
          <aside className="ap-profile">
            <div className="ap-avatar" aria-hidden="true">
              {agent.avatar_url ? <img src={agent.avatar_url} alt="" /> : initialsOf(name) || '?'}
            </div>
            <h2 className="ap-name">
              <span>{name}</span>
              {agent.is_verified_agent && <BadgeCheck size={20} aria-label={t('agentProfile.verifiedAgent')} />}
            </h2>
            <p className="ap-role">{roleLabel}</p>
            {createdAt && (
              <p className="ap-meta">
                {t('agentProfile.memberSince', {
                  date: new Date(createdAt).toLocaleDateString(locale, { month: 'long', year: 'numeric' }),
                })}
              </p>
            )}
            {agent.bio && <p className="ap-bio">{agent.bio}</p>}
            <div className="ap-stats">
              <a className="ap-stat" href="#agent-listings">
                <strong>{properties.length}</strong>
                <span>{t('agentProfile.listings')}</span>
              </a>
              <div className="ap-stat">
                <strong>
                  {averageRating !== null && <Star size={15} color="#F59E0B" fill="#F59E0B" aria-hidden="true" />}
                  {averageRating !== null ? averageRating.toFixed(1) : '—'}
                </strong>
                <span>{t('agentProfile.rating')}</span>
              </div>
              <a className="ap-stat" href="#agent-reviews">
                <strong>{reviews.length}</strong>
                <span>{t('agentProfile.reviews')}</span>
              </a>
            </div>
          </aside>

          <main className="ap-main">
            {/* Listings */}
            <section id="agent-listings" className="ap-section">
              <div className="ap-section-head">
                <h2>{t('agentProfile.listings')}</h2>
                {properties.length > 6 && (
                  <button type="button" className="ap-link" onClick={() => setShowAllProperties((v) => !v)}>
                    {showAllProperties ? t('agentProfile.showLess') : t('agentProfile.seeAll')}
                  </button>
                )}
              </div>
              {properties.length === 0 ? (
                <div className="ap-card">
                  <EmptyState compact icon={HomeIcon} title={t('agentProfile.listingsEmptyTitle')} body={t('agentProfile.listingsEmptyBody', { name })} />
                </div>
              ) : (
                <div className="ap-grid">
                  {shownProperties.map((property) => (
                    <PropertyCard key={property.id} property={{ ...property, image: property.images?.[0] || '', isVerified: !!agent.is_verified_agent }} />
                  ))}
                </div>
              )}
            </section>

            {/* Reviews */}
            <section id="agent-reviews" className="ap-section">
              <div className="ap-section-head">
                <h2>{t('agentProfile.reviews')}</h2>
                {reviews.length > 4 && (
                  <button type="button" className="ap-link" onClick={() => setShowAllReviews((v) => !v)}>
                    {showAllReviews ? t('agentProfile.showLess') : t('agentProfile.seeAll')}
                  </button>
                )}
              </div>

              {canRate && (
                <div className="ap-rate">
                  <p>{t('agentProfile.rateYourVisitHint')}</p>
                  <button type="button" className="ap-btn" onClick={() => navigate('/user/reservations')}>
                    <Star size={16} aria-hidden="true" />
                    {t('agentProfile.rateYourVisit')}
                  </button>
                </div>
              )}

              <div className="ap-card">
                {reviews.length === 0 ? (
                  <EmptyState compact icon={Star} title={t('agentProfile.reviewsEmptyTitle')} body={t('agentProfile.reviewsEmptyBody')} />
                ) : (
                  <>
                    {averageRating !== null && (
                      <div className="ap-rating-summary">
                        <strong>{averageRating.toFixed(1)}</strong>
                        <div>
                          <div className="ap-stars" aria-label={`${averageRating.toFixed(1)} / 5`}>
                            {[1, 2, 3, 4, 5].map((i) => (
                              <Star
                                key={i}
                                size={18}
                                color={i <= Math.round(averageRating) ? '#F59E0B' : 'var(--color-neutral-300, #d1d5db)'}
                                fill={i <= Math.round(averageRating) ? '#F59E0B' : 'none'}
                                aria-hidden="true"
                              />
                            ))}
                          </div>
                          <span>{t('agentProfile.reviewsCount', { count: reviews.length })}</span>
                        </div>
                      </div>
                    )}
                    <ul className="ap-reviews">
                      {shownReviews.map((review, idx) => {
                        const reviewer = review.user?.full_name || t('agentProfile.anonymous')
                        return (
                          <li key={review.id || idx} className="ap-review">
                            <div className="ap-review-head">
                              <span className="ap-review-avatar" aria-hidden="true">
                                {review.user?.avatar_url ? <img src={review.user.avatar_url} alt="" /> : initialsOf(reviewer) || '?'}
                              </span>
                              <div className="ap-review-who">
                                <strong>{reviewer}</strong>
                                <span>
                                  {new Date(review.created_at).toLocaleDateString(locale, { day: 'numeric', month: 'short', year: 'numeric' })}
                                </span>
                              </div>
                              <div className="ap-stars" aria-label={`${review.rating} / 5`}>
                                {[1, 2, 3, 4, 5].map((i) => (
                                  <Star
                                    key={i}
                                    size={13}
                                    color={i <= review.rating ? '#F59E0B' : 'var(--color-neutral-300, #d1d5db)'}
                                    fill={i <= review.rating ? '#F59E0B' : 'none'}
                                    aria-hidden="true"
                                  />
                                ))}
                              </div>
                            </div>
                            {review.comment && <p>{review.comment}</p>}
                          </li>
                        )
                      })}
                    </ul>
                  </>
                )}
              </div>
            </section>
          </main>
        </div>
      </div>
    </>
  )
}
