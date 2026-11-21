import { useEffect, useMemo, useState } from 'react'
import { RoomAvailability, fetchAvailability } from '@/lib/stays'

/** What a stay can offer for one search: dates and party size. */
export interface StayFit {
  /** Cheapest room type that is free and sleeps the party; null when none fits. */
  fromPrice: number | null
  /** Free rooms across the types that sleep the party. */
  roomsLeft: number
  /** Has rooms set up, but none free that sleep the party. */
  full: boolean
  /** The host hasn't set up rooms yet, so there's nothing to check. */
  noRooms: boolean
}

export function summariseFit(list: RoomAvailability[], guests: number): StayFit {
  const fits = list.filter((r) => r.available_rooms > 0 && r.max_guests >= guests)
  return {
    fromPrice: fits.length ? Math.min(...fits.map((r) => r.nightly_price)) : null,
    roomsLeft: fits.reduce((n, r) => n + r.available_rooms, 0),
    full: list.length > 0 && fits.length === 0,
    noRooms: list.length === 0,
  }
}

// Shared across screens for the session; availability moves slowly enough.
const cache = new Map<string, { at: number; list: RoomAvailability[] }>()
const FRESH_MS = 60_000

async function cachedAvailability(id: string, checkIn: string, checkOut: string) {
  const key = `${id}|${checkIn}|${checkOut}`
  const hit = cache.get(key)
  if (hit && Date.now() - hit.at < FRESH_MS) return hit.list
  const list = await fetchAvailability(id, checkIn, checkOut)
  cache.set(key, { at: Date.now(), list })
  return list
}

/**
 * Availability for many stays at once (Home → Stays). One lookup per stay, in
 * parallel and cached; a stay that fails to load simply shows no badge.
 */
export function useStayAvailability(ids: string[], checkIn: string, checkOut: string, guests: number) {
  const [raw, setRaw] = useState<Record<string, RoomAvailability[]>>({})
  const key = ids.join(',')

  useEffect(() => {
    if (!ids.length) return
    let active = true
    Promise.all(
      ids.map((id) =>
        cachedAvailability(id, checkIn, checkOut)
          .then((list) => [id, list] as const)
          .catch(() => null),
      ),
    ).then((pairs) => {
      if (!active) return
      const next: Record<string, RoomAvailability[]> = {}
      for (const p of pairs) if (p) next[p[0]] = p[1]
      setRaw(next)
    })
    return () => {
      active = false
    }
    // `key` stands in for `ids` so a new array with the same stays doesn't refetch.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key, checkIn, checkOut])

  return useMemo(() => {
    const out: Record<string, StayFit> = {}
    for (const [id, list] of Object.entries(raw)) out[id] = summariseFit(list, guests)
    return out
  }, [raw, guests])
}
