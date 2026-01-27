import React, { useState, useMemo, useCallback, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useAuth } from '@/contexts/AuthContext'
import { useThemeMode } from '@/contexts/ThemeContext'
import { useLanguage } from '@/contexts/I18nContext'
import { getColors } from '@/constants/Colors'
import { useChatList } from '@/hooks/useChatList'
import { useMessages } from '@/hooks/useMessages'
import { useBadgeCounts } from '@/hooks/useBadgeCounts'
import { Search, X, MessageCircle, CheckCircle2, MoreVertical } from 'lucide-react'
import ChatDetail from '@/pages/chat/[id]'
import './Messages.css'

export default function UserMessages() {
  const { id: selectedChatId } = useParams<{ id?: string }>()
  const { user } = useAuth()
  const { colorScheme } = useThemeMode()
  const { t } = useLanguage()
  const Colors = getColors(colorScheme)
  const navigate = useNavigate()

  const { conversations, loading, error, refresh } = useChatList(user?.id || '')
  const { markConversationAsRead } = useMessages(user?.id || '')
  const { clearMessageBadge } = useBadgeCounts(user?.id || '', user?.role)

  const [searchQuery, setSearchQuery] = useState('')
  const [isSearchFocused, setIsSearchFocused] = useState(false)
  const [localSelectedChatId, setLocalSelectedChatId] = useState<string | null>(null)

  const [isLargeScreen, setIsLargeScreen] = useState(window.innerWidth >= 1024)

  useEffect(() => {
    const handleResize = () => {
      setIsLargeScreen(window.innerWidth >= 1024)
    }
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  // Initialize local selected chat from URL param on large screens
  useEffect(() => {
    if (isLargeScreen && selectedChatId && !localSelectedChatId) {
      setLocalSelectedChatId(selectedChatId)
    }
  }, [isLargeScreen, selectedChatId, localSelectedChatId])

  // On large screens, if we're on /user/messages/:id route, redirect to /user/messages
  // to keep everything inline
  useEffect(() => {
    if (isLargeScreen && selectedChatId && window.location.pathname.includes('/messages/')) {
      // Replace the URL to /user/messages but keep the chat selected via local state
      window.history.replaceState({}, '', '/user/messages')
      setLocalSelectedChatId(selectedChatId)
    }
  }, [isLargeScreen, selectedChatId])

  // Clear message badge when screen is opened
  useEffect(() => {
    if (user?.id) {
      clearMessageBadge()
    }
  }, [clearMessageBadge, user?.id])

  // Filter conversations based on search query
  const filteredConversations = useMemo(() => {
    if (!searchQuery.trim()) return conversations
    
    return conversations.filter(conversation => 
      conversation.counterpart.full_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      conversation.lastMessage.content?.toLowerCase().includes(searchQuery.toLowerCase())
    )
  }, [conversations, searchQuery])

  const handleConversationClick = useCallback(async (counterpartId: string) => {
    if (!user?.id) return
    
    // Mark messages as read
    try {
      await markConversationAsRead(user.id, counterpartId)
    } catch (error) {
      console.error('Error marking conversation as read:', error)
    }
    
    // On large screens, use local state to show chat inline (no navigation)
    // On small screens, navigate to full page chat
    if (isLargeScreen) {
      setLocalSelectedChatId(counterpartId)
      // Update URL without causing navigation
      window.history.pushState({}, '', `/user/messages/${counterpartId}`)
    } else {
      // Navigate to full page chat on mobile
      navigate(`/chat/${counterpartId}`)
    }
  }, [user?.id, markConversationAsRead, navigate, isLargeScreen])

  const formatTime = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diff = now.getTime() - date.getTime()
    const minutes = Math.floor(diff / 60000)
    const hours = Math.floor(diff / 3600000)
    const days = Math.floor(diff / 86400000)

    if (minutes < 1) return 'Just now'
    if (minutes < 60) return `${minutes}m ago`
    if (hours < 24) return `${hours}h ago`
    if (days < 7) return `${days}d ago`
    return date.toLocaleDateString()
  }

  const renderRoleBadge = (role: string) => {
    let bgColor = Colors.neutral[100]
    let textColor = Colors.neutral[600]
    
    switch(role) {
      case 'agent':
        bgColor = Colors.primary[100]
        textColor = Colors.primary[700]
        break
      case 'landlord':
        bgColor = Colors.success[100]
        textColor = Colors.success[700]
        break
    }
    
    return (
      <span style={{
        backgroundColor: bgColor,
        color: textColor,
        padding: '2px 8px',
        borderRadius: '12px',
        fontSize: '11px',
        fontWeight: '500',
        textTransform: 'capitalize'
      }}>
        {role}
      </span>
    )
  }

  return (
    <div className="messages-container" style={{ 
      backgroundColor: Colors.white, 
      minHeight: '100vh',
      display: 'flex',
      flexDirection: isLargeScreen ? 'row' : 'column',
      height: '100vh',
      overflow: 'hidden'
    }}>
      {/* Chat List Sidebar */}
      <div className="messages-list-container" style={{
        width: isLargeScreen ? '400px' : '100%',
        flexShrink: 0,
        display: 'flex',
        flexDirection: 'column',
        borderRight: isLargeScreen ? `1px solid ${Colors.neutral[200]}` : 'none',
        backgroundColor: Colors.white
      }}>
        {/* Header */}
        <div className="messages-header" style={{ 
          backgroundColor: Colors.primary[600],
          padding: '20px 16px 16px',
          color: Colors.white
        }}>
          <h1 style={{ fontSize: '20px', fontWeight: '600', marginBottom: '16px' }}>
            {t('messages.title')}
          </h1>
          
          {/* Search Bar */}
          <div className="messages-search-container">
            <div 
              className="messages-search-input-wrapper"
              style={{
                backgroundColor: Colors.white,
                borderColor: isSearchFocused ? Colors.primary[400] : Colors.neutral[200],
              }}
            >
              <Search size={20} color={Colors.neutral[400]} />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onFocus={() => setIsSearchFocused(true)}
                onBlur={() => setIsSearchFocused(false)}
                placeholder={t('messages.searchOrStartNewChat')}
                className="messages-search-input"
                style={{ color: Colors.neutral[800] }}
              />
              {searchQuery.length > 0 && (
                <button
                  onClick={() => setSearchQuery('')}
                  style={{
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    padding: '4px',
                    display: 'flex',
                    alignItems: 'center'
                  }}
                >
                  <X size={16} color={Colors.neutral[400]} />
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Conversations List */}
        <div className="messages-content">
          {loading && (
            <div style={{ padding: '40px', textAlign: 'center', color: Colors.neutral[600] }}>
              {t('common.loading')}...
            </div>
          )}

          {error && (
            <div style={{ padding: '40px', textAlign: 'center', color: Colors.error[600] }}>
              {error}
            </div>
          )}

          {!loading && !error && filteredConversations.length === 0 && (
            <div className="messages-empty-state">
              <MessageCircle size={64} color={Colors.neutral[400]} />
              <h2 style={{ color: Colors.neutral[800], marginTop: '16px', marginBottom: '8px' }}>
                {t('messages.noConversations')}
              </h2>
              <p style={{ color: Colors.neutral[600] }}>
                {t('messages.startChattingWithAgents')}
              </p>
            </div>
          )}

          {!loading && !error && filteredConversations.length > 0 && (
            <div className="messages-list">
              {filteredConversations.map((conversation) => {
                const counterpart = conversation.counterpart
                const lastMessage = conversation.lastMessage
                const isUnread = conversation.unread
                const isSelected = (isLargeScreen ? localSelectedChatId : selectedChatId) === counterpart.id
                
                return (
                  <div
                    key={counterpart.id}
                    onClick={() => handleConversationClick(counterpart.id)}
                    className="messages-item"
                    style={{
                      backgroundColor: isSelected ? Colors.primary[50] : Colors.white,
                      borderBottom: `1px solid ${Colors.neutral[200]}`,
                      borderLeft: isSelected ? `4px solid ${Colors.primary[600]}` : '4px solid transparent',
                    }}
                  >
                    <div className="messages-item-avatar">
                      {counterpart.avatar_url ? (
                        <img
                          src={counterpart.avatar_url}
                          alt={counterpart.full_name || ''}
                          style={{
                            width: '48px',
                            height: '48px',
                            borderRadius: '24px',
                            objectFit: 'cover'
                          }}
                        />
                      ) : (
                        <div style={{
                          width: '48px',
                          height: '48px',
                          borderRadius: '24px',
                          backgroundColor: Colors.neutral[200],
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          color: Colors.neutral[500],
                          fontSize: '18px',
                          fontWeight: '600'
                        }}>
                          {counterpart.full_name?.charAt(0).toUpperCase() || 'U'}
                        </div>
                      )}
                      {isUnread && (
                        <span style={{
                          position: 'absolute',
                          top: '-2px',
                          right: '-2px',
                          width: '12px',
                          height: '12px',
                          borderRadius: '6px',
                          backgroundColor: Colors.primary[600],
                          border: `2px solid ${Colors.white}`
                        }} />
                      )}
                    </div>

                    <div className="messages-item-content">
                      <div className="messages-item-header">
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flex: 1 }}>
                          <span style={{
                            fontSize: '16px',
                            fontWeight: isUnread ? '600' : '500',
                            color: Colors.neutral[900]
                          }}>
                            {counterpart.full_name || t('common.user')}
                          </span>
                          {counterpart.is_verified_agent && (
                            <CheckCircle2 size={16} color={Colors.success[600]} />
                          )}
                          {counterpart.role && renderRoleBadge(counterpart.role)}
                        </div>
                        <span style={{
                          fontSize: '12px',
                          color: isUnread ? Colors.primary[600] : Colors.neutral[500],
                          fontWeight: isUnread ? '500' : '400'
                        }}>
                          {lastMessage.created_at ? formatTime(lastMessage.created_at) : ''}
                        </span>
                      </div>
                      <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        marginTop: '4px'
                      }}>
                        <p style={{
                          fontSize: '14px',
                          color: Colors.neutral[600],
                          margin: 0,
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap',
                          flex: 1
                        }}>
                          {lastMessage.attachment_url 
                            ? `📎 ${t('messages.attachment') || 'Attachment'}`
                            : lastMessage.content || t('messages.noMessages') || 'No message'
                          }
                        </p>
                        {isUnread && (
                          <span style={{
                            width: '8px',
                            height: '8px',
                            borderRadius: '4px',
                            backgroundColor: Colors.primary[600],
                            marginLeft: '8px'
                          }} />
                        )}
                      </div>
                    </div>

                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        // Handle more options
                      }}
                      style={{
                        background: 'none',
                        border: 'none',
                        cursor: 'pointer',
                        padding: '8px',
                        display: 'flex',
                        alignItems: 'center'
                      }}
                    >
                      <MoreVertical size={20} color={Colors.neutral[400]} />
                    </button>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>

      {/* Chat Detail - Show on large screens or when route has ID */}
      <div className="messages-chat-container" style={{
        flex: 1,
        display: isLargeScreen || selectedChatId ? 'flex' : 'none',
        flexDirection: 'column',
        height: '100%',
        overflow: 'hidden'
      }}>
        {(isLargeScreen ? localSelectedChatId : selectedChatId) ? (
          <ChatDetail counterpartId={isLargeScreen ? localSelectedChatId! : selectedChatId!} hideBackButton={isLargeScreen} />
        ) : isLargeScreen ? (
          <div style={{
            flex: 1,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: Colors.neutral[50],
            color: Colors.neutral[500],
            textAlign: 'center',
            padding: '40px'
          }}>
            <div>
              <MessageCircle size={64} color={Colors.neutral[400]} style={{ marginBottom: '16px', opacity: 0.5 }} />
              <p style={{ fontSize: '18px', fontWeight: '500', marginBottom: '8px' }}>
                {t('messages.selectConversation')}
              </p>
              <p style={{ fontSize: '14px' }}>
                {t('messages.selectConversationHint')}
              </p>
            </div>
          </div>
        ) : null}
      </div>
    </div>
  )
}
