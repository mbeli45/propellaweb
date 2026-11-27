export type QueueKey = 'reservations' | 'withdrawals' | 'reports' | 'verifications' | 'commissionDisputes';
export interface AdminTab { path: string; label: string; queue?: QueueKey }
export interface AdminLink { path: string; label: string; icon: string; queue?: QueueKey; tabs?: AdminTab[]; description?: string; /** The page renders its own title. */ ownHeader?: boolean }

export const navigation: { label: string; links: AdminLink[] }[] = [
  { label: 'Workspace', links: [
    { path: '/', label: 'Overview', icon: 'lucide:layout-dashboard' },
    { path: '/deals', label: 'Requests & deals', icon: 'lucide:handshake' },
  ] },
  { label: 'Marketplace', links: [
    { path: '/properties', label: 'Properties', icon: 'lucide:building-2', description: 'Every listing on Propella, with its owner, price and whether it waits on an ID check.' },
    { path: '/reservations', label: 'Reservations', icon: 'lucide:calendar-check', queue: 'reservations', description: 'Site-visit bookings, their payments and refund requests.' },
    { path: '/stays', label: 'Stays', icon: 'lucide:bed-double', ownHeader: true, description: 'Commission and deposit terms for stays, and deposits to refund.' },
    { path: '/profiles', label: 'People', icon: 'lucide:users', description: 'Accounts, ID checks for agents, landlords and hosts, and professional verification.', tabs: [
      { path: '/profiles', label: 'Accounts' },
      { path: '/agent_identity_verifications', label: 'ID reviews', queue: 'verifications' },
      { path: '/agent_verifications', label: 'Professional verification' },
    ] },
  ] },
  { label: 'Operations', links: [
    { path: '/transactions', label: 'Finance', icon: 'lucide:wallet', description: 'Track transactions, commission payments, balances, and withdrawal requests.', tabs: [
      { path: '/transactions', label: 'Transactions' },
      { path: '/commission_payments', label: 'Commissions' },
      { path: '/wallets', label: 'Wallets' },
      { path: '/withdrawal_requests', label: 'Withdrawals', queue: 'withdrawals' },
    ] },
    { path: '/content_reports', label: 'Moderation', icon: 'lucide:shield-check', description: 'Review reported content, property reviews, and commission disputes.', tabs: [
      { path: '/content_reports', label: 'Content reports', queue: 'reports' },
      { path: '/property_reviews', label: 'Reviews' },
      { path: '/commission_disputes', label: 'Commission disputes', queue: 'commissionDisputes' },
      { path: '/property_media_cleanup_jobs', label: 'Media cleanup' },
    ] },
    { path: '/signup-stats', label: 'Analytics', icon: 'lucide:bar-chart-3', description: 'Explore account growth and property viewing activity.', tabs: [
      { path: '/signup-stats', label: 'Signup insights' },
      { path: '/property_views', label: 'Property views' },
    ] },
    { path: '/notifications', label: 'Notifications', icon: 'lucide:bell', description: 'Messages Propella has sent to people in the app.' },
  ] },
];

// Include detail routes, but never match a different resource with the same prefix.
export const matchesAdminPath = (pathname: string, base: string, path: string) => {
  const root = `${base}${path}`.replace(/\/$/, '');
  const current = pathname.replace(/\/$/, '');
  return current === root || (path !== '/' && current.startsWith(`${root}/`));
};
