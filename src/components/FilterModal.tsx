import React, { useState, useEffect } from 'react'
import { X } from 'lucide-react'
import { useLanguage } from '@/contexts/I18nContext'
import { getColors } from '@/constants/Colors'
import { useThemeMode } from '@/contexts/ThemeContext'
import Button from './ui/Button'
import './FilterModal.css'

export interface FilterOptions {
  propertyType: string[]
  priceRange: [number, number]
  bedrooms: number | null
  bathrooms: number | null
  category: string[]
}

interface FilterModalProps {
  visible: boolean
  onClose: () => void
  onApply: (filters: FilterOptions) => void
  initialFilters?: FilterOptions
}

// Upper bound of the price inputs. A max equal to this means "no max".
export const MAX_PRICE = 5000000

const pricePresets: { label: string; range: [number, number] }[] = [
  { label: '< 50K', range: [0, 50000] },
  { label: '50K - 150K', range: [50000, 150000] },
  { label: '150K - 300K', range: [150000, 300000] },
  { label: '300K - 500K', range: [300000, 500000] },
  { label: '500K+', range: [500000, MAX_PRICE] },
]

const defaultFilters: FilterOptions = {
  propertyType: [],
  priceRange: [0, MAX_PRICE],
  bedrooms: null,
  bathrooms: null,
  category: [],
}

export default function FilterModal({
  visible,
  onClose,
  onApply,
  initialFilters = defaultFilters,
}: FilterModalProps) {
  const [filters, setFilters] = useState<FilterOptions>(initialFilters)
  const { colorScheme } = useThemeMode()
  const Colors = getColors(colorScheme)
  const { t } = useLanguage()

  useEffect(() => {
    if (visible) {
      setFilters(initialFilters)
    }
  }, [visible, initialFilters])

  const propertyTypes = ['Single Room', 'Apartment', 'Studio', 'Shop', 'Land', 'House']
  const categories = ['Budget', 'Standard', 'Premium', 'Luxury']
  const bedroomOptions = [1, 2, 3, 4, '5+']
  const bathroomOptions = [1, 2, 3, '4+']

  const resetFilters = () => {
    setFilters(defaultFilters)
  }

  const togglePropertyType = (type: string) => {
    if (filters.propertyType.includes(type)) {
      setFilters({
        ...filters,
        propertyType: filters.propertyType.filter(t => t !== type),
      })
    } else {
      setFilters({
        ...filters,
        propertyType: [...filters.propertyType, type],
      })
    }
  }

  const toggleCategory = (category: string) => {
    if (filters.category.includes(category)) {
      setFilters({
        ...filters,
        category: filters.category.filter(c => c !== category),
      })
    } else {
      setFilters({
        ...filters,
        category: [...filters.category, category],
      })
    }
  }

  const setBedrooms = (amount: number | null) => {
    setFilters({
      ...filters,
      bedrooms: filters.bedrooms === amount ? null : amount,
    })
  }

  const setBathrooms = (amount: number | null) => {
    setFilters({
      ...filters,
      bathrooms: filters.bathrooms === amount ? null : amount,
    })
  }

  // An empty input means "unbounded" — 0 for the min, MAX_PRICE for the max.
  const setPriceBound = (index: 0 | 1, text: string) => {
    const digits = text.replace(/[^0-9]/g, '')
    const fallback = index === 0 ? 0 : MAX_PRICE
    const value = digits === '' ? fallback : Math.min(parseInt(digits, 10), MAX_PRICE)
    const nextRange: [number, number] = [filters.priceRange[0], filters.priceRange[1]]
    nextRange[index] = value
    setFilters({ ...filters, priceRange: nextRange })
  }

  const togglePricePreset = (range: [number, number]) => {
    const isActive = filters.priceRange[0] === range[0] && filters.priceRange[1] === range[1]
    setFilters({
      ...filters,
      priceRange: isActive ? [0, MAX_PRICE] : [range[0], range[1]],
    })
  }

  const handleApply = () => {
    // Guard against a min above the max (typed in either order).
    const [min, max] = filters.priceRange
    const normalized: FilterOptions = min > max ? { ...filters, priceRange: [max, min] } : filters
    onApply(normalized)
    onClose()
  }

  if (!visible) return null

  return (
    <>
      <div
        className="filter-modal-overlay"
        onClick={onClose}
        style={{
          backgroundColor: 'rgba(0, 0, 0, 0.5)',
        }}
      />
      <div
        className="filter-modal-container"
        style={{
          backgroundColor: Colors.white,
        }}
      >
        <div className="filter-modal-content">
          <div
            className="filter-modal-header"
            style={{
              borderBottomColor: Colors.neutral[200],
            }}
          >
            <h2
              className="filter-modal-title"
              style={{
                color: Colors.neutral[800],
              }}
            >
              {t('filterModal.filterProperties')}
            </h2>
            <button
              onClick={onClose}
              className="filter-modal-close"
              style={{
                color: Colors.neutral[800],
              }}
            >
              <X size={24} />
            </button>
          </div>

          <div className="filter-modal-scroll">
            {/* Property Type */}
            <div className="filter-section">
              <h3
                className="filter-section-title"
                style={{
                  color: Colors.neutral[800],
                }}
              >
                {t('filterModal.propertyType')}
              </h3>
              <div className="filter-options-container">
                {propertyTypes.map((type) => {
                  const isSelected = filters.propertyType.includes(type)
                  return (
                    <button
                      key={type}
                      onClick={() => togglePropertyType(type)}
                      className={`filter-option-chip ${isSelected ? 'selected' : ''}`}
                      style={{
                        backgroundColor: isSelected ? Colors.primary[100] : Colors.neutral[100],
                        borderColor: isSelected ? Colors.primary[800] : 'transparent',
                        color: isSelected ? Colors.primary[800] : Colors.neutral[600],
                        fontWeight: isSelected ? '600' : '500',
                      }}
                    >
                      {type}
                    </button>
                  )
                })}
              </div>
            </div>

            {/* Category */}
            <div className="filter-section">
              <h3
                className="filter-section-title"
                style={{
                  color: Colors.neutral[800],
                }}
              >
                {t('filterModal.category')}
              </h3>
              <div className="filter-options-container">
                {categories.map((category) => {
                  const isSelected = filters.category.includes(category)
                  return (
                    <button
                      key={category}
                      onClick={() => toggleCategory(category)}
                      className={`filter-option-chip ${isSelected ? 'selected' : ''}`}
                      style={{
                        backgroundColor: isSelected ? Colors.primary[100] : Colors.neutral[100],
                        borderColor: isSelected ? Colors.primary[800] : 'transparent',
                        color: isSelected ? Colors.primary[800] : Colors.neutral[600],
                        fontWeight: isSelected ? '600' : '500',
                      }}
                    >
                      {category}
                    </button>
                  )
                })}
              </div>
            </div>

            {/* Price */}
            <div className="filter-section">
              <h3
                className="filter-section-title"
                style={{
                  color: Colors.neutral[800],
                }}
              >
                {t('explore.priceRange')}
              </h3>
              <div className="filter-price-row">
                <label className="filter-price-group">
                  <span className="filter-price-label" style={{ color: Colors.neutral[500] }}>
                    {t('explore.minPrice')}
                  </span>
                  <input
                    type="text"
                    inputMode="numeric"
                    className="filter-price-input"
                    placeholder="0"
                    style={{
                      backgroundColor: Colors.neutral[100],
                      borderColor: Colors.neutral[200],
                      color: Colors.neutral[800],
                    }}
                    value={filters.priceRange[0] > 0 ? String(filters.priceRange[0]) : ''}
                    onChange={(e) => setPriceBound(0, e.target.value)}
                  />
                </label>
                <span className="filter-price-separator" style={{ color: Colors.neutral[400] }}>
                  —
                </span>
                <label className="filter-price-group">
                  <span className="filter-price-label" style={{ color: Colors.neutral[500] }}>
                    {t('explore.maxPrice')}
                  </span>
                  <input
                    type="text"
                    inputMode="numeric"
                    className="filter-price-input"
                    placeholder={t('filterModal.anyPrice')}
                    style={{
                      backgroundColor: Colors.neutral[100],
                      borderColor: Colors.neutral[200],
                      color: Colors.neutral[800],
                    }}
                    value={filters.priceRange[1] < MAX_PRICE ? String(filters.priceRange[1]) : ''}
                    onChange={(e) => setPriceBound(1, e.target.value)}
                  />
                </label>
              </div>
              <div className="filter-options-container">
                {pricePresets.map((preset) => {
                  const isSelected =
                    filters.priceRange[0] === preset.range[0] && filters.priceRange[1] === preset.range[1]
                  return (
                    <button
                      key={preset.label}
                      onClick={() => togglePricePreset(preset.range)}
                      className={`filter-option-chip ${isSelected ? 'selected' : ''}`}
                      style={{
                        backgroundColor: isSelected ? Colors.primary[100] : Colors.neutral[100],
                        borderColor: isSelected ? Colors.primary[800] : 'transparent',
                        color: isSelected ? Colors.primary[800] : Colors.neutral[600],
                        fontWeight: isSelected ? '600' : '500',
                      }}
                    >
                      {preset.label}
                    </button>
                  )
                })}
              </div>
            </div>

            {/* Bedrooms */}
            <div className="filter-section">
              <h3
                className="filter-section-title"
                style={{
                  color: Colors.neutral[800],
                }}
              >
                {t('filterModal.bedrooms')}
              </h3>
              <div className="filter-options-container">
                {bedroomOptions.map((option) => {
                  const value = typeof option === 'number' ? option : 5
                  const isSelected = filters.bedrooms === value
                  return (
                    <button
                      key={`bed-${option}`}
                      onClick={() => setBedrooms(value)}
                      className={`filter-option-chip ${isSelected ? 'selected' : ''}`}
                      style={{
                        backgroundColor: isSelected ? Colors.primary[100] : Colors.neutral[100],
                        borderColor: isSelected ? Colors.primary[800] : 'transparent',
                        color: isSelected ? Colors.primary[800] : Colors.neutral[600],
                        fontWeight: isSelected ? '600' : '500',
                      }}
                    >
                      {option}
                    </button>
                  )
                })}
              </div>
            </div>

            {/* Bathrooms */}
            <div className="filter-section">
              <h3
                className="filter-section-title"
                style={{
                  color: Colors.neutral[800],
                }}
              >
                {t('filterModal.bathrooms')}
              </h3>
              <div className="filter-options-container">
                {bathroomOptions.map((option) => {
                  const value = typeof option === 'number' ? option : 4
                  const isSelected = filters.bathrooms === value
                  return (
                    <button
                      key={`bath-${option}`}
                      onClick={() => setBathrooms(value)}
                      className={`filter-option-chip ${isSelected ? 'selected' : ''}`}
                      style={{
                        backgroundColor: isSelected ? Colors.primary[100] : Colors.neutral[100],
                        borderColor: isSelected ? Colors.primary[800] : 'transparent',
                        color: isSelected ? Colors.primary[800] : Colors.neutral[600],
                        fontWeight: isSelected ? '600' : '500',
                      }}
                    >
                      {option}
                    </button>
                  )
                })}
              </div>
            </div>
          </div>

          <div
            className="filter-modal-footer"
            style={{
              borderTopColor: Colors.neutral[200],
            }}
          >
            <button
              onClick={resetFilters}
              className="filter-reset-button"
              style={{
                color: Colors.neutral[500],
              }}
            >
              {t('explore.reset') || 'Reset'}
            </button>
            <Button
              title={t('explore.applyFilters') || 'Apply Filters'}
              onPress={handleApply}
              variant="primary"
            />
          </div>
        </div>
      </div>
    </>
  )
}
