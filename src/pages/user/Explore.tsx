import { useState, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { useThemeMode } from '@/contexts/ThemeContext'
import { useLanguage } from '@/contexts/I18nContext'
import { getColors } from '@/constants/Colors'
import { useAllProperties } from '@/hooks/useProperties'
import PropertyCard from '@/components/PropertyCard'
import FilterModal, { FilterOptions } from '@/components/FilterModal'
import MapView from '@/components/MapView'
import { Search, Map as MapIcon, List, Filter, X } from 'lucide-react'
import './Explore.css'

export default function UserExplore() {
  const { colorScheme } = useThemeMode()
  const { t } = useLanguage()
  const Colors = getColors(colorScheme)
  const navigate = useNavigate()

  const [viewMode, setViewMode] = useState<'list' | 'map'>('list')
  const [searchTerm, setSearchTerm] = useState('')
  const [filterVisible, setFilterVisible] = useState(false)
  const [filters, setFilters] = useState<FilterOptions>({
    propertyType: [],
    priceRange: [0, 5000000],
    bedrooms: null,
    bathrooms: null,
    category: [],
  })

  const { properties: allProperties, loading, error } = useAllProperties()

  // Filter properties
  const filteredProperties = useMemo(() => {
    let filtered = allProperties

    // Search filter
    if (searchTerm.trim()) {
      const searchLower = searchTerm.toLowerCase()
      filtered = filtered.filter(property =>
        property.title?.toLowerCase().includes(searchLower) ||
        property.location?.toLowerCase().includes(searchLower) ||
        property.type?.toLowerCase().includes(searchLower) ||
        property.category?.toLowerCase().includes(searchLower)
      )
    }

    // Category filter
    if (filters.category.length > 0) {
      filtered = filtered.filter(property =>
        filters.category.includes(property.category || '')
      )
    }

    // Property type filter
    if (filters.propertyType.length > 0) {
      filtered = filtered.filter(property =>
        filters.propertyType.includes(property.property_type || '')
      )
    }

    // Price filter
    if (filters.priceRange[0] > 0) {
      filtered = filtered.filter(property => property.price >= filters.priceRange[0])
    }
    if (filters.priceRange[1] < 5000000) {
      filtered = filtered.filter(property => property.price <= filters.priceRange[1])
    }

    // Bedrooms filter
    if (filters.bedrooms !== null) {
      filtered = filtered.filter(property => (property.bedrooms || 0) >= filters.bedrooms!)
    }

    // Bathrooms filter
    if (filters.bathrooms !== null) {
      filtered = filtered.filter(property => (property.bathrooms || 0) >= filters.bathrooms!)
    }

    return filtered
  }, [allProperties, searchTerm, filters])

  const clearFilters = () => {
    setFilters({
      propertyType: [],
      priceRange: [0, 5000000],
      bedrooms: null,
      bathrooms: null,
      category: [],
    })
    setSearchTerm('')
  }

  const handleFilterApply = (newFilters: FilterOptions) => {
    setFilters(newFilters)
    setFilterVisible(false)
  }

  const hasActiveFilters = useMemo(() => {
    return searchTerm.trim() !== '' ||
      filters.category.length > 0 ||
      filters.propertyType.length > 0 ||
      filters.priceRange[0] > 0 ||
      filters.priceRange[1] < 5000000 ||
      filters.bedrooms !== null ||
      filters.bathrooms !== null
  }, [searchTerm, filters])

  return (
    <div className="explore-container" style={{ backgroundColor: Colors.neutral[50], minHeight: '100vh' }}>
      {/* Header */}
      <div className="explore-header" style={{
        backgroundColor: Colors.white,
        padding: '16px',
        borderBottom: `1px solid ${Colors.neutral[200]}`,
        position: 'sticky',
        top: 0,
        zIndex: 10
      }}>
        <h1 style={{
          fontSize: '24px',
          fontWeight: '700',
          color: Colors.neutral[900],
          marginBottom: '16px'
        }}>
          {t('explore.exploreProperties')}
        </h1>

        {/* Search Bar */}
        <div style={{
          display: 'flex',
          gap: '8px',
          marginBottom: '12px'
        }}>
          <div style={{
            flex: 1,
            position: 'relative',
            display: 'flex',
            alignItems: 'center'
          }}>
            <Search size={20} color={Colors.neutral[400]} style={{
              position: 'absolute',
              left: '12px',
              pointerEvents: 'none'
            }} />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder={t('explore.searchLocationPropertyType')}
              style={{
                width: '100%',
                padding: '12px 12px 12px 40px',
                border: `1px solid ${Colors.neutral[300]}`,
                borderRadius: '8px',
                fontSize: '14px',
                outline: 'none'
              }}
            />
            {searchTerm && (
              <button
                onClick={() => setSearchTerm('')}
                style={{
                  position: 'absolute',
                  right: '12px',
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  padding: '4px',
                  display: 'flex',
                  alignItems: 'center'
                }}
              >
                <X size={16} color={Colors.neutral[400]} />
              </button>
            )}
          </div>

          <button
            onClick={() => setFilterVisible(true)}
            style={{
              padding: '12px',
              backgroundColor: hasActiveFilters ? Colors.primary[600] : Colors.neutral[100],
              color: hasActiveFilters ? Colors.white : Colors.neutral[700],
              border: 'none',
              borderRadius: '8px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center'
            }}
          >
            <Filter size={20} />
          </button>
        </div>

        {/* View Mode Toggle */}
        <div style={{
          display: 'flex',
          gap: '8px',
          alignItems: 'center',
          justifyContent: 'space-between'
        }}>
          <div style={{
            display: 'flex',
            gap: '8px',
            backgroundColor: Colors.neutral[100],
            padding: '4px',
            borderRadius: '8px'
          }}>
            <button
              onClick={() => setViewMode('list')}
              style={{
                padding: '8px 16px',
                backgroundColor: viewMode === 'list' ? Colors.white : 'transparent',
                color: viewMode === 'list' ? Colors.primary[600] : Colors.neutral[600],
                border: 'none',
                borderRadius: '6px',
                cursor: 'pointer',
                fontSize: '14px',
                fontWeight: '500',
                display: 'flex',
                alignItems: 'center',
                gap: '6px'
              }}
            >
              <List size={16} />
              {t('explore.list')}
            </button>
            <button
              onClick={() => setViewMode('map')}
              style={{
                padding: '8px 16px',
                backgroundColor: viewMode === 'map' ? Colors.white : 'transparent',
                color: viewMode === 'map' ? Colors.primary[600] : Colors.neutral[600],
                border: 'none',
                borderRadius: '6px',
                cursor: 'pointer',
                fontSize: '14px',
                fontWeight: '500',
                display: 'flex',
                alignItems: 'center',
                gap: '6px'
              }}
            >
              <MapIcon size={16} />
              {t('explore.map')}
            </button>
          </div>

          {hasActiveFilters && (
            <button
              onClick={clearFilters}
              style={{
                padding: '6px 12px',
                backgroundColor: Colors.neutral[200],
                color: Colors.neutral[700],
                border: 'none',
                borderRadius: '6px',
                cursor: 'pointer',
                fontSize: '12px',
                fontWeight: '500',
                display: 'flex',
                alignItems: 'center',
                gap: '4px'
              }}
            >
              <X size={14} />
              {t('explore.clear')}
            </button>
          )}
        </div>
      </div>


      {/* Content */}
      {viewMode === 'map' ? (
        <div style={{ 
          position: 'relative',
          height: 'calc(100vh - 200px)',
          width: '100%',
          overflow: 'hidden'
        }}>
          {loading ? (
            <div style={{ 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center', 
              height: '100%',
              color: Colors.neutral[600] 
            }}>
              {t('common.loading')}...
            </div>
          ) : (
            <MapView 
              properties={filteredProperties}
              onPropertyClick={(property) => navigate(`/property/${property.id}`)}
            />
          )}
        </div>
      ) : (
        <div style={{ padding: '16px' }}>
          {loading && (
            <div style={{ textAlign: 'center', padding: '40px', color: Colors.neutral[600] }}>
              {t('common.loading')}...
            </div>
          )}

          {error && (
            <div style={{ textAlign: 'center', padding: '40px', color: Colors.error[600] }}>
              {t('explore.errorLoadingProperties')}
            </div>
          )}

          {!loading && !error && (
            <>
              <div style={{
                marginBottom: '16px',
                fontSize: '14px',
                color: Colors.neutral[600]
              }}>
                {t('explore.propertiesAvailable', { count: filteredProperties.length })}
              </div>

              {filteredProperties.length === 0 ? (
                <div style={{
                  textAlign: 'center',
                  padding: '48px 16px',
                  backgroundColor: Colors.white,
                  borderRadius: '12px'
                }}>
                  <p style={{
                    fontSize: '18px',
                    fontWeight: '600',
                    color: Colors.neutral[800],
                    marginBottom: '8px'
                  }}>
                    {t('explore.noPropertiesFound')}
                  </p>
                  <p style={{
                    fontSize: '14px',
                    color: Colors.neutral[600]
                  }}>
                    {t('explore.tryAdjustingSearch')}
                  </p>
                </div>
              ) : (
                <div className="explore-properties-grid">
                  {filteredProperties.map((property) => (
                    <PropertyCard key={property.id} property={property} />
                  ))}
                </div>
              )}
            </>
          )}
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
