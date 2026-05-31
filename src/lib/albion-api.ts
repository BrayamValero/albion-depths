import { AlbionKillEvent } from './types'

const API_BASE = process.env.ALBION_API_BASE || 'https://gameinfo.albiononline.com/api/gameinfo'

export async function fetchKillEvents(limit: number = 50, offset: number = 0): Promise<AlbionKillEvent[]> {
  const url = `${API_BASE}/events?limit=${limit}&offset=${offset}`
  const response = await fetch(url)

  if (!response.ok) {
    throw new Error(`Failed to fetch kill events: ${response.status}`)
  }

  return response.json()
}

/**
 * Fetch events with pagination, returning all events until
 * we hit an EventId that's already been processed (or reach maxPages).
 * Individual page timeouts are handled gracefully — we keep
 * whatever events we already fetched.
 */
export async function fetchAllRecentEvents(
  lastEventId: number,
  maxPages: number = 8
): Promise<AlbionKillEvent[]> {
  const allEvents: AlbionKillEvent[] = []
  const seenIds = new Set<number>()
  const limit = 50

  for (let page = 0; page < maxPages; page++) {
    let events: AlbionKillEvent[]
    try {
      events = await fetchKillEvents(limit, page * limit)
    } catch {
      break
    }

    if (events.length === 0) break

    for (const event of events) {
      if (event.EventId <= lastEventId) {
        return allEvents
      }
      if (seenIds.has(event.EventId)) continue
      seenIds.add(event.EventId)
      allEvents.push(event)
    }

    if (events.length < limit) break
  }

  return allEvents
}

export async function searchPlayers(query: string): Promise<{ id: string; name: string }[]> {
  const url = `${API_BASE}/search?q=${encodeURIComponent(query)}`
  const response = await fetch(url)

  if (!response.ok) {
    throw new Error(`Failed to search players: ${response.status}`)
  }

  const data = await response.json()
  return data.filter((item: { type: string }) => item.type === 'Player')
}

export async function fetchPlayerKills(playerId: string): Promise<any[]> {
  const url = `${API_BASE}/players/${playerId}/kills`
  const response = await fetch(url)
  if (!response.ok) {
    throw new Error(`Failed to fetch player kills: ${response.status}`)
  }
  return response.json()
}

export async function getPlayerInfo(playerId: string) {
  const url = `${API_BASE}/players/${playerId}`
  const response = await fetch(url)

  if (!response.ok) {
    throw new Error(`Failed to get player info: ${response.status}`)
  }

  return response.json()
}

export function isDepthsKill(event: AlbionKillEvent): boolean {
  return event.groupMemberCount >= 2 && event.groupMemberCount <= 3
}

export function isValidKillEvent(event: AlbionKillEvent): boolean {
  return Boolean(
    event.Killer?.Id &&
    event.Victim?.Id &&
    event.Killer.Id !== event.Victim.Id &&
    event.Type === 'KILL'
  )
}

export function extractWeaponType(equipment: AlbionKillEvent['Killer']['Equipment']): string | null {
  return equipment?.MainHand?.Type || null
}

