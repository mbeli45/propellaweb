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
  const [viewMode, setViewMode] = useState<'grid' | 'feed'>(() => {
    const saved = localStorage.getItem('homeViewMode')
    return (saved === 'feed' || saved === 'grid') ? saved : 'grid'
  })

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
      <div style={{ height: '100vh', overflow: 'hidden', position: 'relative' }}>
        {/* View Toggle Overlay - Only show when feed is active */}
        <div style={{
          position: 'absolute',
          top: '16px',
          right: '16px',
          zIndex: 100,
          display: 'flex',
          gap: '4px',
          backgroundColor: 'rgba(0,0,0,0.5)',
          borderRadius: '8px',
          padding: '4px',
          backdropFilter: 'blur(10px)'
        }}>
          <button
            onClick={() => handleViewModeChange('grid')}
            style={{
              padding: '8px 12px',
              borderRadius: '6px',
              border: 'none',
              backgroundColor: 'rgba(255,255,255,0.2)',
              color: Colors.white,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
              fontSize: '14px',
              fontWeight: '500',
              transition: 'all 0.2s'
            }}
          >
            <Grid3x3 size={16} />
            <span style={{ display: window.innerWidth > 480 ? 'inline' : 'none' }}>Grid</span>
          </button>
        </div>
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
        <div style={{
          display: 'flex',
          gap: '4px',
          backgroundColor: Colors.neutral[100],
          borderRadius: '8px',
          padding: '4px'
        }}>
          <button
            onClick={() => handleViewModeChange('grid')}
            style={{
              padding: '8px 12px',
              borderRadius: '6px',
              border: 'none',
              backgroundColor: viewMode === 'grid' ? Colors.white : 'transparent',
              color: viewMode === 'grid' ? Colors.primary[600] : Colors.neutral[600],
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
              fontSize: '14px',
              fontWeight: '500',
              boxShadow: viewMode === 'grid' ? '0 2px 4px rgba(0,0,0,0.1)' : 'none',
              transition: 'all 0.2s'
            }}
          >
            <Grid3x3 size={16} />
            <span style={{ display: window.innerWidth > 480 ? 'inline' : 'none' }}>Grid</span>
          </button>
          <button
            onClick={() => handleViewModeChange('feed')}
            style={{
              padding: '8px 12px',
              borderRadius: '6px',
              border: 'none',
              backgroundColor: viewMode === 'feed' ? Colors.white : 'transparent',
              color: viewMode === 'feed' ? Colors.primary[600] : Colors.neutral[600],
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
              fontSize: '14px',
              fontWeight: '500',
              boxShadow: viewMode === 'feed' ? '0 2px 4px rgba(0,0,0,0.1)' : 'none',
              transition: 'all 0.2s'
            }}
          >
            <LayoutGrid size={16} />
            <span style={{ display: window.innerWidth > 480 ? 'inline' : 'none' }}>Feed</span>
          </button>
        </div>
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
