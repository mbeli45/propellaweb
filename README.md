# Propella Web

A responsive web version of the Propella real estate platform built with Vite, React, and TypeScript.

## Features

- 🏠 Property listings and search
- 👤 User authentication (Guest, User, Agent roles)
- 💬 Messaging system
- 📅 Reservation management
- 💰 Wallet and payments
- 🗺️ Map integration
- 📱 Fully responsive mobile-first design

## Tech Stack

- **Vite** - Build tool and dev server
- **React 18** - UI framework
- **TypeScript** - Type safety
- **React Router** - Routing
- **Supabase** - Backend (auth, database, storage)
- **i18next** - Internationalization
- **Lucide React** - Icons

## Getting Started

### Prerequisites

- Node.js 18+ and npm

### Installation

1. Install dependencies:
```bash
npm install
```

2. Create a `.env` file in the root directory:
```env
VITE_PUBLIC_SUPABASE_URL=your_supabase_url
VITE_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
VITE_ADMIN_EMAILS=admin1@example.com,admin2@example.com,admin3@example.com
```

**Admin Access:**
- `VITE_ADMIN_EMAILS` (or `VITE_ADMIN_EMAIL` for single admin) - Comma-separated list of emails with admin access regardless of role
- Users with `admin`, `agent`, or `landlord` roles can also access the admin panel
- Login uses your Supabase account credentials (email/password)
- Access the admin panel at `/admin`

3. Start the development server:
```bash
npm run dev
```

The app will be available at `http://localhost:3000`

### Build for Production

```bash
npm run build
```

The production build will be in the `dist` directory.

## Project Structure

```
src/
├── components/     # Reusable components
├── contexts/      # React contexts (Auth, Theme, i18n)
├── constants/     # Constants and colors
├── hooks/         # Custom React hooks
├── layouts/       # Layout components
├── lib/           # Utilities and configs
├── locales/       # Translation files
├── pages/         # Page components
├── routes/        # Route configuration
└── types/         # TypeScript types
```

## Features in Development

- Property listing and detail pages
- Advanced search and filters
- Real-time messaging
- Map integration
- Payment processing
- Profile management

## Mobile Responsiveness

The app is built with a mobile-first approach and is highly responsive across all device sizes. The bottom navigation adapts to different screen sizes for optimal mobile experience.

## License

Private - Propella
