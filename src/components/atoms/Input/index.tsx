import { Input as AntInput } from 'antd'
import type { ComponentProps } from 'react'

type AntInputProps = ComponentProps<typeof AntInput>
type AntInputPasswordProps = ComponentProps<typeof AntInput.Password>

export function Input({ className = '', ...props }: AntInputProps) {
  return (
    <AntInput
      className={`h-10 ${className}`}
      {...props}
    />
  )
}

export function InputPassword({ className = '', ...props }: AntInputPasswordProps) {
  return (
    <AntInput.Password
      className={`h-10 ${className}`}
      {...props}
    />
  )
}
