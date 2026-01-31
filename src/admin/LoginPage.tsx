import { useState } from 'react';
import { useLogin, useNotify } from 'react-admin';
import {
  Box,
  Card,
  CardContent,
  TextField,
  Button,
  Typography,
  Container,
  Alert,
  InputAdornment,
  IconButton,
  Fade,
} from '@mui/material';
import { Icon } from '@iconify/react';
import { Colors } from '@/constants/Colors';

const LoginPage = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const login = useLogin();
  const notify = useNotify();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      await login({ username: email, password });
      notify('Login successful', { type: 'success' });
    } catch (err: any) {
      const errorMessage = err?.message || 'Invalid email or password';
      setError(errorMessage);
      notify(errorMessage, { type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box
      sx={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: `linear-gradient(135deg, ${Colors.primary[50]} 0%, ${Colors.secondary[50]} 100%)`,
        padding: { xs: 2, sm: 3 },
        position: 'relative',
        overflow: 'hidden',
        '&::before': {
          content: '""',
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: `radial-gradient(circle at 20% 50%, ${Colors.primary[100]}40 0%, transparent 50%),
                       radial-gradient(circle at 80% 80%, ${Colors.secondary[100]}40 0%, transparent 50%)`,
          pointerEvents: 'none',
        },
      }}
    >
      <Container maxWidth="sm" sx={{ position: 'relative', zIndex: 1 }}>
        <Fade in timeout={600}>
          <Card
            sx={{
              borderRadius: 3,
              boxShadow: '0 20px 60px rgba(0, 0, 0, 0.15), 0 0 0 1px rgba(0, 0, 0, 0.05)',
              overflow: 'hidden',
              backgroundColor: Colors.white,
              border: `1px solid ${Colors.neutral[100]}`,
            }}
          >
            {/* Header */}
            <Box
              sx={{
                background: `linear-gradient(135deg, ${Colors.primary[600]} 0%, ${Colors.primary[700]} 100%)`,
                padding: { xs: 3, sm: 4 },
                textAlign: 'center',
                color: 'white',
                position: 'relative',
                '&::after': {
                  content: '""',
                  position: 'absolute',
                  bottom: 0,
                  left: 0,
                  right: 0,
                  height: '1px',
                  background: `linear-gradient(90deg, transparent, ${Colors.primary[400]}40, transparent)`,
                },
              }}
            >
              <Box
                sx={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  width: 64,
                  height: 64,
                  borderRadius: 2,
                  backgroundColor: 'rgba(255, 255, 255, 0.15)',
                  backdropFilter: 'blur(10px)',
                  mb: 2,
                }}
              >
                <Icon icon="lucide:shield-check" width={32} style={{ color: 'white' }} />
              </Box>
              <Typography 
                variant="h4" 
                component="h1" 
                fontWeight={700} 
                gutterBottom
                sx={{ fontSize: { xs: '1.75rem', sm: '2rem' } }}
              >
                Propella Admin
              </Typography>
              <Typography 
                variant="body2" 
                sx={{ 
                  opacity: 0.95,
                  fontSize: '0.95rem',
                  fontWeight: 400,
                }}
              >
                Sign in to access the admin panel
              </Typography>
            </Box>

            <CardContent sx={{ padding: { xs: 3, sm: 4 } }}>
              {error && (
                <Alert 
                  severity="error" 
                  sx={{ 
                    mb: 3, 
                    borderRadius: 2,
                    backgroundColor: Colors.error[50],
                    border: `1px solid ${Colors.error[200]}`,
                    color: Colors.error[700],
                    '& .MuiAlert-icon': {
                      color: Colors.error[600],
                    },
                  }}
                >
                  {error}
                </Alert>
              )}

              <form onSubmit={handleSubmit}>
                <Box sx={{ mb: 2.5 }}>
                  <TextField
                    fullWidth
                    label="Email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    variant="outlined"
                    autoComplete="email"
                    autoFocus
                    disabled={loading}
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          <Icon 
                            icon="lucide:mail" 
                            width={20} 
                            style={{ color: Colors.neutral[400] }} 
                          />
                        </InputAdornment>
                      ),
                    }}
                    sx={{
                      '& .MuiOutlinedInput-root': {
                        backgroundColor: Colors.neutral[50],
                        borderRadius: 2,
                        '& fieldset': {
                          borderColor: Colors.neutral[200],
                          borderWidth: '1.5px',
                        },
                        '&:hover fieldset': {
                          borderColor: Colors.primary[400],
                        },
                        '&.Mui-focused fieldset': {
                          borderColor: Colors.primary[600],
                          borderWidth: '2px',
                        },
                      },
                      '& .MuiInputLabel-root': {
                        color: Colors.neutral[600],
                        '&.Mui-focused': {
                          color: Colors.primary[600],
                        },
                      },
                    }}
                  />
                </Box>

                <Box sx={{ mb: 3 }}>
                  <TextField
                    fullWidth
                    label="Password"
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    variant="outlined"
                    autoComplete="current-password"
                    disabled={loading}
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          <Icon 
                            icon="lucide:lock" 
                            width={20} 
                            style={{ color: Colors.neutral[400] }} 
                          />
                        </InputAdornment>
                      ),
                      endAdornment: (
                        <InputAdornment position="end">
                          <IconButton
                            onClick={() => setShowPassword(!showPassword)}
                            edge="end"
                            disabled={loading}
                            sx={{ 
                              color: Colors.neutral[400],
                              '&:hover': {
                                color: Colors.primary[600],
                                backgroundColor: Colors.primary[50],
                              },
                            }}
                          >
                            <Icon 
                              icon={showPassword ? "lucide:eye-off" : "lucide:eye"} 
                              width={20} 
                            />
                          </IconButton>
                        </InputAdornment>
                      ),
                    }}
                    sx={{
                      '& .MuiOutlinedInput-root': {
                        backgroundColor: Colors.neutral[50],
                        borderRadius: 2,
                        '& fieldset': {
                          borderColor: Colors.neutral[200],
                          borderWidth: '1.5px',
                        },
                        '&:hover fieldset': {
                          borderColor: Colors.primary[400],
                        },
                        '&.Mui-focused fieldset': {
                          borderColor: Colors.primary[600],
                          borderWidth: '2px',
                        },
                      },
                      '& .MuiInputLabel-root': {
                        color: Colors.neutral[600],
                        '&.Mui-focused': {
                          color: Colors.primary[600],
                        },
                      },
                    }}
                  />
                </Box>

                <Button
                  type="submit"
                  fullWidth
                  variant="contained"
                  size="large"
                  disabled={loading}
                  sx={{
                    py: 1.75,
                    fontSize: '1rem',
                    fontWeight: 600,
                    textTransform: 'none',
                    borderRadius: 2,
                    background: `linear-gradient(135deg, ${Colors.primary[600]} 0%, ${Colors.primary[700]} 100%)`,
                    boxShadow: `0 4px 12px ${Colors.primary[500]}40`,
                    transition: 'all 0.3s ease',
                    '&:hover': {
                      background: `linear-gradient(135deg, ${Colors.primary[700]} 0%, ${Colors.primary[800]} 100%)`,
                      boxShadow: `0 8px 24px ${Colors.primary[600]}50`,
                      transform: 'translateY(-2px)',
                    },
                    '&:active': {
                      transform: 'translateY(0)',
                    },
                    '&:disabled': {
                      background: Colors.neutral[300],
                      color: Colors.neutral[500],
                      boxShadow: 'none',
                      transform: 'none',
                    },
                  }}
                >
                  {loading ? 'Signing in...' : 'Sign In'}
                </Button>
              </form>
            </CardContent>
          </Card>
        </Fade>

        <Box 
          sx={{ 
            textAlign: 'center', 
            mt: 3,
            position: 'relative',
            zIndex: 1,
          }}
        >
          <Typography 
            variant="body2" 
            sx={{
              color: Colors.neutral[500],
              fontSize: '0.875rem',
            }}
          >
            © {new Date().getFullYear()} Propella. All rights reserved.
          </Typography>
        </Box>
      </Container>
    </Box>
  );
};

export default LoginPage;
