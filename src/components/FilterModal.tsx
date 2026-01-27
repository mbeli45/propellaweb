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

const defaultFilters: FilterOptions = {
  propertyType: [],
  priceRange: [0, 5000000],
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
  const categories = ['Budget', 'Standard', 'Premium']
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

  const handleApply = () => {
    onApply(filters)
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
