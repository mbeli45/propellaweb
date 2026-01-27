import { useState, useEffect } from 'react'

export const useNetworkStatus = () => {
  const [isOnline, setIsOnline] = useState(navigator.onLine)
  const [isConnected, setIsConnected] = useState(navigator.onLine)
  const [connectionType, setConnectionType] = useState<string | null>(null)

  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true)
      setIsConnected(true)
    }

    const handleOffline = () => {
      setIsOnline(false)
      setIsConnected(false)
    }

    // Check connection type if available
    const connection = (navigator as any).connection || (navigator as any).mozConnection || (navigator as any).webkitConnection
    if (connection) {
      setConnectionType(connection.effectiveType || connection.type || 'unknown')
      connection.addEventListener('change', () => {
        setConnectionType(connection.effectiveType || connection.type || 'unknown')
      })
    }

    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)

    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [])

  return {
    isOnline,
    isConnected,
    connectionType,
  }
}
