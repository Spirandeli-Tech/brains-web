import { Typography } from 'antd'
import type { ComponentProps, ReactNode } from 'react'

const { Text: AntText } = Typography

type AntTextProps = ComponentProps<typeof AntText>

interface LabelProps {
  children: ReactNode
  required?: boolean
  className?: string
}

export function Text({ children, type, className, ...props }: AntTextProps) {
  return (
    <AntText type={type} className={className} {...props}>
      {children}
    </AntText>
  )
}

export function Label({ children, required, className = '' }: LabelProps) {
  return (
    <label className={`block text-sm font-medium text-gray-700 mb-1 ${className}`}>
      {required && <span className="text-red-500 mr-1">*</span>}
      {children}
    </label>
  )
}
