import { Admin, Resource } from 'react-admin';
import { dataProvider } from './dataProvider';
import { authProvider } from './authProvider';
import { adminTheme } from './theme';
import { Layout } from './Layout';
import LoginPage from './LoginPage';
import { Icon } from '@iconify/react';

// Import resources
import { PropertyList, PropertyEdit, PropertyCreate } from './resources/Properties';
import { ProfileList, ProfileEdit } from './resources/Profiles';
import { ReservationList, ReservationEdit } from './resources/Reservations';
import { TransactionList } from './resources/Transactions';
import { ReviewList, ReviewEdit } from './resources/Reviews';
import { AgentVerificationList, AgentVerificationEdit } from './resources/AgentVerifications';
import { CommissionPaymentList, CommissionPaymentEdit } from './resources/CommissionPayments';
import { CommissionDisputeList, CommissionDisputeEdit } from './resources/CommissionDisputes';
import { WalletList } from './resources/Wallets';
import { WithdrawalRequestList, WithdrawalRequestEdit } from './resources/WithdrawalRequests';
import { NotificationList } from './resources/Notifications';
import { PropertyViewList } from './resources/PropertyViews';

// Menu icons - Using Lucide and Heroicons for better design
const PropertyIcon = () => <Icon icon="lucide:building-2" width={24} />;
const ProfileIcon = () => <Icon icon="lucide:users" width={24} />;
const ReservationIcon = () => <Icon icon="lucide:calendar-check" width={24} />;
const TransactionIcon = () => <Icon icon="lucide:credit-card" width={24} />;
const ReviewIcon = () => <Icon icon="lucide:star" width={24} />;
const AgentVerificationIcon = () => <Icon icon="lucide:shield-check" width={24} />;
const CommissionIcon = () => <Icon icon="lucide:coins" width={24} />;
const DisputeIcon = () => <Icon icon="lucide:alert-triangle" width={24} />;
const WalletIcon = () => <Icon icon="lucide:wallet" width={24} />;
const WithdrawalIcon = () => <Icon icon="lucide:arrow-down-circle" width={24} />;
const NotificationIcon = () => <Icon icon="lucide:bell" width={24} />;
const AnalyticsIcon = () => <Icon icon="lucide:bar-chart-3" width={24} />;

const AdminApp = () => {
  // Determine basename based on hostname
  const isAdminSubdomain = typeof window !== 'undefined' && 
    (window.location.hostname === 'admin.propellacam.com' || 
     window.location.hostname === 'admin.propella.cm');
  
  // Use root basename on admin subdomain, /admin on main domain
  const basename = isAdminSubdomain ? '/' : '/admin';
  
  return (
    <Admin
      basename={basename}
      dataProvider={dataProvider}
      authProvider={authProvider}
      theme={adminTheme}
      layout={Layout}
      loginPage={LoginPage}
      requireAuth
    >
      <Resource
        name="properties"
        list={PropertyList}
        edit={PropertyEdit}
        create={PropertyCreate}
        recordRepresentation="title"
        icon={PropertyIcon}
      />
      <Resource
        name="profiles"
        list={ProfileList}
        edit={ProfileEdit}
        recordRepresentation={(record) => record.full_name || record.email}
        icon={ProfileIcon}
      />
      <Resource
        name="reservations"
        list={ReservationList}
        edit={ReservationEdit}
        recordRepresentation={(record) => `Reservation #${record.id.slice(0, 8)}`}
        icon={ReservationIcon}
      />
      <Resource
        name="transactions"
        list={TransactionList}
        recordRepresentation={(record) => `Transaction #${record.id.slice(0, 8)}`}
        icon={TransactionIcon}
      />
      <Resource
        name="property_reviews"
        list={ReviewList}
        edit={ReviewEdit}
        recordRepresentation={(record) => `Review by ${record.user_id?.slice(0, 8)}`}
        icon={ReviewIcon}
      />
      <Resource
        name="agent_verifications"
        list={AgentVerificationList}
        edit={AgentVerificationEdit}
        recordRepresentation={(record) => `Verification: ${record.agent_id?.slice(0, 8)}`}
        icon={AgentVerificationIcon}
      />
      <Resource
        name="commission_payments"
        list={CommissionPaymentList}
        edit={CommissionPaymentEdit}
        recordRepresentation={(record) => `Payment: ${record.id?.slice(0, 8)}`}
        icon={CommissionIcon}
      />
      <Resource
        name="commission_disputes"
        list={CommissionDisputeList}
        edit={CommissionDisputeEdit}
        recordRepresentation={(record) => `Dispute: ${record.id?.slice(0, 8)}`}
        icon={DisputeIcon}
      />
      <Resource
        name="wallets"
        list={WalletList}
        recordRepresentation={(record) => `Wallet: ${record.user_id?.slice(0, 8)}`}
        icon={WalletIcon}
      />
      <Resource
        name="withdrawal_requests"
        list={WithdrawalRequestList}
        edit={WithdrawalRequestEdit}
        recordRepresentation={(record) => `Withdrawal: ${record.id?.slice(0, 8)}`}
        icon={WithdrawalIcon}
      />
      <Resource
        name="notifications"
        list={NotificationList}
        recordRepresentation={(record) => `Notification: ${record.id?.slice(0, 8)}`}
        icon={NotificationIcon}
      />
      <Resource
        name="property_views"
        list={PropertyViewList}
        recordRepresentation={(record) => `View: ${record.id?.slice(0, 8)}`}
        icon={AnalyticsIcon}
      />
    </Admin>
  );
};

export default AdminApp;
