import { useState, useMemo, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { useThemeMode } from '@/contexts/ThemeContext'
import { useLanguage } from '@/contexts/I18nContext'
import { getColors } from '@/constants/Colors'
import { useHomeProperties } from '@/hooks/useProperties'
import { useSearch } from '@/hooks/useSearch'
import SearchBar from '@/components/SearchBar'
import FilterModal, { FilterOptions } from '@/components/FilterModal'
import PropertyCard from '@/components/PropertyCard'
import PropertyListSkeleton from '@/components/PropertyListSkeleton'
import PropertyFeedView from '@/components/PropertyFeedView'
import { MapPin, ArrowRight, Grid3x3, LayoutGrid } from 'lucide-react'
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
    priceRange: [0, 5000000],
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
      minPrice: newFilters.priceRange[0],
      maxPrice: newFilters.priceRange[1],
      bedrooms: newFilters.bedrooms || undefined,
      bathrooms: newFilters.bathrooms || undefined,
    })
    setFilterVisible(false)
  }, [updateFilters])

  const handleViewModeChange = useCallback((mode: 'grid' | 'feed') => {
    setViewMode(mode)
    localStorage.setItem('homeViewMode', mode)
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

  // Render feed view
  if (viewMode === 'feed') {
    return (
      <div style={{ 
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        height: '100dvh',
        overflow: 'hidden'
      }}>
        {/* View Toggle Button - Only show when feed is active */}
        <button
          onClick={() => handleViewModeChange('grid')}
          style={{
            position: 'absolute',
            top: '16px',
            right: '16px',
            zIndex: 100,
            padding: '10px',
            borderRadius: '8px',
            border: 'none',
            backgroundColor: 'rgba(0,0,0,0.5)',
            color: Colors.white,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            backdropFilter: 'blur(10px)',
            transition: 'all 0.2s'
          }}
          title="Switch to Grid View"
        >
          <Grid3x3 size={20} />
        </button>
        <PropertyFeedView 
          properties={allPropertiesForFeed}
          loading={isLoading}
        />
      </div>
    )
  }

  return (
    <div className="home-container" style={{ backgroundColor: Colors.neutral[100] }}>
      {/* Search Bar and View Toggle */}
      <div style={{ 
        padding: '16px',
        display: 'flex',
        alignItems: 'center',
        gap: '8px'
      }}>
        <div style={{ flex: 1 }}>
          <SearchBar 
            onSearch={handleSearch}
            onFilter={handleFilterOpen}
            placeholder={t('home.searchPlaceholder')}
          />
        </div>
        <button
          onClick={() => handleViewModeChange(viewMode === 'grid' ? 'feed' : 'grid')}
          style={{
            padding: '10px',
            borderRadius: '8px',
            border: 'none',
            backgroundColor: Colors.neutral[100],
            color: Colors.neutral[700],
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            transition: 'all 0.2s'
          }}
          title={viewMode === 'grid' ? 'Switch to Feed View' : 'Switch to Grid View'}
        >
          {viewMode === 'grid' ? <LayoutGrid size={20} /> : <Grid3x3 size={20} />}
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
        <div className="properties-section">
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
          <div className="property-grid">
            {featuredProperties.slice(0, 6).map((property) => (
              <PropertyCard key={property.id} property={property} />
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
  )
}
