import { createTheme } from '@mui/material/styles';
import { Colors } from '@/constants/Colors';

export const adminTheme = createTheme({
  palette: {
    mode: 'light',
    primary: {
      main: Colors.primary[500],
      light: Colors.primary[300],
      dark: Colors.primary[700],
      contrastText: '#fff',
    },
    secondary: {
      main: Colors.secondary[500],
      light: Colors.secondary[300],
      dark: Colors.secondary[700],
    },
    background: {
      default: Colors.neutral[50],
      paper: Colors.white,
    },
    text: {
      primary: Colors.neutral[900],
      secondary: Colors.neutral[600],
    },
    success: {
      main: Colors.success[500],
      light: Colors.success[300],
      dark: Colors.success[700],
    },
    error: {
      main: Colors.error[500],
      light: Colors.error[300],
      dark: Colors.error[700],
    },
    warning: {
      main: Colors.warning[500],
      light: Colors.warning[300],
      dark: Colors.warning[700],
    },
    info: {
      main: Colors.info[500],
      light: Colors.info[300],
      dark: Colors.info[700],
    },
  },
  typography: {
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
    h1: {
      fontWeight: 700,
      fontSize: '2.5rem',
    },
    h2: {
      fontWeight: 700,
      fontSize: '2rem',
    },
    h3: {
      fontWeight: 600,
      fontSize: '1.75rem',
    },
    h4: {
      fontWeight: 600,
      fontSize: '1.5rem',
    },
    h5: {
      fontWeight: 600,
      fontSize: '1.25rem',
    },
    h6: {
      fontWeight: 600,
      fontSize: '1rem',
    },
    button: {
      textTransform: 'none',
      fontWeight: 600,
    },
  },
  shape: {
    borderRadius: 12,
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: 12,
          padding: '10px 24px',
          fontWeight: 600,
          boxShadow: 'none',
          '&:hover': {
            boxShadow: '0 4px 12px rgba(0, 105, 255, 0.15)',
          },
          '@media (max-width: 768px)': {
            padding: '8px 16px',
            fontSize: '0.875rem',
          },
        },
        contained: {
          '&:hover': {
            boxShadow: '0 4px 12px rgba(0, 105, 255, 0.25)',
          },
        },
      },
    },
    // No rounded corners anywhere in admin — tables, list wrappers, drawer.
    // The user-facing app still uses its own theme with rounded cards.
    MuiCard: {
      styleOverrides: {
        root: {
          borderRadius: 0,
          boxShadow: 'none',
          border: `1px solid ${Colors.neutral[200]}`,
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          borderRadius: 0,
          boxShadow: 'none',
          '& .RaSimpleForm-form': {
            '@media (max-width: 768px)': {
              padding: '16px',
              '& > *': {
                marginBottom: '16px',
                '&:last-child': {
                  marginBottom: 0,
                },
              },
            },
          },
        },
        elevation1: {
          boxShadow: 'none',
        },
      },
    },
    // MUI AppBar is no longer used — our custom Layout renders a plain Box as
    // the topbar. The override is harmless but unnecessary; left intentionally
    // minimal so any stray MUI AppBar use elsewhere still picks up the brand.
    MuiAppBar: {
      styleOverrides: {
        root: {
          backgroundColor: Colors.white,
          color: Colors.neutral[900],
          boxShadow: 'none',
        },
      },
    },
    MuiDrawer: {
      styleOverrides: {
        paper: {
          borderRight: `1px solid ${Colors.neutral[200]}`,
          backgroundColor: Colors.white,
        },
      },
    },
    // ListItemButton lives in the sidebar — the navigation rows compose their
    // own active/hover treatment via sx, so we keep the global override empty
    // here instead of forcing margin/borderRadius that fights it.
    MuiListItemButton: {
      styleOverrides: {
        root: {},
      },
    },
    MuiTextField: {
      styleOverrides: {
        root: {
          '& .MuiOutlinedInput-root': {
            borderRadius: 12,
            '&:hover fieldset': {
              borderColor: Colors.primary[300],
            },
            '&.Mui-focused fieldset': {
              borderColor: Colors.primary[500],
            },
          },
          '@media (max-width: 768px)': {
            width: '100%',
            marginBottom: '16px',
            '& .MuiInputBase-root': {
              fontSize: '16px', // Prevents zoom on iOS
            },
            '& .MuiInputLabel-root': {
              fontSize: '16px', // Prevents zoom on iOS
            },
          },
        },
      },
    },
    // Styles for react-admin SimpleForm
    MuiFormControl: {
      styleOverrides: {
        root: {
          '@media (max-width: 768px)': {
            width: '100%',
            marginBottom: '16px',
            '& .MuiInputBase-root': {
              fontSize: '16px', // Prevents zoom on iOS
            },
            '& .MuiInputLabel-root': {
              fontSize: '16px', // Prevents zoom on iOS
            },
          },
        },
      },
    },
    MuiFormControlLabel: {
      styleOverrides: {
        root: {
          '@media (max-width: 768px)': {
            marginBottom: '12px',
            '& .MuiTypography-root': {
              fontSize: '16px', // Prevents zoom on iOS
            },
          },
        },
      },
    },
    MuiInputBase: {
      styleOverrides: {
        root: {
          '@media (max-width: 768px)': {
            fontSize: '16px', // Prevents zoom on iOS
          },
        },
      },
    },
    MuiSelect: {
      styleOverrides: {
        root: {
          '@media (max-width: 768px)': {
            fontSize: '16px', // Prevents zoom on iOS
            minHeight: '48px', // Better touch target
          },
        },
      },
    },
    MuiCheckbox: {
      styleOverrides: {
        root: {
          '@media (max-width: 768px)': {
            padding: '12px', // Larger touch target
          },
        },
      },
    },
    MuiRadio: {
      styleOverrides: {
        root: {
          '@media (max-width: 768px)': {
            padding: '12px', // Larger touch target
          },
        },
      },
    },
    MuiDialog: {
      styleOverrides: {
        paper: {
          '@media (max-width: 768px)': {
            margin: '16px',
            maxWidth: 'calc(100% - 32px)',
          },
        },
      },
    },
    MuiTableContainer: {
      styleOverrides: {
        root: {
          // Mobile renders the ResponsiveList card layout instead of a table,
          // so the only mobile concern here is preventing accidental horizontal
          // overflow on the few remaining tables (Edit pages, etc.).
          '@media (max-width: 768px)': {
            overflowX: 'auto',
            WebkitOverflowScrolling: 'touch',
          },
        },
      },
    },
    MuiList: {
      styleOverrides: {
        root: {
          '@media (max-width: 768px)': {
            padding: '0',
            '& .RaList-actions': {
              flexDirection: 'column',
              gap: '12px',
              padding: '16px',
              '& > *': {
                width: '100%',
                minHeight: '44px', // Better touch targets
              },
            },
            '& .RaList-main': {
              padding: '0',
            },
          },
        },
      },
    },
    MuiTableCell: {
      styleOverrides: {
        // Desktop table cells get a calmer header treatment; mobile no longer
        // needs the column-hide hacks because ResponsiveList swaps the table
        // for a card layout below 768px.
        head: {
          fontWeight: 700,
          fontSize: '0.75rem',
          textTransform: 'uppercase',
          letterSpacing: '0.5px',
          color: Colors.neutral[600],
          backgroundColor: Colors.neutral[50],
          borderBottom: `1px solid ${Colors.neutral[200]}`,
        },
      },
    },
    MuiToolbar: {
      styleOverrides: {
        root: {
          '@media (max-width: 768px)': {
            padding: '12px 16px !important',
            flexDirection: 'column',
            gap: '12px',
            '& > *': {
              width: '100%',
            },
          },
        },
      },
    },
    // Add styles for RaLayout content area
    MuiContainer: {
      styleOverrides: {
        root: {
          '@media (max-width: 768px)': {
            paddingLeft: '16px',
            paddingRight: '16px',
          },
        },
      },
    },
  },
  breakpoints: {
    values: {
      xs: 0,
      sm: 600,
      md: 768,
      lg: 1024,
      xl: 1280,
    },
  },
});
