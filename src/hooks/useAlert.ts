import { useState, useCallback } from 'react'

type AlertType = 'success' | 'error' | 'warning' | 'info'

interface AlertOptions {
  title?: string
  message: string
  type?: AlertType
  duration?: number
}

interface AlertState extends AlertOptions {
  open: boolean
}

export function useAlert() {
  const [alert, setAlert] = useState<AlertState>({
    open: false,
    message: '',
    type: 'info',
  })

  const showAlert = useCallback(
    (options: AlertOptions) => {
      setAlert({
        ...options,
        open: true,
        type: options.type || 'info',
      })

      const duration = options.duration || 3000
      setTimeout(() => {
        setAlert((prev) => ({ ...prev, open: false }))
      }, duration)
    },
    []
  )

  const close = useCallback(() => {
    setAlert((prev) => ({ ...prev, open: false }))
  }, [])

  return {
    alert,
    showAlert,
    close,
  }
}
