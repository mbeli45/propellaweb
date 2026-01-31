import { Helmet } from 'react-helmet-async'
import { useLanguage } from '@/contexts/I18nContext'

interface SEOProps {
  title?: string
  description?: string
  keywords?: string
  image?: string
  url?: string
  type?: 'website' | 'article' | 'profile'
  structuredData?: object
  noindex?: boolean
}

const getCanonicalBaseUrl = (): string => {
  if (typeof window !== 'undefined') {
    const hostname = window.location.hostname
    if (hostname.includes('propellacam.com') || hostname.includes('propella.cm')) {
      return `https://${hostname.includes('propellacam.com') ? 'propellacam.com' : 'propella.cm'}`
    }
    return window.location.origin
  }
  return 'https://propellacam.com'
}

// Default SEO content in both languages
const defaultSEO = {
  en: {
    title: 'Propella - Real Estate Platform in Cameroon',
    description: 'Find your ideal property in Cameroon. Propella is the best real estate platform to buy, sell or rent houses, apartments and land in Yaoundé, Douala, Buea and throughout Cameroon.',
    keywords: 'real estate Cameroon, house for sale Cameroon, apartment for rent Yaoundé, land Douala, property Buea, real estate Buea, house for sale Buea, apartment for rent Buea, real estate agency Cameroon, property Cameroon, house rental Cameroon, land sale Cameroon'
  },
  fr: {
    title: 'Propella - Plateforme Immobilière au Cameroun',
    description: 'Trouvez votre propriété idéale au Cameroun. Propella est la meilleure plateforme immobilière pour acheter, vendre ou louer des maisons, appartements et terrains à Yaoundé, Douala, Buea et partout au Cameroun.',
    keywords: 'immobilier Cameroun, maison à vendre Cameroun, appartement à louer Yaoundé, terrain Douala, propriété Buea, immobilier Buea, maison à vendre Buea, appartement à louer Buea, agence immobilière Cameroun, propriété Cameroun, location maison Cameroun, vente terrain Cameroun'
  }
}

export default function SEO({
  title,
  description,
  keywords,
  image = '/app-icon.png',
  url = typeof window !== 'undefined' ? window.location.href : getCanonicalBaseUrl(),
  type = 'website',
  structuredData,
  noindex = false,
}: SEOProps) {
  const { currentLanguage } = useLanguage()
  const lang = currentLanguage || 'en'
  const defaults = defaultSEO[lang as keyof typeof defaultSEO] || defaultSEO.en
  
  const baseUrl = getCanonicalBaseUrl()
  const finalTitle = title || defaults.title
  const fullTitle = finalTitle.includes('Propella') ? finalTitle : `${finalTitle} | Propella`
  const finalDescription = description || defaults.description
  const finalKeywords = keywords || defaults.keywords
  const fullImage = image.startsWith('http') ? image : `${baseUrl}${image}`
  const canonicalUrl = url.startsWith('http') ? url : `${baseUrl}${url}`
  
  // Get alternate language URL (same URL, language is handled by app state)
  const alternateLang = lang === 'en' ? 'fr' : 'en'

  const ogLocale = lang === 'fr' ? 'fr_CM' : 'en_CM'
  const alternateOgLocale = lang === 'fr' ? 'en_CM' : 'fr_CM'

  return (
    <Helmet>
      {/* HTML Language */}
      <html lang={lang} />
      
      {/* Primary Meta Tags */}
      <title>{fullTitle}</title>
      <meta name="title" content={fullTitle} />
      <meta name="description" content={finalDescription} />
      <meta name="keywords" content={finalKeywords} />
      {noindex && <meta name="robots" content="noindex, nofollow" />}
      
      {/* Open Graph / Facebook */}
      <meta property="og:type" content={type} />
      <meta property="og:url" content={canonicalUrl} />
      <meta property="og:title" content={fullTitle} />
      <meta property="og:description" content={finalDescription} />
      <meta property="og:image" content={fullImage} />
      <meta property="og:image:width" content="1200" />
      <meta property="og:image:height" content="630" />
      <meta property="og:locale" content={ogLocale} />
      <meta property="og:locale:alternate" content={alternateOgLocale} />
      <meta property="og:site_name" content="Propella" />
      
      {/* Twitter */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:url" content={canonicalUrl} />
      <meta name="twitter:title" content={fullTitle} />
      <meta name="twitter:description" content={finalDescription} />
      <meta name="twitter:image" content={fullImage} />
      
      {/* Canonical URL */}
      <link rel="canonical" href={canonicalUrl} />
      
      {/* Alternate Languages */}
      <link rel="alternate" hrefLang="en" href={canonicalUrl} />
      <link rel="alternate" hrefLang="fr" href={canonicalUrl} />
      <link rel="alternate" hrefLang="x-default" href={canonicalUrl} />
      
      {/* Structured Data */}
      {structuredData && (
        <script type="application/ld+json">
          {JSON.stringify(structuredData)}
        </script>
      )}
    </Helmet>
  )
}
