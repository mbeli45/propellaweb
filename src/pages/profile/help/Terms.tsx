import React from 'react'
import { useNavigate } from 'react-router-dom'
import { useThemeMode } from '@/contexts/ThemeContext'
import { useLanguage } from '@/contexts/I18nContext'
import { getColors } from '@/constants/Colors'
import { ArrowLeft } from 'lucide-react'
import '../Help.css'

export default function Terms() {
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
          {t('help.termsOfService')}
        </h1>
      </div>

      <div style={{ padding: '20px 16px', maxWidth: '800px', margin: '0 auto' }}>
        <p style={{
          fontSize: '14px',
          color: Colors.neutral[500],
          textAlign: 'center',
          marginBottom: '24px'
        }}>
          {t('help.lastUpdated')}
        </p>

        {/* 1. Acceptance of Terms */}
        <div style={{
          backgroundColor: Colors.white,
          borderRadius: '12px',
          padding: '20px',
          marginBottom: '16px',
          boxShadow: '0 2px 4px rgba(0, 0, 0, 0.05)'
        }}>
          <h2 style={{ fontSize: '18px', fontWeight: '600', color: Colors.neutral[900], marginBottom: '12px' }}>
            {t('help.acceptanceOfTerms')}
          </h2>
          <p style={{ fontSize: '15px', color: Colors.neutral[700], lineHeight: '22px', marginBottom: '12px' }}>
            {t('help.acceptanceText')}
          </p>
        </div>

        {/* 2. Description of Service */}
        <div style={{
          backgroundColor: Colors.white,
          borderRadius: '12px',
          padding: '20px',
          marginBottom: '16px',
          boxShadow: '0 2px 4px rgba(0, 0, 0, 0.05)'
        }}>
          <h2 style={{ fontSize: '18px', fontWeight: '600', color: Colors.neutral[900], marginBottom: '12px' }}>
            {t('help.descriptionOfService')}
          </h2>
          <p style={{ fontSize: '15px', color: Colors.neutral[700], lineHeight: '22px', marginBottom: '12px' }}>
            {t('help.serviceDescription')}
          </p>
          <ul style={{ paddingLeft: '20px', marginBottom: '0' }}>
            <li style={{ fontSize: '15px', color: Colors.neutral[700], lineHeight: '22px', marginBottom: '4px' }}>
              {t('help.propertyListings')}
            </li>
            <li style={{ fontSize: '15px', color: Colors.neutral[700], lineHeight: '22px', marginBottom: '4px' }}>
              {t('help.communicationTools')}
            </li>
            <li style={{ fontSize: '15px', color: Colors.neutral[700], lineHeight: '22px', marginBottom: '4px' }}>
              {t('help.paymentProcessing')}
            </li>
            <li style={{ fontSize: '15px', color: Colors.neutral[700], lineHeight: '22px', marginBottom: '4px' }}>
              {t('help.propertyVerification')}
            </li>
            <li style={{ fontSize: '15px', color: Colors.neutral[700], lineHeight: '22px', marginBottom: '4px' }}>
              {t('help.locationBasedSearch')}
            </li>
          </ul>
        </div>

        {/* 3. User Accounts and Registration */}
        <div style={{
          backgroundColor: Colors.white,
          borderRadius: '12px',
          padding: '20px',
          marginBottom: '16px',
          boxShadow: '0 2px 4px rgba(0, 0, 0, 0.05)'
        }}>
          <h2 style={{ fontSize: '18px', fontWeight: '600', color: Colors.neutral[900], marginBottom: '12px' }}>
            {t('help.userAccountsAndRegistration')}
          </h2>
          <p style={{ fontSize: '15px', color: Colors.neutral[700], lineHeight: '22px', marginBottom: '12px' }}>
            {t('help.accountAgreement')}
          </p>
          <ul style={{ paddingLeft: '20px', marginBottom: '0' }}>
            <li style={{ fontSize: '15px', color: Colors.neutral[700], lineHeight: '22px', marginBottom: '4px' }}>
              {t('help.provideAccurateInfo')}
            </li>
            <li style={{ fontSize: '15px', color: Colors.neutral[700], lineHeight: '22px', marginBottom: '4px' }}>
              {t('help.maintainSecurity')}
            </li>
            <li style={{ fontSize: '15px', color: Colors.neutral[700], lineHeight: '22px', marginBottom: '4px' }}>
              {t('help.notifyUnauthorized')}
            </li>
            <li style={{ fontSize: '15px', color: Colors.neutral[700], lineHeight: '22px', marginBottom: '4px' }}>
              {t('help.acceptResponsibility')}
            </li>
          </ul>
        </div>

        {/* 4. User Roles and Responsibilities */}
        <div style={{
          backgroundColor: Colors.white,
          borderRadius: '12px',
          padding: '20px',
          marginBottom: '16px',
          boxShadow: '0 2px 4px rgba(0, 0, 0, 0.05)'
        }}>
          <h2 style={{ fontSize: '18px', fontWeight: '600', color: Colors.neutral[900], marginBottom: '12px' }}>
            {t('help.userRolesAndResponsibilities')}
          </h2>
          
          <h3 style={{ fontSize: '16px', fontWeight: '500', color: Colors.neutral[700], marginTop: '16px', marginBottom: '8px' }}>
            {t('help.propertyOwnersLandlords')}
          </h3>
          <ul style={{ paddingLeft: '20px', marginBottom: '8px' }}>
            <li style={{ fontSize: '15px', color: Colors.neutral[700], lineHeight: '22px', marginBottom: '4px' }}>
              {t('help.provideAccurateProperty')}
            </li>
            <li style={{ fontSize: '15px', color: Colors.neutral[700], lineHeight: '22px', marginBottom: '4px' }}>
              {t('help.responsibleForAvailability')}
            </li>
            <li style={{ fontSize: '15px', color: Colors.neutral[700], lineHeight: '22px', marginBottom: '4px' }}>
              {t('help.complyWithLaws')}
            </li>
            <li style={{ fontSize: '15px', color: Colors.neutral[700], lineHeight: '22px', marginBottom: '4px' }}>
              {t('help.liableForMisrepresentations')}
            </li>
          </ul>

          <h3 style={{ fontSize: '16px', fontWeight: '500', color: Colors.neutral[700], marginTop: '16px', marginBottom: '8px' }}>
            {t('help.agents')}
          </h3>
          <ul style={{ paddingLeft: '20px', marginBottom: '8px' }}>
            <li style={{ fontSize: '15px', color: Colors.neutral[700], lineHeight: '22px', marginBottom: '4px' }}>
              {t('help.properlyLicensed')}
            </li>
            <li style={{ fontSize: '15px', color: Colors.neutral[700], lineHeight: '22px', marginBottom: '4px' }}>
              {t('help.actInBestInterest')}
            </li>
            <li style={{ fontSize: '15px', color: Colors.neutral[700], lineHeight: '22px', marginBottom: '4px' }}>
              {t('help.provideAccurateProperty')}
            </li>
          </ul>

          <h3 style={{ fontSize: '16px', fontWeight: '500', color: Colors.neutral[700], marginTop: '16px', marginBottom: '8px' }}>
            {t('help.tenantsBuyers')}
          </h3>
          <ul style={{ paddingLeft: '20px', marginBottom: '0' }}>
            <li style={{ fontSize: '15px', color: Colors.neutral[700], lineHeight: '22px', marginBottom: '4px' }}>
              {t('help.provideAccuratePersonalInfo')}
            </li>
            <li style={{ fontSize: '15px', color: Colors.neutral[700], lineHeight: '22px', marginBottom: '4px' }}>
              {t('help.responsibleForPayment')}
            </li>
            <li style={{ fontSize: '15px', color: Colors.neutral[700], lineHeight: '22px', marginBottom: '4px' }}>
              {t('help.respectViewings')}
            </li>
          </ul>
        </div>

        {/* 5. Property Listings and Content */}
        <div style={{
          backgroundColor: Colors.white,
          borderRadius: '12px',
          padding: '20px',
          marginBottom: '16px',
          boxShadow: '0 2px 4px rgba(0, 0, 0, 0.05)'
        }}>
          <h2 style={{ fontSize: '18px', fontWeight: '600', color: Colors.neutral[900], marginBottom: '12px' }}>
            {t('help.propertyListingsAndContent')}
          </h2>
          <p style={{ fontSize: '15px', color: Colors.neutral[700], lineHeight: '22px', marginBottom: '12px' }}>
            {t('help.usersWhoPostAgree')}
          </p>
          <ul style={{ paddingLeft: '20px', marginBottom: '0' }}>
            <li style={{ fontSize: '15px', color: Colors.neutral[700], lineHeight: '22px', marginBottom: '4px' }}>
              {t('help.provideAccurateUpToDate')}
            </li>
            <li style={{ fontSize: '15px', color: Colors.neutral[700], lineHeight: '22px', marginBottom: '4px' }}>
              {t('help.includeClearPhotos')}
            </li>
            <li style={{ fontSize: '15px', color: Colors.neutral[700], lineHeight: '22px', marginBottom: '4px' }}>
              {t('help.discloseKnownIssues')}
            </li>
            <li style={{ fontSize: '15px', color: Colors.neutral[700], lineHeight: '22px', marginBottom: '4px' }}>
              {t('help.notPostFraudulent')}
            </li>
            <li style={{ fontSize: '15px', color: Colors.neutral[700], lineHeight: '22px', marginBottom: '4px' }}>
              {t('help.complyWithLaws')}
            </li>
          </ul>
        </div>

        {/* 6. Payment and Fees */}
        <div style={{
          backgroundColor: Colors.white,
          borderRadius: '12px',
          padding: '20px',
          marginBottom: '16px',
          boxShadow: '0 2px 4px rgba(0, 0, 0, 0.05)'
        }}>
          <h2 style={{ fontSize: '18px', fontWeight: '600', color: Colors.neutral[900], marginBottom: '12px' }}>
            6. Payment and Fees
          </h2>
          <p style={{ fontSize: '15px', color: Colors.neutral[700], lineHeight: '22px', marginBottom: '12px' }}>
            The App may charge fees for various services:
          </p>
          <ul style={{ paddingLeft: '20px', marginBottom: '12px' }}>
            <li style={{ fontSize: '15px', color: Colors.neutral[700], lineHeight: '22px', marginBottom: '4px' }}>
              Reservation fees for property bookings
            </li>
            <li style={{ fontSize: '15px', color: Colors.neutral[700], lineHeight: '22px', marginBottom: '4px' }}>
              Platform fees for successful transactions
            </li>
            <li style={{ fontSize: '15px', color: Colors.neutral[700], lineHeight: '22px', marginBottom: '4px' }}>
              Premium listing fees for enhanced visibility
            </li>
            <li style={{ fontSize: '15px', color: Colors.neutral[700], lineHeight: '22px', marginBottom: '4px' }}>
              Agent verification fees
            </li>
          </ul>
          <p style={{ fontSize: '15px', color: Colors.neutral[700], lineHeight: '22px', marginBottom: '0' }}>
            All fees are clearly displayed before payment. Payments are processed through secure third-party payment processors.
          </p>
        </div>

        {/* 7. Prohibited Activities */}
        <div style={{
          backgroundColor: Colors.white,
          borderRadius: '12px',
          padding: '20px',
          marginBottom: '16px',
          boxShadow: '0 2px 4px rgba(0, 0, 0, 0.05)'
        }}>
          <h2 style={{ fontSize: '18px', fontWeight: '600', color: Colors.neutral[900], marginBottom: '12px' }}>
            7. Prohibited Activities
          </h2>
          <p style={{ fontSize: '15px', color: Colors.neutral[700], lineHeight: '22px', marginBottom: '12px' }}>
            Users are prohibited from:
          </p>
          <ul style={{ paddingLeft: '20px', marginBottom: '0' }}>
            <li style={{ fontSize: '15px', color: Colors.neutral[700], lineHeight: '22px', marginBottom: '4px' }}>
              Posting false or misleading information
            </li>
            <li style={{ fontSize: '15px', color: Colors.neutral[700], lineHeight: '22px', marginBottom: '4px' }}>
              Harassing or discriminating against other users
            </li>
            <li style={{ fontSize: '15px', color: Colors.neutral[700], lineHeight: '22px', marginBottom: '4px' }}>
              Attempting to circumvent payment systems
            </li>
            <li style={{ fontSize: '15px', color: Colors.neutral[700], lineHeight: '22px', marginBottom: '4px' }}>
              Using the App for illegal activities
            </li>
            <li style={{ fontSize: '15px', color: Colors.neutral[700], lineHeight: '22px', marginBottom: '4px' }}>
              Impersonating others or creating fake accounts
            </li>
            <li style={{ fontSize: '15px', color: Colors.neutral[700], lineHeight: '22px', marginBottom: '4px' }}>
              Spamming or sending unsolicited messages
            </li>
          </ul>
        </div>

        {/* 8. Privacy and Data Protection */}
        <div style={{
          backgroundColor: Colors.white,
          borderRadius: '12px',
          padding: '20px',
          marginBottom: '16px',
          boxShadow: '0 2px 4px rgba(0, 0, 0, 0.05)'
        }}>
          <h2 style={{ fontSize: '18px', fontWeight: '600', color: Colors.neutral[900], marginBottom: '12px' }}>
            8. Privacy and Data Protection
          </h2>
          <p style={{ fontSize: '15px', color: Colors.neutral[700], lineHeight: '22px', marginBottom: '0' }}>
            Your privacy is important to us. We collect, use, and protect your personal information in accordance with our Privacy Policy. By using the App, you consent to our data practices as described in our Privacy Policy.
          </p>
        </div>

        {/* 9. Intellectual Property */}
        <div style={{
          backgroundColor: Colors.white,
          borderRadius: '12px',
          padding: '20px',
          marginBottom: '16px',
          boxShadow: '0 2px 4px rgba(0, 0, 0, 0.05)'
        }}>
          <h2 style={{ fontSize: '18px', fontWeight: '600', color: Colors.neutral[900], marginBottom: '12px' }}>
            9. Intellectual Property
          </h2>
          <p style={{ fontSize: '15px', color: Colors.neutral[700], lineHeight: '22px', marginBottom: '0' }}>
            The App and its content, including but not limited to text, graphics, logos, and software, are the property of Propella and are protected by copyright and other intellectual property laws. Users retain ownership of their property listings and personal content.
          </p>
        </div>

        {/* 10. Disclaimers and Limitations */}
        <div style={{
          backgroundColor: Colors.white,
          borderRadius: '12px',
          padding: '20px',
          marginBottom: '16px',
          boxShadow: '0 2px 4px rgba(0, 0, 0, 0.05)'
        }}>
          <h2 style={{ fontSize: '18px', fontWeight: '600', color: Colors.neutral[900], marginBottom: '12px' }}>
            10. Disclaimers and Limitations
          </h2>
          <p style={{ fontSize: '15px', color: Colors.neutral[700], lineHeight: '22px', marginBottom: '12px' }}>
            Propella provides the App "as is" without warranties of any kind. We do not guarantee:
          </p>
          <ul style={{ paddingLeft: '20px', marginBottom: '12px' }}>
            <li style={{ fontSize: '15px', color: Colors.neutral[700], lineHeight: '22px', marginBottom: '4px' }}>
              The accuracy of property information
            </li>
            <li style={{ fontSize: '15px', color: Colors.neutral[700], lineHeight: '22px', marginBottom: '4px' }}>
              The availability of listed properties
            </li>
            <li style={{ fontSize: '15px', color: Colors.neutral[700], lineHeight: '22px', marginBottom: '4px' }}>
              The success of any transactions
            </li>
            <li style={{ fontSize: '15px', color: Colors.neutral[700], lineHeight: '22px', marginBottom: '4px' }}>
              Uninterrupted access to the App
            </li>
          </ul>
          <p style={{ fontSize: '15px', color: Colors.neutral[700], lineHeight: '22px', marginBottom: '0' }}>
            Users are responsible for verifying property information and conducting their own due diligence.
          </p>
        </div>

        {/* 11. Liability */}
        <div style={{
          backgroundColor: Colors.white,
          borderRadius: '12px',
          padding: '20px',
          marginBottom: '16px',
          boxShadow: '0 2px 4px rgba(0, 0, 0, 0.05)'
        }}>
          <h2 style={{ fontSize: '18px', fontWeight: '600', color: Colors.neutral[900], marginBottom: '12px' }}>
            11. Liability
          </h2>
          <p style={{ fontSize: '15px', color: Colors.neutral[700], lineHeight: '22px', marginBottom: '0' }}>
            Propella shall not be liable for any indirect, incidental, special, or consequential damages arising from the use of the App. Our total liability shall not exceed the amount paid by you for our services in the 12 months preceding the claim.
          </p>
        </div>

        {/* 12. Termination */}
        <div style={{
          backgroundColor: Colors.white,
          borderRadius: '12px',
          padding: '20px',
          marginBottom: '16px',
          boxShadow: '0 2px 4px rgba(0, 0, 0, 0.05)'
        }}>
          <h2 style={{ fontSize: '18px', fontWeight: '600', color: Colors.neutral[900], marginBottom: '12px' }}>
            12. Termination
          </h2>
          <p style={{ fontSize: '15px', color: Colors.neutral[700], lineHeight: '22px', marginBottom: '0' }}>
            We may terminate or suspend your account at any time for violations of these terms. You may also terminate your account at any time by contacting our support team.
          </p>
        </div>

        {/* 13. Changes to Terms */}
        <div style={{
          backgroundColor: Colors.white,
          borderRadius: '12px',
          padding: '20px',
          marginBottom: '16px',
          boxShadow: '0 2px 4px rgba(0, 0, 0, 0.05)'
        }}>
          <h2 style={{ fontSize: '18px', fontWeight: '600', color: Colors.neutral[900], marginBottom: '12px' }}>
            13. Changes to Terms
          </h2>
          <p style={{ fontSize: '15px', color: Colors.neutral[700], lineHeight: '22px', marginBottom: '0' }}>
            We reserve the right to modify these terms at any time. Changes will be effective immediately upon posting. Continued use of the App constitutes acceptance of the modified terms.
          </p>
        </div>

        {/* 14. Governing Law */}
        <div style={{
          backgroundColor: Colors.white,
          borderRadius: '12px',
          padding: '20px',
          marginBottom: '16px',
          boxShadow: '0 2px 4px rgba(0, 0, 0, 0.05)'
        }}>
          <h2 style={{ fontSize: '18px', fontWeight: '600', color: Colors.neutral[900], marginBottom: '12px' }}>
            14. Governing Law
          </h2>
          <p style={{ fontSize: '15px', color: Colors.neutral[700], lineHeight: '22px', marginBottom: '0' }}>
            These terms are governed by the laws of Cameroon. Any disputes shall be resolved in the courts of Cameroon.
          </p>
        </div>

        {/* 15. Contact Information */}
        <div style={{
          backgroundColor: Colors.white,
          borderRadius: '12px',
          padding: '20px',
          marginBottom: '16px',
          boxShadow: '0 2px 4px rgba(0, 0, 0, 0.05)'
        }}>
          <h2 style={{ fontSize: '18px', fontWeight: '600', color: Colors.neutral[900], marginBottom: '12px' }}>
            15. Contact Information
          </h2>
          <p style={{ fontSize: '15px', color: Colors.neutral[700], lineHeight: '22px', marginBottom: '12px' }}>
            For questions about these Terms of Service, please contact us at:
          </p>
          <p style={{ fontSize: '15px', fontWeight: '500', color: Colors.primary[600], marginBottom: '4px' }}>
            Email: Propellacm@gmail.com
          </p>
          <p style={{ fontSize: '15px', fontWeight: '500', color: Colors.primary[600], marginBottom: '0' }}>
            Phone: +237 672 239 591
          </p>
        </div>

        {/* Footer */}
        <div style={{
          backgroundColor: Colors.white,
          borderRadius: '12px',
          padding: '20px',
          marginBottom: '24px',
          boxShadow: '0 2px 4px rgba(0, 0, 0, 0.05)'
        }}>
          <p style={{ fontSize: '14px', color: Colors.neutral[600], textAlign: 'center', fontStyle: 'italic', marginBottom: '0' }}>
            By using Propella, you acknowledge that you have read, understood, and agree to be bound by these Terms of Service.
          </p>
        </div>
      </div>
    </div>
  )
}
