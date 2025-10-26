
interface StatusBadgeProps {
  status: 'pendente' | 'em_analise' | 'concluida' | 'pago' | 'pendente_pagamento'
  className?: string
}

export function StatusBadge({ status, className = '' }: StatusBadgeProps) {
  const statusConfig = {
    pendente: {
      label: 'Pendente',
      className: 'status-badge status-pendente',
      icon: '⏳'
    },
    em_analise: {
      label: 'Em Análise',
      className: 'status-badge status-analise',
      icon: '🔬'
    },
    concluida: {
      label: 'Concluída',
      className: 'status-badge status-concluida',
      icon: '✅'
    },
    pago: {
      label: 'Pago',
      className: 'status-badge status-pago',
      icon: '💳'
    },
    pendente_pagamento: {
      label: 'Pendente Pagamento',
      className: 'status-badge status-pendente-pagamento',
      icon: '⏰'
    }
  }

  const config = statusConfig[status]

  return (
    <span className={`${config.className} ${className}`}>
      <span className="mr-1">{config.icon}</span>
      {config.label}
    </span>
  )
}

export function StatusDot({ status, className = '' }: StatusBadgeProps) {
  const statusColors = {
    pendente: 'bg-amber-400',
    em_analise: 'bg-emerald-500',
    concluida: 'bg-green-600',
    pago: 'bg-green-700',
    pendente_pagamento: 'bg-red-500'
  }

  return (
    <div className={`w-3 h-3 rounded-full ${statusColors[status]} ${className}`}></div>
  )
}
