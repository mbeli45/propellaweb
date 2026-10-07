import { useCallback, useEffect, useRef, useState } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { identityCommand, identityStage, type IdentityState } from '@/lib/identity'

/** The signed-in user's ID check, refreshed when the tab regains focus. */
export function useIdentityGate() {
  const { user } = useAuth()
  const [record, setRecord] = useState<{ userId: string; state: IdentityState } | null>(null)
  const currentUser = useRef(user?.id)
  currentUser.current = user?.id
  const request = useRef(0)
  const state = record?.userId === user?.id ? record?.state ?? null : null
  const setState = useCallback((next: IdentityState) => { request.current++; setRecord({ userId: user?.id || '', state: next }); setLoading(false); }, [user?.id]);
  const [loading, setLoading] = useState(true)

  const refresh = useCallback(async () => {
    if (!user?.id) {
      setRecord(null)
      setLoading(false)
      return
    }
    const version = ++request.current
    try {
      const next = await identityCommand('status')
      if (currentUser.current === user.id && request.current === version) setRecord({ userId: user.id, state: next })
    } catch (e) {
      console.warn('identity status', e)
      if (currentUser.current === user.id && request.current === version) setRecord(null)
    } finally {
      if (currentUser.current === user.id && request.current === version) setLoading(false)
    }
  }, [user?.id])

  useEffect(() => {
    void refresh()
    const onFocus = () => void refresh()
    window.addEventListener('focus', onFocus)
    return () => window.removeEventListener('focus', onFocus)
  }, [refresh])

  return { state, setState, loading, refresh, stage: identityStage(state) }
}

