import { useState, useEffect } from 'react'

type AppStateStatus = 'active' | 'background' | 'inactive'

export function useAppState() {
  const [appState, setAppState] = useState<AppStateStatus>('active')
  const [lastActive, setLastActive] = useState<Date>(new Date())
  const [isActive, setIsActive] = useState(true)

  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.hidden) {
        setAppState('background')
        setIsActive(false)
      } else {
        setAppState('active')
        setIsActive(true)
        setLastActive(new Date())
      }
    }

    const handleFocus = () => {
      setAppState('active')
      setIsActive(true)
      setLastActive(new Date())
    }

    const handleBlur = () => {
      setAppState('inactive')
      setIsActive(false)
    }

    document.addEventListener('visibilitychange', handleVisibilityChange)
    window.addEventListener('focus', handleFocus)
    window.addEventListener('blur', handleBlur)

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange)
      window.removeEventListener('focus', handleFocus)
      window.removeEventListener('blur', handleBlur)
    }
  }, [])

  return {
    appState,
    isActive,
    lastActive,
  }
}
