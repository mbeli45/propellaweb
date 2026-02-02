import React, { forwardRef } from 'react'
import { TextField, InputAdornment, IconButton, TextFieldProps } from '@mui/material'
import { Icon } from '@iconify/react'
import { useThemeMode } from '@/contexts/ThemeContext'
import { getColors } from '@/constants/Colors'
import { LucideIcon } from 'lucide-react'

export interface InputProps extends Omit<TextFieldProps, 'variant'> {
  icon?: LucideIcon
  rightIcon?: React.ReactNode
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ icon: IconComponent, rightIcon, ...props }, ref) => {
    const { colorScheme } = useThemeMode()
    const Colors = getColors(colorScheme)

    // Convert lucide icon name to iconify format
    const getIconName = (IconComponent: any) => {
      if (!IconComponent) return null
      const name = IconComponent.displayName || IconComponent.name || ''
      return `lucide:${name.toLowerCase().replace(/([A-Z])/g, '-$1').replace(/^-/, '')}`
    }

    return (
      <TextField
        {...props}
        ref={ref}
        fullWidth
        variant="outlined"
        InputProps={{
          ...props.InputProps,
          startAdornment: IconComponent ? (
            <InputAdornment position="start">
              <Icon 
                icon={getIconName(IconComponent)} 
                width={20} 
                style={{ color: Colors.neutral[400] }} 
              />
            </InputAdornment>
          ) : props.InputProps?.startAdornment,
          endAdornment: rightIcon ? (
            <InputAdornment position="end">
              {rightIcon}
            </InputAdornment>
          ) : props.InputProps?.endAdornment,
        }}
        sx={{
          mb: 2.5,
          '& .MuiOutlinedInput-root': {
            backgroundColor: Colors.neutral[50],
            borderRadius: 2,
            '& fieldset': {
              borderColor: Colors.neutral[200],
              borderWidth: '1.5px',
            },
            '&:hover fieldset': {
              borderColor: Colors.primary[400],
            },
            '&.Mui-focused fieldset': {
              borderColor: Colors.primary[600],
              borderWidth: '2px',
            },
          },
          '& .MuiInputLabel-root': {
            color: Colors.neutral[600],
            '&.Mui-focused': {
              color: Colors.primary[600],
            },
          },
          ...props.sx,
        }}
      />
    )
  }
)

Input.displayName = 'Input'
