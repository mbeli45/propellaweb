import React, { useState, useMemo, useCallback, useEffect, useRef } from 'react'
import { useLocation, useNavigate, useParams } from 'react-router-dom'
import { BadgeCheck, Check, CheckCheck, Image as ImageIcon, MessageCircle, Mic, Paperclip, Search, X } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import { useAuth } from '@/contexts/AuthContext'
import { useLanguage } from '@/contexts/I18nContext'
import { useChatList, ConversationSummary } from '@/hooks/useChatList'
import { useChatVisitContext, ChatVisit } from '@/hooks/useChatVisitContext'
import { useBadgeCounts } from '@/hooks/useBadgeCounts'
import { isVisitToday, reservationRef } from '@/components/reservations/ReservationUI'
import { MessageListSkeleton } from '@/components/skeletons'
import { chatListTimestamp } from '@/lib/chatDates'
import ChatDetail from '@/pages/chat/[id]'
import './Messages.css'

type Filter = 'all' | 'unread' | 'visits' | 'people'

const getInitials = (name: string) =>
  name
    .split(' ')
    .filter(Boolean)
    .map((word) => word.charAt(0))
    .join('')
    .toUpperCase()
    .slice(0, 2)

/**
 * Chats list (web). Mirrors propella/components/MessagesListScreen.tsx; on wide
 * screens the selected conversation opens in the right-hand pane.
 */
export default function UserMessages() {
  const { id: selectedChatId } = useParams<{ id?: string }>()
  const { user } = useAuth()
  const { t, currentLanguage } = useLanguage()
  const locale = currentLanguage === 'fr' ? 'fr-FR' : 'en-US'
  const navigate = useNavigate()
  const location = useLocation()
  // Mounted under both /user and /agent.
  const basePath = location.pathname.startsWith('/agent') ? '/agent/messages' : '/user/messages'
  const audience: 'customer' | 'agent' = user?.role === 'agent' || user?.role === 'landlord' ? 'agent' : 'customer'

  const { conversations, loading, error, refresh, unreadCounts, markConversationAsRead } = useChatList(user?.id || '')
  const visits = useChatVisitContext(user?.id, audience)
  const { clearMessageBadge } = useBadgeCounts(user?.id || '', user?.role)
  const searchRef = useRef<HTMLInputElement>(null)

  const [searchQuery, setSearchQuery] = useState('')
  const [activeFilter, setActiveFilter] = useState<Filter>('all')
  const [readConversations, setReadConversations] = useState<Set<string>>(new Set())
  const [localSelectedChatId, setLocalSelectedChatId] = useState<string | null>(null)
  const [isLargeScreen, setIsLargeScreen] = useState(window.innerWidth >= 1024)

  useEffect(() => {
    const handleResize = () => setIsLargeScreen(window.innerWidth >= 1024)
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  // On large screens keep the chat inline: adopt the :id from the URL, then
  // return the URL to the list route.
  useEffect(() => {
    if (isLargeScreen && selectedChatId) {
      setLocalSelectedChatId(selectedChatId)
      if (window.location.pathname.includes('/messages/')) window.history.replaceState({}, '', basePath)
    }
  }, [isLargeScreen, selectedChatId, basePath])

  useEffect(() => {
    if (user?.id) clearMessageBadge()
  }, [clearMessageBadge, user?.id])

  const isUnread = (c: ConversationSummary) => c.unread && !readConversations.has(c.counterpart.id)
  const unreadConversationIds = useMemo(
    () => conversations.filter(isUnread).map((c) => c.counterpart.id),
    [conversations, readConversations],
  )
  const unreadCount = unreadConversationIds.length

  // Customers filter to the agents/landlords they talk to; agents to their clients.
  const isPerson = (c: ConversationSummary) =>
    audience === 'customer'
      ? ['agent', 'landlord'].includes(c.counterpart.role || '')
      : !['agent', 'landlord'].includes(c.counterpart.role || '')
  const visitCount = conversations.filter((c) => visits.byCounterpart.has(c.counterpart.id)).length
  const peopleCount = conversations.filter(isPerson).length

  const filters: { key: Filter; label: string; count?: number; dot?: string }[] = [
    { key: 'all', label: t('messages.all') },
    ...(unreadCount > 0 ? [{ key: 'unread' as Filter, label: t('messages.unread'), count: unreadCount, dot: 'var(--chats-primary)' }] : []),
    ...(visitCount > 0 ? [{ key: 'visits' as Filter, label: t('messages.activeVisits'), count: visitCount, dot: 'var(--chats-success)' }] : []),
    ...(peopleCount > 0
      ? [{ key: 'people' as Filter, label: audience === 'customer' ? t('messages.agentsFilter') : t('messages.clientsFilter'), count: peopleCount }]
      : []),
  ]

  // Drop a filter that no longer matches anything (e.g. after "mark all read").
  useEffect(() => {
    if (!filters.some((f) => f.key === activeFilter)) setActiveFilter('all')
  }, [filters.length, activeFilter])

  const filteredConversations = useMemo(() => {
    let list = conversations
    if (activeFilter === 'unread') list = list.filter(isUnread)
    else if (activeFilter === 'visits') list = list.filter((c) => visits.byCounterpart.has(c.counterpart.id))
    else if (activeFilter === 'people') list = list.filter(isPerson)
    const query = searchQuery.trim().toLowerCase()
    if (query) {
      list = list.filter(
        (c) =>
          (c.counterpart.full_name || '').toLowerCase().includes(query) ||
          (c.lastMessage.content || '').toLowerCase().includes(query),
      )
    }
    // Chats with a visit today come first, then the usual most-recent order.
    return [...list].sort(
      (a, b) =>
        (isVisitToday(visits.byCounterpart.get(b.counterpart.id)) ? 1 : 0) -
        (isVisitToday(visits.byCounterpart.get(a.counterpart.id)) ? 1 : 0),
    )
  }, [conversations, searchQuery, activeFilter, readConversations, visits.byCounterpart])

  const markRead = useCallback(
    async (ids: string[]) => {
      if (!user?.id || ids.length === 0) return
      await Promise.all(ids.map((id) => markConversationAsRead(user.id, id)))
      setReadConversations((prev) => new Set([...prev, ...ids]))
      setTimeout(() => refresh(), 100)
    },
    [user?.id, markConversationAsRead, refresh],
  )

  const openConversation = (counterpartId: string, unread: boolean) => {
    if (unread) markRead([counterpartId]).catch((err) => console.error('Error marking conversation as read:', err))
    if (isLargeScreen) {
      setLocalSelectedChatId(counterpartId)
      window.history.pushState({}, '', `${basePath}/${counterpartId}`)
    } else {
      navigate(`/chat/${counterpartId}`)
    }
  }

  const visitTag = (visit: ChatVisit | undefined) => {
    if (!visit) return null
    if (isVisitToday(visit) && visit.status === 'confirmed') {
      const time = visit.reservation_time
        ? new Date(`2000-01-01T${visit.reservation_time}`).toLocaleTimeString(locale, { hour: '2-digit', minute: '2-digit' })
        : ''
      return { label: time ? t('messages.visitAt', { time }) : t('reservations.liveToday'), live: true }
    }
    return { label: reservationRef(visit.id), live: false }
  }

  const previewFor = (item: ConversationSummary): { icon: LucideIcon | null; text: string } => {
    const m = item.lastMessage
    if (m.voice_url) return { icon: Mic, text: t('messages.voiceMessage') }
    if (m.attachment_url && !m.content) {
      const isImage = (m.attachment_type || '').startsWith('image')
      return { icon: isImage ? ImageIcon : Paperclip, text: isImage ? t('messages.photo') : t('messages.attachment') }
    }
    return { icon: null, text: m.content }
  }

  const activeChatId = isLargeScreen ? localSelectedChatId : selectedChatId
  const showSkeleton = loading && conversations.length === 0
  const emptyIsFiltered = searchQuery || activeFilter !== 'all'

  return (
    <div className="chats">
      <section className="chats-list" aria-label={t('messages.chats')}>
        <header className="chats-header">
          <div className="chats-header-top">
            <div className="chats-title-row">
              <h1 className="chats-title">{t('messages.chats')}</h1>
              {unreadCount > 0 && <span className="chats-unread-pill">{t('messages.unreadChats', { num: unreadCount })}</span>}
            </div>
            <button type="button" className="chats-icon-btn" aria-label={t('messages.searchOrStartNewChat')} onClick={() => searchRef.current?.focus()}>
              <Search size={20} />
            </button>
          </div>

          <label className="chats-search">
            <Search size={18} aria-hidden="true" />
            <input
              ref={searchRef}
              type="search"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={t('messages.searchOrStartNewChat')}
              aria-label={t('messages.searchOrStartNewChat')}
            />
            {searchQuery && (
              <button type="button" className="chats-clear" onClick={() => setSearchQuery('')} aria-label={t('messages.clearSearch')}>
                <X size={16} />
              </button>
            )}
          </label>

          <div className="chats-filters" role="group" aria-label={t('messages.chats')}>
            {filters.map((option) => (
              <button
                key={option.key}
                type="button"
                className="chats-filter"
                aria-pressed={activeFilter === option.key}
                onClick={() => setActiveFilter(option.key)}
              >
                {option.dot && <span className="chats-filter-dot" style={{ background: option.dot }} />}
                {option.label}
                {option.count != null ? ` (${option.count})` : ''}
              </button>
            ))}
          </div>
        </header>

        {conversations.length > 0 && (
          <div className="chats-strip">
            <span className="chats-strip-text">
              {unreadCount > 0 ? t('messages.unreadSummary', { count: unreadCount }) : t('messages.allCaughtUp')}
            </span>
            {unreadCount > 0 && (
              <button
                type="button"
                className="chats-link"
                onClick={() => markRead(unreadConversationIds).catch((err) => console.error('Error marking all as read:', err))}
              >
                {t('messages.markAllRead')}
              </button>
            )}
          </div>
        )}

        <div className="chats-scroll">
          {showSkeleton ? (
            <MessageListSkeleton count={6} />
          ) : error && conversations.length === 0 ? (
            <p className="chats-error" role="alert">
              {error}
            </p>
          ) : filteredConversations.length === 0 ? (
            emptyIsFiltered ? (
              <div className="chats-empty">
                <p>{t('messages.noMatches')}</p>
              </div>
            ) : (
              <div className="chats-empty">
                <span className="chats-empty-icon" aria-hidden="true">
                  <MessageCircle size={40} />
                </span>
                <h2>{t('messages.noConversations')}</h2>
                <p>{audience === 'agent' ? t('messages.startChattingWithClients') : t('messages.startChattingWithAgents')}</p>
                <button
                  type="button"
                  className="chats-cta"
                  onClick={() => navigate(audience === 'agent' ? '/agent' : '/user/explore')}
                >
                  {audience === 'agent' ? t('agent.viewListings') : t('agent.exploreProperties')}
                </button>
              </div>
            )
          ) : (
            <ul className="chats-rows">
              {filteredConversations.map((item) => {
                const counterpart = item.counterpart
                const unread = isUnread(item)
                const count = unread ? unreadCounts[counterpart.id] || 1 : 0
                const outgoing = item.lastMessage.sender_id === user?.id
                const verified = Boolean(counterpart.is_verified_agent || (counterpart as any).verified)
                const visit = visits.byCounterpart.get(counterpart.id)
                const tag = visitTag(visit)
                const preview = previewFor(item)
                const PreviewIcon = preview.icon
                const avatar = typeof counterpart.avatar_url === 'string' ? counterpart.avatar_url : null
                const classes = ['chats-row', unread && 'is-unread', activeChatId === counterpart.id && 'is-selected']
                  .filter(Boolean)
                  .join(' ')
                return (
                  <li key={counterpart.id}>
                    <button
                      type="button"
                      className={classes}
                      aria-current={activeChatId === counterpart.id ? 'true' : undefined}
                      aria-label={[counterpart.full_name, tag?.label, preview.text, count ? t('messages.unreadMessagesA11y', { count }) : '']
                        .filter(Boolean)
                        .join(', ')}
                      onClick={() => openConversation(counterpart.id, unread)}
                    >
                      <span className="chats-avatar-wrap">
                        <span className="chats-avatar">
                          {avatar ? <img src={avatar} alt="" loading="lazy" /> : getInitials(counterpart.full_name || '')}
                        </span>
                        {/* Green dot = an active visit with this person (not online presence). */}
                        {visit && <span className="chats-visit-dot" />}
                      </span>
                      <span className="chats-body">
                        <span className="chats-name-row">
                          <span className="chats-name-group">
                            <span className="chats-name">{counterpart.full_name || t('common.user')}</span>
                            {verified && <BadgeCheck size={15} aria-hidden="true" />}
                            {tag && <span className={`chats-tag${tag.live ? ' is-live' : ''}`}>{tag.label}</span>}
                          </span>
                          <span className="chats-time">{chatListTimestamp(item.lastMessage.created_at, locale, t('messages.yesterday'))}</span>
                        </span>
                        <span className="chats-preview-row">
                          <span className="chats-preview">
                            {outgoing &&
                              (item.lastMessage.read ? (
                                <CheckCheck size={16} className="chats-read" aria-label={t('messages.readReceipt')} />
                              ) : (
                                <Check size={16} className="chats-sent" aria-label={t('messages.sentReceipt')} />
                              ))}
                            {PreviewIcon && <PreviewIcon size={15} aria-hidden="true" />}
                            <span>{preview.text}</span>
                          </span>
                          {count > 0 && <span className="chats-badge">{count > 9 ? '9+' : count}</span>}
                        </span>
                      </span>
                    </button>
                  </li>
                )
              })}
            </ul>
          )}
        </div>
      </section>

      <section className={`chats-pane${selectedChatId ? ' is-open' : ''}`} aria-label={t('messages.title')}>
        {activeChatId ? (
          <ChatDetail counterpartId={activeChatId} hideBackButton={isLargeScreen} />
        ) : isLargeScreen ? (
          <div className="chats-pane-empty">
            <div className="chats-empty">
              <span className="chats-empty-icon" aria-hidden="true">
                <MessageCircle size={40} />
              </span>
              <h2>{t('messages.selectConversation')}</h2>
              <p>{t('messages.selectConversationHint')}</p>
            </div>
          </div>
        ) : null}
      </section>
    </div>
  )
}
