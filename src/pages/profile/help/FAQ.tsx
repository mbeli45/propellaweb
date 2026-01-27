import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useThemeMode } from '@/contexts/ThemeContext'
import { useLanguage } from '@/contexts/I18nContext'
import { getColors } from '@/constants/Colors'
import { ArrowLeft, ChevronDown, ChevronUp } from 'lucide-react'
import '../Help.css'

interface FAQItem {
  question: string
  answer: string
}

export default function FAQ() {
  const { colorScheme } = useThemeMode()
  const { t } = useLanguage()
  const Colors = getColors(colorScheme)
  const navigate = useNavigate()
  const [expandedItems, setExpandedItems] = useState<number[]>([])

  const faqData: FAQItem[] = [
    {
      question: t('faq.howToCreateAccount'),
      answer: t('faq.createAccountAnswer')
    },
    {
      question: t('faq.howToListProperty'),
      answer: t('faq.listPropertyAnswer')
    },
    {
      question: t('faq.whatAreFees'),
      answer: t('faq.feesAnswer')
    },
    {
      question: t('faq.howToContactOwner'),
      answer: t('faq.contactOwnerAnswer')
    },
    {
      question: t('faq.isInfoSafe'),
      answer: t('faq.infoSafeAnswer')
    },
    {
      question: t('faq.howToVerifyAgent'),
      answer: t('faq.verifyAgentAnswer')
    },
    {
      question: t('faq.canScheduleViewings'),
      answer: t('faq.scheduleViewingsAnswer')
    },
    {
      question: t('faq.whatPaymentMethods'),
      answer: t('faq.paymentMethodsAnswer')
    },
    {
      question: t('faq.howToReportListing'),
      answer: t('faq.reportListingAnswer')
    },
    {
      question: t('faq.canSaveProperties'),
      answer: t('faq.savePropertiesAnswer')
    },
    {
      question: t('faq.howToUpdateListing'),
      answer: t('faq.updateListingAnswer')
    },
    {
      question: t('faq.whatIfCancelReservation'),
      answer: t('faq.cancelReservationAnswer')
    },
    {
      question: t('faq.howToChangeSettings'),
      answer: t('faq.changeSettingsAnswer')
    },
    {
      question: t('faq.isAvailableInArea'),
      answer: t('faq.availableInAreaAnswer')
    },
    {
      question: t('faq.howToGetHelp'),
      answer: t('faq.getHelpAnswer')
    }
  ]

  const toggleItem = (index: number) => {
    setExpandedItems(prev =>
      prev.includes(index)
        ? prev.filter(i => i !== index)
        : [...prev, index]
    )
  }

  return (
    <div style={{ backgroundColor: Colors.neutral[50], minHeight: '100vh' }}>
      {/* Header */}
      <div style={{
        backgroundColor: Colors.white,
        padding: '16px',
        borderBottom: `1px solid ${Colors.neutral[200]}`,
        display: 'flex',
        alignItems: 'center',
        gap: '12px',
        position: 'sticky',
        top: 0,
        zIndex: 10
      }}>
        <button
          onClick={() => navigate(-1)}
          style={{
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            padding: '8px',
            display: 'flex',
            alignItems: 'center'
          }}
        >
          <ArrowLeft size={24} color={Colors.neutral[700]} />
        </button>
        <h1 style={{
          fontSize: '20px',
          fontWeight: '600',
          color: Colors.neutral[900],
          margin: 0
        }}>
          {t('faq.frequentlyAskedQuestions')}
        </h1>
      </div>

      <div style={{ padding: '20px 16px', maxWidth: '800px', margin: '0 auto' }}>
        <p style={{
          fontSize: '14px',
          color: Colors.neutral[600],
          textAlign: 'center',
          marginBottom: '24px'
        }}>
          {t('faq.findAnswersToCommonQuestions')}
        </p>

        <div style={{
          backgroundColor: Colors.white,
          borderRadius: '12px',
          overflow: 'hidden',
          boxShadow: '0 2px 4px rgba(0, 0, 0, 0.05)'
        }}>
          {faqData.map((item, index) => {
            const isExpanded = expandedItems.includes(index)
            return (
              <div
                key={index}
                style={{
                  borderBottom: index < faqData.length - 1 ? `1px solid ${Colors.neutral[200]}` : 'none'
                }}
              >
                <button
                  onClick={() => toggleItem(index)}
                  style={{
                    width: '100%',
                    padding: '16px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    textAlign: 'left'
                  }}
                >
                  <span style={{
                    fontSize: '16px',
                    fontWeight: '500',
                    color: Colors.neutral[900],
                    flex: 1
                  }}>
                    {item.question}
                  </span>
                  {isExpanded ? (
                    <ChevronUp size={20} color={Colors.neutral[600]} />
                  ) : (
                    <ChevronDown size={20} color={Colors.neutral[600]} />
                  )}
                </button>
                {isExpanded && (
                  <div style={{
                    padding: '0 16px 16px 16px',
                    fontSize: '14px',
                    color: Colors.neutral[700],
                    lineHeight: '22px'
                  }}>
                    {item.answer}
                  </div>
                )}
              </div>
            )
          })}
        </div>

        <div style={{
          marginTop: '32px',
          padding: '24px',
          backgroundColor: Colors.white,
          borderRadius: '12px',
          textAlign: 'center',
          boxShadow: '0 2px 4px rgba(0, 0, 0, 0.05)'
        }}>
          <h3 style={{
            fontSize: '18px',
            fontWeight: '600',
            color: Colors.neutral[900],
            marginBottom: '8px'
          }}>
            {t('faq.stillNeedHelp')}
          </h3>
          <p style={{
            fontSize: '14px',
            color: Colors.neutral[600],
            marginBottom: '16px'
          }}>
            {t('faq.supportTeamHereToHelp')}
          </p>
          <button
            onClick={() => window.location.href = 'mailto:Propellacm@gmail.com'}
            style={{
              padding: '12px 24px',
              backgroundColor: Colors.primary[600],
              color: Colors.white,
              border: 'none',
              borderRadius: '8px',
              fontSize: '16px',
              fontWeight: '500',
              cursor: 'pointer'
            }}
          >
            {t('faq.contactSupport')}
          </button>
        </div>
      </div>
    </div>
  )
}
