import React, { createContext, useContext, useState, ReactNode } from 'react'
import ConfirmDialog from '@/components/ui/ConfirmDialog'
import Alert from '@/components/ui/Alert'
import { useAlert } from '@/hooks/useAlert'

interface ConfirmOptions {
  title: string
  message: string
  confirmText?: string
  cancelText?: string
  variant?: 'danger' | 'warning' | 'info'
}

interface DialogContextType {
  confirm: (options: ConfirmOptions) => Promise<boolean>
  alert: (message: string, type?: 'success' | 'error' | 'warning' | 'info', title?: string) => void
}

const DialogContext = createContext<DialogContextType | undefined>(undefined)

export function DialogProvider({ children }: { children: ReactNode }) {
  const [confirmDialog, setConfirmDialog] = useState<{
    open: boolean
    options: ConfirmOptions | null
    resolve: ((value: boolean) => void) | null
  }>({
    open: false,
    options: null,
    resolve: null,
  })

  const { alert: alertState, showAlert, close: closeAlert } = useAlert()

  const confirm = (options: ConfirmOptions): Promise<boolean> => {
    return new Promise((resolve) => {
      setConfirmDialog({
        open: true,
        options,
        resolve,
      })
    })
  }

  const handleConfirm = () => {
    if (confirmDialog.resolve) {
      confirmDialog.resolve(true)
    }
    setConfirmDialog({ open: false, options: null, resolve: null })
  }

  const handleCancel = () => {
    if (confirmDialog.resolve) {
      confirmDialog.resolve(false)
    }
    setConfirmDialog({ open: false, options: null, resolve: null })
  }

  const alert = (message: string, type: 'success' | 'error' | 'warning' | 'info' = 'info', title?: string) => {
    showAlert({ message, type, title })
  }

  return (
    <DialogContext.Provider value={{ confirm, alert }}>
      {children}
      {confirmDialog.open && confirmDialog.options && (
        <ConfirmDialog
          open={confirmDialog.open}
          title={confirmDialog.options.title}
          message={confirmDialog.options.message}
          confirmText={confirmDialog.options.confirmText}
          cancelText={confirmDialog.options.cancelText}
          variant={confirmDialog.options.variant || 'warning'}
          onConfirm={handleConfirm}
          onCancel={handleCancel}
        />
      )}
      <Alert
        open={alertState.open}
        title={alertState.title}
        message={alertState.message}
        type={alertState.type}
        onClose={closeAlert}
      />
    </DialogContext.Provider>
  )
}

export function useDialog() {
  const context = useContext(DialogContext)
  if (!context) {
    throw new Error('useDialog must be used within DialogProvider')
  }
  return context
}
