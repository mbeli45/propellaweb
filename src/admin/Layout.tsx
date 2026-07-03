import { ReactNode, useEffect, useMemo, useState } from 'react';
import { LayoutProps, Notification, UserMenu, Logout } from 'react-admin';
import { NavLink, useLocation, useNavigate } from 'react-router-dom';
import {
  Box,
  Drawer,
  IconButton,
  Typography,
  List,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Chip,
  Tooltip,
  useMediaQuery,
  alpha,
} from '@mui/material';
import { Icon } from '@iconify/react';
import { Colors } from '@/constants/Colors';
import { supabase } from '@/lib/supabase';

// Layout B — traditional admin chrome.
//
// Structure:
//   ┌─────────────────────────────────┐
//   │ ☰  Logo  Propella Admin   🏠 👤 │ ← fixed full-width topbar
//   ├──────────┬──────────────────────┤
//   │ Sidebar  │                      │
//   │ nav      │     Content          │
//   │          │                      │
//   └──────────┴──────────────────────┘
//
// We render this as a plain MUI flexbox without react-admin's <RALayout>, so
// react-admin owns routing + data while we own the chrome.

const SIDEBAR_WIDTH = 240;
const SIDEBAR_WIDTH_COLLAPSED = 64;
const TOPBAR_HEIGHT = 60;
const COLLAPSED_KEY = 'admin-sidebar-collapsed';

// Persist the collapse state across reloads so admins keep their preference.
const useSidebarCollapsed = () => {
  const [collapsed, setCollapsed] = useState(() => {
    if (typeof window === 'undefined') return false;
    return window.localStorage.getItem(COLLAPSED_KEY) === 'true';
  });
  useEffect(() => {
    if (typeof window === 'undefined') return;
    window.localStorage.setItem(COLLAPSED_KEY, String(collapsed));
  }, [collapsed]);
  return [collapsed, setCollapsed] as const;
};

// Mirrors App.tsx so links inside admin always resolve to the right basename,
// regardless of whether we're on /admin/* or the admin subdomain.
const useAdminBasePath = () =>
  useMemo(() => {
    if (typeof window === 'undefined') return '/admin';
    const host = window.location.hostname;
    const isAdminSubdomain =
      host === 'admin.propellacam.com' ||
      host === 'admin.propella.cm' ||
      host === 'admin.propella.com';
    return isAdminSubdomain ? '' : '/admin';
  }, []);

// ----- Queue counts for sidebar badges -----------------------------------

interface QueueCounts {
  reservations: number;
  withdrawals: number;
  reports: number;
  verifications: number;
  commissionDisputes: number;
}

const useQueueCounts = (): QueueCounts => {
  const [counts, setCounts] = useState<QueueCounts>({
    reservations: 0,
    withdrawals: 0,
    reports: 0,
    verifications: 0,
    commissionDisputes: 0,
  });

  useEffect(() => {
    let alive = true;
    const load = async () => {
      try {
        const [r, w, c, v, d] = await Promise.all([
          supabase.from('reservations').select('id', { count: 'exact', head: true })
            .eq('refund_requested', true).neq('refund_status', 'refunded'),
          supabase.from('withdrawal_requests').select('id', { count: 'exact', head: true })
            .eq('status', 'pending'),
          supabase.from('content_reports').select('id', { count: 'exact', head: true })
            .eq('status', 'pending'),
          supabase.from('agent_verifications').select('id', { count: 'exact', head: true })
            .eq('verification_status', 'pending'),
          supabase.from('commission_disputes').select('id', { count: 'exact', head: true })
            .eq('status', 'open'),
        ]);
        if (!alive) return;
        setCounts({
          reservations: r.count ?? 0,
          withdrawals: w.count ?? 0,
          reports: c.count ?? 0,
          verifications: v.count ?? 0,
          commissionDisputes: d.count ?? 0,
        });
      } catch (err) {
        console.warn('Sidebar count load failed', err);
      }
    };
    load();
    const id = setInterval(load, 60_000);
    return () => {
      alive = false;
      clearInterval(id);
    };
  }, []);

  return counts;
};

// ----- Menu primitives ---------------------------------------------------

const SectionLabel = ({ label }: { label: string }) => (
  <Typography
    variant="caption"
    sx={{
      display: 'block',
      px: 2.5,
      pt: 2,
      pb: 0.5,
      color: Colors.neutral[500],
      fontWeight: 700,
      letterSpacing: '0.6px',
      textTransform: 'uppercase',
      fontSize: '0.6875rem',
    }}
  >
    {label}
  </Typography>
);

interface NavItemProps {
  to: string;
  end?: boolean;
  icon: string;
  label: string;
  badge?: number;
  onClick?: () => void;
  /** When true, render icon-only with the label as a tooltip and badge as a
   *  small dot in the top-right corner. */
  collapsed?: boolean;
}

const NavItem = ({ to, end, icon, label, badge, onClick, collapsed }: NavItemProps) => {
  const location = useLocation();
  const isActive = end ? location.pathname === to : location.pathname.startsWith(to);

  const inner = (
    <ListItemButton
      component={NavLink}
      to={to}
      end={end}
      onClick={onClick}
      sx={{
        height: collapsed ? 44 : 38,
        px: collapsed ? 0 : 2.5,
        gap: 1.5,
        justifyContent: collapsed ? 'center' : 'flex-start',
        position: 'relative',
        color: isActive ? Colors.primary[700] : Colors.neutral[700],
        backgroundColor: isActive ? Colors.primary[50] : 'transparent',
        borderLeft: `3px solid ${isActive ? Colors.primary[600] : 'transparent'}`,
        pl: collapsed ? 0 : 'calc(20px - 3px)',
        '&:hover': {
          backgroundColor: isActive ? Colors.primary[100] : Colors.neutral[50],
        },
        '& .MuiListItemIcon-root': {
          minWidth: 0,
          color: isActive ? Colors.primary[600] : Colors.neutral[500],
        },
      }}
    >
      <ListItemIcon>
        <Icon icon={icon} width={collapsed ? 20 : 18} />
      </ListItemIcon>
      {!collapsed && (
        <ListItemText
          primary={label}
          primaryTypographyProps={{
            fontSize: '0.875rem',
            fontWeight: isActive ? 600 : 500,
          }}
        />
      )}
      {!collapsed && badge !== undefined && badge > 0 && (
        <Chip
          size="small"
          label={badge}
          sx={{
            height: 20,
            fontSize: '0.6875rem',
            fontWeight: 700,
            bgcolor: Colors.warning[100],
            color: Colors.warning[800],
            '& .MuiChip-label': { px: 0.75 },
          }}
        />
      )}
      {collapsed && badge !== undefined && badge > 0 && (
        <Box
          sx={{
            position: 'absolute',
            top: 8,
            right: 14,
            width: 8,
            height: 8,
            borderRadius: '50%',
            bgcolor: Colors.warning[600],
            boxShadow: `0 0 0 2px ${Colors.white}`,
          }}
        />
      )}
    </ListItemButton>
  );

  return collapsed ? (
    <Tooltip title={badge && badge > 0 ? `${label} (${badge})` : label} placement="right" arrow>
      {inner}
    </Tooltip>
  ) : (
    inner
  );
};

// ----- Sidebar content (no brand block — brand lives in the topbar) ------

// Compact separator used in collapsed mode where section labels would feel
// cramped. Keeps the visual rhythm without the text.
const SectionDivider = () => (
  <Box sx={{ height: 1, bgcolor: Colors.neutral[200], mx: 1.5, my: 1 }} />
);

interface SidebarContentProps {
  onNavigate?: () => void;
  collapsed?: boolean;
}

const SidebarContent = ({ onNavigate, collapsed }: SidebarContentProps) => {
  const base = useAdminBasePath();
  const counts = useQueueCounts();
  const p = (s: string) => `${base}${s}`;
  const Section = collapsed ? SectionDivider : (props: { label: string }) => <SectionLabel {...props} />;

  return (
    <Box sx={{ height: '100%', overflowY: 'auto', overflowX: 'hidden', py: 1 }}>
      <List dense disablePadding>
        <NavItem to={p('/')} end icon="lucide:layout-dashboard" label="Dashboard" onClick={onNavigate} collapsed={collapsed} />

        <Section label="Operations" />
        <NavItem to={p('/properties')} icon="lucide:building-2" label="Properties" onClick={onNavigate} collapsed={collapsed} />
        <NavItem to={p('/reservations')} icon="lucide:calendar-check" label="Reservations" badge={counts.reservations} onClick={onNavigate} collapsed={collapsed} />
        <NavItem to={p('/profiles')} icon="lucide:users" label="Users" onClick={onNavigate} collapsed={collapsed} />
        <NavItem to={p('/signup-stats')} icon="lucide:user-plus" label="Signup stats" onClick={onNavigate} collapsed={collapsed} />

        <Section label="Money" />
        <NavItem to={p('/transactions')} icon="lucide:credit-card" label="Transactions" onClick={onNavigate} collapsed={collapsed} />
        <NavItem to={p('/wallets')} icon="lucide:wallet" label="Wallets" onClick={onNavigate} collapsed={collapsed} />
        <NavItem to={p('/commission_payments')} icon="lucide:coins" label="Commissions" onClick={onNavigate} collapsed={collapsed} />
        <NavItem to={p('/commission_disputes')} icon="lucide:alert-triangle" label="Disputes" badge={counts.commissionDisputes} onClick={onNavigate} collapsed={collapsed} />
        <NavItem to={p('/withdrawal_requests')} icon="lucide:arrow-down-circle" label="Withdrawals" badge={counts.withdrawals} onClick={onNavigate} collapsed={collapsed} />

        <Section label="Moderation" />
        <NavItem to={p('/content_reports')} icon="lucide:flag" label="Reports" badge={counts.reports} onClick={onNavigate} collapsed={collapsed} />
        <NavItem to={p('/agent_verifications')} icon="lucide:shield-check" label="Verifications" badge={counts.verifications} onClick={onNavigate} collapsed={collapsed} />
        <NavItem to={p('/property_reviews')} icon="lucide:star" label="Reviews" onClick={onNavigate} collapsed={collapsed} />

        <Section label="Content" />
        <NavItem to={p('/notifications')} icon="lucide:bell" label="Notifications" onClick={onNavigate} collapsed={collapsed} />
        <NavItem to={p('/property_views')} icon="lucide:bar-chart-3" label="Property views" onClick={onNavigate} collapsed={collapsed} />
        <NavItem to={p('/storage-migration')} icon="lucide:database-backup" label="Storage" onClick={onNavigate} collapsed={collapsed} />
      </List>
    </Box>
  );
};

// ----- Fixed full-width topbar -------------------------------------------

interface TopbarProps {
  onMenuClick: () => void;
  onCollapseToggle: () => void;
  isMobile: boolean;
  isCollapsed: boolean;
}

const Topbar = ({ onMenuClick, onCollapseToggle, isMobile, isCollapsed }: TopbarProps) => {
  const navigate = useNavigate();
  return (
    <Box
      sx={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        height: TOPBAR_HEIGHT,
        bgcolor: Colors.white,
        borderBottom: `1px solid ${Colors.neutral[200]}`,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        px: { xs: 1.5, md: 3 },
        zIndex: 1201,
      }}
    >
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, minWidth: 0 }}>
        {/* Mobile: hamburger opens the slide-in drawer.
            Desktop: chevron toggles between full sidebar (240px) and rail (64px). */}
        <Tooltip title={isMobile ? 'Open navigation' : isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}>
          <IconButton
            onClick={isMobile ? onMenuClick : onCollapseToggle}
            edge="start"
            sx={{ color: Colors.neutral[700], mr: 0.5 }}
            aria-label={isMobile ? 'Open navigation' : 'Toggle sidebar'}
          >
            <Icon
              icon={isMobile ? 'lucide:menu' : isCollapsed ? 'lucide:panel-left-open' : 'lucide:panel-left-close'}
              width={22}
            />
          </IconButton>
        </Tooltip>
        <img src="/app-icon.png" alt="Propella" style={{ width: 28, height: 28, objectFit: 'cover', flexShrink: 0 }} />
        <Typography
          fontWeight={700}
          color={Colors.primary[600]}
          sx={{
            fontSize: '1rem',
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
          }}
        >
          Propella Admin
        </Typography>
      </Box>

      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, flexShrink: 0 }}>
        <Tooltip title="Back to app">
          <IconButton
            onClick={() => navigate('/user')}
            sx={{
              color: Colors.neutral[600],
              '&:hover': { backgroundColor: alpha(Colors.primary[500], 0.08), color: Colors.primary[600] },
            }}
            aria-label="Back to user app"
          >
            <Icon icon="lucide:home" width={20} />
          </IconButton>
        </Tooltip>
        <UserMenu>
          <Logout />
        </UserMenu>
      </Box>
    </Box>
  );
};

// ----- Root layout -------------------------------------------------------

export const Layout = (props: LayoutProps) => {
  const children: ReactNode = (props as any).children;
  const isMobile = useMediaQuery('(max-width: 900px)');
  const [mobileOpen, setMobileOpen] = useState(false);
  const [collapsed, setCollapsed] = useSidebarCollapsed();

  useEffect(() => {
    if (!isMobile) setMobileOpen(false);
  }, [isMobile]);

  // On mobile, the slide-in drawer should always show the full-width sidebar.
  // The persisted `collapsed` flag is desktop-only.
  const effectiveCollapsed = !isMobile && collapsed;
  const effectiveWidth = effectiveCollapsed ? SIDEBAR_WIDTH_COLLAPSED : SIDEBAR_WIDTH;

  // borderRadius:0 overrides the global MuiPaper rounding from theme.ts so the
  // drawer sits flush against the viewport edges.
  const drawerPaperSx = {
    width: effectiveWidth,
    boxSizing: 'border-box' as const,
    bgcolor: Colors.white,
    borderRight: `1px solid ${Colors.neutral[200]}`,
    borderRadius: 0,
    top: TOPBAR_HEIGHT,
    height: `calc(100vh - ${TOPBAR_HEIGHT}px)`,
    // Smooth width transition when toggling collapse on desktop.
    transition: 'width 180ms ease',
    overflowX: 'hidden' as const,
  };
  const mobileDrawerPaperSx = { ...drawerPaperSx, width: SIDEBAR_WIDTH, transition: 'none' };

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: Colors.neutral[50] }}>
      <Topbar
        onMenuClick={() => setMobileOpen(true)}
        onCollapseToggle={() => setCollapsed((c) => !c)}
        isMobile={isMobile}
        isCollapsed={collapsed}
      />

      {/* Permanent sidebar for desktop */}
      {!isMobile && (
        <Drawer
          variant="permanent"
          sx={{
            width: effectiveWidth,
            flexShrink: 0,
            transition: 'width 180ms ease',
            '& .MuiDrawer-paper': drawerPaperSx,
          }}
        >
          <SidebarContent collapsed={effectiveCollapsed} />
        </Drawer>
      )}

      {/* Temporary slide-in drawer for mobile (always full-width) */}
      {isMobile && (
        <Drawer
          variant="temporary"
          open={mobileOpen}
          onClose={() => setMobileOpen(false)}
          ModalProps={{ keepMounted: true }}
          sx={{ '& .MuiDrawer-paper': mobileDrawerPaperSx }}
        >
          <SidebarContent onNavigate={() => setMobileOpen(false)} />
        </Drawer>
      )}

      {/* Main content offset by the topbar (always) and the sidebar (desktop) */}
      <Box
        component="main"
        sx={{
          pt: `${TOPBAR_HEIGHT}px`,
          pl: { xs: 0, md: `${effectiveWidth}px` },
          minHeight: '100vh',
          transition: 'padding-left 180ms ease',
        }}
      >
        <Box sx={{ p: { xs: 1.5, md: 3 } }}>{children}</Box>
      </Box>

      <Notification />
    </Box>
  );
};
