const light = {
  primary: {
    50: '#E6F0FF',
    100: '#CCE1FF',
    200: '#99C3FF',
    300: '#66A5FF',
    400: '#3387FF',
    500: '#0069FF',
    600: '#004aad',
    700: '#003B8A',
    800: '#002C67',
    900: '#001D44',
  },
  secondary: {
    50: '#F0F9FF', 100: '#E0F2FE', 200: '#BAE6FD', 300: '#7DD3FC', 400: '#38BDF8', 500: '#0EA5E9', 600: '#0284C7', 700: '#0369A1', 800: '#075985', 900: '#0C4A6E',
  },
  neutral: {
    50: '#F9FAFB', 100: '#F3F4F6', 200: '#E5E7EB', 300: '#D1D5DB', 400: '#9CA3AF', 500: '#6B7280', 600: '#4B5563', 700: '#374151', 800: '#1F2937', 900: '#111827',
  },
  success: {
    50: '#ECFDF5', 100: '#D1FAE5', 200: '#A7F3D0', 300: '#6EE7B7', 400: '#34D399', 500: '#10B981', 600: '#059669', 700: '#047857', 800: '#065F46', 900: '#064E3B',
  },
  error: {
    50: '#FEF2F2', 100: '#FEE2E2', 200: '#FECACA', 300: '#FCA5A5', 400: '#F87171', 500: '#EF4444', 600: '#DC2626', 700: '#B91C1C', 800: '#991B1B', 900: '#7F1D1D',
  },
  warning: {
    50: '#FFFBEB', 100: '#FEF3C7', 200: '#FDE68A', 300: '#FCD34D', 400: '#FBBF24', 500: '#F59E0B', 600: '#D97706', 700: '#B45309', 800: '#92400E', 900: '#78350F',
  },
  info: {
    50: '#E6F0FF', 100: '#CCE1FF', 200: '#99C3FF', 300: '#66A5FF', 400: '#3387FF', 500: '#0069FF', 600: '#004aad', 700: '#003B8A', 800: '#002C67', 900: '#001D44',
  },
  red: {
    50: '#FEF2F2', 100: '#FEE2E2', 200: '#FECACA', 300: '#FCA5A5', 400: '#F87171', 500: '#EF4444', 600: '#DC2626', 700: '#B91C1C', 800: '#991B1B', 900: '#7F1D1D',
  },
  green: {
    50: '#ECFDF5', 100: '#D1FAE5', 200: '#A7F3D0', 300: '#6EE7B7', 400: '#34D399', 500: '#10B981', 600: '#059669', 700: '#047857', 800: '#065F46', 900: '#064E3B',
  },
  amber: {
    50: '#FFFBEB', 100: '#FEF3C7', 200: '#FDE68A', 300: '#FCD34D', 400: '#FBBF24', 500: '#F59E0B', 600: '#D97706', 700: '#B45309', 800: '#92400E', 900: '#78350F',
  },
  blue: {
    50: '#E6F0FF', 100: '#CCE1FF', 200: '#99C3FF', 300: '#66A5FF', 400: '#3387FF', 500: '#0069FF', 600: '#004aad', 700: '#003B8A', 800: '#002C67', 900: '#001D44',
  },
  transparent: 'transparent',
  white: '#FFFFFF',
  black: '#000000',
}

const dark = {
  primary: light.primary,
  secondary: light.secondary,
  neutral: {
    50: '#18181B', 100: '#27272A', 200: '#3F3F46', 300: '#52525B', 400: '#71717A', 500: '#A1A1AA', 600: '#D4D4D8', 700: '#E4E4E7', 800: '#F4F4F5', 900: '#FAFAFA',
  },
  success: light.success,
  error: light.error,
  warning: light.warning,
  info: light.info,
  red: light.red,
  green: light.green,
  amber: light.amber,
  blue: light.blue,
  transparent: 'transparent',
  white: '#18181B',
  black: '#FAFAFA',
}

const colorCache = new Map<string, typeof light>()

const getColors = (scheme?: 'light' | 'dark' | null) => {
  const colorScheme = scheme || 'light'
  
  if (colorCache.has(colorScheme)) {
    return colorCache.get(colorScheme)!
  }
  
  const colors = colorScheme === 'dark' ? dark : light
  colorCache.set(colorScheme, colors)
  
  return colors
}

export { light as Colors, dark as DarkColors, getColors }
