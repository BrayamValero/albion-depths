import { AdminPanel } from '@/components/AdminPanel'

export const metadata = {
  title: 'Admin - Albion Depths Killboard',
}

export default function AdminPage() {
  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Admin Panel</h1>
        <p className="text-text-muted mt-1">Manage the killboard</p>
      </div>

      <AdminPanel />
    </div>
  )
}