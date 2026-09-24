import React from 'react'
import { NavLink } from 'react-router-dom'
import './SectionSwitch.css'

interface SectionSwitchItem {
  to: string
  label: string
  badge?: number
}

interface SectionSwitchProps {
  label: string
  items: SectionSwitchItem[]
}

// Segmented links for sibling pages that share one nav tab (e.g. Bookings | Deals).
export default function SectionSwitch({ label, items }: SectionSwitchProps) {
  return (
    <nav className="section-switch" aria-label={label}>
      {items.map((item) => (
        <NavLink key={item.to} to={item.to} end className="section-switch-item">
          {item.label}
          {item.badge && item.badge > 0 ? <span className="section-switch-badge">{item.badge}</span> : null}
        </NavLink>
      ))}
    </nav>
  )
}
