import React from 'react'
import { useNavigate } from 'react-router-dom'
import { useThemeMode } from '@/contexts/ThemeContext'
import { useLanguage } from '@/contexts/I18nContext'
import { getColors } from '@/constants/Colors'
import { ArrowLeft } from 'lucide-react'
import '../Help.css'

export default function Privacy() {
  const { colorScheme } = useThemeMode()
  const { t } = useLanguage()
  const Colors = getColors(colorScheme)
  const navigate = useNavigate()

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
          {t('privacy.privacyPolicy')}
        </h1>
      </div>

      <div style={{ padding: '20px 16px', maxWidth: '800px', margin: '0 auto' }}>
        <p style={{
          fontSize: '14px',
          color: Colors.neutral[500],
          textAlign: 'center',
          marginBottom: '24px'
        }}>
          {t('privacy.lastUpdated')}
        </p>

        {/* 1. Introduction */}
        <div style={{ backgroundColor: Colors.white, borderRadius: '12px', padding: '20px', marginBottom: '16px', boxShadow: '0 2px 4px rgba(0, 0, 0, 0.05)' }}>
          <h2 style={{ fontSize: '18px', fontWeight: '600', color: Colors.neutral[900], marginBottom: '12px' }}>
            {t('privacy.introduction')}
          </h2>
          <p style={{ fontSize: '15px', color: Colors.neutral[700], lineHeight: '22px', marginBottom: '0' }}>
            {t('privacy.introductionText')}
          </p>
        </div>

        {/* 2. Information We Collect */}
        <div style={{ backgroundColor: Colors.white, borderRadius: '12px', padding: '20px', marginBottom: '16px', boxShadow: '0 2px 4px rgba(0, 0, 0, 0.05)' }}>
          <h2 style={{ fontSize: '18px', fontWeight: '600', color: Colors.neutral[900], marginBottom: '12px' }}>
            {t('privacy.informationWeCollect')}
          </h2>
          
          <h3 style={{ fontSize: '16px', fontWeight: '500', color: Colors.neutral[700], marginTop: '16px', marginBottom: '8px' }}>
            {t('privacy.personalInformation')}
          </h3>
          <ul style={{ paddingLeft: '20px', marginBottom: '8px' }}>
            <li style={{ fontSize: '15px', color: Colors.neutral[700], lineHeight: '22px', marginBottom: '4px' }}>{t('privacy.nameEmailPhone')}</li>
            <li style={{ fontSize: '15px', color: Colors.neutral[700], lineHeight: '22px', marginBottom: '4px' }}>{t('privacy.profileInformation')}</li>
            <li style={{ fontSize: '15px', color: Colors.neutral[700], lineHeight: '22px', marginBottom: '4px' }}>{t('privacy.paymentInformation')}</li>
            <li style={{ fontSize: '15px', color: Colors.neutral[700], lineHeight: '22px', marginBottom: '4px' }}>{t('privacy.identityVerification')}</li>
          </ul>

          <h3 style={{ fontSize: '16px', fontWeight: '500', color: Colors.neutral[700], marginTop: '16px', marginBottom: '8px' }}>
            {t('privacy.propertyInformation')}
          </h3>
          <ul style={{ paddingLeft: '20px', marginBottom: '8px' }}>
            <li style={{ fontSize: '15px', color: Colors.neutral[700], lineHeight: '22px', marginBottom: '4px' }}>{t('privacy.propertyDetails')}</li>
            <li style={{ fontSize: '15px', color: Colors.neutral[700], lineHeight: '22px', marginBottom: '4px' }}>{t('privacy.locationData')}</li>
            <li style={{ fontSize: '15px', color: Colors.neutral[700], lineHeight: '22px', marginBottom: '4px' }}>{t('privacy.pricingAvailability')}</li>
            <li style={{ fontSize: '15px', color: Colors.neutral[700], lineHeight: '22px', marginBottom: '4px' }}>{t('privacy.propertyVerification')}</li>
          </ul>

          <h3 style={{ fontSize: '16px', fontWeight: '500', color: Colors.neutral[700], marginTop: '16px', marginBottom: '8px' }}>
            {t('privacy.usageInformation')}
          </h3>
          <ul style={{ paddingLeft: '20px', marginBottom: '8px' }}>
            <li style={{ fontSize: '15px', color: Colors.neutral[700], lineHeight: '22px', marginBottom: '4px' }}>{t('privacy.usagePatterns')}</li>
            <li style={{ fontSize: '15px', color: Colors.neutral[700], lineHeight: '22px', marginBottom: '4px' }}>{t('privacy.searchHistory')}</li>
            <li style={{ fontSize: '15px', color: Colors.neutral[700], lineHeight: '22px', marginBottom: '4px' }}>{t('privacy.communicationLogs')}</li>
            <li style={{ fontSize: '15px', color: Colors.neutral[700], lineHeight: '22px', marginBottom: '4px' }}>{t('privacy.deviceInformation')}</li>
          </ul>

          <h3 style={{ fontSize: '16px', fontWeight: '500', color: Colors.neutral[700], marginTop: '16px', marginBottom: '8px' }}>
            {t('privacy.locationInformation')}
          </h3>
          <ul style={{ paddingLeft: '20px', marginBottom: '0' }}>
            <li style={{ fontSize: '15px', color: Colors.neutral[700], lineHeight: '22px', marginBottom: '4px' }}>{t('privacy.gpsCoordinates')}</li>
            <li style={{ fontSize: '15px', color: Colors.neutral[700], lineHeight: '22px', marginBottom: '4px' }}>{t('privacy.locationPreferences')}</li>
            <li style={{ fontSize: '15px', color: Colors.neutral[700], lineHeight: '22px', marginBottom: '4px' }}>{t('privacy.viewingHistory')}</li>
          </ul>
        </div>

        {/* 3. How We Use Your Information */}
        <div style={{ backgroundColor: Colors.white, borderRadius: '12px', padding: '20px', marginBottom: '16px', boxShadow: '0 2px 4px rgba(0, 0, 0, 0.05)' }}>
          <h2 style={{ fontSize: '18px', fontWeight: '600', color: Colors.neutral[900], marginBottom: '12px' }}>
            {t('privacy.howWeUseInformation')}
          </h2>
          <p style={{ fontSize: '15px', color: Colors.neutral[700], lineHeight: '22px', marginBottom: '12px' }}>
            {t('privacy.howWeUseText')}
          </p>
          <ul style={{ paddingLeft: '20px', marginBottom: '0' }}>
            <li style={{ fontSize: '15px', color: Colors.neutral[700], lineHeight: '22px', marginBottom: '4px' }}>{t('privacy.providePlatform')}</li>
            <li style={{ fontSize: '15px', color: Colors.neutral[700], lineHeight: '22px', marginBottom: '4px' }}>{t('privacy.connectUsers')}</li>
            <li style={{ fontSize: '15px', color: Colors.neutral[700], lineHeight: '22px', marginBottom: '4px' }}>{t('privacy.processPayments')}</li>
            <li style={{ fontSize: '15px', color: Colors.neutral[700], lineHeight: '22px', marginBottom: '4px' }}>{t('privacy.verifyIdentities')}</li>
            <li style={{ fontSize: '15px', color: Colors.neutral[700], lineHeight: '22px', marginBottom: '4px' }}>{t('privacy.sendNotifications')}</li>
            <li style={{ fontSize: '15px', color: Colors.neutral[700], lineHeight: '22px', marginBottom: '4px' }}>{t('privacy.improveServices')}</li>
            <li style={{ fontSize: '15px', color: Colors.neutral[700], lineHeight: '22px', marginBottom: '4px' }}>{t('privacy.customerSupport')}</li>
            <li style={{ fontSize: '15px', color: Colors.neutral[700], lineHeight: '22px', marginBottom: '4px' }}>{t('privacy.legalObligations')}</li>
          </ul>
        </div>

        {/* 4. Information Sharing and Disclosure */}
        <div style={{ backgroundColor: Colors.white, borderRadius: '12px', padding: '20px', marginBottom: '16px', boxShadow: '0 2px 4px rgba(0, 0, 0, 0.05)' }}>
          <h2 style={{ fontSize: '18px', fontWeight: '600', color: Colors.neutral[900], marginBottom: '12px' }}>
            {t('privacy.informationSharing')}
          </h2>
          <p style={{ fontSize: '15px', color: Colors.neutral[700], lineHeight: '22px', marginBottom: '12px' }}>
            {t('privacy.sharingText')}
          </p>
          
          <h3 style={{ fontSize: '16px', fontWeight: '500', color: Colors.neutral[700], marginTop: '16px', marginBottom: '8px' }}>
            {t('privacy.withOtherUsers')}
          </h3>
          <ul style={{ paddingLeft: '20px', marginBottom: '8px' }}>
            <li style={{ fontSize: '15px', color: Colors.neutral[700], lineHeight: '22px', marginBottom: '4px' }}>{t('privacy.listingsVisible')}</li>
            <li style={{ fontSize: '15px', color: Colors.neutral[700], lineHeight: '22px', marginBottom: '4px' }}>{t('privacy.contactShared')}</li>
            <li style={{ fontSize: '15px', color: Colors.neutral[700], lineHeight: '22px', marginBottom: '4px' }}>{t('privacy.profileVisible')}</li>
          </ul>

          <h3 style={{ fontSize: '16px', fontWeight: '500', color: Colors.neutral[700], marginTop: '16px', marginBottom: '8px' }}>
            {t('privacy.withServiceProviders')}
          </h3>
          <ul style={{ paddingLeft: '20px', marginBottom: '8px' }}>
            <li style={{ fontSize: '15px', color: Colors.neutral[700], lineHeight: '22px', marginBottom: '4px' }}>{t('privacy.paymentProcessors')}</li>
            <li style={{ fontSize: '15px', color: Colors.neutral[700], lineHeight: '22px', marginBottom: '4px' }}>{t('privacy.cloudStorage')}</li>
            <li style={{ fontSize: '15px', color: Colors.neutral[700], lineHeight: '22px', marginBottom: '4px' }}>{t('privacy.analyticsServices')}</li>
            <li style={{ fontSize: '15px', color: Colors.neutral[700], lineHeight: '22px', marginBottom: '4px' }}>{t('privacy.supportTools')}</li>
          </ul>

          <h3 style={{ fontSize: '16px', fontWeight: '500', color: Colors.neutral[700], marginTop: '16px', marginBottom: '8px' }}>
            {t('privacy.legalRequirements')}
          </h3>
          <ul style={{ paddingLeft: '20px', marginBottom: '0' }}>
            <li style={{ fontSize: '15px', color: Colors.neutral[700], lineHeight: '22px', marginBottom: '4px' }}>{t('privacy.requiredByLaw')}</li>
            <li style={{ fontSize: '15px', color: Colors.neutral[700], lineHeight: '22px', marginBottom: '4px' }}>{t('privacy.protectRights')}</li>
            <li style={{ fontSize: '15px', color: Colors.neutral[700], lineHeight: '22px', marginBottom: '4px' }}>{t('privacy.preventFraud')}</li>
            <li style={{ fontSize: '15px', color: Colors.neutral[700], lineHeight: '22px', marginBottom: '4px' }}>{t('privacy.emergencySituations')}</li>
          </ul>
        </div>

        {/* 5. Data Security */}
        <div style={{ backgroundColor: Colors.white, borderRadius: '12px', padding: '20px', marginBottom: '16px', boxShadow: '0 2px 4px rgba(0, 0, 0, 0.05)' }}>
          <h2 style={{ fontSize: '18px', fontWeight: '600', color: Colors.neutral[900], marginBottom: '12px' }}>
            {t('privacy.dataSecurity')}
          </h2>
          <p style={{ fontSize: '15px', color: Colors.neutral[700], lineHeight: '22px', marginBottom: '12px' }}>
            {t('privacy.securityText')}
          </p>
          <ul style={{ paddingLeft: '20px', marginBottom: '0' }}>
            <li style={{ fontSize: '15px', color: Colors.neutral[700], lineHeight: '22px', marginBottom: '4px' }}>{t('privacy.encryption')}</li>
            <li style={{ fontSize: '15px', color: Colors.neutral[700], lineHeight: '22px', marginBottom: '4px' }}>{t('privacy.secureAuthentication')}</li>
            <li style={{ fontSize: '15px', color: Colors.neutral[700], lineHeight: '22px', marginBottom: '4px' }}>{t('privacy.securityAudits')}</li>
            <li style={{ fontSize: '15px', color: Colors.neutral[700], lineHeight: '22px', marginBottom: '4px' }}>{t('privacy.limitedAccess')}</li>
            <li style={{ fontSize: '15px', color: Colors.neutral[700], lineHeight: '22px', marginBottom: '4px' }}>{t('privacy.securePayment')}</li>
          </ul>
        </div>

        {/* 6. Data Retention */}
        <div style={{ backgroundColor: Colors.white, borderRadius: '12px', padding: '20px', marginBottom: '16px', boxShadow: '0 2px 4px rgba(0, 0, 0, 0.05)' }}>
          <h2 style={{ fontSize: '18px', fontWeight: '600', color: Colors.neutral[900], marginBottom: '12px' }}>
            {t('privacy.dataRetention')}
          </h2>
          <p style={{ fontSize: '15px', color: Colors.neutral[700], lineHeight: '22px', marginBottom: '12px' }}>
            {t('privacy.retentionText')}
          </p>
          <ul style={{ paddingLeft: '20px', marginBottom: '12px' }}>
            <li style={{ fontSize: '15px', color: Colors.neutral[700], lineHeight: '22px', marginBottom: '4px' }}>{t('privacy.provideServices')}</li>
            <li style={{ fontSize: '15px', color: Colors.neutral[700], lineHeight: '22px', marginBottom: '4px' }}>{t('privacy.complyLegal')}</li>
            <li style={{ fontSize: '15px', color: Colors.neutral[700], lineHeight: '22px', marginBottom: '4px' }}>{t('privacy.resolveDisputes')}</li>
            <li style={{ fontSize: '15px', color: Colors.neutral[700], lineHeight: '22px', marginBottom: '4px' }}>{t('privacy.improveServices')}</li>
          </ul>
          <p style={{ fontSize: '15px', color: Colors.neutral[700], lineHeight: '22px', marginBottom: '0' }}>
            {t('privacy.retentionPeriod')}
          </p>
        </div>

        {/* 7. Your Rights and Choices */}
        <div style={{ backgroundColor: Colors.white, borderRadius: '12px', padding: '20px', marginBottom: '16px', boxShadow: '0 2px 4px rgba(0, 0, 0, 0.05)' }}>
          <h2 style={{ fontSize: '18px', fontWeight: '600', color: Colors.neutral[900], marginBottom: '12px' }}>
            {t('privacy.yourRightsAndChoices')}
          </h2>
          <p style={{ fontSize: '15px', color: Colors.neutral[700], lineHeight: '22px', marginBottom: '12px' }}>
            {t('privacy.rightsText')}
          </p>
          <ul style={{ paddingLeft: '20px', marginBottom: '0' }}>
            <li style={{ fontSize: '15px', color: Colors.neutral[700], lineHeight: '22px', marginBottom: '4px' }}>{t('privacy.accessReview')}</li>
            <li style={{ fontSize: '15px', color: Colors.neutral[700], lineHeight: '22px', marginBottom: '4px' }}>{t('privacy.updateCorrect')}</li>
            <li style={{ fontSize: '15px', color: Colors.neutral[700], lineHeight: '22px', marginBottom: '4px' }}>{t('privacy.requestDeletion')}</li>
            <li style={{ fontSize: '15px', color: Colors.neutral[700], lineHeight: '22px', marginBottom: '4px' }}>{t('privacy.optOutMarketing')}</li>
            <li style={{ fontSize: '15px', color: Colors.neutral[700], lineHeight: '22px', marginBottom: '4px' }}>{t('privacy.controlLocation')}</li>
            <li style={{ fontSize: '15px', color: Colors.neutral[700], lineHeight: '22px', marginBottom: '4px' }}>{t('privacy.exportData')}</li>
          </ul>
        </div>

        {/* 8. Cookies and Tracking Technologies */}
        <div style={{ backgroundColor: Colors.white, borderRadius: '12px', padding: '20px', marginBottom: '16px', boxShadow: '0 2px 4px rgba(0, 0, 0, 0.05)' }}>
          <h2 style={{ fontSize: '18px', fontWeight: '600', color: Colors.neutral[900], marginBottom: '12px' }}>
            {t('privacy.cookiesAndTracking')}
          </h2>
          <p style={{ fontSize: '15px', color: Colors.neutral[700], lineHeight: '22px', marginBottom: '12px' }}>
            {t('privacy.cookiesText')}
          </p>
          <ul style={{ paddingLeft: '20px', marginBottom: '12px' }}>
            <li style={{ fontSize: '15px', color: Colors.neutral[700], lineHeight: '22px', marginBottom: '4px' }}>{t('privacy.rememberPreferences')}</li>
            <li style={{ fontSize: '15px', color: Colors.neutral[700], lineHeight: '22px', marginBottom: '4px' }}>{t('privacy.analyzeUsage')}</li>
            <li style={{ fontSize: '15px', color: Colors.neutral[700], lineHeight: '22px', marginBottom: '4px' }}>{t('privacy.personalizedContent')}</li>
            <li style={{ fontSize: '15px', color: Colors.neutral[700], lineHeight: '22px', marginBottom: '4px' }}>{t('privacy.ensureSecurity')}</li>
          </ul>
          <p style={{ fontSize: '15px', color: Colors.neutral[700], lineHeight: '22px', marginBottom: '0' }}>
            {t('privacy.cookiesNote')}
          </p>
        </div>

        {/* 9. Third-Party Services */}
        <div style={{ backgroundColor: Colors.white, borderRadius: '12px', padding: '20px', marginBottom: '16px', boxShadow: '0 2px 4px rgba(0, 0, 0, 0.05)' }}>
          <h2 style={{ fontSize: '18px', fontWeight: '600', color: Colors.neutral[900], marginBottom: '12px' }}>
            {t('privacy.thirdPartyServices')}
          </h2>
          <p style={{ fontSize: '15px', color: Colors.neutral[700], lineHeight: '22px', marginBottom: '12px' }}>
            {t('privacy.thirdPartyText')}
          </p>
          <ul style={{ paddingLeft: '20px', marginBottom: '12px' }}>
            <li style={{ fontSize: '15px', color: Colors.neutral[700], lineHeight: '22px', marginBottom: '4px' }}>{t('privacy.paymentProcessorsList')}</li>
            <li style={{ fontSize: '15px', color: Colors.neutral[700], lineHeight: '22px', marginBottom: '4px' }}>{t('privacy.mapsLocation')}</li>
            <li style={{ fontSize: '15px', color: Colors.neutral[700], lineHeight: '22px', marginBottom: '4px' }}>{t('privacy.socialMedia')}</li>
            <li style={{ fontSize: '15px', color: Colors.neutral[700], lineHeight: '22px', marginBottom: '4px' }}>{t('privacy.analyticsTools')}</li>
          </ul>
          <p style={{ fontSize: '15px', color: Colors.neutral[700], lineHeight: '22px', marginBottom: '0' }}>
            {t('privacy.thirdPartyNote')}
          </p>
        </div>

        {/* 10. Children's Privacy */}
        <div style={{ backgroundColor: Colors.white, borderRadius: '12px', padding: '20px', marginBottom: '16px', boxShadow: '0 2px 4px rgba(0, 0, 0, 0.05)' }}>
          <h2 style={{ fontSize: '18px', fontWeight: '600', color: Colors.neutral[900], marginBottom: '12px' }}>
            {t('privacy.childrensPrivacy')}
          </h2>
          <p style={{ fontSize: '15px', color: Colors.neutral[700], lineHeight: '22px', marginBottom: '0' }}>
            {t('privacy.childrenText')}
          </p>
        </div>

        {/* 11. International Data Transfers */}
        <div style={{ backgroundColor: Colors.white, borderRadius: '12px', padding: '20px', marginBottom: '16px', boxShadow: '0 2px 4px rgba(0, 0, 0, 0.05)' }}>
          <h2 style={{ fontSize: '18px', fontWeight: '600', color: Colors.neutral[900], marginBottom: '12px' }}>
            {t('privacy.internationalDataTransfers')}
          </h2>
          <p style={{ fontSize: '15px', color: Colors.neutral[700], lineHeight: '22px', marginBottom: '0' }}>
            {t('privacy.internationalText')}
          </p>
        </div>

        {/* 12. Changes to This Privacy Policy */}
        <div style={{ backgroundColor: Colors.white, borderRadius: '12px', padding: '20px', marginBottom: '16px', boxShadow: '0 2px 4px rgba(0, 0, 0, 0.05)' }}>
          <h2 style={{ fontSize: '18px', fontWeight: '600', color: Colors.neutral[900], marginBottom: '12px' }}>
            {t('privacy.changesToPrivacyPolicy')}
          </h2>
          <p style={{ fontSize: '15px', color: Colors.neutral[700], lineHeight: '22px', marginBottom: '0' }}>
            {t('privacy.changesText')}
          </p>
        </div>

        {/* 13. Contact Us */}
        <div style={{ backgroundColor: Colors.white, borderRadius: '12px', padding: '20px', marginBottom: '16px', boxShadow: '0 2px 4px rgba(0, 0, 0, 0.05)' }}>
          <h2 style={{ fontSize: '18px', fontWeight: '600', color: Colors.neutral[900], marginBottom: '12px' }}>
            {t('privacy.contactUs')}
          </h2>
          <p style={{ fontSize: '15px', color: Colors.neutral[700], lineHeight: '22px', marginBottom: '12px' }}>
            {t('privacy.contactText')}
          </p>
          <p style={{ fontSize: '15px', fontWeight: '500', color: Colors.primary[600], marginBottom: '4px' }}>
            {t('privacy.emailContact')}
          </p>
          <p style={{ fontSize: '15px', fontWeight: '500', color: Colors.primary[600], marginBottom: '12px' }}>
            {t('privacy.phoneContact')}
          </p>
          <p style={{ fontSize: '15px', color: Colors.neutral[700], lineHeight: '22px', marginBottom: '0' }}>
            We will respond to your inquiry within a reasonable timeframe.
          </p>
        </div>

        {/* Footer */}
        <div style={{ backgroundColor: Colors.white, borderRadius: '12px', padding: '20px', marginBottom: '24px', boxShadow: '0 2px 4px rgba(0, 0, 0, 0.05)' }}>
          <p style={{ fontSize: '14px', color: Colors.neutral[600], textAlign: 'center', fontStyle: 'italic', marginBottom: '0' }}>
            By using Propella, you acknowledge that you have read and understood this Privacy Policy and consent to our collection, use, and disclosure of your information as described herein.
          </p>
        </div>
      </div>
    </div>
  )
}
