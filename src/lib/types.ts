export type Tier = 'Iron' | 'Bronze' | 'Silver' | 'Gold' | 'Platinum' | 'Emerald' | 'Crystal'

export interface PlayerWithMMR {
  id: string
  name: string
  mmr: number
  tier: Tier
  kills: number
  deaths: number
  assists: number
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
    tier: string
  }
  victim: {
    id: string
    name: string
    mmr: number
    tier: string
  }
  role: 'KILL' | 'ASSIST' | 'DEATH'
  mmrChange: number
  killTime: Date
  fame: number
  totalFame?: number
  lootSilverValue?: number | null
  lootCount?: number
  killerWeapon?: string
  victimWeapon?: string
  killerGuild?: string
  victimGuild?: string
  killerAlliance?: string
  victimAlliance?: string
  killerIp?: number
  victimIp?: number
  groupMemberCount?: number
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
  assists: number
  kd: number
  streak: number
  peakMMR: number
  recentKills: KillEvent[]
  recentDeaths: KillEvent[]
  recentAssists: KillEvent[]
}

export interface SearchResult {
  id: string
  name: string
  mmr: number
  tier: Tier
  kills: number
  assists: number
  deaths: number
}

export interface AdminStats {
  totalPlayers: number
  totalKills: number
  lastSyncAt: Date | null
}

export interface AlbionEquipment {
  Type?: string
  Count?: number
  Quality?: number
  ActiveSpells?: string[]
  PassiveSpells?: string[]
  LegendarySoul?: string | null
}

export interface AlbionPlayerData {
  Id: string
  Name: string
  GuildName?: string
  GuildId?: string
  AllianceName?: string
  AllianceId?: string
  AllianceTag?: string
  Avatar?: string
  AvatarRing?: string
  AverageItemPower: number
  KillFame: number
  DeathFame: number
  FameRatio: number
  Equipment: {
    MainHand?: AlbionEquipment | null
    OffHand?: AlbionEquipment | null
    Head?: AlbionEquipment | null
    Armor?: AlbionEquipment | null
    Shoes?: AlbionEquipment | null
    Bag?: AlbionEquipment | null
    Cape?: AlbionEquipment | null
    Mount?: AlbionEquipment | null
    Potion?: AlbionEquipment | null
    Food?: AlbionEquipment | null
  }
  Inventory?: (AlbionEquipment | null)[]
  LifetimeStatistics?: Record<string, unknown>
}

export interface AlbionParticipant extends AlbionPlayerData {
  DamageDone: number
  SupportHealingDone: number
}

export interface AlbionKillEvent {
  numberOfParticipants: number
  groupMemberCount: number
  EventId: number
  TimeStamp: string
  Version: number
  Killer: AlbionPlayerData
  Victim: AlbionPlayerData
  TotalVictimKillFame: number
  Location: string | null
  Participants?: AlbionParticipant[]
  GroupMembers?: unknown[]
  GvGMatch?: unknown
  BattleId?: string
  KillArea?: string
  Category: string | null
  Type: string
}
