import React, { useState } from 'react'
import { Search, X, SlidersHorizontal } from 'lucide-react'
import { useThemeMode } from '@/contexts/ThemeContext'
import { useLanguage } from '@/contexts/I18nContext'
import { getColors } from '@/constants/Colors'
import './SearchBar.css'

interface SearchBarProps {
  onSearch: (query: string) => void
  onFilter?: () => void
  placeholder?: string
  showFilter?: boolean
}

export default function SearchBar({
  onSearch,
  onFilter,
  placeholder,
  showFilter = true,
}: SearchBarProps) {
  const [query, setQuery] = useState('')
  const { colorScheme } = useThemeMode()
  const { t } = useLanguage()
  const Colors = getColors(colorScheme)

  const handleClear = () => {
    setQuery('')
    onSearch('')
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const text = e.target.value
    setQuery(text)
    onSearch(text)
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSearch(query)
  }

  return (
    <div className="search-bar-container">
      <div className="search-bar-form">
        <div
          className="search-bar-input-wrapper"
          style={{
            backgroundColor: Colors.white,
            borderColor: Colors.neutral[200],
          }}
        >
          <Search size={20} color={Colors.neutral[500]} className="search-icon" />
          <input
            type="text"
            value={query}
            onChange={handleChange}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault()
                handleSubmit(e)
              }
            }}
            placeholder={placeholder || t('home.searchPlaceholder')}
            className="search-bar-input"
            style={{
              color: Colors.neutral[800],
            }}
          />
          {query.length > 0 && (
            <button
              type="button"
              onClick={handleClear}
              className="search-bar-clear"
              style={{
                color: Colors.neutral[500],
              }}
            >
              <X size={18} />
            </button>
          )}
        </div>
        {showFilter && onFilter && (
          <button
            type="button"
            onClick={onFilter}
            className="search-bar-filter"
            style={{
              backgroundColor: Colors.white,
              borderColor: Colors.neutral[200],
              color: Colors.primary[800],
            }}
          >
            <SlidersHorizontal size={20} />
          </button>
        )}
      </div>
    </div>
  )
}
