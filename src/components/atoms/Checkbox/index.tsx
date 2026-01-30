import { Checkbox as AntCheckbox } from 'antd'
import type { ComponentProps } from 'react'

type AntCheckboxProps = ComponentProps<typeof AntCheckbox>

export function Checkbox({ children, className = '', ...props }: AntCheckboxProps) {
  return (
    <AntCheckbox className={className} {...props}>
      {children}
    </AntCheckbox>
  )
}
