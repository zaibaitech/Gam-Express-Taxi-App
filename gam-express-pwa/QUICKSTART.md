# ⚡ Quick Start Guide

## First Time Setup

### 1. Check Prerequisites
```bash
node --version  # Should be 18.x or higher
npm --version   # Should be 9.x or higher
```

### 2. Install Dependencies
```bash
npm install
```

### 3. Start Development Server
```bash
npm run dev
```

### 4. Open in Browser
Open [http://localhost:3000](http://localhost:3000)

## Available Scripts

```bash
npm run dev      # Start development server
npm run build    # Build for production
npm start        # Start production server
npm run lint     # Run ESLint
```

## Testing the App

### 1. Landing Page (/)
- View hero section and features
- Click "Book a Taxi" button
- Try the booking tracker with any reference starting with "GMX-"

### 2. Booking Form (/booking)
- Enter pickup location (e.g., "Serrekunda Market")
- Enter dropoff location (e.g., "Banjul Airport")
- See fare estimate update automatically
- Fill in your name and phone number
- Try both payment methods
- Submit the form

### 3. Confirmation Page (/confirmation)
- View booking summary
- Check booking reference
- Test support buttons

### 4. Test PWA Features
1. Open Chrome DevTools (F12)
2. Go to Application tab
3. Check "Manifest" to see PWA config
4. Test "Add to Home Screen"

## Common Issues

### Port Already in Use
```bash
# Kill process on port 3000
npx kill-port 3000

# Or use different port
npm run dev -- -p 3001
```

### Build Errors
```bash
# Clear Next.js cache
rm -rf .next

# Reinstall dependencies
rm -rf node_modules
npm install
```

### TypeScript Errors
```bash
# Regenerate types
rm tsconfig.tsbuildinfo
npm run dev
```

## Project Structure Tour

```
app/
├── page.tsx              # Landing page
├── booking/page.tsx      # Booking form
├── confirmation/page.tsx # Confirmation
├── layout.tsx           # Root layout
└── globals.css          # Global styles

components/
├── booking/             # Booking components
├── home/               # Home components
├── layout/             # Header/Footer
└── ui/                 # Reusable UI

lib/
└── utils.ts            # Helper functions

types/
└── index.ts            # TypeScript types
```

## Making Changes

### Update Colors
Edit `tailwind.config.ts`:
```typescript
colors: {
  primary: { ... },
  accent: { ... },
}
```

### Update Content
- Landing page: `app/page.tsx`
- Booking form: `app/booking/page.tsx`
- Header: `components/layout/AppHeader.tsx`
- Footer: `components/layout/AppFooter.tsx`

### Update Contact Info
Search for `+2203456789` and replace with actual number

## Development Tips

1. **Hot Reload**: Changes auto-refresh in browser
2. **Error Overlay**: Build errors show in browser
3. **Console**: Check browser console for warnings
4. **Mobile Testing**: Use Chrome DevTools device mode

## Build for Production

```bash
# Create optimized build
npm run build

# Test production build locally
npm start
```

## Next Steps

1. ✅ App is running
2. ✅ Test all pages
3. ✅ Review components
4. 📝 Update placeholder content
5. 🎨 Customize branding
6. 🔧 Set up backend API
7. 💳 Integrate payment gateway
8. 🚀 Deploy to Vercel/Netlify

## Need Help?

- Check `README.md` for full documentation
- Check `PROJECT_SUMMARY.md` for feature list
- Check `DEPLOYMENT.md` for deployment guide

## Demo Data

Booking Tracker Test References:
- `GMX-ABC123` (works - shows mock driver assignment)
- `GMX-XYZ789` (works - shows mock driver assignment)
- Any other reference (shows "not found" message)

---

**Ready to go!** 🚀 Start with `npm run dev`
