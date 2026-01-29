import { useState, useCallback } from 'react'

interface ConfirmOptions {
  title: string
  message: string
  confirmText?: string
  cancelText?: string
  variant?: 'danger' | 'warning' | 'info'
}

interface ConfirmDialogState extends ConfirmOptions {
  open: boolean
  onConfirm?: () => void
  onCancel?: () => void
}

export function useConfirmDialog() {
  const [dialog, setDialog] = useState<ConfirmDialogState>({
    open: false,
    title: '',
    message: '',
  })

  const confirm = useCallback(
    (options: ConfirmOptions): Promise<boolean> => {
      return new Promise((resolve) => {
        setDialog({
          ...options,
          open: true,
          onConfirm: () => {
            setDialog((prev) => ({ ...prev, open: false }))
            resolve(true)
          },
          onCancel: () => {
            setDialog((prev) => ({ ...prev, open: false }))
            resolve(false)
          },
        })
      })
    },
    []
  )

  const close = useCallback(() => {
    setDialog((prev) => ({ ...prev, open: false }))
  }, [])

  return {
    dialog,
    confirm,
    close,
  }
}
