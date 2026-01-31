/**
 * SEO utility functions for Propella
 */

/**
 * Gets the canonical base URL for SEO purposes
 */
export const getCanonicalBaseUrl = (): string => {
  if (typeof window !== 'undefined') {
    // In production, use the actual domain
    const hostname = window.location.hostname
    if (hostname.includes('propellacam.com') || hostname.includes('propella.cm')) {
      return `https://${hostname.includes('propellacam.com') ? 'propellacam.com' : 'propella.cm'}`
    }
    // For local development
    return window.location.origin
  }
  return 'https://propellacam.com'
}

/**
 * Generates structured data for a property listing
 */
export const generatePropertyStructuredData = (property: any, rentPrices?: { monthlyPrice: number; yearlyPrice: number }) => {
  const baseUrl = getCanonicalBaseUrl()
  const propertyUrl = `${baseUrl}/property/${property.id}`
  const imageUrl = property.images && property.images.length > 0 
    ? property.images[0] 
    : property.image || '/app-icon.png'
  const fullImageUrl = imageUrl.startsWith('http') ? imageUrl : `${baseUrl}${imageUrl}`
  
  const price = property.type === 'rent' && rentPrices 
    ? rentPrices.monthlyPrice 
    : property.price

  return {
    '@context': 'https://schema.org',
    '@type': property.type === 'rent' ? 'Apartment' : 'House',
    name: property.title,
    description: property.description || `${property.title} à ${property.location}, Cameroun`,
    image: fullImageUrl,
    url: propertyUrl,
    address: {
      '@type': 'PostalAddress',
      addressLocality: property.location,
      addressCountry: 'CM',
      addressRegion: property.location.includes('Yaoundé') ? 'Centre' 
        : property.location.includes('Douala') ? 'Littoral' 
        : property.location.includes('Buea') ? 'Sud-Ouest' 
        : 'Cameroun'
    },
    offers: {
      '@type': 'Offer',
      price: price,
      priceCurrency: 'XAF',
      availability: property.status === 'available' ? 'https://schema.org/InStock' : 'https://schema.org/SoldOut',
      url: propertyUrl
    },
    numberOfRooms: property.bedrooms || undefined,
    numberOfBathroomsTotal: property.bathrooms || undefined,
    floorSize: property.area ? {
      '@type': 'QuantitativeValue',
      value: property.area,
      unitCode: 'MTK'
    } : undefined,
    ...(property.owner && {
      seller: {
        '@type': 'RealEstateAgent',
        name: property.owner.full_name || 'Agent',
        url: `${baseUrl}/agents/${property.owner.id}`
      }
    })
  }
}

/**
 * Generates structured data for an agent profile
 */
export const generateAgentStructuredData = (agent: any, propertiesCount: number, reviewsCount: number, averageRating?: number | null) => {
  const baseUrl = getCanonicalBaseUrl()
  const agentUrl = `${baseUrl}/agents/${agent.id}`

  return {
    '@context': 'https://schema.org',
    '@type': 'RealEstateAgent',
    name: agent.full_name || 'Agent Immobilier',
    description: agent.bio || `Agent immobilier professionnel au Cameroun avec ${propertiesCount} propriété${propertiesCount > 1 ? 's' : ''} listée${propertiesCount > 1 ? 's' : ''}.`,
    url: agentUrl,
    image: agent.avatar_url || undefined,
    email: agent.email || undefined,
    telephone: agent.phone || undefined,
    address: {
      '@type': 'PostalAddress',
      addressCountry: 'CM'
    },
    aggregateRating: averageRating ? {
      '@type': 'AggregateRating',
      ratingValue: averageRating,
      reviewCount: reviewsCount
    } : undefined,
    numberOfProperties: propertiesCount
  }
}

/**
 * Generates structured data for the homepage
 */
export const generateHomepageStructuredData = () => {
  return {
    '@context': 'https://schema.org',
    '@type': 'RealEstateAgent',
    name: 'Propella',
    description: 'Plateforme immobilière au Cameroun pour acheter, vendre et louer des propriétés à Yaoundé, Douala, Buea et partout au Cameroun',
    url: getCanonicalBaseUrl(),
    address: {
      '@type': 'PostalAddress',
      addressCountry: 'CM',
      addressRegion: 'Cameroun'
    },
    areaServed: [
      {
        '@type': 'City',
        name: 'Yaoundé'
      },
      {
        '@type': 'City',
        name: 'Douala'
      },
      {
        '@type': 'City',
        name: 'Buea'
      },
      {
        '@type': 'Country',
        name: 'Cameroun'
      }
    ],
    serviceType: 'Real Estate Services',
    priceRange: '$$'
  }
}
