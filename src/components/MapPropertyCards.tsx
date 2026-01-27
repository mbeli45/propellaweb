import React, { useRef, useState } from 'react'
import PropertyCard from './PropertyCard'
import { PropertyData } from './PropertyCard'
import './MapPropertyCards.css'

interface MapPropertyCardsProps {
  properties: PropertyData[]
  onPropertySelect?: (property: PropertyData) => void
  onPropertyFocus?: (property: PropertyData) => void
}

export default function MapPropertyCards({ 
  properties, 
  onPropertySelect,
  onPropertyFocus 
}: MapPropertyCardsProps) {
  const scrollRef = useRef<HTMLDivElement>(null)
  const [currentIndex, setCurrentIndex] = useState(0)

  // Handle scroll events to update current index
  const handleScroll = () => {
    if (!scrollRef.current) return
    
    const scrollLeft = scrollRef.current.scrollLeft
    const cardWidth = 340 + 16 // card width + gap
    const newIndex = Math.round(scrollLeft / cardWidth)
    
    if (newIndex !== currentIndex && newIndex < properties.length) {
      setCurrentIndex(newIndex)
      
      // Notify parent component about the focused property
      const focusedProperty = properties[newIndex]
      if (onPropertyFocus) {
        onPropertyFocus(focusedProperty)
      }
    }
  }

  if (properties.length === 0) {
    return null
  }

  return (
    <div className="map-property-cards-container">
      <div 
        ref={scrollRef}
        className="map-property-cards-scroll hidden-scrollbar"
        onScroll={handleScroll}
      >
        {properties.map((property, index) => (
          <div 
            key={`map-property-${property.id}-${index}`} 
            className="map-property-card-wrapper"
          >
            <PropertyCard 
              property={property}
              horizontal
              onClick={() => onPropertySelect?.(property)}
            />
          </div>
        ))}
      </div>
    </div>
  )
}
