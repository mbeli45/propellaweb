import React, { useState, useEffect, useRef } from 'react'
import { MapPin, X, Loader } from 'lucide-react'
import { useLocationSearch } from '@/hooks/useLocationSearch'
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
  const [showSuggestions, setShowSuggestions] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)

  // Handle input change with debouncing via the hook
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value
    onChange(newValue)
    handleSearchQueryChange(newValue)
    setShowSuggestions(true)
  }

  // Handle suggestion selection
  const handleSelectSuggestion = (suggestion: LocationSuggestion) => {
    onChange(suggestion.place_name)
    if (onLocationSelect) {
      onLocationSelect(suggestion)
    }
    setShowSuggestions(false)
    clearSuggestions()
  }

  // Handle clear
  const handleClear = () => {
    onChange('')
    clearSuggestions()
    setShowSuggestions(false)
  }

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
          onFocus={() => value && setShowSuggestions(true)}
          placeholder={placeholder}
          required={required}
          disabled={disabled}
          className="location-search-input"
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

      {showSuggestions && suggestions.length > 0 && (
        <div className="location-search-suggestions">
          {suggestions.map((suggestion) => (
            <button
              key={suggestion.id}
              type="button"
              onClick={() => handleSelectSuggestion(suggestion)}
              className="location-search-suggestion-item"
            >
              <MapPin size={16} className="suggestion-icon" />
              <div className="suggestion-content">
                <div className="suggestion-name">{suggestion.place_name}</div>
                {suggestion.context && suggestion.context.length > 0 && (
                  <div className="suggestion-context">
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
