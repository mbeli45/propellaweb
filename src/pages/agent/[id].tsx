import React, { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useThemeMode } from '@/contexts/ThemeContext'
import { useLanguage } from '@/contexts/I18nContext'
import { getColors } from '@/constants/Colors'
import { useAuth } from '@/contexts/AuthContext'
import { useAgentProfile } from '@/hooks/useAgentProfile'
import { supabase } from '@/lib/supabase'
import PropertyCard from '@/components/PropertyCard'
import { Star, User as UserIcon, Mail, Phone, ArrowRight, CheckCircle2, ArrowLeft, X } from 'lucide-react'
import './AgentProfile.css'

export default function AgentProfile() {
  const { id: agentId } = useParams<{ id: string }>()
  const { colorScheme } = useThemeMode()
  const { t } = useLanguage()
  const Colors = getColors(colorScheme)
  const navigate = useNavigate()
  const { user } = useAuth()

  const {
    agent,
    reviews,
    properties,
    averageRating,
    loading,
    error,
    refetch
  } = useAgentProfile(agentId || '')

  const [showAllReviews, setShowAllReviews] = useState(false)
  const [showAllProperties, setShowAllProperties] = useState(false)
  const [showReviewModal, setShowReviewModal] = useState(false)
  const [reviewRating, setReviewRating] = useState(0)
  const [reviewComment, setReviewComment] = useState('')
  const [submittingReview, setSubmittingReview] = useState(false)

  if (loading) {
    return (
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        height: '100vh',
        backgroundColor: Colors.neutral[50]
      }}>
        <div style={{ textAlign: 'center', color: Colors.neutral[600] }}>
          {t('loading.loadingAgentProfile') || 'Loading agent profile...'}
        </div>
      </div>
    )
  }

  if (error || !agent) {
    return (
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        height: '100vh',
        backgroundColor: Colors.neutral[50],
        padding: '20px'
      }}>
        <p style={{ color: Colors.error[600], marginBottom: '16px' }}>
          {error || 'Agent not found'}
        </p>
        <button
          onClick={() => navigate(-1)}
          style={{
            padding: '12px 24px',
            backgroundColor: Colors.primary[600],
            color: Colors.white,
            border: 'none',
            borderRadius: '8px',
            cursor: 'pointer'
          }}
        >
          {t('common.back')}
        </button>
      </div>
    )
  }

  const displayedReviews = showAllReviews ? reviews : reviews.slice(0, 3)
  const displayedProperties = showAllProperties ? properties : properties.slice(0, 6)

  const handleSubmitReview = async () => {
    if (!user) {
      alert('Please login to leave a review')
      return
    }
    
    if (reviewRating === 0) {
      alert('Please select a rating')
      return
    }

    if (!reviewComment.trim()) {
      alert('Please write a comment')
      return
    }

    setSubmittingReview(true)
    try {
      const { error: reviewError } = await supabase
        .from('agent_reviews')
        .insert({
          agent_id: agentId,
          user_id: user.id,
          rating: reviewRating,
          comment: reviewComment.trim(),
        })

      if (reviewError) throw reviewError

      alert('Review submitted successfully!')
      setShowReviewModal(false)
      setReviewRating(0)
      setReviewComment('')
      refetch() // Refresh agent data
    } catch (err: any) {
      console.error('Error submitting review:', err)
      alert(err.message || 'Failed to submit review')
    } finally {
      setSubmittingReview(false)
    }
  }

  return (
    <div style={{ 
      backgroundColor: Colors.neutral[50], 
      minHeight: '100vh',
      paddingBottom: '24px'
    }}>
      {/* Back Button Header */}
      <div style={{
        backgroundColor: Colors.white,
        padding: '16px',
        borderBottom: `1px solid ${Colors.neutral[200]}`,
        position: 'sticky',
        top: 0,
        zIndex: 10
      }}>
        <button
          onClick={() => navigate(-1)}
          style={{
            background: 'none',
            border: 'none',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            cursor: 'pointer',
            color: Colors.neutral[900],
            fontSize: '16px',
            fontWeight: '500',
            padding: '8px 0'
          }}
        >
          <ArrowLeft size={24} color={Colors.neutral[900]} />
          <span>{t('common.back')}</span>
        </button>
      </div>

      {/* Profile Card */}
      <div style={{
        backgroundColor: Colors.white,
        padding: '24px 16px',
        textAlign: 'center',
        margin: '16px',
        borderRadius: '16px',
        boxShadow: '0 2px 8px rgba(0, 0, 0, 0.08)'
      }}>
        <div style={{
          width: '80px',
          height: '80px',
          borderRadius: '40px',
          backgroundColor: Colors.neutral[200],
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          margin: '0 auto 12px',
          fontSize: '32px',
          fontWeight: '600',
          color: Colors.neutral[500]
        }}>
          {agent.avatar_url ? (
            <img
              src={agent.avatar_url}
              alt={agent.full_name || ''}
              style={{
                width: '100%',
                height: '100%',
                borderRadius: '40px',
                objectFit: 'cover'
              }}
            />
          ) : (
            agent.full_name?.charAt(0).toUpperCase() || 'A'
          )}
        </div>
        <h1 style={{
          fontSize: '22px',
          fontWeight: '700',
          color: Colors.neutral[900],
          marginBottom: '4px',
          margin: '0 0 4px 0'
        }}>
          {agent.full_name || t('common.user')}
        </h1>
        <div style={{
          fontSize: '15px',
          color: Colors.primary[700],
          marginBottom: '8px'
        }}>
          {agent.role === 'agent' ? t('agentProfile.verifiedAgent') : 'User'}
        </div>
        {agent.bio && (
          <p style={{
            fontSize: '15px',
            color: Colors.neutral[700],
            marginTop: '8px',
            marginBottom: '12px',
            lineHeight: '1.5'
          }}>
            {agent.bio}
          </p>
        )}
        
        {/* Contact Info */}
        <div style={{
          display: 'flex',
          flexWrap: 'wrap',
          justifyContent: 'center',
          gap: '16px',
          marginTop: '12px'
        }}>
          {agent.email && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
              <Mail size={16} color={Colors.primary[700]} />
              <span style={{ fontSize: '14px', color: Colors.neutral[700] }}>{agent.email}</span>
            </div>
          )}
          {agent.phone && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
              <Phone size={16} color={Colors.primary[700]} />
              <span style={{ fontSize: '14px', color: Colors.neutral[700] }}>{agent.phone}</span>
            </div>
          )}
        </div>
      </div>

      {/* Reviews Section */}
      <div style={{
        backgroundColor: Colors.white,
        borderRadius: '16px',
        padding: '20px 16px',
        margin: '0 16px 24px',
        boxShadow: '0 2px 8px rgba(0, 0, 0, 0.08)'
      }}>
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '8px'
        }}>
          <h2 style={{
            fontSize: '18px',
            fontWeight: '600',
            color: Colors.neutral[900],
            margin: 0
          }}>
            Agent Reviews
          </h2>
          {user && user.id !== agentId && (
            <button
              onClick={() => setShowReviewModal(true)}
              style={{
                padding: '8px 16px',
                backgroundColor: Colors.primary[600],
                color: Colors.white,
                border: 'none',
                borderRadius: '8px',
                fontSize: '14px',
                fontWeight: '500',
                cursor: 'pointer',
                transition: 'background-color 0.2s'
              }}
              onMouseEnter={(e) => e.currentTarget.style.backgroundColor = Colors.primary[700]}
              onMouseLeave={(e) => e.currentTarget.style.backgroundColor = Colors.primary[600]}
            >
              Write a Review
            </button>
          )}
        </div>
        
        {/* Rating Display */}
        {averageRating !== null && (
          <div style={{
            display: 'flex',
            alignItems: 'center',
            marginBottom: '16px'
          }}>
            {[1, 2, 3, 4, 5].map((star) => (
              <Star
                key={star}
                size={20}
                color={star <= Math.round(averageRating) ? Colors.primary[700] : Colors.neutral[300]}
                fill={star <= Math.round(averageRating) ? Colors.primary[700] : 'none'}
              />
            ))}
            <span style={{
              marginLeft: '8px',
              fontSize: '15px',
              color: Colors.neutral[700]
            }}>
              {averageRating.toFixed(1)} ({reviews.length} review{reviews.length === 1 ? '' : 's'})
            </span>
          </div>
        )}
        
        {/* Reviews List */}
        {reviews.length === 0 ? (
          <p style={{ color: Colors.neutral[500], fontSize: '14px' }}>No reviews yet.</p>
        ) : (
          <>
            {displayedReviews.map((review) => (
              <div
                key={review.id}
                style={{
                  padding: '12px',
                  marginBottom: '12px',
                  backgroundColor: Colors.neutral[50],
                  borderRadius: '8px'
                }}
              >
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  marginBottom: '8px'
                }}>
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px'
                  }}>
                    <div style={{
                      width: '24px',
                      height: '24px',
                      borderRadius: '12px',
                      backgroundColor: Colors.neutral[200],
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '12px',
                      fontWeight: '600',
                      color: Colors.neutral[500]
                    }}>
                      {review.user?.full_name?.charAt(0).toUpperCase() || 'U'}
                    </div>
                    <span style={{
                      fontSize: '14px',
                      fontWeight: '500',
                      color: Colors.neutral[900]
                    }}>
                      {review.user?.full_name || 'Anonymous User'}
                    </span>
                  </div>
                  <span style={{
                    fontSize: '12px',
                    color: Colors.neutral[500]
                  }}>
                    {new Date(review.created_at).toLocaleDateString()}
                  </span>
                </div>
                
                <div style={{
                  display: 'flex',
                  gap: '2px',
                  marginBottom: '8px'
                }}>
                  {[1, 2, 3, 4, 5].map((star) => (
                    <Star
                      key={star}
                      size={14}
                      color={star <= review.rating ? Colors.primary[700] : Colors.neutral[300]}
                      fill={star <= review.rating ? Colors.primary[700] : 'none'}
                    />
                  ))}
                </div>
                
                {review.comment && (
                  <p style={{
                    fontSize: '14px',
                    color: Colors.neutral[600],
                    lineHeight: '20px',
                    margin: 0
                  }}>
                    {review.comment}
                  </p>
                )}
              </div>
            ))}
            {reviews.length > 3 && (
              <button
                onClick={() => setShowAllReviews(!showAllReviews)}
                style={{
                  background: 'none',
                  border: 'none',
                  color: Colors.primary[700],
                  fontSize: '14px',
                  fontWeight: '600',
                  cursor: 'pointer',
                  marginTop: '4px',
                  padding: '0'
                }}
              >
                {showAllReviews ? 'Show Less' : 'See All Reviews'}
              </button>
            )}
          </>
        )}
      </div>

      {/* Properties Section */}
      {properties.length === 0 ? (
        <div style={{
          textAlign: 'center',
          padding: '48px 32px',
          margin: '0 16px'
        }}>
          <p style={{
            fontSize: '18px',
            fontWeight: '600',
            color: Colors.neutral[600],
            marginBottom: '8px',
            margin: '0 0 8px 0'
          }}>
            No properties listed by this agent yet.
          </p>
          <p style={{
            fontSize: '14px',
            color: Colors.neutral[500],
            margin: 0
          }}>
            This agent hasn't added any properties yet.
          </p>
        </div>
      ) : (
        <>
          {/* Section Header */}
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            padding: '0 16px',
            marginTop: '24px',
            marginBottom: '12px'
          }}>
            <h2 style={{
              fontSize: '18px',
              fontWeight: '600',
              color: Colors.neutral[800],
              margin: 0
            }}>
              Properties by {agent.full_name || 'this agent'}
            </h2>
            {properties.length > 3 && (
              <button
                onClick={() => setShowAllProperties(!showAllProperties)}
                style={{
                  background: 'none',
                  border: 'none',
                  color: Colors.primary[800],
                  fontSize: '14px',
                  fontWeight: '500',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px',
                  padding: '0'
                }}
              >
                <span>{showAllProperties ? 'Show Less' : 'See All'}</span>
                <ArrowRight size={16} />
              </button>
            )}
          </div>
          
          {/* Properties Grid */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(min(100%, 300px), 1fr))',
            gap: '16px',
            padding: '0 16px'
          }}>
            {displayedProperties.map((property) => (
              <PropertyCard key={property.id} property={property} />
            ))}
          </div>
        </>
      )}

      {/* Review Modal */}
      {showReviewModal && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
            padding: '16px'
          }}
          onClick={() => setShowReviewModal(false)}
        >
          <div
            style={{
              backgroundColor: Colors.white,
              borderRadius: '16px',
              padding: '24px',
              maxWidth: '500px',
              width: '100%',
              maxHeight: '90vh',
              overflowY: 'auto'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: '20px'
            }}>
              <h3 style={{
                fontSize: '20px',
                fontWeight: '600',
                color: Colors.neutral[900],
                margin: 0
              }}>
                Write a Review
              </h3>
              <button
                onClick={() => setShowReviewModal(false)}
                style={{
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  padding: '4px'
                }}
              >
                <X size={24} color={Colors.neutral[600]} />
              </button>
            </div>

            {/* Rating */}
            <div style={{ marginBottom: '20px' }}>
              <label style={{
                display: 'block',
                fontSize: '14px',
                fontWeight: '500',
                color: Colors.neutral[900],
                marginBottom: '8px'
              }}>
                Rating *
              </label>
              <div style={{ display: 'flex', gap: '8px' }}>
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    onClick={() => setReviewRating(star)}
                    style={{
                      background: 'none',
                      border: 'none',
                      cursor: 'pointer',
                      padding: '4px'
                    }}
                  >
                    <Star
                      size={32}
                      color={star <= reviewRating ? Colors.warning[600] : Colors.neutral[300]}
                      fill={star <= reviewRating ? Colors.warning[600] : 'none'}
                    />
                  </button>
                ))}
              </div>
            </div>

            {/* Comment */}
            <div style={{ marginBottom: '24px' }}>
              <label style={{
                display: 'block',
                fontSize: '14px',
                fontWeight: '500',
                color: Colors.neutral[900],
                marginBottom: '8px'
              }}>
                Comment *
              </label>
              <textarea
                value={reviewComment}
                onChange={(e) => setReviewComment(e.target.value)}
                placeholder="Share your experience with this agent..."
                style={{
                  width: '100%',
                  minHeight: '120px',
                  padding: '12px',
                  borderRadius: '8px',
                  border: `1px solid ${Colors.neutral[300]}`,
                  backgroundColor: Colors.white,
                  fontSize: '14px',
                  color: Colors.neutral[900],
                  fontFamily: 'inherit',
                  resize: 'vertical'
                }}
              />
            </div>

            {/* Buttons */}
            <div style={{
              display: 'flex',
              gap: '12px',
              justifyContent: 'flex-end'
            }}>
              <button
                onClick={() => setShowReviewModal(false)}
                style={{
                  padding: '12px 24px',
                  backgroundColor: 'transparent',
                  color: Colors.neutral[700],
                  border: `1px solid ${Colors.neutral[300]}`,
                  borderRadius: '8px',
                  fontSize: '14px',
                  fontWeight: '500',
                  cursor: 'pointer'
                }}
              >
                Cancel
              </button>
              <button
                onClick={handleSubmitReview}
                disabled={submittingReview || reviewRating === 0 || !reviewComment.trim()}
                style={{
                  padding: '12px 24px',
                  backgroundColor: submittingReview || reviewRating === 0 || !reviewComment.trim()
                    ? Colors.neutral[400]
                    : Colors.primary[600],
                  color: Colors.white,
                  border: 'none',
                  borderRadius: '8px',
                  fontSize: '14px',
                  fontWeight: '500',
                  cursor: submittingReview || reviewRating === 0 || !reviewComment.trim()
                    ? 'not-allowed'
                    : 'pointer'
                }}
              >
                {submittingReview ? 'Submitting...' : 'Submit Review'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
