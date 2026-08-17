import { useState, useMemo, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { useThemeMode } from '@/contexts/ThemeContext'
import { useLanguage } from '@/contexts/I18nContext'
import { getColors } from '@/constants/Colors'
import { useHomeProperties } from '@/hooks/useProperties'
import { useSearch } from '@/hooks/useSearch'
import SearchBar from '@/components/SearchBar'
import FilterModal, { FilterOptions, MAX_PRICE } from '@/components/FilterModal'
import PropertyCard from '@/components/PropertyCard'
import PropertyListSkeleton from '@/components/PropertyListSkeleton'
import PropertyFeedView from '@/components/PropertyFeedView'
import SEO from '@/components/SEO'
import { generateHomepageStructuredData } from '@/utils/seoUtils'
import { MapPin, ArrowRight, LayoutGrid } from 'lucide-react'
import './Home.css'

export default function GuestHome() {
  const { colorScheme } = useThemeMode()
  const { t } = useLanguage()
  const Colors = getColors(colorScheme)
  const navigate = useNavigate()

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
  const [filterVisible, setFilterVisible] = useState(false)
  const [filters, setFilters] = useState<FilterOptions>({
    propertyType: [],
    priceRange: [0, MAX_PRICE],
    bedrooms: null,
    bathrooms: null,
    category: [],
  })
  const [viewMode, setViewMode] = useState<'grid' | 'feed'>('feed')

  const popularLocations = useMemo(() => [
    'Yaoundé',
    'Douala',
    'Bafoussam',
    'Buea',
    'Limbe',
    'Kribi',
    'Bamenda'
  ], [])

  const handleSearch = useCallback((query: string) => {
    if (query.trim()) {
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

  const handleFilterOpen = useCallback(() => {
    setFilterVisible(true)
  }, [])

  const handleFilterApply = useCallback((newFilters: FilterOptions) => {
    setFilters(newFilters)
    updateFilters({
      category: newFilters.category,
      propertyType: newFilters.propertyType,
      minPrice: newFilters.priceRange[0] > 0 ? newFilters.priceRange[0] : undefined,
      // The top of the range means "no maximum", so don't constrain the query.
      maxPrice: newFilters.priceRange[1] < MAX_PRICE ? newFilters.priceRange[1] : undefined,
      bedrooms: newFilters.bedrooms || undefined,
      bathrooms: newFilters.bathrooms || undefined,
    })
    setFilterVisible(false)
  }, [updateFilters])

  const handleViewModeChange = useCallback((mode: 'grid' | 'feed') => {
    setViewMode(mode)
    localStorage.setItem('homeViewMode', mode)
    // Trigger a custom event to notify BottomNavigation
    window.dispatchEvent(new Event('viewModeChange'))
  }, [])

  // Combine all properties for feed view
  const allPropertiesForFeed = useMemo(() => {
    if (searchTerm) {
      return searchResults
    }
    // Combine featured and recent, removing duplicates
    const combined = [...featuredProperties]
    recentProperties.forEach(prop => {
      if (!combined.find(p => p.id === prop.id)) {
        combined.push(prop)
      }
    })
    return combined
  }, [searchTerm, searchResults, featuredProperties, recentProperties])

  const displayProperties = searchTerm ? searchResults : (selectedLocation ? searchResults : featuredProperties)
  const isLoading = searchTerm ? searchLoading : homeLoading
  const hasError = searchTerm ? searchError : homeError

  // Generate structured data for homepage
  const structuredData = useMemo(() => generateHomepageStructuredData(), [])

  // Render feed view
  if (viewMode === 'feed') {
    return (
      <>
        <SEO
          structuredData={structuredData}
        />
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          height: '100dvh',
          overflow: 'hidden'
        }}>
          <PropertyFeedView
            properties={allPropertiesForFeed}
            loading={isLoading}
            onSwitchToGrid={() => handleViewModeChange('grid')}
            onSearch={handleSearch}
            searchValue={searchTerm}
          />
        </div>
      </>
    )
  }

  return (
    <>
      <SEO
        structuredData={structuredData}
      />
      <div className="home-container" style={{ backgroundColor: Colors.neutral[100] }}>
      {/* Search Bar and View Toggle */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        paddingRight: '16px',
        marginTop: '16px',
        marginBottom: '12px',
        gap: '8px',
        maxWidth: '720px'
      }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <SearchBar
            onSearch={handleSearch}
            onFilter={handleFilterOpen}
            placeholder={t('home.searchPlaceholder')}
          />
        </div>
        <button
          onClick={() => handleViewModeChange('feed')}
          style={{
            padding: '0 12px',
            height: '48px',
            borderRadius: '10px',
            border: `1px solid ${Colors.neutral[200]}`,
            backgroundColor: Colors.white,
            color: Colors.primary[700],
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            fontSize: '13px',
            fontWeight: '600',
            flexShrink: 0,
            whiteSpace: 'nowrap',
            transition: 'all 0.2s'
          }}
        >
          <LayoutGrid size={18} />
          Feed
        </button>
      </div>

      {/* Location Pills */}
      <div className="location-pills-container" style={{ padding: '16px' }}>
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
                <MapPin size={16} />
                <span>{location}</span>
              </button>
            )
          })}
        </div>
      </div>

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

      {/* Featured Properties Section */}
      {!searchTerm && featuredProperties.length > 0 && (
        <div className="properties-section" style={{ position: 'relative' }}>
          <div className="section-header">
            <h2 style={{ fontSize: '18px', fontWeight: '600', color: Colors.neutral[800] }}>
              {t('home.featuredProperties')}
            </h2>
            <button
              onClick={() => navigate('/guest/explore')}
              className="see-all-button"
              style={{ color: Colors.primary[800] }}
            >
              {t('home.seeAll')}
              <ArrowRight size={16} />
            </button>
          </div>

          {/* Scroll Left Button - Desktop Only */}
          <button
            onClick={() => {
              const container = document.getElementById('guest-featured-scroll-container')
              if (container) {
                container.scrollBy({ left: -340, behavior: 'smooth' })
              }
            }}
            className="horizontal-scroll-arrow left"
            style={{
              position: 'absolute',
              left: '0',
              top: '50%',
              transform: 'translateY(-50%)',
              zIndex: 10,
              width: '40px',
              height: '40px',
              borderRadius: '50%',
              backgroundColor: Colors.white,
              border: `1px solid ${Colors.neutral[200]}`,
              display: 'none',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
              transition: 'all 0.2s'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = Colors.neutral[50]
              e.currentTarget.style.transform = 'translateY(-50%) scale(1.1)'
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = Colors.white
              e.currentTarget.style.transform = 'translateY(-50%) scale(1)'
            }}
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={Colors.neutral[700]} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="15 18 9 12 15 6"></polyline>
            </svg>
          </button>

          <div id="guest-featured-scroll-container" className="horizontal-properties-scroll hidden-scrollbar">
            {featuredProperties.map((property) => (
              <div key={property.id} className="horizontal-card-container">
                <PropertyCard property={property} />
              </div>
            ))}
          </div>

          {/* Scroll Right Button - Desktop Only */}
          <button
            onClick={() => {
              const container = document.getElementById('guest-featured-scroll-container')
              if (container) {
                container.scrollBy({ left: 340, behavior: 'smooth' })
              }
            }}
            className="horizontal-scroll-arrow right"
            style={{
              position: 'absolute',
              right: '0',
              top: '50%',
              transform: 'translateY(-50%)',
              zIndex: 10,
              width: '40px',
              height: '40px',
              borderRadius: '50%',
              backgroundColor: Colors.white,
              border: `1px solid ${Colors.neutral[200]}`,
              display: 'none',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
              transition: 'all 0.2s'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = Colors.neutral[50]
              e.currentTarget.style.transform = 'translateY(-50%) scale(1.1)'
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = Colors.white
              e.currentTarget.style.transform = 'translateY(-50%) scale(1)'
            }}
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={Colors.neutral[700]} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="9 18 15 12 9 6"></polyline>
            </svg>
          </button>
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
              onClick={() => navigate('/guest/explore')}
              className="see-all-button"
              style={{ color: Colors.primary[800] }}
            >
              {t('home.seeAll')}
              <ArrowRight size={16} />
            </button>
          </div>
          <div className="property-grid">
            {recentProperties.slice(0, 6).map((property) => (
              <PropertyCard key={property.id} property={property} />
            ))}
          </div>
        </div>
      )}

      {/* Empty State */}
      {!isLoading && !hasError && displayProperties.length === 0 && (
        <div className="empty-state" style={{ padding: '48px 16px', textAlign: 'center' }}>
          <p style={{ fontSize: '18px', fontWeight: '600', color: Colors.neutral[600], marginBottom: '8px' }}>
            {searchTerm ? t('search.noResults') : t('home.noProperties')}
          </p>
          <p style={{ fontSize: '14px', color: Colors.neutral[500] }}>
            {searchTerm ? t('search.tryDifferentSearch') : t('home.checkBackLater')}
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
    </>
  )
}
