import React from 'react'

interface CardProps {
  children: React.ReactNode
  className?: string
  hover?: boolean
  padding?: 'sm' | 'md' | 'lg'
  variant?: 'glass' | 'panel'
}

export default function Card({
  children,
  className = '',
  hover = false,
  padding = 'md',
  variant = 'panel',
}: CardProps) {
  const paddingSizes = {
    sm: 'p-4',
    md: 'p-6',
    lg: 'p-8',
  }
  
  const cardClass = variant === 'panel' 
    ? (hover ? 'glass-panel-hover' : 'glass-panel')
    : (hover ? 'glass-card-hover' : 'glass-card')
  
  return (
    <div className={`${cardClass} ${paddingSizes[padding]} ${className}`}>
      {children}
    </div>
  )
}
