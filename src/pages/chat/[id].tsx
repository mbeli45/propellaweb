import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useAuth } from '@/contexts/AuthContext'
import { useThemeMode } from '@/contexts/ThemeContext'
import { useLanguage } from '@/contexts/I18nContext'
import { getColors } from '@/constants/Colors'
import { useMessages } from '@/hooks/useMessages'
import { usePresence } from '@/hooks/usePresence'
import { useStorage } from '@/hooks/useStorage'
import { Send, Paperclip, ArrowLeft, MoreVertical, Phone, Video, Check, CheckCheck, Clock } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import './Chat.css'

interface ChatDetailProps {
  counterpartId?: string
  hideBackButton?: boolean
}

export default function ChatDetail({ counterpartId: propCounterpartId, hideBackButton = false }: ChatDetailProps = {} as ChatDetailProps) {
  const { id: routeCounterpartId } = useParams<{ id?: string }>()
  const counterpartId = propCounterpartId || routeCounterpartId
  const { user: currentUser } = useAuth()
  const { colorScheme } = useThemeMode()
  const { t } = useLanguage()
  const Colors = getColors(colorScheme)
  const navigate = useNavigate()
  const { pickImage, uploadImage, uploading: uploadingMedia } = useStorage()

  const {
    messages,
    loading: messagesLoading,
    error: messagesError,
    sendMessage,
    markConversationAsRead,
    refreshMessages,
  } = useMessages(currentUser?.id || '')

  const {
    isTargetOnline,
    targetLastSeen,
    isTyping,
    startTyping,
    stopTyping,
  } = usePresence(counterpartId)

  const [newMessageText, setNewMessageText] = useState('')
  const [counterpartProfile, setCounterpartProfile] = useState<any>(null)
  const [profileLoading, setProfileLoading] = useState(true)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLTextAreaElement>(null)

  // Filter messages for this conversation
  const conversationMessages = useMemo(() => {
    if (!currentUser?.id || !counterpartId) return []
    return messages.filter(m => 
      (m.sender_id === currentUser.id && m.receiver_id === counterpartId) ||
      (m.sender_id === counterpartId && m.receiver_id === currentUser.id)
    ).sort((a, b) => 
      new Date(a.created_at || '').getTime() - new Date(b.created_at || '').getTime()
    )
  }, [messages, currentUser?.id, counterpartId])

  // Fetch counterpart profile
  useEffect(() => {
    if (!counterpartId) return

    const fetchProfile = async () => {
      try {
        setProfileLoading(true)
        const { data, error } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', counterpartId)
          .single()

        if (error) throw error
        setCounterpartProfile(data)
      } catch (error: any) {
        console.error('Error fetching profile:', error)
      } finally {
        setProfileLoading(false)
      }
    }

    fetchProfile()
  }, [counterpartId])

  // Mark conversation as read when opened
  useEffect(() => {
    if (currentUser?.id && counterpartId) {
      markConversationAsRead(currentUser.id, counterpartId)
    }
  }, [currentUser?.id, counterpartId, markConversationAsRead])

  // Scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [conversationMessages])

  const handleSend = async () => {
    if (!newMessageText.trim() || !currentUser?.id || !counterpartId) return

    try {
      await sendMessage(currentUser.id, counterpartId, newMessageText.trim())
      setNewMessageText('')
      inputRef.current?.focus()
    } catch (error) {
      console.error('Error sending message:', error)
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  const handleImagePick = async () => {
    try {
      const image = await pickImage()
      if (image && currentUser?.id && counterpartId) {
        const uploadedUrl = await uploadImage(image, 'messages')
        await sendMessage(currentUser.id, counterpartId, '', uploadedUrl)
      }
    } catch (error) {
      console.error('Error sending image:', error)
    }
  }

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
    return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })
  }

  const getMessageStatus = (message: any) => {
    if (message.read) return <CheckCheck size={14} color={Colors.primary[600]} />
    if (message.sent) return <Check size={14} color={Colors.neutral[400]} />
    return <Clock size={14} color={Colors.neutral[400]} />
  }

  if (profileLoading || messagesLoading) {
    return (
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        height: '100vh',
        backgroundColor: Colors.neutral[50]
      }}>
        <div style={{ textAlign: 'center', color: Colors.neutral[600] }}>
          {t('common.loading')}...
        </div>
      </div>
    )
  }

  if (messagesError || !counterpartProfile) {
    return (
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        height: '100vh',
        backgroundColor: Colors.neutral[50],
        padding: '20px'
      }}>
        <p style={{ color: Colors.error[600], marginBottom: '16px' }}>
          {messagesError || 'User not found'}
        </p>
        <button
          onClick={() => navigate(-1)}
          style={{
            padding: '12px 24px',
            backgroundColor: Colors.primary[600],
            color: Colors.white,
            border: 'none',
            borderRadius: '8px',
            cursor: 'pointer'
          }}
        >
          {t('common.back')}
        </button>
      </div>
    )
  }

  return (
    <div className="chat-container" style={{ 
      display: 'flex',
      flexDirection: 'column',
      height: '100vh',
      backgroundColor: Colors.neutral[50]
    }}>
      {/* Header */}
      <div className="chat-header" style={{
        backgroundColor: Colors.white,
        padding: '12px 16px',
        borderBottom: `1px solid ${Colors.neutral[200]}`,
        display: 'flex',
        alignItems: 'center',
        gap: '12px',
        position: 'sticky',
        top: 0,
        zIndex: 10
      }}>
        {!hideBackButton && (
          <button
            onClick={() => navigate(-1)}
            style={{
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              padding: '8px',
              display: 'flex',
              alignItems: 'center'
            }}
          >
            <ArrowLeft size={24} color={Colors.neutral[700]} />
          </button>
        )}

        <div style={{
          width: '40px',
          height: '40px',
          borderRadius: '20px',
          backgroundColor: Colors.neutral[200],
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: Colors.neutral[500],
          fontSize: '16px',
          fontWeight: '600',
          flexShrink: 0
        }}>
          {counterpartProfile.avatar_url ? (
            <img
              src={counterpartProfile.avatar_url}
              alt={counterpartProfile.full_name || ''}
              style={{
                width: '100%',
                height: '100%',
                borderRadius: '20px',
                objectFit: 'cover'
              }}
            />
          ) : (
            counterpartProfile.full_name?.charAt(0).toUpperCase() || 'U'
          )}
        </div>

        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{
            fontSize: '16px',
            fontWeight: '600',
            color: Colors.neutral[900]
          }}>
            {counterpartProfile.full_name || t('common.user')}
          </div>
          <div style={{
            fontSize: '12px',
            color: isTargetOnline ? Colors.success[600] : Colors.neutral[500]
          }}>
            {isTargetOnline ? t('messages.online') : (targetLastSeen ? `${t('messages.lastSeen')} ${formatTime(targetLastSeen.toISOString())}` : 'Offline')}
          </div>
        </div>

        <div style={{ display: 'flex', gap: '8px' }}>
          <button
            style={{
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              padding: '8px',
              display: 'flex',
              alignItems: 'center'
            }}
          >
            <Phone size={20} color={Colors.neutral[600]} />
          </button>
          <button
            style={{
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              padding: '8px',
              display: 'flex',
              alignItems: 'center'
            }}
          >
            <MoreVertical size={20} color={Colors.neutral[600]} />
          </button>
        </div>
      </div>

      {/* Messages */}
      <div className="chat-messages" style={{
        flex: 1,
        overflowY: 'auto',
        padding: '16px',
        display: 'flex',
        flexDirection: 'column',
        gap: '12px'
      }}>
        {conversationMessages.length === 0 && (
          <div style={{
            flex: 1,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            textAlign: 'center',
            color: Colors.neutral[500]
          }}>
            <div>
              <p style={{ fontSize: '16px', marginBottom: '8px' }}>
                {t('messages.noMessages')}
              </p>
              <p style={{ fontSize: '14px' }}>
                {t('messages.startConversationWith', { name: counterpartProfile.full_name || t('common.user') })}
              </p>
            </div>
          </div>
        )}

        {conversationMessages.map((message) => {
          const isOwn = message.sender_id === currentUser?.id
          
          return (
            <div
              key={message.id}
              style={{
                display: 'flex',
                justifyContent: isOwn ? 'flex-end' : 'flex-start',
                marginBottom: '4px'
              }}
            >
              <div style={{
                maxWidth: '75%',
                padding: '12px 16px',
                borderRadius: '16px',
                backgroundColor: isOwn ? Colors.primary[600] : Colors.white,
                border: isOwn ? 'none' : `1px solid ${Colors.neutral[200]}`,
                borderBottomRightRadius: isOwn ? '4px' : '16px',
                borderBottomLeftRadius: isOwn ? '16px' : '4px',
                boxShadow: '0 1px 2px rgba(0, 0, 0, 0.1)'
              }}>
                {message.attachment_url && (
                  <img
                    src={message.attachment_url}
                    alt="Attachment"
                    style={{
                      maxWidth: '200px',
                      borderRadius: '8px',
                      marginBottom: message.content ? '8px' : '0'
                    }}
                  />
                )}
                {message.content && (
                  <p style={{
                    margin: 0,
                    fontSize: '15px',
                    lineHeight: '20px',
                    color: isOwn ? Colors.white : Colors.neutral[900]
                  }}>
                    {message.content}
                  </p>
                )}
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'flex-end',
                  gap: '4px',
                  marginTop: '4px'
                }}>
                  <span style={{
                    fontSize: '11px',
                    color: isOwn ? 'rgba(255, 255, 255, 0.7)' : Colors.neutral[500]
                  }}>
                    {formatTime(message.created_at || '')}
                  </span>
                  {isOwn && getMessageStatus(message)}
                </div>
              </div>
            </div>
          )
        })}
        <div ref={messagesEndRef} />
      </div>

      {/* Typing Indicator */}
      {isTyping && (
        <div style={{
          padding: '8px 16px',
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          color: Colors.neutral[500],
          fontSize: '14px'
        }}>
          <span>{counterpartProfile.full_name || t('common.user')}</span>
          <span>{t('messages.typing')}</span>
        </div>
      )}

      {/* Input */}
      <div className="chat-input" style={{
        padding: '12px 16px',
        backgroundColor: Colors.white,
        borderTop: `1px solid ${Colors.neutral[200]}`,
        display: 'flex',
        alignItems: 'flex-end',
        gap: '8px'
      }}>
        <button
          onClick={handleImagePick}
          disabled={uploadingMedia}
          style={{
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            padding: '8px',
            display: 'flex',
            alignItems: 'center',
            borderRadius: '8px',
            transition: 'background 0.2s'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = Colors.neutral[100]
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = 'transparent'
          }}
        >
          <Paperclip size={20} color={Colors.neutral[600]} />
        </button>

        <textarea
          ref={inputRef}
          value={newMessageText}
          onChange={(e) => {
            setNewMessageText(e.target.value)
            if (e.target.value.trim()) {
              startTyping()
            } else {
              stopTyping()
            }
          }}
          onKeyPress={handleKeyPress}
          onBlur={() => stopTyping()}
          placeholder={t('messages.typeMessage')}
          style={{
            flex: 1,
            padding: '10px 14px',
            border: `1px solid ${Colors.neutral[300]}`,
            borderRadius: '20px',
            fontSize: '15px',
            fontFamily: 'inherit',
            resize: 'none',
            maxHeight: '100px',
            minHeight: '44px',
            outline: 'none',
            backgroundColor: Colors.neutral[50],
            color: Colors.neutral[900]
          }}
          rows={1}
        />

        <button
          onClick={handleSend}
          disabled={!newMessageText.trim() || uploadingMedia}
          style={{
            background: newMessageText.trim() ? Colors.primary[600] : Colors.neutral[300],
            border: 'none',
            cursor: newMessageText.trim() ? 'pointer' : 'not-allowed',
            padding: '10px',
            borderRadius: '50%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: '44px',
            height: '44px',
            transition: 'background 0.2s'
          }}
        >
          <Send size={20} color={Colors.white} />
        </button>
      </div>
    </div>
  )
}
