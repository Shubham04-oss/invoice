import React from 'react'

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string
  error?: string
  fullWidth?: boolean
}

export default function Input({
  label,
  error,
  fullWidth = true,
  className = '',
  ...props
}: InputProps) {
  const widthClass = fullWidth ? 'w-full' : ''
  
  return (
    <div className={`${widthClass} ${className}`}>
      {label && (
        <label className="block text-sm font-medium text-gray-300 mb-2">
          {label}
        </label>
      )}
      <input
        className={`input ${widthClass} ${error ? 'ring-2 ring-red-500' : ''}`}
        {...props}
      />
      {error && (
        <p className="mt-1 text-sm text-red-400">{error}</p>
      )}
    </div>
  )
}
