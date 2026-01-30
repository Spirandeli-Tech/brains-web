import { Button as AntButton } from 'antd'
import type { ComponentProps } from 'react'

type AntButtonProps = ComponentProps<typeof AntButton>

export function Button({ children, className = '', block = false, ...props }: AntButtonProps) {
  return (
    <AntButton
      className={`h-10 font-semibold ${className}`}
      block={block}
      {...props}
    >
      {children}
    </AntButton>
  )
}
