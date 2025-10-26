import React from 'react'
import { LucideIcon } from 'lucide-react'

interface ModernCardProps {
  title?: string
  subtitle?: string
  icon?: LucideIcon
  children: React.ReactNode
  className?: string
  hover?: boolean
  gradient?: boolean
}

export function ModernCard({ 
  title, 
  subtitle, 
  icon: Icon, 
  children, 
  className = '',
  hover = true,
  gradient = false
}: ModernCardProps) {
  return (
    <div className={`
      card ${hover ? 'hover:shadow-xl hover:-translate-y-1' : ''} 
      ${gradient ? 'bg-gradient-to-br from-white to-slate-50' : ''}
      ${className}
    `}>
      {(title || subtitle || Icon) && (
        <div className="card-header">
          <div className="flex items-center space-x-3">
            {Icon && (
              <div className="w-10 h-10 bg-gradient-to-br from-emerald-500 to-green-600 rounded-xl flex items-center justify-center shadow-lg">
                <Icon className="w-5 h-5 text-white" />
              </div>
            )}
            <div>
              {title && (
                <h3 className="card-title text-lg font-bold text-slate-900">
                  {title}
                </h3>
              )}
              {subtitle && (
                <p className="text-sm text-slate-600 font-medium">
                  {subtitle}
                </p>
              )}
            </div>
          </div>
        </div>
      )}
      <div className="card-content">
        {children}
      </div>
    </div>
  )
}

interface StatCardProps {
  title: string
  value: string | number
  subtitle?: string
  icon?: LucideIcon
  trend?: 'up' | 'down' | 'neutral'
  trendValue?: string
  className?: string
  onClick?: () => void
}

export function StatCard({ 
  title, 
  value, 
  subtitle, 
  icon: Icon, 
  trend, 
  trendValue,
  className = '',
  onClick
}: StatCardProps) {
  const trendColors = {
    up: 'text-emerald-600',
    down: 'text-red-600',
    neutral: 'text-slate-600'
  }

  const trendIcons = {
    up: '↗',
    down: '↘',
    neutral: '→'
  }

  return (
    <ModernCard className={`${className} ${onClick ? 'cursor-pointer' : ''}`} hover>
      <div 
        className="flex items-center justify-between"
        onClick={onClick}
      >
        <div className="flex-1">
          <p className="text-sm font-medium text-slate-600 mb-1">{title}</p>
          <p className="text-3xl font-bold text-slate-900 mb-1">{value}</p>
          {subtitle && (
            <p className="text-sm text-slate-500">{subtitle}</p>
          )}
          {trend && trendValue && (
            <div className={`flex items-center space-x-1 text-sm font-medium ${trendColors[trend]}`}>
              <span>{trendIcons[trend]}</span>
              <span>{trendValue}</span>
            </div>
          )}
        </div>
        {Icon && (
          <div className="w-12 h-12 bg-gradient-to-br from-emerald-500 to-green-600 rounded-xl flex items-center justify-center shadow-lg">
            <Icon className="w-6 h-6 text-white" />
          </div>
        )}
      </div>
    </ModernCard>
  )
}
