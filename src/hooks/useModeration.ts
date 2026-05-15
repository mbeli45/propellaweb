import { useCallback, useEffect, useRef, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/contexts/AuthContext'

export type ReportContentType = 'property' | 'message' | 'review' | 'profile' | 'chat'

export type ReportReason =
  | 'spam'
  | 'harassment'
  | 'sexual'
  | 'violence'
  | 'scam'
  | 'fake_listing'
  | 'impersonation'
  | 'other'

export interface SubmitReportArgs {
  contentType: ReportContentType
  contentId?: string | null
  reportedUserId?: string | null
  reason: ReportReason
  details?: string
}

/**
 * Web moderation utilities: report content, block/unblock users, and surface
 * blocked-user IDs so feeds can filter out blocked content (App Store guideline 1.2).
 */
export function useModeration() {
  const { user } = useAuth()

  const submitReport = useCallback(
    async ({ contentType, contentId, reportedUserId, reason, details }: SubmitReportArgs) => {
      if (!user?.id) throw new Error('Not authenticated')
      const { error } = await supabase.from('content_reports').insert({
        reporter_id: user.id,
        reported_user_id: reportedUserId ?? null,
        content_type: contentType,
        content_id: contentId ?? null,
        reason,
        details: details ?? null,
      } as any)
      if (error) throw new Error(error.message)
    },
    [user?.id],
  )

  const blockUser = useCallback(
    async (blockedId: string, reason?: string) => {
      if (!user?.id) throw new Error('Not authenticated')
      if (user.id === blockedId) throw new Error('You cannot block yourself')
      const { error } = await supabase.from('blocked_users').insert({
        blocker_id: user.id,
        blocked_id: blockedId,
        reason: reason ?? null,
      } as any)
      if (error && !/duplicate key/i.test(error.message)) {
        throw new Error(error.message)
      }
    },
    [user?.id],
  )

  const unblockUser = useCallback(
    async (blockedId: string) => {
      if (!user?.id) throw new Error('Not authenticated')
      const { error } = await supabase
        .from('blocked_users')
        .delete()
        .eq('blocker_id', user.id)
        .eq('blocked_id', blockedId)
      if (error) throw new Error(error.message)
    },
    [user?.id],
  )

  return { submitReport, blockUser, unblockUser }
}

export function useBlockedUserIds() {
  const { user } = useAuth()
  const [blockedIds, setBlockedIds] = useState<string[]>([])
  const [loading, setLoading] = useState(false)
  // Per-instance channel suffix: avoids "cannot add postgres_changes callbacks
  // after subscribe()" when multiple consumers (home/search/all) mount together.
  const channelSuffixRef = useRef(Math.random().toString(36).slice(2, 10))

  const refresh = useCallback(async () => {
    if (!user?.id) {
      setBlockedIds([])
      return
    }
    setLoading(true)
    try {
      const { data, error } = await supabase
        .from('blocked_users')
        .select('blocked_id')
        .eq('blocker_id', user.id)
      if (error) {
        console.warn('Failed to load blocked users:', error.message)
        setBlockedIds([])
        return
      }
      setBlockedIds((data || []).map((r: any) => r.blocked_id as string))
    } finally {
      setLoading(false)
    }
  }, [user?.id])

  useEffect(() => {
    refresh()
  }, [refresh])

  useEffect(() => {
    if (!user?.id) return
    const channelName = `blocked_users_web:${user.id}:${channelSuffixRef.current}`
    const channel = supabase
      .channel(channelName)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'blocked_users', filter: `blocker_id=eq.${user.id}` },
        () => refresh(),
      )
      .subscribe()
    return () => {
      try {
        supabase.removeChannel(channel)
      } catch {}
    }
  }, [user?.id, refresh])

  return { blockedIds, loading, refresh }
}
