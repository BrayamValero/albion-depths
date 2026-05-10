export type Tier = 'Iron' | 'Bronze' | 'Silver' | 'Gold' | 'Crystal'

export interface PlayerWithMMR {
  id: string
  name: string
  mmr: number
  tier: Tier
  kills: number
  deaths: number
  kd: number
  streak: number
  rank: number
}

export interface KillEvent {
  id: number
  eventId: string
  killer: {
    id: string
    name: string
    mmr: number
  }
  victim: {
    id: string
    name: string
    mmr: number
  }
  mmrChange: number
  killTime: Date
  fame: number
}

export interface HeadToHeadStats {
  playerA: string
  playerB: string
  playerAId: string
  playerBId: string
  playerAKills: number
  playerBKills: number
  lastInteraction: Date | null
}

export interface RankingsQuery {
  page?: number
  limit?: number
  tier?: Tier
}

export interface RankingsResponse {
  data: PlayerWithMMR[]
  pagination: {
    page: number
    limit: number
    total: number
    totalPages: number
  }
}

export interface FeedResponse {
  data: KillEvent[]
}

export interface PlayerResponse {
  id: string
  name: string
  mmr: number
  tier: Tier
  kills: number
  deaths: number
  kd: number
  streak: number
  peakMMR: number
  recentKills: KillEvent[]
  recentDeaths: KillEvent[]
}

export interface SearchResult {
  id: string
  name: string
  mmr: number
  tier: Tier
}

export interface AdminStats {
  totalPlayers: number
  totalKills: number
  lastSyncAt: Date | null
}

export interface AlbionKillEvent {
  numberOfParticipants: number
  groupMemberCount: number
  EventId: number
  TimeStamp: string
  Killer: {
    Id: string
    Name: string
    KillFame: number
  }
  Victim: {
    Id: string
    Name: string
    DeathFame: number
  }
  Location: string | null
  KillArea: string
  Category: string | null
  Type: string
}