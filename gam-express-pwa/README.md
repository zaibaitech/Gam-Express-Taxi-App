# 🚕 Gam Express Taxi - PWA Prototype

A modern, mobile-first Progressive Web App (PWA) for a small taxi business in The Gambia.

## 🎯 Project Overview

This is a clean, simple booking system designed for a small taxi owner with 4 taxis. The app provides customers with an easy way to request taxis while giving the owner better visibility and control over bookings and payments.

## ✨ Features

### Customer Features
- **Simple Booking Flow**: Easy 3-step booking process
- **Mobile Money Payment**: Support for QCell, Africell, and Comium
- **Booking Tracking**: Track your booking status with reference ID
- **Instant Fare Estimates**: See estimated fares before booking
- **Call Support**: Quick access to customer support
- **PWA Support**: Installable on mobile devices

### Design Highlights
- Mobile-first responsive design
- Clean, professional UI with trust-building elements
- Smooth animations and transitions
- Optimized for lower-end Android phones
- Clear payment method selection
- Real-time form validation

## 🛠️ Tech Stack

- **Framework**: Next.js 14+ (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **PWA**: Manifest and metadata configured
- **State Management**: React Hooks
- **Form Handling**: Client-side validation

## 📱 Pages

1. **Landing Page** (`/`)
   - Hero section with CTA
   - Features grid
   - How it works section
   - Booking status tracker
   - Trust-building content

2. **Booking Form** (`/booking`)
   - Trip details input
   - Passenger information
   - Payment method selector
   - Fare estimate card
   - Form validation

3. **Confirmation** (`/confirmation`)
   - Booking summary
   - Status badge
   - Next steps information
   - Support options

## 🚀 Getting Started

### Prerequisites
- Node.js 18+ installed
- npm or yarn package manager

### Installation

1. Clone the repository:
```bash
git clone https://github.com/zaibaitech/Gam-Express-Taxi.git
cd Gam-Express-Taxi
```

2. Install dependencies:
```bash
npm install
```

3. Run the development server:
```bash
npm run dev
```

4. Open [http://localhost:3000](http://localhost:3000) in your browser

### Build for Production

```bash
npm run build
npm start
```

## 📂 Project Structure

```
Gam-Express-Taxi/
├── app/                      # Next.js App Router pages
│   ├── booking/             # Booking form page
│   ├── confirmation/        # Confirmation page
│   ├── layout.tsx           # Root layout
│   ├── page.tsx             # Landing page
│   └── globals.css          # Global styles
├── components/              # Reusable components
│   ├── booking/            # Booking-specific components
│   ├── home/               # Home page components
│   ├── layout/             # Layout components
│   └── ui/                 # UI components
├── lib/                     # Utility functions
│   └── utils.ts            # Helper functions
├── types/                   # TypeScript type definitions
│   └── index.ts            # Shared types
├── public/                  # Static assets
│   ├── manifest.json       # PWA manifest
│   └── icons/              # App icons
└── README.md               # This file
```

## 🎨 Design Philosophy

- **Simple & Clean**: Minimal clutter, maximum clarity
- **Trust-Building**: Professional colors and clear communication
- **Mobile-First**: Optimized for mobile devices
- **Fast & Lightweight**: Quick loading on slower connections
- **User-Friendly**: Plain English, clear guidance

## 💡 Future Enhancements

This prototype focuses on the customer booking experience. Planned additions:

- **Driver App**: Driver assignment and route tracking
- **Admin Dashboard**: Booking management and analytics
- **Backend Integration**: Real-time booking processing
- **SMS Notifications**: Booking confirmations via SMS
- **Payment Gateway**: Mobile money API integration
- **Real-time Tracking**: Live driver location
- **Multi-language**: Support for local languages

## 🔧 Configuration

### PWA Icons
Icon placeholders are provided as SVG files. For production:
- Generate PNG files (192x192 and 512x512)
- Update `public/manifest.json` icon references
- Add `apple-touch-icon.png` for iOS support

### Environment Variables
Create a `.env.local` file for API keys and configuration:
```env
# Example configuration
NEXT_PUBLIC_SUPPORT_PHONE=+2203456789
NEXT_PUBLIC_WHATSAPP_NUMBER=2203456789
```

## 📝 Mock Data

The app currently uses mock data for:
- Booking reference generation
- Fare calculations
- Booking status tracking
- Driver assignment

Replace these with actual API calls when backend is ready.

## 🤝 Contributing

This is a prototype project. For production deployment:

1. Set up a proper backend (Node.js, Firebase, etc.)
2. Integrate mobile money payment APIs
3. Add proper database for bookings
4. Implement real-time driver tracking
5. Add authentication and security
6. Generate proper app icons

## 📄 License

ISC

## 👥 Contact

For questions or demo requests:
- Email: info@gamexpresstaxi.gm
- Phone: +220 345 6789

---

**Built with ❤️ for small taxi businesses in The Gambia**