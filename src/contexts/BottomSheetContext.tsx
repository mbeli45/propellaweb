import React, { createContext, useContext, useState, ReactNode } from 'react'

interface BottomSheetContextType {
  isBottomSheetOpen: boolean
  setBottomSheetOpen: (open: boolean) => void
}

const BottomSheetContext = createContext<BottomSheetContextType | undefined>(undefined)

export function BottomSheetProvider({ children }: { children: ReactNode }) {
  const [isBottomSheetOpen, setBottomSheetOpen] = useState(false)

  return (
    <BottomSheetContext.Provider value={{ isBottomSheetOpen, setBottomSheetOpen }}>
      {children}
    </BottomSheetContext.Provider>
  )
}

export function useBottomSheet() {
  const context = useContext(BottomSheetContext)
  if (context === undefined) {
    throw new Error('useBottomSheet must be used within a BottomSheetProvider')
  }
  return context
}
