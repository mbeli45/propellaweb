import { PropertyData } from '@/components/PropertyCard'

interface ShareOptions {
  title?: string
  message: string
  url?: string
  imageUrl?: string
  imageUri?: string
}

/**
 * Formats a price number into a readable string with FCFA currency
 */
export const formatPrice = (price: number): string => {
  return `${price.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ' ')} FCFA`
}

/**
 * Calculates monthly and yearly rent prices based on stored price and rent_period
 */
export const calculateRentPrices = (
  price: number,
  rent_period?: 'monthly' | 'yearly' | null | string
): { monthlyPrice: number; yearlyPrice: number } => {
  if (!price || isNaN(price) || price <= 0) {
    return { monthlyPrice: 0, yearlyPrice: 0 }
  }
  
  const normalizedPeriod = rent_period?.toString().toLowerCase().trim()
  const isYearly = normalizedPeriod === 'yearly' || !normalizedPeriod || normalizedPeriod === 'null' || normalizedPeriod === 'undefined'
  
  if (isYearly) {
    const monthlyPrice = Math.round(price / 12)
    return {
      monthlyPrice,
      yearlyPrice: price,
    }
  } else {
    const yearlyPrice = Math.round(price * 12)
    return {
      monthlyPrice: price,
      yearlyPrice,
    }
  }
}

/**
 * Gets the base URL for the current platform
 */
export const getBaseUrl = (): string => {
  if (typeof window !== 'undefined') {
    return window.location.origin
  }
  return 'https://propellacam.com'
}

/**
 * Creates a property URL
 */
export const createPropertyUrl = (property: PropertyData): string => {
  const baseUrl = getBaseUrl()
  return `${baseUrl}/property/${property.id}`
}

/**
 * Creates a deep link URL
 */
export const createDeepLinkUrl = (property: PropertyData): string => {
  return createPropertyUrl(property)
}

/**
 * Creates a web share URL
 */
export const createWebShareUrl = (property: PropertyData): string => {
  return `https://propellacam.com/functions/v1/share-property?id=${property.id}`
}

/**
 * Creates a share message for a property
 */
export const createPropertyShareMessage = (property: PropertyData): string => {
  const propertyUrl = createPropertyUrl(property)
  
  return [
    `🏠 ${property.title}`,
    `💰 ${formatPrice(property.price)}`,
    `📍 ${property.location}`,
    property.bedrooms ? `🛏️ ${property.bedrooms} Bedrooms` : '',
    property.bathrooms ? `🚿 ${property.bathrooms} Bathrooms` : '',
    property.area ? `📏 ${property.area}m²` : '',
    `\nCheck out this property on Propella!`,
    `\n${propertyUrl}`,
  ].filter(Boolean).join('\n')
}

/**
 * Validates and formats an image URL for sharing
 */
export const formatImageUrlForSharing = (imageUrl?: string): string | undefined => {
  if (!imageUrl) return undefined
  
  if (imageUrl.startsWith('/')) {
    return `https://propellacam.com${imageUrl}`
  }
  
  if (imageUrl.includes('placeholder') || imageUrl.includes('via.placeholder')) {
    return undefined
  }
  
  return imageUrl
}

/**
 * Gets the best available image URL from a property
 */
export const getPropertyImageUrl = (property: PropertyData): string | undefined => {
  const imageUrl = property.images && property.images.length > 0
    ? property.images[0]
    : property.image
  
  return formatImageUrlForSharing(imageUrl)
}

/**
 * Downloads an image (web version - returns blob URL)
 */
export const downloadImage = async (imageUrl: string): Promise<string | null> => {
  try {
    if (!imageUrl || imageUrl.includes('placeholder')) {
      return null
    }

    const response = await fetch(imageUrl)
    if (!response.ok) return null
    
    const blob = await response.blob()
    return URL.createObjectURL(blob)
  } catch (error) {
    console.error('Error downloading image:', error)
    return null
  }
}

/**
 * Saves an image to library (web version - not supported)
 */
export const saveImageToLibrary = async (imageUri: string): Promise<boolean> => {
  // Web: Not supported, user can right-click to save
  return false
}

/**
 * Shares content using Web Share API
 */
export const shareContent = async (options: ShareOptions): Promise<void> => {
  try {
    const { title, message, url, imageUrl } = options

    if (navigator.share) {
      try {
        const shareData: any = {
          title: title || 'Share from Propella',
          text: message,
        }
        
        if (url) {
          shareData.url = url
        }
        
        await navigator.share(shareData)
        return
      } catch (shareError: any) {
        if (shareError.name !== 'AbortError') {
          console.log('Web Share API failed, falling back to clipboard')
        } else {
          return // User cancelled
        }
      }
    }
    
    // Fallback: Copy to clipboard
    const alreadyHasUrl = url ? message.includes(url) : false
    const shareText = url
      ? (alreadyHasUrl ? message : `${message}\n\n${url}`)
      : message
    await navigator.clipboard.writeText(shareText)
    alert('Copied! Content has been copied to your clipboard')
  } catch (error) {
    console.error('Share error:', error)
    alert('Could not share content')
  }
}

/**
 * Creates Open Graph meta tags for better web sharing previews
 */
export const createOpenGraphMeta = (property: PropertyData): void => {
  if (typeof document === 'undefined') {
    return
  }

  const propertyUrl = createPropertyUrl(property)
  const imageUrl = getPropertyImageUrl(property)
  const title = property.title || 'Property on Propella'
  const description = `${formatPrice(property.price)} - ${property.location}`

  // Remove existing meta tags
  const existingTags = document.querySelectorAll('meta[property^="og:"], meta[name^="twitter:"]')
  existingTags.forEach(tag => tag.remove())

  // Create Open Graph meta tags
  const metaTags = [
    { property: 'og:title', content: title },
    { property: 'og:description', content: description },
    { property: 'og:url', content: propertyUrl },
    { property: 'og:type', content: 'website' },
    { property: 'og:site_name', content: 'Propella' },
    { name: 'twitter:card', content: 'summary_large_image' },
    { name: 'twitter:title', content: title },
    { name: 'twitter:description', content: description },
    { name: 'twitter:url', content: propertyUrl },
  ]

  // Add image if available
  if (imageUrl) {
    metaTags.push(
      { property: 'og:image', content: imageUrl },
      { property: 'og:image:width', content: '1200' },
      { property: 'og:image:height', content: '630' },
      { name: 'twitter:image', content: imageUrl }
    )
  }

  // Add meta tags to document head
  metaTags.forEach(tag => {
    const meta = document.createElement('meta')
    Object.entries(tag).forEach(([key, value]) => {
      meta.setAttribute(key, value)
    })
    document.head.appendChild(meta)
  })
}

/**
 * Shares a property
 */
export const shareProperty = async (property: PropertyData): Promise<void> => {
  const message = createPropertyShareMessage(property)
  const imageUrl = getPropertyImageUrl(property)
  const shareUrl = createWebShareUrl(property)

  await shareContent({
    title: property.title || 'Property on Propella',
    message,
    url: shareUrl,
    imageUrl,
  })
}

/**
 * Shares a property URL with a custom message
 */
export const sharePropertyUrl = async (property: PropertyData, customMessage?: string): Promise<void> => {
  const propertyUrl = createPropertyUrl(property)
  const shareUrl = createWebShareUrl(property)
  const message = customMessage 
    ? `${customMessage}\n\n${propertyUrl}`
    : `Check out this property: ${property.title}\n\n${propertyUrl}`

  await shareContent({
    title: property.title || 'Property on Propella',
    message,
    url: shareUrl,
  })
}

/**
 * Requests sharing permissions (web - always true)
 */
export const requestSharingPermissions = async (): Promise<boolean> => {
  return true
}

/**
 * Shares a property with image
 */
export const sharePropertyWithImage = async (property: PropertyData): Promise<void> => {
  const message = createPropertyShareMessage(property)
  const imageUrl = getPropertyImageUrl(property)
  const propertyUrl = createWebShareUrl(property)

  // Create Open Graph meta tags for better sharing previews
  createOpenGraphMeta(property)
  
  // Share the property URL
  await shareContent({
    title: property.title || 'Property on Propella',
    message,
    url: propertyUrl,
    imageUrl,
  })
}
