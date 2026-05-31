export function LoadingSpinner({ message }: { message?: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 gap-3">
      <div className="w-8 h-8 rounded-full border-2 border-accent border-t-transparent animate-spin" />
      {message && <div className="text-text-muted text-sm font-medium tracking-wide">{message}</div>}
    </div>
  )
}
