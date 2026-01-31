import { Layout as RALayout, LayoutProps, Sidebar, Menu, useSidebarState } from 'react-admin';
import { AppBar, UserMenu, Logout } from 'react-admin';
import { Box, Typography, IconButton, Tooltip, useMediaQuery, Backdrop } from '@mui/material';
import { Colors } from '@/constants/Colors';
import { useNavigate } from 'react-router-dom';
import { Icon } from '@iconify/react';
import { useEffect } from 'react';

const CustomAppBar = () => {
  const navigate = useNavigate();
  
  const handleGoHome = () => {
    navigate('/user');
  };
  
  return (
    <AppBar
      sx={{
        backgroundColor: Colors.white,
        borderBottom: `1px solid ${Colors.neutral[200]}`,
        boxShadow: 'none',
        '& .RaAppBar-toolbar': {
          minHeight: { xs: '56px', md: '64px' },
          padding: { xs: '0 16px', md: '0 24px' },
          display: 'flex !important',
          flexDirection: 'row !important',
          alignItems: 'center !important',
          justifyContent: 'space-between !important',
        },
      }}
      userMenu={
        <UserMenu>
          <Logout />
        </UserMenu>
      }
    >
      <Box sx={{ 
        display: 'flex', 
        alignItems: 'center', 
        gap: 1.5,
        flexShrink: 0,
      }}>
        <img
          src="/app-icon.png"
          alt="Propella"
          style={{
            width: '32px',
            height: '32px',
            objectFit: 'cover',
          }}
        />
        <Typography 
          variant="h6" 
          fontWeight={700} 
          color={Colors.primary[600]}
          sx={{ fontSize: '1rem' }}
        >
          Admin
        </Typography>
      </Box>
      
      <Box sx={{ flex: 1 }} />
      
      <Tooltip title="Back to App">
        <IconButton
          onClick={handleGoHome}
          sx={{
            color: Colors.neutral[600],
            '&:hover': {
              backgroundColor: Colors.primary[50],
              color: Colors.primary[600],
            },
          }}
        >
          <Icon icon="lucide:home" width={20} />
        </IconButton>
      </Tooltip>
    </AppBar>
  );
};

const CustomSidebar = (props: any) => {
  const [open, setOpen] = useSidebarState();
  const isMobile = useMediaQuery('(max-width: 768px)');
  
  useEffect(() => {
    if (isMobile) {
      setOpen(false);
    }
  }, [isMobile, setOpen]);
  
  return (
    <>
      {isMobile && (
        <Backdrop
          open={open}
          onClick={() => setOpen(false)}
          sx={{
            zIndex: (theme) => theme.zIndex.drawer - 1,
            backgroundColor: 'rgba(0, 0, 0, 0.5)',
          }}
        />
      )}
      <Sidebar
        {...props}
        sx={{
          '& .RaSidebar-drawerPaper': {
            backgroundColor: Colors.white,
            borderRight: `1px solid ${Colors.neutral[200]}`,
            top: { xs: '56px', md: '64px' },
            height: { xs: 'calc(100vh - 56px)', md: 'calc(100vh - 64px)' },
            '@media (max-width: 768px)': {
              position: 'fixed',
              zIndex: (theme) => theme.zIndex.drawer,
            },
          },
          '& .RaMenuItemLink-icon': {
            color: Colors.neutral[600],
            transition: 'color 0.2s',
            '& svg': {
              width: '20px',
              height: '20px',
            },
          },
          '& .RaMenuItemLink-root': {
            padding: { xs: '14px 16px', md: '12px 16px' },
            margin: '0',
            borderRadius: '0',
            transition: 'all 0.2s',
            fontSize: { xs: '0.9375rem', md: '1rem' },
            '&:hover': {
              backgroundColor: Colors.neutral[50],
            },
            '&.RaMenuItemLink-active': {
              backgroundColor: 'transparent',
              color: Colors.neutral[900],
              fontWeight: 400,
              '& .RaMenuItemLink-icon': {
                color: Colors.primary[600],
              },
            },
          },
        }}
      >
        <Menu />
      </Sidebar>
    </>
  );
};

export const Layout = (props: LayoutProps) => (
  <RALayout
    {...props}
    appBar={CustomAppBar}
    sidebar={CustomSidebar}
    sx={{
      '& .RaLayout-appFrame': {
        '@media (max-width: 768px)': {
          marginTop: '0 !important',
        },
      },
      '& .RaLayout-content': {
        backgroundColor: Colors.neutral[50],
        padding: { xs: '16px', md: '24px' },
        '@media (max-width: 768px)': {
          marginLeft: '0 !important',
          width: '100% !important',
          maxWidth: '100vw',
          overflow: 'hidden',
        },
      },
      '& .RaList-main': {
        '@media (max-width: 768px)': {
          width: '100%',
          maxWidth: '100%',
          overflow: 'hidden',
        },
      },
      '& .MuiCard-root': {
        '@media (max-width: 768px)': {
          boxShadow: 'none',
          border: `1px solid ${Colors.neutral[200]}`,
          width: '100%',
          maxWidth: '100%',
        },
      },
      // Make tables responsive with horizontal scroll
      '& .MuiTableContainer-root': {
        overflowX: 'auto',
        WebkitOverflowScrolling: 'touch',
        '@media (max-width: 768px)': {
          width: '100%',
          maxWidth: 'calc(100vw - 32px)',
        },
      },
      '& .RaDatagrid-root': {
        '& .RaDatagrid-headerCell': {
          padding: '16px 12px',
          fontSize: '0.875rem',
          fontWeight: 600,
          whiteSpace: 'nowrap',
        },
        '& .RaDatagrid-rowCell': {
          padding: '16px 12px',
          fontSize: '0.875rem',
        },
      },
      // Toolbar responsiveness
      '& .RaToolbar-root': {
        '@media (max-width: 768px)': {
          flexWrap: 'wrap',
          gap: '8px',
        },
      },
    }}
  />
);
