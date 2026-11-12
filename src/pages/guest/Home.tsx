import { useMemo } from 'react'
import SEO from '@/components/SEO'
import { generateHomepageStructuredData } from '@/utils/seoUtils'
import StaysHome from '@/pages/stays/StaysHome'
import PropertiesHome from '@/pages/properties/PropertiesHome'
import { useMarket } from '@/contexts/MarketContext'

/** Home follows the Properties | Stays switch; each side has its own page. */
export default function GuestHome() {
  const { market } = useMarket()
  const structuredData = useMemo(() => generateHomepageStructuredData(), [])
  return (
    <>
      <SEO structuredData={structuredData} />
      {market === 'stays' ? <StaysHome mapPath="/guest/map" /> : <PropertiesHome basePath="/guest" />}
    </>
  )
}
