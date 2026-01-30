import { Label, Input, InputPassword } from '@/components/atoms'
import type { ChangeEvent } from 'react'

interface FormFieldProps {
  label: string
  name: string
  type?: 'text' | 'email' | 'password'
  required?: boolean
  placeholder?: string
  value?: string
  onChange?: (e: ChangeEvent<HTMLInputElement>) => void
}

export function FormField({
  label,
  name,
  type = 'text',
  required = false,
  placeholder,
  value,
  onChange,
  ...props
}: FormFieldProps & Record<string, unknown>) {
  const InputComponent = type === 'password' ? InputPassword : Input

  return (
    <div className="mb-4">
      <Label required={required}>{label}</Label>
      <InputComponent
        name={name}
        type={type}
        placeholder={placeholder}
        value={value}
        onChange={onChange}
        {...props}
      />
    </div>
  )
}
