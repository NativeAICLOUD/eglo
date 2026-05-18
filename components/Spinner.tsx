interface SpinnerProps {
  size?: 'sm' | 'md' | 'lg'
  className?: string
}

export function Spinner({ size = 'md', className = '' }: SpinnerProps) {
  const dim = { sm: 'w-5 h-5', md: 'w-9 h-9', lg: 'w-14 h-14' }[size]
  return (
    <div className={`${dim} relative ${className}`} role="status" aria-label="Loading">
      {/* Track */}
      <div className="absolute inset-0 rounded-full border-2 border-gray-100" />
      {/* Arc */}
      <div className="absolute inset-0 rounded-full border-2 border-transparent border-t-teal-500 animate-spin" />
      {/* Inner glow dot */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-teal-500 mt-[1px]" />
    </div>
  )
}

export function PageSpinner() {
  return (
    <div className="min-h-[60vh] flex flex-col items-center justify-center gap-4">
      <Spinner size="lg" />
      <div className="flex gap-1">
        {[0, 1, 2].map(i => (
          <div
            key={i}
            className="w-1.5 h-1.5 rounded-full bg-teal-400 animate-bounce"
            style={{ animationDelay: `${i * 0.15}s` }}
          />
        ))}
      </div>
    </div>
  )
}
