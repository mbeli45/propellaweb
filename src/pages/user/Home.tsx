import React, { useState, useMemo, useCallback, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '@/contexts/AuthContext'
import { useThemeMode } from '@/contexts/ThemeContext'
import { useLanguage } from '@/contexts/I18nContext'
import { getColors } from '@/constants/Colors'
import { useHomeProperties } from '@/hooks/useProperties'
import { useSearch } from '@/hooks/useSearch'
import { useAgentVerification } from '@/hooks/useAgentVerification'
import SearchBar from '@/components/SearchBar'
import FilterModal, { FilterOptions } from '@/components/FilterModal'
import PropertyCard from '@/components/PropertyCard'
import PropertyListSkeleton from '@/components/PropertyListSkeleton'
import { MapPin, ArrowRight, Star, User as UserIcon } from 'lucide-react'
import './Home.css'

export default function UserHome() {
  const { user } = useAuth()
  const { colorScheme } = useThemeMode()
  const { t } = useLanguage()
  const Colors = getColors(colorScheme)
  const navigate = useNavigate()
  const { getTopVerifiedAgents, getBadgeInfo } = useAgentVerification()

  const {
    featuredProperties,
    recentProperties,
    loading: homeLoading,
    error: homeError
  } = useHomeProperties()

  const {
    searchTerm,
    results: searchResults,
    loading: searchLoading,
    error: searchError,
    search,
    clearSearch,
    updateFilters
  } = useSearch()

  const [selectedLocation, setSelectedLocation] = useState<string | null>(null)
  const [topAgents, setTopAgents] = useState<any[]>([])
  const [agentRatings, setAgentRatings] = useState<{ [id: string]: number }>({})
  const [agentsFetched, setAgentsFetched] = useState(false)
  const [filterVisible, setFilterVisible] = useState(false)
  const [filters, setFilters] = useState<FilterOptions>({
    propertyType: [],
    priceRange: [0, 5000000],
    bedrooms: null,
    bathrooms: null,
    category: [],
  })

  const popularLocations = useMemo(() => [
    'Douala',
    'Yaoundé',
    'Bamenda',
    'Buea',
    'Kribi'
  ], [])

  useEffect(() => {
    const fetchTopAgents = async () => {
      if (agentsFetched) return
      try {
        setAgentsFetched(true)
        const agents = await getTopVerifiedAgents(5)
        setTopAgents(agents)

        const ratings: { [id: string]: number } = {}
        agents.forEach(agent => {
          ratings[agent.id] = agent.verification?.average_rating || 0
        })
        setAgentRatings(ratings)
      } catch (error) {
        setTopAgents([])
        setAgentRatings({})
      }
    }

    if (!agentsFetched) {
      fetchTopAgents()
    }
  }, [getTopVerifiedAgents, agentsFetched])

  const handleSearch = useCallback((query: string) => {
    if (query.trim()) {
      setSelectedLocation(null)
      search(query)
    } else {
      clearSearch()
    }
  }, [search, clearSearch])

  const handleLocationFilter = useCallback((location: string) => {
    if (selectedLocation === location) {
      setSelectedLocation(null)
      clearSearch()
    } else {
      setSelectedLocation(location)
      search(location)
    }
  }, [selectedLocation, search, clearSearch])

  const handleSeeAll = useCallback((section: string) => {
    if (section === 'featured') {
      navigate('/user/explore?filter=featured')
    } else if (section === 'recent') {
      navigate('/user/explore?filter=recent')
    } else if (section === 'agents') {
      navigate('/user/explore?filter=agents')
    }
  }, [navigate])

  const handleFilterOpen = useCallback(() => {
    setFilterVisible(true)
  }, [])

  const handleFilterApply = useCallback((newFilters: FilterOptions) => {
    setFilters(newFilters)
    updateFilters({
      category: newFilters.category,
      minPrice: newFilters.priceRange[0],
      maxPrice: newFilters.priceRange[1],
      bedrooms: newFilters.bedrooms || undefined,
      bathrooms: newFilters.bathrooms || undefined,
    })
    setFilterVisible(false)
  }, [updateFilters])

  const displayProperties = searchTerm ? searchResults : (selectedLocation ? searchResults : featuredProperties)
  const isLoading = searchTerm ? searchLoading : homeLoading
  const hasError = searchTerm ? searchError : homeError
  const hasTopAgents = topAgents.length > 0

  return (
    <div className="home-container" style={{ backgroundColor: Colors.neutral[100] }}>
      {/* Welcome Section */}
      <div className="welcome-section" style={{ 
        backgroundColor: Colors.white,
        borderBottom: `1px solid ${Colors.neutral[200]}`,
        padding: '14px 16px',
        marginBottom: '2px'
      }}>
        <h1 style={{ 
          fontSize: '20px', 
          fontWeight: '700', 
          color: Colors.neutral[900], 
          marginBottom: '4px',
          fontFamily: 'Inter-Bold',
          margin: 0
        }}>
          {t('home.welcomeBack', { name: user?.full_name?.split(' ')[0] || t('common.user') })}
        </h1>
        <p style={{ 
          fontSize: '14px', 
          color: Colors.neutral[600], 
          fontFamily: 'Inter-Regular',
          margin: 0
        }}>
          {t('home.welcomeSubtext')}
        </p>
      </div>

      {/* Search Bar */}
      <div style={{ padding: '0 16px', marginBottom: '12px' }}>
        <SearchBar 
          onSearch={handleSearch}
          onFilter={handleFilterOpen}
          placeholder={t('home.searchPlaceholder')}
        />
      </div>

      {/* Location Pills */}
      <div className="location-pills-container" style={{ padding: '0 16px 12px' }}>
        <div className="location-pills-scroll hidden-scrollbar">
          {popularLocations.map((location, index) => {
            const isSelected = selectedLocation === location
            return (
              <button
                key={index}
                onClick={() => handleLocationFilter(location)}
                className="location-pill"
                style={{
                  backgroundColor: isSelected ? Colors.primary[50] : Colors.white,
                  borderColor: isSelected ? Colors.primary[300] : Colors.neutral[200],
                  color: isSelected ? Colors.primary[700] : Colors.neutral[700],
                }}
              >
                <MapPin size={16} color={isSelected ? Colors.primary[700] : Colors.neutral[600]} />
                <span>{location}</span>
              </button>
            )
          })}
        </div>
      </div>

      {/* Top Agents Section */}
      {hasTopAgents && !searchTerm && (
        <div className="top-agents-section" style={{ marginBottom: '24px' }}>
          <div className="section-header" style={{ padding: '0 16px', marginBottom: '12px' }}>
            <h2 style={{ fontSize: '18px', fontWeight: '600', color: Colors.neutral[800] }}>
              Top Agents
            </h2>
            <button
              onClick={() => handleSeeAll('agents')}
              className="see-all-button"
              style={{ color: Colors.primary[800] }}
            >
              See All
              <ArrowRight size={16} />
            </button>
          </div>
          <div className="top-agents-scroll hidden-scrollbar">
            {topAgents.map((agent) => {
              const badgeInfo = getBadgeInfo(agent.verification_badge || agent.verification?.verification_badge || 'none')
              return (
                <div
                  key={agent.id}
                  className="agent-card"
                  onClick={() => navigate(`/agents/${agent.id}`)}
                  style={{
                    backgroundColor: Colors.white,
                    borderRadius: '12px',
                    padding: '16px',
                    minWidth: '140px',
                    border: `1px solid ${Colors.neutral[200]}`,
                    cursor: 'pointer',
                    transition: 'transform 0.2s'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform = 'translateY(-2px)'
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = 'translateY(0)'
                  }}
                >
                  <div style={{ position: 'relative', marginBottom: '8px' }}>
                    {agent.avatar_url ? (
                      <img 
                        src={agent.avatar_url} 
                        alt={agent.full_name}
                        style={{
                          width: '48px',
                          height: '48px',
                          borderRadius: '24px',
                          objectFit: 'cover'
                        }}
                      />
                    ) : (
                      <div style={{
                        width: '48px',
                        height: '48px',
                        borderRadius: '24px',
                        backgroundColor: Colors.neutral[100],
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                      }}>
                        <UserIcon size={24} color={Colors.neutral[600]} />
                      </div>
                    )}
                  </div>
                  <p style={{
                    fontSize: '14px',
                    fontWeight: '600',
                    color: Colors.neutral[800],
                    marginBottom: '4px',
                    fontFamily: 'Inter-SemiBold',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap'
                  }}>
                    {agent.full_name}
                  </p>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <Star size={12} color={Colors.warning[500]} fill={Colors.warning[500]} />
                    <span style={{
                      fontSize: '12px',
                      fontWeight: '600',
                      color: Colors.neutral[600],
                      fontFamily: 'Inter-SemiBold'
                    }}>
                      {agentRatings[agent.id]?.toFixed(1) || 'N/A'}
                    </span>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Error State */}
      {hasError && (
        <div style={{ padding: '16px', textAlign: 'center', color: Colors.error[600] }}>
          {t('common.errorLoading')}
        </div>
      )}

      {/* Loading State */}
      {isLoading && !displayProperties.length && (
        <PropertyListSkeleton count={6} />
      )}

      {/* Search Results Section */}
      {searchTerm && displayProperties.length > 0 && (
        <div className="properties-section">
          <div className="section-header">
            <h2 style={{ fontSize: '18px', fontWeight: '600', color: Colors.neutral[800] }}>
              {t('search.results')} ({displayProperties.length})
            </h2>
          </div>
          <div className="property-grid">
            {displayProperties.map((property) => (
              <PropertyCard key={property.id} property={property} />
            ))}
          </div>
        </div>
      )}

      {/* Featured Properties Section - Horizontal Scroll */}
      {!searchTerm && featuredProperties.length > 0 && (
        <div className="properties-section">
          <div className="section-header">
            <h2 style={{ fontSize: '18px', fontWeight: '600', color: Colors.neutral[800] }}>
              {t('home.featuredProperties')}
            </h2>
            <button
              onClick={() => handleSeeAll('featured')}
              className="see-all-button"
              style={{ color: Colors.primary[800] }}
            >
              {t('home.seeAll')}
              <ArrowRight size={16} />
            </button>
          </div>
          <div className="horizontal-properties-scroll hidden-scrollbar">
            {featuredProperties.map((property) => (
              <div key={property.id} className="horizontal-card-container">
                <PropertyCard property={property} />
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Recent Properties Section */}
      {!searchTerm && recentProperties.length > 0 && (
        <div className="properties-section">
          <div className="section-header">
            <h2 style={{ fontSize: '18px', fontWeight: '600', color: Colors.neutral[800] }}>
              {t('home.recentProperties')}
            </h2>
            <button
              onClick={() => handleSeeAll('recent')}
              className="see-all-button"
              style={{ color: Colors.primary[800] }}
            >
              {t('home.seeAll')}
              <ArrowRight size={16} />
            </button>
          </div>
          <div className="property-grid">
            {recentProperties.slice(0, 4).map((property) => (
              <PropertyCard key={property.id} property={property} />
            ))}
          </div>
        </div>
      )}

      {/* Empty State */}
      {!isLoading && !hasError && displayProperties.length === 0 && !searchTerm && (
        <div className="empty-state" style={{ padding: '48px 16px', textAlign: 'center' }}>
          <p style={{ fontSize: '18px', fontWeight: '600', color: Colors.neutral[600], marginBottom: '8px' }}>
            {t('home.noPropertiesAvailable')}
          </p>
          <p style={{ fontSize: '14px', color: Colors.neutral[500] }}>
            {t('home.checkBackLater')}
          </p>
        </div>
      )}

      <FilterModal
        visible={filterVisible}
        onClose={() => setFilterVisible(false)}
        onApply={handleFilterApply}
        initialFilters={filters}
      />
    </div>
  )
}
