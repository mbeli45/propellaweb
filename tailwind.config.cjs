module.exports = {
  content: ['./src/admin/**/*.{ts,tsx}'],
  corePlugins: { preflight: false },
  theme: { extend: {
    colors: { border:'#e2e8f0', input:'#cbd5e1', ring:'#0069ff', background:'#ffffff', foreground:'#142b49', primary:{DEFAULT:'#0069ff',foreground:'#ffffff'}, secondary:{DEFAULT:'#f1f5f9',foreground:'#334155'}, muted:{DEFAULT:'#f8fafc',foreground:'#64748b'}, accent:{DEFAULT:'#eff6ff',foreground:'#004aad'}, destructive:{DEFAULT:'#dc2626',foreground:'#ffffff'}, popover:{DEFAULT:'#ffffff',foreground:'#142b49'}, card:{DEFAULT:'#ffffff',foreground:'#142b49'} },
    borderRadius:{lg:'0.625rem',md:'0.5rem',sm:'0.375rem'}
  } },
  plugins: [require('tailwindcss-animate')]
};
