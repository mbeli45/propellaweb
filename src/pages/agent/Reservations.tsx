import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '@/contexts/AuthContext'
import { useThemeMode } from '@/contexts/ThemeContext'
import { useLanguage } from '@/contexts/I18nContext'
import { getColors } from '@/constants/Colors'
import { useAgentPropertyReservations } from '@/hooks/useReservations'
import { supabase } from '@/lib/supabase'
import { Clock, MapPin, CreditCard, CheckCircle2, MessageCircle, Calendar } from 'lucide-react'
import { formatPrice } from '@/utils/shareUtils'
import '../user/Reservations.css'

export default function AgentReservations() {
  const { user } = useAuth()
  const { colorScheme } = useThemeMode()
  const { t } = useLanguage()
  const Colors = getColors(colorScheme)
  const navigate = useNavigate()
  const [userProfiles, setUserProfiles] = useState<Record<string, any>>({})

  // Agent sees reservations for their properties
  const { reservations, loading, error, refetch } = useAgentPropertyReservations(user?.id || '')

  useEffect(() => {
    if (user?.id) {
      refetch()
    }
  }, [user?.id, refetch])

  // Fetch user profiles for all reservations
  useEffect(() => {
    const fetchUserProfiles = async () => {
      if (reservations.length === 0) return
      
      const userIds = [...new Set(reservations.map(r => r.user_id).filter(Boolean))]
      const profiles: Record<string, any> = {}
      
      for (const userId of userIds) {
        try {
          const { data, error } = await supabase
            .from('profiles')
            .select('id, full_name, email, phone, avatar_url')
            .eq('id', userId)
            .single()
          
          if (data && !error) {
            profiles[userId] = data
          }
        } catch (err) {
          console.error('Error fetching user profile:', err)
        }
      }
      
      setUserProfiles(profiles)
    }
    
    fetchUserProfiles()
  }, [reservations])

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'confirmed':
        return Colors.success[600]
      case 'pending':
        return Colors.warning[600]
      case 'cancelled':
        return Colors.error[600]
      case 'completed':
        return Colors.primary[600]
      default:
        return Colors.neutral[600]
    }
  }

  const getStatusLabel = (status: string) => {
    return t(`reservations.${status}`) || status
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
  }

  const formatTime = (timeString: string | null) => {
    if (!timeString) return ''
    return new Date(`2000-01-01T${timeString}`).toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  return (
    <div className="reservations-container" style={{ backgroundColor: Colors.neutral[50], minHeight: '100vh' }}>
      <div style={{ padding: '20px 16px' }}>
        <h1 style={{ 
          fontSize: '24px', 
          fontWeight: '700', 
          color: Colors.neutral[900],
          marginBottom: '4px'
        }}>
          {t('reservations.title')}
        </h1>
        <p style={{ 
          fontSize: '14px', 
          color: Colors.neutral[600],
          marginBottom: '20px'
        }}>
          {t('reservations.reservationsForProperties')}
        </p>
      </div>

      {loading && (
        <div style={{ padding: '40px', textAlign: 'center', color: Colors.neutral[600] }}>
          {t('common.loading')}...
        </div>
      )}

      {error && (
        <div style={{ padding: '40px', textAlign: 'center', color: Colors.error[600] }}>
          {error}
        </div>
      )}

      {!loading && !error && reservations.length === 0 && (
        <div style={{
          padding: '48px 24px',
          textAlign: 'center',
          backgroundColor: Colors.white,
          margin: '0 16px',
          borderRadius: '12px'
        }}>
          <Calendar size={64} color={Colors.neutral[400]} style={{ marginBottom: '16px' }} />
          <h2 style={{ color: Colors.neutral[800], marginBottom: '8px' }}>
            {t('reservations.noReservations')}
          </h2>
          <p style={{ color: Colors.neutral[600] }}>
            {t('reservations.noOneHasReserved')}
          </p>
        </div>
      )}

      {!loading && !error && reservations.length > 0 && (
        <div style={{ padding: '0 16px 20px' }}>
          {reservations.map((reservation) => {
                const property = reservation.property
                const userProfile = userProfiles[reservation.user_id]
                if (!property) return null

                return (
                  <div
                    key={reservation.id}
                    style={{
                      backgroundColor: Colors.white,
                      borderRadius: '12px',
                      padding: '20px',
                      marginBottom: '16px',
                      boxShadow: '0 2px 8px rgba(0, 0, 0, 0.06)',
                      border: `1px solid ${Colors.neutral[200]}`
                    }}
                  >
                    {/* Header: Status and Date */}
                    <div style={{ 
                      display: 'flex', 
                      justifyContent: 'space-between', 
                      alignItems: 'center',
                      marginBottom: '16px',
                      paddingBottom: '12px',
                      borderBottom: `1px solid ${Colors.neutral[100]}`
                    }}>
                      <span style={{
                        padding: '6px 14px',
                        borderRadius: '20px',
                        fontSize: '12px',
                        fontWeight: '600',
                        backgroundColor: `${getStatusColor(reservation.status)}15`,
                        color: getStatusColor(reservation.status),
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '6px'
                      }}>
                        {reservation.payment_status === 'paid' && (
                          <CheckCircle2 size={14} />
                        )}
                        {getStatusLabel(reservation.status)}
                      </span>
                      <span style={{ 
                        fontSize: '12px', 
                        color: Colors.neutral[600],
                        fontWeight: '500'
                      }}>
                        {formatDate(reservation.reservation_date)}
                      </span>
                    </div>

                    {/* Property and Client Info - Side by Side */}
                    <div style={{ 
                      display: 'grid',
                      gridTemplateColumns: 'auto 1fr',
                      gap: '16px',
                      marginBottom: '16px'
                    }}>
                      {/* Property Image */}
                      {property.images?.[0] && (
                        <img 
                          src={property.images[0]} 
                          alt={property.title}
                          onClick={() => navigate(`/property/${property.id}`)}
                          style={{
                            width: '90px',
                            height: '90px',
                            borderRadius: '8px',
                            objectFit: 'cover',
                            cursor: 'pointer',
                            flexShrink: 0
                          }}
                        />
                      )}
                      
                      {/* Property and Client Details */}
                      <div style={{ minWidth: 0 }}>
                        {/* Property Name */}
                        <h3 
                          onClick={() => navigate(`/property/${property.id}`)}
                          style={{
                            fontSize: '15px',
                            fontWeight: '600',
                            color: Colors.neutral[900],
                            marginBottom: '6px',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap',
                            cursor: 'pointer'
                          }}
                        >
                          {property.title}
                        </h3>
                        
                        {/* Property Location */}
                        <div style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '4px',
                          marginBottom: '10px'
                        }}>
                          <MapPin size={12} color={Colors.neutral[500]} />
                          <span style={{ fontSize: '12px', color: Colors.neutral[600] }}>
                            {property.location}
                          </span>
                        </div>
                        
                        {/* Client Info - Compact */}
                        <div style={{ 
                          display: 'flex', 
                          alignItems: 'center', 
                          gap: '10px',
                          padding: '8px 12px',
                          backgroundColor: Colors.neutral[50],
                          borderRadius: '8px'
                        }}>
                          <div style={{
                            width: '32px',
                            height: '32px',
                            borderRadius: '16px',
                            backgroundColor: Colors.primary[100],
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontSize: '14px',
                            fontWeight: '600',
                            color: Colors.primary[700],
                            flexShrink: 0
                          }}>
                            {userProfile?.avatar_url ? (
                              <img 
                                src={userProfile.avatar_url} 
                                alt={userProfile.full_name}
                                style={{
                                  width: '100%',
                                  height: '100%',
                                  borderRadius: '16px',
                                  objectFit: 'cover'
                                }}
                              />
                            ) : (
                              (userProfile?.full_name?.charAt(0) || 'U').toUpperCase()
                            )}
                          </div>
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <div style={{ 
                              fontSize: '13px', 
                              fontWeight: '600', 
                              color: Colors.neutral[900],
                              marginBottom: '2px',
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                              whiteSpace: 'nowrap'
                            }}>
                              {userProfile?.full_name || t('reservations.unknownUser')}
                            </div>
                            {userProfile?.phone && (
                              <div style={{ 
                                fontSize: '11px',
                                color: Colors.neutral[600],
                                overflow: 'hidden',
                                textOverflow: 'ellipsis',
                                whiteSpace: 'nowrap'
                              }}>
                                {userProfile.phone}
                              </div>
                            )}
                          </div>
                          <button
                            onClick={() => navigate(`/agent/messages/${reservation.user_id}`)}
                            style={{
                              padding: '6px 10px',
                              backgroundColor: Colors.primary[600],
                              color: Colors.white,
                              border: 'none',
                              borderRadius: '6px',
                              fontSize: '12px',
                              fontWeight: '600',
                              cursor: 'pointer',
                              display: 'flex',
                              alignItems: 'center',
                              gap: '4px',
                              flexShrink: 0
                            }}
                          >
                            <MessageCircle size={14} />
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* Visit Time and Amount - Compact Row */}
                    <div style={{
                      display: 'flex',
                      gap: '10px',
                      justifyContent: 'space-between'
                    }}>
                      {reservation.reservation_time && (
                        <div style={{
                          flex: 1,
                          padding: '10px',
                          backgroundColor: Colors.neutral[50],
                          borderRadius: '8px',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '8px'
                        }}>
                          <Clock size={16} color={Colors.neutral[600]} />
                          <div>
                            <div style={{ fontSize: '11px', color: Colors.neutral[600], marginBottom: '2px' }}>
                              {t('reservations.visitTime') || 'Time'}
                            </div>
                            <div style={{ fontSize: '13px', fontWeight: '600', color: Colors.neutral[900] }}>
                              {formatTime(reservation.reservation_time)}
                            </div>
                          </div>
                        </div>
                      )}
                      <div style={{
                        flex: 1,
                        padding: '10px',
                        backgroundColor: Colors.success[50],
                        borderRadius: '8px',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px'
                      }}>
                        <CreditCard size={16} color={Colors.success[700]} />
                        <div>
                          <div style={{ fontSize: '11px', color: Colors.success[700], marginBottom: '2px' }}>
                            {t('wallet.amount')}
                          </div>
                          <div style={{ fontSize: '13px', fontWeight: '600', color: Colors.success[700] }}>
                            {formatPrice(reservation.amount || 0)} FCFA
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )
              })}
        </div>
      )}
    </div>
  )
}
