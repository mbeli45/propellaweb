// Web compatibility: react-native modules are not available in web builds
// Using browser APIs instead
const Dimensions = {
  get: (type: 'window' | 'screen') => ({
    width: typeof window !== 'undefined' ? window.innerWidth : 1024,
    height: typeof window !== 'undefined' ? window.innerHeight : 768,
  })
};

const PixelRatio = {
  roundToNearestPixel: (value: number) => Math.round(value)
};

const Platform = {
  OS: 'web' as const
};

// Screen dimensions
const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

// Breakpoints for different screen sizes
export const BREAKPOINTS = {
  xs: 320,    // Small phones
  sm: 375,    // Large phones
  md: 768,    // Tablets
  lg: 1024,   // Large tablets
  xl: 1200,   // Small desktops
  xxl: 1440,  // Large desktops
} as const;

// Device type detection
export const getDeviceType = (): 'phone' | 'tablet' | 'desktop' => {
  if (Platform.OS === 'web') {
    if (SCREEN_WIDTH >= BREAKPOINTS.lg) return 'desktop';
    if (SCREEN_WIDTH >= BREAKPOINTS.md) return 'tablet';
    return 'phone';
  }
  
  // For mobile apps, use screen width to determine device type
  if (SCREEN_WIDTH >= BREAKPOINTS.md) return 'tablet';
  return 'phone';
};

// Responsive scaling based on screen width
export const scale = (size: number): number => {
  const scale = SCREEN_WIDTH / 375; // Base width (iPhone 12/13/14)
  const newSize = size * scale;
  return Math.round(PixelRatio.roundToNearestPixel(newSize));
};

// Responsive font scaling
export const scaleFont = (size: number): number => {
  const scale = SCREEN_WIDTH / 375;
  const newSize = size * scale;
  return Math.round(PixelRatio.roundToNearestPixel(newSize));
};

// Responsive spacing
export const scaleSpacing = (size: number): number => {
  const scale = SCREEN_WIDTH / 375;
  const newSize = size * scale;
  return Math.round(PixelRatio.roundToNearestPixel(newSize));
};

// Breakpoint utilities
export const isPhone = (): boolean => getDeviceType() === 'phone';
export const isTablet = (): boolean => getDeviceType() === 'tablet';
export const isDesktop = (): boolean => getDeviceType() === 'desktop';

// Screen size utilities
export const isSmallScreen = (): boolean => SCREEN_WIDTH < BREAKPOINTS.sm;
export const isMediumScreen = (): boolean => SCREEN_WIDTH >= BREAKPOINTS.sm && SCREEN_WIDTH < BREAKPOINTS.md;
export const isLargeScreen = (): boolean => SCREEN_WIDTH >= BREAKPOINTS.md;

// Responsive values based on screen size
export const getResponsiveValue = <T>(
  phone: T,
  tablet?: T,
  desktop?: T
): T => {
  const deviceType = getDeviceType();
  
  if (deviceType === 'desktop' && desktop !== undefined) return desktop;
  if (deviceType === 'tablet' && tablet !== undefined) return tablet;
  return phone;
};

// Responsive padding/margin
export const getResponsivePadding = () => ({
  xs: scaleSpacing(8),
  sm: scaleSpacing(12),
  md: scaleSpacing(16),
  lg: scaleSpacing(20),
  xl: scaleSpacing(24),
  xxl: scaleSpacing(32),
});

// Responsive font sizes
export const getResponsiveFontSizes = () => ({
  xs: scaleFont(10),
  sm: scaleFont(12),
  base: scaleFont(14),
  md: scaleFont(16),
  lg: scaleFont(18),
  xl: scaleFont(20),
  '2xl': scaleFont(24),
  '3xl': scaleFont(30),
  '4xl': scaleFont(36),
  '5xl': scaleFont(48),
});

// Responsive icon sizes
export const getResponsiveIconSizes = () => ({
  xs: scale(12),
  sm: scale(16),
  md: scale(20),
  lg: scale(24),
  xl: scale(28),
  '2xl': scale(32),
  '3xl': scale(40),
});

// Responsive border radius
export const getResponsiveBorderRadius = () => ({
  none: 0,
  sm: scale(2),
  base: scale(4),
  md: scale(6),
  lg: scale(8),
  xl: scale(12),
  '2xl': scale(16),
  '3xl': scale(24),
  full: 9999,
});

// Grid system for responsive layouts
export const getGridColumns = (): number => {
  const deviceType = getDeviceType();
  switch (deviceType) {
    case 'desktop': return 4;
    case 'tablet': return 3;
    case 'phone': return 2;
    default: return 2;
  }
};

// Responsive container max width
export const getContainerMaxWidth = (): number => {
  const deviceType = getDeviceType();
  switch (deviceType) {
    case 'desktop': return 1200;
    case 'tablet': return 768;
    case 'phone': return SCREEN_WIDTH;
    default: return SCREEN_WIDTH;
  }
};

// Responsive aspect ratios
export const getResponsiveAspectRatios = () => ({
  square: 1,
  video: 16 / 9,
  photo: 4 / 3,
  wide: 21 / 9,
  portrait: 3 / 4,
});

// Screen dimensions
export const screenDimensions = {
  width: SCREEN_WIDTH,
  height: SCREEN_HEIGHT,
  isLandscape: SCREEN_WIDTH > SCREEN_HEIGHT,
  isPortrait: SCREEN_HEIGHT > SCREEN_WIDTH,
};

// Safe area utilities
export const getSafeAreaInsets = () => {
  const deviceType = getDeviceType();
  return {
    top: deviceType === 'phone' ? 44 : 20,
    bottom: deviceType === 'phone' ? 34 : 20,
    left: deviceType === 'phone' ? 0 : 20,
    right: deviceType === 'phone' ? 0 : 20,
  };
};

// Responsive shadow
export const getResponsiveShadow = (elevation: number = 2) => {
  const deviceType = getDeviceType();
  const baseShadow = {
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: elevation,
    },
    shadowOpacity: 0.1,
    shadowRadius: elevation * 2,
    elevation: elevation,
  };

  // Adjust shadow for different devices
  if (deviceType === 'desktop') {
    return {
      ...baseShadow,
      shadowRadius: elevation * 3,
      elevation: elevation * 1.5,
    };
  }

  return baseShadow;
};

// Responsive animation durations
export const getResponsiveAnimationDuration = () => ({
  fast: 150,
  normal: 250,
  slow: 350,
  verySlow: 500,
});

// Export all utilities
export default {
  BREAKPOINTS,
  getDeviceType,
  scale,
  scaleFont,
  scaleSpacing,
  isPhone,
  isTablet,
  isDesktop,
  isSmallScreen,
  isMediumScreen,
  isLargeScreen,
  getResponsiveValue,
  getResponsivePadding,
  getResponsiveFontSizes,
  getResponsiveIconSizes,
  getResponsiveBorderRadius,
  getGridColumns,
  getContainerMaxWidth,
  getResponsiveAspectRatios,
  screenDimensions,
  getSafeAreaInsets,
  getResponsiveShadow,
  getResponsiveAnimationDuration,
}; 