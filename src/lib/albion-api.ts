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

export async function searchPlayers(query: string): Promise<{ id: string; name: string }[]> {
  const url = `${API_BASE}/search?q=${encodeURIComponent(query)}`
  const response = await fetch(url)

  if (!response.ok) {
    throw new Error(`Failed to search players: ${response.status}`)
  }

  const data = await response.json()
  return data.filter((item: { type: string }) => item.type === 'Player')
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