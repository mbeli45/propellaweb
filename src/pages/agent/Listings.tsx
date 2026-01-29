import React, { useState, useEffect, useMemo } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { useThemeMode } from '@/contexts/ThemeContext'
import { useLanguage } from '@/contexts/I18nContext'
import { getColors } from '@/constants/Colors'
import { useProperties } from '@/hooks/useProperties'
import { useAgentPropertyReservations } from '@/hooks/useReservations'
import { usePropertyViews } from '@/hooks/usePropertyViews'
import { useDialog } from '@/contexts/DialogContext'
import PropertyCard from '@/components/PropertyCard'
import { Plus, BarChart3, Home, Users, Calendar } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import './Listings.css'

export default function AgentListings() {
  const { user } = useAuth()
  const { colorScheme } = useThemeMode()
  const { t } = useLanguage()
  const Colors = getColors(colorScheme)
  const navigate = useNavigate()
  const { getAgentTotalViews } = usePropertyViews()

  const { properties, loading, error, refetch, deleteProperty } = useProperties(user?.id || '')
  const { reservations: agentReservations } = useAgentPropertyReservations(user?.id || '')
  const { confirm, alert } = useDialog()
  const [totalViews, setTotalViews] = useState(0)
  const [activeTab, setActiveTab] = useState<'active' | 'reserved' | 'sold'>('active')
  const [deletingPropertyId, setDeletingPropertyId] = useState<string | null>(null)

  useEffect(() => {
    const fetchTotalViews = async () => {
      if (user?.id) {
        const views = await getAgentTotalViews(user.id)
        setTotalViews(views)
      }
    }
    fetchTotalViews()
  }, [user?.id, getAgentTotalViews])

  const filteredProperties = useMemo(() => {
    if (!properties) return []
    
    switch (activeTab) {
      case 'active':
        return properties.filter(p => p.status === 'available')
      case 'reserved':
        return properties.filter(p => p.status === 'reserved')
      case 'sold':
        return properties.filter(p => p.status === 'sold')
      default:
        return properties
    }
  }, [properties, activeTab])

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'available':
        return '#10B981'
      case 'reserved':
        return '#F59E0B'
      case 'sold':
        return '#EF4444'
      default:
        return '#6B7280'
    }
  }

  const handleEdit = (propertyId: string) => {
    navigate(`/property/edit/${propertyId}`)
  }

  const handleDelete = async (propertyId: string) => {
    const confirmed = await confirm({
      title: t('property.deleteProperty') || 'Delete Property',
      message: t('agent.deletePropertyMessage') || t('property.deletePropertyMessage') || 'Are you sure you want to delete this property? This action cannot be undone.',
      confirmText: t('common.delete') || 'Delete',
      cancelText: t('common.cancel') || 'Cancel',
      variant: 'danger',
    })

    if (!confirmed) {
      return
    }

    setDeletingPropertyId(propertyId)
    try {
      const success = await deleteProperty(propertyId)
      if (success) {
        // Property will be removed from list automatically via refetch
        refetch()
        alert(t('property.propertyDeletedSuccess') || 'Property deleted successfully', 'success')
      } else {
        alert(t('agent.failedToDeleteProperty') || t('property.failedToDeleteProperty') || 'Failed to delete property. Please try again.', 'error')
      }
    } catch (err: any) {
      console.error('Delete property error:', err)
      alert(err.message || t('agent.failedToDeleteProperty') || t('property.failedToDeleteProperty') || 'Failed to delete property.', 'error')
    } finally {
      setDeletingPropertyId(null)
    }
  }

  return (
    <div className="agent-listings-container" style={{ backgroundColor: Colors.neutral[50] }}>
      {/* Header */}
      <div className="agent-header" style={{ 
        backgroundColor: Colors.white,
        borderBottom: `1px solid ${Colors.neutral[100]}`,
        paddingTop: '20px',
        paddingBottom: '20px',
        boxShadow: '0 2px 4px rgba(0,0,0,0.05)'
      }}>
        <div className="header-content" style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          padding: '0 20px',
          marginBottom: '20px'
        }}>
          <div className="welcome-section" style={{ flex: 1 }}>
            <h1 style={{
              fontSize: '24px',
              fontWeight: '700',
              color: Colors.neutral[900],
              marginBottom: '4px',
              margin: 0
            }}>
              {t('home.welcomeBack', { name: user?.full_name?.split(' ')[0] || t('common.agent') })}
            </h1>
            <p style={{
              fontSize: '16px',
              fontWeight: '400',
              color: Colors.neutral[600],
              margin: 0
            }}>
              {t('agent.manageListings')}
            </p>
          </div>
          
          <div className="header-actions" style={{ display: 'flex', gap: '12px' }}>
            <button
              onClick={() => navigate('/agent/analytics')}
              style={{
                width: '44px',
                height: '44px',
                borderRadius: '22px',
                backgroundColor: Colors.neutral[200],
                border: 'none',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                transition: 'background 0.2s'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = Colors.neutral[300]
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = Colors.neutral[200]
              }}
            >
              <BarChart3 size={20} color={Colors.neutral[700]} />
            </button>
            <button
              onClick={() => navigate('/property/add')}
              style={{
                width: '44px',
                height: '44px',
                borderRadius: '22px',
                backgroundColor: Colors.primary[600],
                border: 'none',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                transition: 'background 0.2s',
                boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = Colors.primary[700]
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = Colors.primary[600]
              }}
            >
              <Plus size={20} color="white" />
            </button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="stats-container" style={{
          display: 'flex',
          gap: '12px',
          padding: '0 20px'
        }}>
          <div className="stat-card" style={{
            flex: 1,
            borderRadius: '12px',
            padding: '16px',
            backgroundColor: Colors.neutral[50],
            border: `1px solid ${Colors.neutral[200]}`,
            textAlign: 'center'
          }}>
            <div style={{
              width: '40px',
              height: '40px',
              borderRadius: '20px',
              backgroundColor: Colors.primary[50],
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 8px'
            }}>
              <Home size={20} color={Colors.primary[600]} />
            </div>
            <p style={{
              fontSize: '20px',
              fontWeight: '700',
              color: Colors.neutral[900],
              margin: '0 0 4px 0'
            }}>
              {properties?.length || 0}
            </p>
            <p style={{
              fontSize: '12px',
              fontWeight: '500',
              color: Colors.neutral[600],
              margin: 0
            }}>
              {t('agent.totalListings')}
            </p>
          </div>
          
          <div className="stat-card" style={{
            flex: 1,
            borderRadius: '12px',
            padding: '16px',
            backgroundColor: Colors.neutral[50],
            border: `1px solid ${Colors.neutral[200]}`,
            textAlign: 'center'
          }}>
            <div style={{
              width: '40px',
              height: '40px',
              borderRadius: '20px',
              backgroundColor: '#FEF3C7',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 8px'
            }}>
              <BarChart3 size={20} color="#F59E0B" />
            </div>
            <p style={{
              fontSize: '20px',
              fontWeight: '700',
              color: Colors.neutral[900],
              margin: '0 0 4px 0'
            }}>
              {properties?.filter(p => p.status === 'available').length || 0}
            </p>
            <p style={{
              fontSize: '12px',
              fontWeight: '500',
              color: Colors.neutral[600],
              margin: 0
            }}>
              {t('agent.available')}
            </p>
          </div>
          
          <div className="stat-card" style={{
            flex: 1,
            borderRadius: '12px',
            padding: '16px',
            backgroundColor: Colors.neutral[50],
            border: `1px solid ${Colors.neutral[200]}`,
            textAlign: 'center'
          }}>
            <div style={{
              width: '40px',
              height: '40px',
              borderRadius: '20px',
              backgroundColor: '#DCFCE7',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 8px'
            }}>
              <Users size={20} color="#16A34A" />
            </div>
            <p style={{
              fontSize: '20px',
              fontWeight: '700',
              color: Colors.neutral[900],
              margin: '0 0 4px 0'
            }}>
              {totalViews}
            </p>
            <p style={{
              fontSize: '12px',
              fontWeight: '500',
              color: Colors.neutral[600],
              margin: 0
            }}>
              {t('agent.views')}
            </p>
          </div>

          <div className="stat-card" style={{
            flex: 1,
            borderRadius: '12px',
            padding: '16px',
            backgroundColor: Colors.neutral[50],
            border: `1px solid ${Colors.neutral[200]}`,
            textAlign: 'center'
          }}>
            <div style={{
              width: '40px',
              height: '40px',
              borderRadius: '20px',
              backgroundColor: '#E0E7FF',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 8px'
            }}>
              <Calendar size={20} color="#4F46E5" />
            </div>
            <p style={{
              fontSize: '20px',
              fontWeight: '700',
              color: Colors.neutral[900],
              margin: '0 0 4px 0'
            }}>
              {agentReservations?.length || 0}
            </p>
            <p style={{
              fontSize: '12px',
              fontWeight: '500',
              color: Colors.neutral[600],
              margin: 0
            }}>
              {t('navigation.reservations')}
            </p>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="tabs-container" style={{
        display: 'flex',
        gap: '4px',
        padding: '16px 20px',
        backgroundColor: Colors.white,
        borderBottom: `1px solid ${Colors.neutral[100]}`
      }}>
        {[
          { key: 'active', label: t('agent.available'), count: properties?.filter(p => p.status === 'available').length || 0 },
          { key: 'reserved', label: t('property.reserved'), count: properties?.filter(p => p.status === 'reserved').length || 0 },
          { key: 'sold', label: t('property.sold'), count: properties?.filter(p => p.status === 'sold').length || 0 },
        ].map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key as any)}
            style={{
              flex: 1,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              padding: '10px 16px',
              borderRadius: '8px',
              border: `1px solid ${Colors.neutral[200]}`,
              backgroundColor: activeTab === tab.key ? Colors.primary[600] : Colors.neutral[50],
              color: activeTab === tab.key ? '#FFFFFF' : Colors.neutral[600],
              fontSize: '14px',
              fontWeight: '500',
              cursor: 'pointer',
              transition: 'all 0.2s'
            }}
          >
            <span>{tab.label}</span>
            <span style={{
              padding: '2px 8px',
              borderRadius: '10px',
              backgroundColor: activeTab === tab.key ? 'rgba(255, 255, 255, 0.2)' : Colors.neutral[200],
              color: activeTab === tab.key ? '#FFFFFF' : Colors.neutral[600],
              fontSize: '12px',
              fontWeight: '600',
              minWidth: '20px',
              textAlign: 'center'
            }}>
              {tab.count}
            </span>
          </button>
        ))}
      </div>

      {/* Content */}
      {loading && (
        <div style={{ textAlign: 'center', padding: '40px', color: Colors.neutral[600] }}>
          {t('agent.loadingYourProperties')}...
        </div>
      )}

      {error && (
        <div style={{ textAlign: 'center', padding: '40px', color: Colors.error[600] }}>
          {t('agent.errorLoadingProperties')}
        </div>
      )}

      {!loading && !error && filteredProperties.length === 0 && (
        <div style={{
          textAlign: 'center',
          padding: '40px',
          backgroundColor: Colors.white,
          margin: '20px',
          borderRadius: '12px'
        }}>
          <p style={{ color: Colors.neutral[600], marginBottom: '16px' }}>
            {activeTab === 'active' ? t('agent.noAvailableProperties') :
             activeTab === 'reserved' ? t('agent.noReservedProperties') :
             t('agent.noSoldProperties')}
          </p>
          {activeTab === 'active' && (
            <button
              onClick={() => navigate('/property/add')}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                padding: '12px 24px',
                backgroundColor: Colors.primary[600],
                color: '#FFFFFF',
                border: 'none',
                borderRadius: '8px',
                fontSize: '16px',
                fontWeight: '600',
                cursor: 'pointer'
              }}
            >
              <Plus size={20} />
              {t('agent.addProperty')}
            </button>
          )}
        </div>
      )}

      {!loading && !error && filteredProperties.length > 0 && (
        <div className="properties-list" style={{
          padding: '20px',
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
          gap: '16px'
        }}>
          {filteredProperties.map((property) => (
            <PropertyCard 
              key={property.id} 
              property={property} 
              isOwner 
              onEdit={() => handleEdit(property.id)}
              onDelete={() => handleDelete(property.id)}
            />
          ))}
        </div>
      )}
    </div>
  )
}
