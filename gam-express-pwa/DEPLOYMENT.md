# 🚀 Deployment Guide

## Quick Deploy Options

### 1. Vercel (Recommended)

The easiest way to deploy this Next.js app:

```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel
```

Or use the Vercel Dashboard:
1. Go to [vercel.com](https://vercel.com)
2. Import your GitHub repository
3. Configure project (auto-detected)
4. Deploy

### 2. Netlify

```bash
# Install Netlify CLI
npm i -g netlify-cli

# Build
npm run build

# Deploy
netlify deploy --prod
```

### 3. Docker

```bash
# Build image
docker build -t gam-express-taxi .

# Run container
docker run -p 3000:3000 gam-express-taxi
```

Create a `Dockerfile`:
```dockerfile
FROM node:18-alpine AS base

# Install dependencies only when needed
FROM base AS deps
RUN apk add --no-cache libc6-compat
WORKDIR /app

COPY package*.json ./
RUN npm ci

# Rebuild the source code only when needed
FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

RUN npm run build

# Production image
FROM base AS runner
WORKDIR /app

ENV NODE_ENV production

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

USER nextjs

EXPOSE 3000

ENV PORT 3000

CMD ["node", "server.js"]
```

### 4. Traditional Hosting

For traditional hosting (cPanel, etc.):

```bash
# Build static export (if supported)
npm run build

# Upload the .next folder and node_modules
# Set up Node.js environment
# Run: npm start
```

## Environment Configuration

Create `.env.production`:

```env
# Public variables
NEXT_PUBLIC_SUPPORT_PHONE=+2203456789
NEXT_PUBLIC_WHATSAPP_NUMBER=2203456789
NEXT_PUBLIC_APP_URL=https://your-domain.com

# Backend API (when ready)
NEXT_PUBLIC_API_URL=https://api.your-domain.com

# Analytics (optional)
NEXT_PUBLIC_GA_ID=G-XXXXXXXXXX
```

## Pre-Deployment Checklist

- [ ] Update contact information in components
- [ ] Replace placeholder icons with actual PNG files
- [ ] Set up custom domain
- [ ] Configure SSL certificate
- [ ] Test on multiple devices
- [ ] Set up error monitoring (e.g., Sentry)
- [ ] Configure analytics (e.g., Google Analytics)
- [ ] Test PWA installation
- [ ] Optimize images
- [ ] Run lighthouse audit
- [ ] Set up backend API
- [ ] Configure mobile money payment gateway
- [ ] Test payment flows
- [ ] Set up database
- [ ] Configure email/SMS notifications

## Performance Optimization

```bash
# Analyze bundle size
npm run build
# Check the output for bundle sizes

# Run lighthouse audit
npx lighthouse https://your-domain.com --view
```

## PWA Testing

Test PWA features:
1. Open Chrome DevTools
2. Go to Application tab
3. Check Service Worker
4. Test offline functionality
5. Test "Add to Home Screen"

## Monitoring

Recommended monitoring tools:
- Vercel Analytics (if using Vercel)
- Google Analytics
- Sentry for error tracking
- LogRocket for session replay
- Hotjar for user behavior

## Custom Domain Setup

### Vercel
1. Go to project settings
2. Add custom domain
3. Configure DNS:
   - Type: A
   - Name: @
   - Value: 76.76.21.21
   
   - Type: CNAME
   - Name: www
   - Value: cname.vercel-dns.com

### Netlify
1. Go to domain settings
2. Add custom domain
3. Follow DNS instructions

## SSL Certificate

Both Vercel and Netlify provide automatic SSL certificates.

For custom hosting, use:
- Let's Encrypt (free)
- Cloudflare SSL

## Post-Deployment

1. Test all pages and functionality
2. Test on multiple devices (iOS, Android)
3. Verify PWA installation
4. Check loading performance
5. Monitor error logs
6. Set up automated backups
7. Configure CDN if needed
8. Set up staging environment

## Scaling Considerations

When ready to scale:
- Set up load balancing
- Configure caching (Redis)
- Implement rate limiting
- Set up database replication
- Use CDN for static assets
- Implement API rate limiting
- Set up monitoring and alerts

## Support

For deployment issues:
- Next.js Docs: https://nextjs.org/docs/deployment
- Vercel Support: https://vercel.com/support
- Community: https://github.com/vercel/next.js/discussions
