
interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg'
  text?: string
  className?: string
}

export function LoadingSpinner({ size = 'md', text, className = '' }: LoadingSpinnerProps) {
  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-8 h-8',
    lg: 'w-12 h-12'
  }

  return (
    <div className={`flex flex-col items-center justify-center space-y-3 ${className}`}>
      <div className={`${sizeClasses[size]} relative`}>
        <div className="absolute inset-0 rounded-full border-4 border-slate-200"></div>
        <div className="absolute inset-0 rounded-full border-4 border-emerald-600 border-t-transparent animate-spin"></div>
      </div>
      {text && (
        <p className="text-sm font-medium text-slate-600 animate-pulse">
          {text}
        </p>
      )}
    </div>
  )
}

export function LoadingPage({ text = 'Carregando...' }: { text?: string }) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 via-emerald-50 to-green-50">
      <div className="text-center space-y-6">
        <div className="relative">
          <div className="w-16 h-16 rounded-full border-4 border-slate-200"></div>
          <div className="absolute inset-0 w-16 h-16 rounded-full border-4 border-emerald-600 border-t-transparent animate-spin"></div>
        </div>
        <div>
          <h2 className="text-xl font-semibold text-slate-900 mb-2">{text}</h2>
          <p className="text-slate-600">Aguarde um momento...</p>
        </div>
      </div>
    </div>
  )
}

export function LoadingCard({ className = '' }: { className?: string }) {
  return (
    <div className={`card animate-pulse ${className}`}>
      <div className="card-header">
        <div className="h-4 bg-slate-200 rounded w-3/4 mb-2"></div>
        <div className="h-3 bg-slate-200 rounded w-1/2"></div>
      </div>
      <div className="card-content">
        <div className="space-y-3">
          <div className="h-3 bg-slate-200 rounded w-full"></div>
          <div className="h-3 bg-slate-200 rounded w-5/6"></div>
          <div className="h-3 bg-slate-200 rounded w-4/6"></div>
        </div>
      </div>
    </div>
  )
}

export function LoadingTable({ rows = 5, columns = 4 }: { rows?: number; columns?: number }) {
  return (
    <div className="card overflow-hidden">
      <div className="table">
        <div className="table-header">
          <div className="table-row">
            {Array.from({ length: columns }).map((_, i) => (
              <div key={i} className="table-head">
                <div className="h-4 bg-slate-200 rounded w-3/4 animate-pulse"></div>
              </div>
            ))}
          </div>
        </div>
        <div className="table-body">
          {Array.from({ length: rows }).map((_, rowIndex) => (
            <div key={rowIndex} className="table-row">
              {Array.from({ length: columns }).map((_, colIndex) => (
                <div key={colIndex} className="table-cell">
                  <div className="h-3 bg-slate-200 rounded w-full animate-pulse"></div>
                </div>
              ))}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
