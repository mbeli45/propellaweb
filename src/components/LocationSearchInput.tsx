import React, { useState, useEffect, useRef } from 'react'
import { MapPin, X, Loader } from 'lucide-react'
import { useLocationSearch } from '@/hooks/useLocationSearch'
import { useThemeMode } from '@/contexts/ThemeContext'
import { getColors } from '@/constants/Colors'
import './LocationSearchInput.css'

interface LocationSuggestion {
  id: string
  place_name: string
  coordinates: [number, number]
  relevance: number
  type: string
  context?: string[]
}

interface LocationSearchInputProps {
  value: string
  onChange: (value: string) => void
  onLocationSelect?: (location: LocationSuggestion) => void
  placeholder?: string
  required?: boolean
  disabled?: boolean
  style?: React.CSSProperties
}

export default function LocationSearchInput({
  value,
  onChange,
  onLocationSelect,
  placeholder = 'Search for property location...',
  required = false,
  disabled = false,
  style
}: LocationSearchInputProps) {
  const { suggestions, loading, handleSearchQueryChange, clearSuggestions } = useLocationSearch()
  const { colorScheme } = useThemeMode()
  const Colors = getColors(colorScheme)
  const [showSuggestions, setShowSuggestions] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)
  const isSelectingRef = useRef(false)

  // Handle input change with debouncing via the hook
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value
    onChange(newValue)
    if (newValue.trim().length >= 2) {
      handleSearchQueryChange(newValue)
      setShowSuggestions(true)
    } else {
      setShowSuggestions(false)
    }
  }

  // Handle suggestion selection
  const handleSelectSuggestion = (suggestion: LocationSuggestion) => {
    isSelectingRef.current = true
    onChange(suggestion.place_name)
    if (onLocationSelect) {
      onLocationSelect(suggestion)
    }
    setShowSuggestions(false)
    clearSuggestions()
    // Reset flag after a short delay
    setTimeout(() => {
      isSelectingRef.current = false
    }, 100)
  }

  // Handle clear
  const handleClear = () => {
    onChange('')
    clearSuggestions()
    setShowSuggestions(false)
  }

  // Show suggestions when they arrive (if user is still typing)
  useEffect(() => {
    if (suggestions.length > 0 && value.trim().length >= 2) {
      setShowSuggestions(true)
    }
  }, [suggestions, value])

  // Close suggestions when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setShowSuggestions(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  return (
    <div className="location-search-container" ref={containerRef} style={style}>
      <div className="location-search-input-wrapper">
        <MapPin className="location-search-icon" size={18} />
        <input
          type="text"
          value={value}
          onChange={handleInputChange}
          placeholder={placeholder}
          required={required}
          disabled={disabled}
          className="location-search-input"
          style={{
            borderColor: Colors.neutral[300],
            backgroundColor: Colors.neutral[50],
            color: Colors.neutral[900],
            paddingLeft: '50px',
            paddingRight: '40px',
          }}
          onFocus={(e) => {
            e.target.style.borderColor = Colors.primary[600]
            e.target.style.backgroundColor = colorScheme === 'dark' ? Colors.neutral[200] : Colors.white
            if (value && value.trim().length >= 2) {
              handleSearchQueryChange(value)
              setShowSuggestions(true)
            } else if (value && value.trim().length > 0) {
              setShowSuggestions(true)
            }
          }}
          onBlur={(e) => {
            const input = e.target as HTMLInputElement
            input.style.borderColor = Colors.neutral[300]
            input.style.backgroundColor = Colors.neutral[50]
            // Don't close suggestions if we're selecting one
            if (!isSelectingRef.current) {
              setTimeout(() => {
                if (!containerRef.current?.contains(document.activeElement)) {
                  setShowSuggestions(false)
                }
              }, 150)
            }
          }}
        />
        {loading && (
          <Loader className="location-search-loader" size={16} />
        )}
        {value && !loading && (
          <button
            type="button"
            onClick={handleClear}
            className="location-search-clear"
            aria-label="Clear"
          >
            <X size={16} />
          </button>
        )}
      </div>

      {showSuggestions && (suggestions.length > 0 || loading) && (
        <div 
          className="location-search-suggestions"
          style={{
            backgroundColor: Colors.white,
            borderColor: Colors.neutral[200],
            boxShadow: colorScheme === 'dark' 
              ? '0 4px 12px rgba(0, 0, 0, 0.3)' 
              : '0 4px 12px rgba(0, 0, 0, 0.1)',
          }}
        >
          {loading && (
            <div style={{ padding: '12px 16px', textAlign: 'center', color: Colors.neutral[600] }}>
              Searching...
            </div>
          )}
          {!loading && suggestions.length === 0 && value.trim().length >= 2 && (
            <div style={{ padding: '12px 16px', textAlign: 'center', color: Colors.neutral[600] }}>
              No locations found
            </div>
          )}
          {suggestions.map((suggestion) => (
            <button
              key={suggestion.id}
              type="button"
              onClick={() => handleSelectSuggestion(suggestion)}
              onMouseDown={(e) => {
                // Prevent input blur when clicking suggestion
                e.preventDefault()
              }}
              className="location-search-suggestion-item"
              style={{
                borderBottomColor: Colors.neutral[200],
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = Colors.neutral[50]
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = 'transparent'
              }}
            >
              <MapPin size={16} className="suggestion-icon" color={Colors.primary[600]} />
              <div className="suggestion-content">
                <div className="suggestion-name" style={{ color: Colors.neutral[900] }}>
                  {suggestion.place_name}
                </div>
                {suggestion.context && suggestion.context.length > 0 && (
                  <div className="suggestion-context" style={{ color: Colors.neutral[600] }}>
                    {suggestion.context.slice(0, 2).join(', ')}
                  </div>
                )}
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
