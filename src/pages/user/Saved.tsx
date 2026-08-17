import { useNavigate } from 'react-router-dom'
import { ArrowLeft, Bookmark } from 'lucide-react'
import { useThemeMode } from '@/contexts/ThemeContext'
import { useLanguage } from '@/contexts/I18nContext'
import { getColors } from '@/constants/Colors'
import { useAuth } from '@/contexts/AuthContext'
import { useSavedProperties } from '@/hooks/useSavedProperties'
import PropertyCard from '@/components/PropertyCard'
import './Saved.css'

export default function SavedProperties() {
  const { colorScheme } = useThemeMode()
  const { t } = useLanguage()
  const Colors = getColors(colorScheme)
  const navigate = useNavigate()
  const { user } = useAuth()
  const { properties, loading, error, refresh, removeSaved } = useSavedProperties(user?.id)

  // Agents/landlords browse from their own listings area; renters use Explore.
  const browsePath = user?.role === 'agent' || user?.role === 'landlord' ? '/agent' : '/user/explore'

  const renderEmptyState = (title: string, hint: string, actionLabel: string, onAction: () => void) => (
    <div className="saved-empty" style={{ backgroundColor: Colors.white }}>
      <Bookmark size={48} color={Colors.neutral[400]} />
      <p className="saved-empty-title" style={{ color: Colors.neutral[800] }}>{title}</p>
      <p className="saved-empty-hint" style={{ color: Colors.neutral[600] }}>{hint}</p>
      <button
        className="saved-primary-button"
        style={{ backgroundColor: Colors.primary[600], color: Colors.white }}
        onClick={onAction}
      >
        {actionLabel}
      </button>
    </div>
  )

  return (
    <div className="saved-container" style={{ backgroundColor: Colors.neutral[50] }}>
      <div
        className="saved-header"
        style={{ backgroundColor: Colors.white, borderBottom: `1px solid ${Colors.neutral[200]}` }}
      >
        <button
          className="saved-back-button"
          onClick={() => navigate(-1)}
          aria-label={t('common.back')}
        >
          <ArrowLeft size={22} color={Colors.neutral[800]} />
        </button>
        <h1 className="saved-title" style={{ color: Colors.neutral[900] }}>
          {t('saved.title')}
        </h1>
        {properties.length > 0 && (
          <span className="saved-count" style={{ color: Colors.neutral[600] }}>
            {t('saved.count', { count: properties.length })}
          </span>
        )}
      </div>

      <div className="saved-body">
        {!user ? (
          renderEmptyState(t('saved.title'), t('saved.signInHint'), t('saved.signIn'), () =>
            navigate('/auth/login')
          )
        ) : loading ? (
          <div style={{ textAlign: 'center', padding: '40px', color: Colors.neutral[600] }}>
            {t('common.loading')}
          </div>
        ) : error ? (
          <div style={{ textAlign: 'center', padding: '40px', color: Colors.error[600] }}>
            <p>{error}</p>
            <button
              className="saved-primary-button"
              style={{ backgroundColor: Colors.primary[600], color: Colors.white }}
              onClick={refresh}
            >
              {t('common.retry')}
            </button>
          </div>
        ) : properties.length === 0 ? (
          renderEmptyState(
            t('saved.empty'),
            t('saved.emptyHint'),
            t('saved.browseProperties'),
            () => navigate(browsePath)
          )
        ) : (
          <div className="saved-properties-grid">
            {properties.map((property) => (
              <PropertyCard
                key={property.id}
                property={property}
                onRemoveSaved={() => removeSaved(property.id)}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
