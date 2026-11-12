import StaysHome from '@/pages/stays/StaysHome'
import PropertiesHome from '@/pages/properties/PropertiesHome'
import { useMarket } from '@/contexts/MarketContext'

/** Home follows the Properties | Stays switch; each side has its own page. */
export default function UserHome() {
  const { market } = useMarket()
  return market === 'stays' ? <StaysHome mapPath="/user/map" /> : <PropertiesHome basePath="/user" showAgents />
}
