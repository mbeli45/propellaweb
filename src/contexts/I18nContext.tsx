import React, { createContext, useContext, ReactNode } from 'react'
import { useTranslation } from 'react-i18next'

interface I18nContextProps {
  t: (key: string, options?: any) => string
  i18n: any
}

const I18nContext = createContext<I18nContextProps | undefined>(undefined)

export function I18nProvider({ children }: { children: ReactNode }) {
  const { t, i18n } = useTranslation()

  return (
    <I18nContext.Provider value={{ t, i18n }}>
      {children}
    </I18nContext.Provider>
  )
}

export function useLanguage() {
  const context = useContext(I18nContext)
  if (!context) {
    throw new Error('useLanguage must be used within I18nProvider')
  }
  return context
}
