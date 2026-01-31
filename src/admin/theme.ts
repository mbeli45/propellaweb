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
    MuiCard: {
      styleOverrides: {
        root: {
          borderRadius: 16,
          boxShadow: '0 2px 8px rgba(0, 0, 0, 0.08)',
          border: `1px solid ${Colors.neutral[200]}`,
          '@media (max-width: 768px)': {
            margin: '8px',
            borderRadius: 12,
          },
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          borderRadius: 16,
          boxShadow: '0 2px 8px rgba(0, 0, 0, 0.08)',
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
          boxShadow: '0 2px 8px rgba(0, 0, 0, 0.08)',
        },
      },
    },
    MuiAppBar: {
      styleOverrides: {
        root: {
          boxShadow: '0 2px 8px rgba(0, 0, 0, 0.08)',
          backgroundColor: `${Colors.white} !important`,
          color: Colors.neutral[900],
          borderBottom: `1px solid ${Colors.neutral[200]}`,
          '@media (max-width: 768px)': {
            boxShadow: '0 1px 4px rgba(0, 0, 0, 0.08)',
            '& .RaAppBar-title': {
              fontSize: '0.875rem',
              fontWeight: 600,
            },
            '& .RaAppBar-toolbar': {
              minHeight: '52px !important',
            },
          },
        },
      },
    },
    MuiDrawer: {
      styleOverrides: {
        paper: {
          borderRight: `1px solid ${Colors.neutral[200]}`,
          backgroundColor: Colors.white,
          top: '64px !important', // Start below header
          height: 'calc(100vh - 64px) !important', // Extend to bottom
          '@media (max-width: 768px)': {
            top: '56px !important',
            height: 'calc(100vh - 56px) !important',
          },
        },
      },
    },
    MuiListItemButton: {
      styleOverrides: {
        root: {
          borderRadius: 12,
          margin: '4px 8px',
          '&:hover': {
            backgroundColor: Colors.primary[50],
          },
          '&.Mui-selected': {
            backgroundColor: Colors.primary[100],
            color: Colors.primary[700],
            '&:hover': {
              backgroundColor: Colors.primary[200],
            },
          },
        },
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
          '@media (max-width: 768px)': {
            overflowX: 'visible',
            overflowY: 'visible',
            width: '100%',
            position: 'relative',
            margin: '0',
            padding: '0',
            '& .RaDatagrid-root': {
              minWidth: 'auto',
              margin: 0,
              width: '100%',
            },
            '& .RaDatagrid-table': {
              fontSize: '0.75rem',
              minWidth: 'auto',
              width: '100%',
            },
            '& table': {
              minWidth: 'auto',
              width: '100%',
            },
            '& thead': {
              position: 'sticky',
              top: 0,
              zIndex: 10,
              backgroundColor: Colors.neutral[50],
            },
            // Hide columns 4, 5, 6, 7, etc. but keep last 3 (action columns)
            '& th:nth-child(n+5):not(:nth-last-child(-n+3))': {
              display: 'none',
            },
            '& td:nth-child(n+5):not(:nth-last-child(-n+3))': {
              display: 'none',
            },
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
        root: {
          '@media (max-width: 768px)': {
            padding: '10px 8px',
            fontSize: '0.75rem',
            lineHeight: 1.4,
            maxWidth: '120px',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
            '&:first-of-type': {
              paddingLeft: '12px',
              maxWidth: '140px',
            },
            '&:nth-last-of-type(-n+3)': {
              maxWidth: '50px',
              padding: '8px 4px',
              textAlign: 'center',
            },
          },
        },
        head: {
          '@media (max-width: 768px)': {
            padding: '12px 8px',
            fontSize: '0.6875rem',
            fontWeight: 700,
            textTransform: 'uppercase',
            letterSpacing: '0.5px',
            color: Colors.neutral[600],
            backgroundColor: Colors.neutral[50],
            borderBottom: `2px solid ${Colors.neutral[200]}`,
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
            maxWidth: '120px',
            '&:first-of-type': {
              paddingLeft: '12px',
              maxWidth: '140px',
            },
            '&:nth-last-of-type(-n+3)': {
              maxWidth: '50px',
              padding: '8px 4px',
              textAlign: 'center',
            },
          },
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
