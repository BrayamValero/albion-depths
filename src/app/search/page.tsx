import { SearchBar } from '@/components/SearchBar'

export const metadata = {
  title: 'Search - Albion Depths Killboard',
  description: 'Search for players',
}

export default function SearchPage() {
  return (
    <div className="max-w-2xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Search Players</h1>
        <p className="text-text-muted mt-1">Find a player by name</p>
      </div>

      <SearchBar />
    </div>
  )
}