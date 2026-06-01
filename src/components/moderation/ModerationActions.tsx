import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Ban, Flag, MoreVertical } from 'lucide-react'
import { useAuth } from '@/contexts/AuthContext'
import { useLanguage } from '@/contexts/I18nContext'
import { useThemeMode } from '@/contexts/ThemeContext'
import { getColors } from '@/constants/Colors'
import { useModeration } from '@/hooks/useModeration'
import ReportModal from './ReportModal'

interface ModerationActionsProps {
  /** The user being moderated (owner of the content the viewer is looking at). */
  targetUserId: string | null | undefined
  /** Optional readable name for the confirmation prompt. */
  targetUserName?: string | null
  /** What is being reported / moderated. */
  contentType: 'property' | 'profile' | 'chat' | 'review' | 'message'
  /** The specific content row id, if applicable. */
  contentId?: string | null
  /** Called after a successful block — e.g., to navigate the user away. */
  onBlocked?: () => void
  /** Visual size — defaults to "default". */
  size?: 'default' | 'compact'
  /** Render as inline pills (default) or as a 3-dot popover menu. */
  mode?: 'inline' | 'menu'
}

/**
 * Web report + block UI. Renders nothing for the viewer's own content
 * (no self-moderation), and nothing when not signed in.
 */
export default function ModerationActions({
  targetUserId,
  targetUserName,
  contentType,
  contentId,
  onBlocked,
  size = 'default',
  mode = 'inline',
}: ModerationActionsProps) {
  const { user } = useAuth()
  const { t } = useLanguage()
  const { colorScheme } = useThemeMode()
  const Colors = useMemo(() => getColors(colorScheme), [colorScheme])
  const { blockUser } = useModeration()

  const [reportOpen, setReportOpen] = useState(false)
  const [confirmBlock, setConfirmBlock] = useState(false)
  const [blocking, setBlocking] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)
  const menuRef = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    if (!menuOpen) return
    const onClickAway = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false)
      }
    }
    document.addEventListener('mousedown', onClickAway)
    return () => document.removeEventListener('mousedown', onClickAway)
  }, [menuOpen])

  const handleBlock = useCallback(async () => {
    if (!targetUserId || blocking) return
    try {
      setBlocking(true)
      await blockUser(targetUserId)
      setConfirmBlock(false)
      onBlocked?.()
    } catch (e: any) {
      alert(e?.message || t('moderation.blockFailed'))
    } finally {
      setBlocking(false)
    }
  }, [targetUserId, blocking, blockUser, onBlocked, t])

  if (!user || !targetUserId || user.id === targetUserId) {
    return null
  }

  const compact = size === 'compact'

  return (
    <>
      {mode === 'menu' ? (
        <div ref={menuRef} style={{ position: 'relative', display: 'inline-flex' }}>
          <button
            type="button"
            aria-haspopup="menu"
            aria-expanded={menuOpen}
            onClick={() => setMenuOpen((v) => !v)}
            style={{
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              padding: '8px',
              display: 'flex',
              alignItems: 'center',
              borderRadius: '999px',
            }}
          >
            <MoreVertical size={20} color={Colors.neutral[600]} />
          </button>
          {menuOpen && (
            <div
              role="menu"
              style={{
                position: 'absolute',
                top: '100%',
                right: 0,
                marginTop: '4px',
                backgroundColor: Colors.white,
                border: `1px solid ${Colors.neutral[200]}`,
                borderRadius: '8px',
                boxShadow: '0 8px 24px rgba(0,0,0,0.12)',
                minWidth: '160px',
                overflow: 'hidden',
                zIndex: 1000,
              }}
            >
              <button
                type="button"
                role="menuitem"
                onClick={() => {
                  setMenuOpen(false)
                  setReportOpen(true)
                }}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px',
                  width: '100%',
                  padding: '10px 14px',
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  color: Colors.neutral[800],
                  fontSize: '14px',
                  fontWeight: 500,
                  textAlign: 'left',
                }}
              >
                <Flag size={16} />
                {t('moderation.report')}
              </button>
              <button
                type="button"
                role="menuitem"
                onClick={() => {
                  setMenuOpen(false)
                  setConfirmBlock(true)
                }}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px',
                  width: '100%',
                  padding: '10px 14px',
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  color: Colors.error[700],
                  fontSize: '14px',
                  fontWeight: 500,
                  textAlign: 'left',
                }}
              >
                <Ban size={16} />
                {t('moderation.block')}
              </button>
            </div>
          )}
        </div>
      ) : (
        <div style={{ display: 'inline-flex', gap: '8px' }}>
          <button
            type="button"
            onClick={() => setReportOpen(true)}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              padding: compact ? '6px 10px' : '8px 14px',
              borderRadius: '999px',
              backgroundColor: Colors.neutral[100],
              border: `1px solid ${Colors.neutral[200]}`,
              color: Colors.neutral[800],
              fontWeight: 600,
              fontSize: '13px',
              cursor: 'pointer',
            }}
          >
            <Flag size={14} />
            {t('moderation.report')}
          </button>
          <button
            type="button"
            onClick={() => setConfirmBlock(true)}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              padding: compact ? '6px 10px' : '8px 14px',
              borderRadius: '999px',
              backgroundColor: Colors.error[50],
              border: `1px solid ${Colors.error[200]}`,
              color: Colors.error[700],
              fontWeight: 600,
              fontSize: '13px',
              cursor: 'pointer',
            }}
          >
            <Ban size={14} />
            {t('moderation.block')}
          </button>
        </div>
      )}

      <ReportModal
        open={reportOpen}
        onClose={() => setReportOpen(false)}
        contentType={contentType}
        contentId={contentId}
        reportedUserId={targetUserId}
      />

      {confirmBlock && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.5)',
            zIndex: 9999,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '16px',
          }}
          onClick={() => !blocking && setConfirmBlock(false)}
        >
          <div
            role="dialog"
            aria-modal="true"
            onClick={(e) => e.stopPropagation()}
            style={{
              backgroundColor: Colors.white,
              borderRadius: '12px',
              padding: '20px',
              width: '100%',
              maxWidth: '380px',
              boxShadow: '0 10px 30px rgba(0,0,0,0.25)',
            }}
          >
            <h3 style={{ fontSize: '17px', fontWeight: 600, margin: '0 0 10px', color: Colors.neutral[900] }}>
              {t('moderation.blockConfirmTitle')}
            </h3>
            <p style={{ fontSize: '14px', color: Colors.neutral[600], lineHeight: '20px', marginBottom: '16px' }}>
              {t('moderation.blockUserConfirm', { name: targetUserName || 'this user' })}
            </p>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
              <button
                type="button"
                onClick={() => setConfirmBlock(false)}
                disabled={blocking}
                style={{
                  padding: '8px 14px',
                  borderRadius: '8px',
                  backgroundColor: Colors.neutral[100],
                  color: Colors.neutral[700],
                  border: 'none',
                  cursor: 'pointer',
                  fontWeight: 600,
                }}
              >
                {t('moderation.cancel')}
              </button>
              <button
                type="button"
                onClick={handleBlock}
                disabled={blocking}
                style={{
                  padding: '8px 14px',
                  borderRadius: '8px',
                  backgroundColor: Colors.error[600],
                  color: Colors.white,
                  border: 'none',
                  cursor: 'pointer',
                  fontWeight: 700,
                }}
              >
                {blocking ? '...' : t('moderation.block')}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
