import { Dialog as UiDialog, DialogContent as UiDialogContent, DialogTitle as UiDialogTitle } from './ui/dialog';
import { Button } from '@/admin/ui/button';
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator } from '@/admin/ui/dropdown-menu';
import { ReactNode, useEffect, useMemo, useState } from 'react';
import { LayoutProps, Notification, useLogout, useGetIdentity } from 'react-admin';
import { NavLink, useLocation, useNavigate } from 'react-router-dom';
import {
  Box,
  IconButton,
  Tooltip,
  useMediaQuery,
} from '@mui/material';
import { Icon } from '@iconify/react';
import './admin.css';
import './shadcn.css';
import { navigation, matchesAdminPath, type AdminLink, type QueueKey } from './navigation';
import { supabase } from '@/lib/supabase';

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

export const Layout = (props: LayoutProps) => {
  const children: ReactNode = (props as any).children;
  const isMobile = useMediaQuery('(max-width: 900px)');
  const [mobileOpen, setMobileOpen] = useState(false);
  const [collapsed, setCollapsed] = useSidebarCollapsed();
  const [query, setQuery] = useState('');
  const base = useAdminBasePath();
  const location = useLocation();
  const navigate = useNavigate();
  const counts = useQueueCounts();
  const { data: identity } = useGetIdentity();
  const logout = useLogout();
  const seenKey = identity?.id ? `admin-seen-queues:${identity.id}` : null;
  const [seen, setSeen] = useState<Partial<QueueCounts>>({});
  useEffect(() => {
    try { setSeen(seenKey ? JSON.parse(localStorage.getItem(seenKey) || '{}') : {}); }
    catch { setSeen({}); }
  }, [seenKey]);
  const openQueue = navigation.flatMap(group=>group.links).flatMap(link=>link.tabs || [link]).find(item=>item.queue && matchesAdminPath(location.pathname,base,item.path))?.queue;
  useEffect(() => {
    if (!seenKey || !openQueue) return;
    setSeen(previous => {
      if (previous[openQueue] === counts[openQueue]) return previous;
      const next = {...previous, [openQueue]: counts[openQueue]};
      try { localStorage.setItem(seenKey, JSON.stringify(next)); } catch { /* Storage may be disabled. */ }
      return next;
    });
  }, [seenKey, openQueue, counts]);
  const badgeCount = (queue: QueueKey) => openQueue===queue || seen[queue]===counts[queue] ? 0 : counts[queue];
  const compact = !isMobile && collapsed;
  const width = compact ? 80 : 264;
  const path = (link: AdminLink) => `${base}${link.path}`;
  const selected = (link: AdminLink) => (link.tabs || [link]).some(item=>matchesAdminPath(location.pathname,base,item.path));
  const current = navigation.flatMap(g => g.links).find(selected);
  const activeTab = current?.tabs?.find(item=>matchesAdminPath(location.pathname,base,item.path));
  const groups = navigation.map(group => ({ ...group, links: group.links.filter(link => `${link.label} ${group.label} ${link.tabs?.map(tab=>tab.label).join(' ') || ''}`.toLowerCase().includes(query.trim().toLowerCase())) })).filter(group => group.links.length);
  useEffect(() => { setMobileOpen(false) }, [location.pathname]);
  useEffect(() => { if (!isMobile) setMobileOpen(false) }, [isMobile]);
  useEffect(() => { if (compact) setQuery('') }, [compact]);

  const sidebar = <div className={`admin-navigation ${compact ? 'is-compact' : ''}`}>
    <NavLink to={`${base}/`} className="admin-brand" aria-label="Propella admin overview">
      <img src="/app-icon.png" alt="" width="36" height="36" />
      {!compact && <span>Propella<small>ADMIN WORKSPACE</small></span>}
    </NavLink>
    {isMobile && <IconButton className="admin-drawer-close" aria-label="Close navigation" onClick={() => setMobileOpen(false)}><Icon icon="lucide:x" width={20}/></IconButton>}
    {!compact && <label className="admin-nav-search"><Icon icon="lucide:search" width={17}/><input aria-label="Find an admin page" placeholder="Find a page…" value={query} onChange={e=>setQuery(e.target.value)}/>{query && <button aria-label="Clear page search" onClick={()=>setQuery('')}><Icon icon="lucide:x" width={15}/></button>}</label>}
    <nav className="admin-nav-scroll" aria-label="Admin navigation">
      {groups.map(group=><section className="admin-nav-group" key={group.label}>
        {!compact && <h2>{group.label}</h2>}
        {group.links.map(link=>{
          const count = (link.tabs || [link]).reduce((total,item)=>total+(item.queue ? badgeCount(item.queue) : 0),0);
          return <Tooltip key={link.path} title={compact ? `${link.label}${count ? ` (${count})` : ''}` : ''} placement="right">
            <NavLink to={path(link)} end={link.path==='/'} onClick={()=>setMobileOpen(false)} aria-current={selected(link) ? 'page' : undefined} aria-label={compact ? link.label : undefined} className={`admin-nav-link ${selected(link) ? 'is-active' : ''}`}>
              <Icon icon={link.icon} width={20}/>{!compact && <span>{link.label}</span>}{count>0 && <b className={compact?'admin-queue-dot':'admin-queue-count'}>{!compact && (count>99?'99+':count)}</b>}
            </NavLink>
          </Tooltip>;
        })}
      </section>)}
      {!groups.length && <p className="admin-nav-empty">No pages found. Try another name.</p>}
    </nav>
    <div className="admin-nav-footer">
      {!compact && <div><Icon icon="lucide:shield-check" width={18}/><span>Propella operations<small>Manage your marketplace</small></span></div>}
      {!isMobile && <Tooltip title={compact?'Expand sidebar':'Collapse sidebar'}><button aria-label={compact?'Expand sidebar':'Collapse sidebar'} onClick={()=>setCollapsed(c=>!c)}><Icon icon={compact?'lucide:panel-left-open':'lucide:panel-left-close'} width={20}/></button></Tooltip>}
    </div>
  </div>;

  return <Box className="propella-admin" sx={{minHeight:'100vh',background:'#F5F7FB'}}>
    <a className="admin-skip-link" href="#admin-main">Skip to content</a>
    {isMobile ? <UiDialog open={mobileOpen} onOpenChange={setMobileOpen}><UiDialogContent className="admin-mobile-sidebar" aria-describedby={undefined}><UiDialogTitle className="sr-only">Admin navigation</UiDialogTitle>{sidebar}</UiDialogContent></UiDialog> : <aside className="admin-desktop-sidebar" style={{width}}>{sidebar}</aside>}
    <header className="admin-topbar" style={{left:isMobile?0:width}}>
      <div className="admin-topbar-context">
        {isMobile && <IconButton aria-label="Open navigation" onClick={()=>setMobileOpen(true)}><Icon icon="lucide:menu" width={22}/></IconButton>}
        <div><span className="admin-breadcrumb">Workspace <span>/</span></span><strong>{current?.label || 'Administration'}</strong></div>
      </div>
      <div className="admin-topbar-actions"><button className="admin-app-link" onClick={()=>navigate('/user')}><Icon icon="lucide:arrow-up-right" width={17}/><span>Open Propella</span></button><DropdownMenu><DropdownMenuTrigger asChild><Button variant="ghost">{identity?.fullName || 'My account'}<span>⌄</span></Button></DropdownMenuTrigger><DropdownMenuContent align="end"><DropdownMenuLabel>Admin workspace</DropdownMenuLabel><DropdownMenuSeparator/><DropdownMenuItem onSelect={()=>void logout()}>Sign out</DropdownMenuItem></DropdownMenuContent></DropdownMenu></div>
    </header>
    <main id="admin-main" tabIndex={-1} className="admin-main" style={{marginLeft:isMobile?0:width}}><div className="admin-page-content">
      {current?.tabs && <section className="admin-section-header" aria-label={`${current.label} navigation`}>
        <h1>{current.label}</h1><p>{current.description}</p>
        <nav className="admin-section-tabs" aria-label={`${current.label} pages`}>
          {current.tabs.map(tab=><NavLink key={tab.path} to={`${base}${tab.path}`} aria-current={activeTab===tab?'page':undefined} className={activeTab===tab?'is-active':''}>{tab.label}{tab.queue && badgeCount(tab.queue)>0 && <span>{badgeCount(tab.queue)}</span>}</NavLink>)}
        </nav>
      </section>}
      {children}
    </div></main>
    <Notification/>
  </Box>;
};
