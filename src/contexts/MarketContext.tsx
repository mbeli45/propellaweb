import React, { createContext, useCallback, useContext, useMemo, useState, ReactNode } from 'react'

/**
 * Which side of Propella the visitor is browsing: homes to rent or buy
 * (`properties`), or nights at a hotel or guest house (`stays`). Home, the
 * video feed, the map and search all follow it, so the two never mix.
 * The last choice is remembered; the first visit opens on Properties.
 */
export type Market = 'properties' | 'stays'

const STORAGE_KEY = 'propella.market'

const readSaved = (): Market => {
  try {
    return localStorage.getItem(STORAGE_KEY) === 'stays' ? 'stays' : 'properties'
  } catch {
    return 'properties'
  }
}

interface MarketContextType {
  market: Market
  setMarket: (market: Market) => void
}

const MarketContext = createContext<MarketContextType>({ market: 'properties', setMarket: () => {} })

export function MarketProvider({ children }: { children: ReactNode }) {
  const [market, setMarketState] = useState<Market>(readSaved)

  const setMarket = useCallback((next: Market) => {
    setMarketState(next)
    try {
      localStorage.setItem(STORAGE_KEY, next)
    } catch {
      /* private mode: the choice lasts for this visit only */
    }
  }, [])

  const value = useMemo(() => ({ market, setMarket }), [market, setMarket])
  return <MarketContext.Provider value={value}>{children}</MarketContext.Provider>
}

export const useMarket = () => useContext(MarketContext)
