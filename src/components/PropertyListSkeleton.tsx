import React from 'react'
import { getColors } from '@/constants/Colors'
import { useThemeMode } from '@/contexts/ThemeContext'
import './PropertyListSkeleton.css'

interface PropertyListSkeletonProps {
  count?: number
}

export default function PropertyListSkeleton({ count = 3 }: PropertyListSkeletonProps) {
  const { colorScheme } = useThemeMode()
  const Colors = getColors(colorScheme)

  const renderSkeletonCard = (index: number) => {
    return (
      <div
        key={index}
        className="skeleton-card"
        style={{
          backgroundColor: Colors.white,
          borderRadius: '16px',
          overflow: 'hidden',
          boxShadow: '0 2px 8px rgba(0, 0, 0, 0.08)',
        }}
      >
        {/* Image skeleton */}
        <div
          className="skeleton-image"
          style={{
            backgroundColor: Colors.neutral[200],
            height: '200px',
            animation: 'pulse 1.5s ease-in-out infinite',
          }}
        />
        
        {/* Content skeleton */}
        <div style={{ padding: '16px' }}>
          {/* Price skeleton */}
          <div
            className="skeleton-line"
            style={{
              backgroundColor: Colors.neutral[200],
              height: '24px',
              width: '40%',
              marginBottom: '12px',
              borderRadius: '4px',
              animation: 'pulse 1.5s ease-in-out infinite',
            }}
          />
          
          {/* Title skeleton */}
          <div
            className="skeleton-line"
            style={{
              backgroundColor: Colors.neutral[200],
              height: '18px',
              width: '70%',
              marginBottom: '8px',
              borderRadius: '4px',
              animation: 'pulse 1.5s ease-in-out infinite',
              animationDelay: '0.1s',
            }}
          />
          
          {/* Location skeleton */}
          <div
            className="skeleton-line"
            style={{
              backgroundColor: Colors.neutral[200],
              height: '16px',
              width: '60%',
              marginBottom: '16px',
              borderRadius: '4px',
              animation: 'pulse 1.5s ease-in-out infinite',
              animationDelay: '0.2s',
            }}
          />
          
          {/* Details skeleton */}
          <div style={{ display: 'flex', gap: '16px' }}>
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="skeleton-line"
                style={{
                  backgroundColor: Colors.neutral[200],
                  height: '16px',
                  width: '40px',
                  borderRadius: '4px',
                  animation: 'pulse 1.5s ease-in-out infinite',
                  animationDelay: `${0.3 + i * 0.1}s`,
                }}
              />
            ))}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="skeleton-container">
      {Array.from({ length: count }, (_, index) => renderSkeletonCard(index))}
    </div>
  )
}
