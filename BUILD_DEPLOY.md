# 🏗️ Build & Deployment Guide

Complete guide for building and deploying CollabCanvas to production.

---

## Build Process

### Production Build

```bash
# Build for production
npm run build

# Output directory: dist/
# - index.html (entry point)
# - assets/*.js (JavaScript bundles)
# - assets/*.css (stylesheets)
```

### Build Configuration

**Vite Configuration** (`vite.config.ts`):
```typescript
export default defineConfig({
  plugins: [react()],
  build: {
    outDir: 'dist',
    sourcemap: false,  // Disable for production
    minify: 'terser',
    rollupOptions: {
      output: {
        manualChunks: {
          'react-vendor': ['react', 'react-dom'],
          'firebase-vendor': ['firebase/app', 'firebase/firestore'],
          'konva-vendor': ['konva', 'react-konva']
        }
      }
    }
  }
});
```

### Build Optimization

**Code Splitting**:
- React vendor bundle (~11KB gzipped)
- Firebase vendor bundle (~144KB gzipped)
- Konva vendor bundle (~93KB gzipped)
- Main app bundle (~123KB gzipped)

**Bundle Analysis**:
```bash
# Analyze bundle size
npm run build
du -h dist/assets/*

# Expected output:
# ~620KB total
# ~145KB gzipped
```

---

## Deployment Platforms

### Option 1: Vercel (Recommended)

**Why Vercel?**
- ✅ Zero-config deployment
- ✅ Automatic HTTPS
- ✅ Global CDN
- ✅ Serverless functions for AI
- ✅ Preview deployments for PRs

#### Initial Setup

```bash
# Install Vercel CLI
npm i -g vercel

# Login to Vercel
vercel login

# Link project (first time only)
vercel link
```

#### Deploy to Production

```bash
# Build locally
npm run build

# Deploy to production
vercel --prod

# Or deploy without building (Vercel builds)
vercel --prod --yes
```

#### Update Alias

```bash
# Set custom domain alias
vercel alias set [deployment-url] collab-canvas-miriam.vercel.app

# Example:
vercel alias set collab-canvas-abc123-miriams-projects.vercel.app collab-canvas-miriam.vercel.app
```

#### Environment Variables

Set in Vercel Dashboard or CLI:

```bash
# Set environment variable
vercel env add OPENAI_API_KEY production
# Paste your API key when prompted

# View all environment variables
vercel env ls
```

#### Vercel Configuration

**`vercel.json`**:
```json
{
  "buildCommand": "npm run build",
  "outputDirectory": "dist",
  "framework": "vite",
  "rewrites": [
    {
      "source": "/(.*)",
      "destination": "/index.html"
    }
  ],
  "functions": {
    "api/ai/command.ts": {
      "memory": 1024,
      "maxDuration": 10
    }
  }
}
```

---

### Option 2: Firebase Hosting

**Why Firebase?**
- ✅ Integrated with Firebase services
- ✅ Free SSL
- ✅ Custom domain support
- ✅ Built-in caching

#### Setup

```bash
# Install Firebase CLI
npm install -g firebase-tools

# Login
firebase login

# Initialize hosting (first time only)
firebase init hosting
# Select 'dist' as public directory
# Configure as single-page app: Yes
# Set up automatic builds: No
```

#### Deploy

```bash
# Build project
npm run build

# Deploy to Firebase
firebase deploy --only hosting

# Deploy with preview channel
firebase hosting:channel:deploy preview

# Output: https://collab-canvas-2e4c5.web.app
```

#### Firebase Configuration

**`firebase.json`**:
```json
{
  "hosting": {
    "public": "dist",
    "ignore": [
      "firebase.json",
      "**/.*",
      "**/node_modules/**"
    ],
    "rewrites": [
      {
        "source": "**",
        "destination": "/index.html"
      }
    ],
    "headers": [
      {
        "source": "**/*.@(js|css)",
        "headers": [
          {
            "key": "Cache-Control",
            "value": "max-age=31536000"
          }
        ]
      }
    ]
  }
}
```

---

## Pre-Deployment Checklist

### Code Quality

```bash
# 1. Run TypeScript checks
npx tsc --noEmit

# 2. Run linter
npm run lint

# 3. Run all tests
npm run test:run

# 4. Check for console.logs (should remove for production)
grep -r "console.log" src/

# 5. Check bundle size
npm run build
ls -lh dist/assets/
```

### Security

```bash
# 1. Update dependencies
npm audit
npm audit fix

# 2. Check for exposed secrets
git log -p | grep -i "api.*key\|secret\|password"

# 3. Review .env files
cat .env*  # Ensure no sensitive data committed
```

### Firebase

```bash
# 1. Deploy security rules
firebase deploy --only firestore:rules

# 2. Deploy indexes
firebase deploy --only firestore:indexes

# 3. Deploy RTDB rules
firebase deploy --only database

# 4. Test rules in emulator
firebase emulators:start --only firestore,database
```

---

## Deployment Strategies

### 1. Blue-Green Deployment

```bash
# Deploy to preview
vercel --prod --yes  # Creates new deployment

# Test preview URL
curl https://collab-canvas-[hash].vercel.app

# Switch traffic (update alias)
vercel alias set collab-canvas-[hash].vercel.app collab-canvas-miriam.vercel.app

# Rollback if needed
vercel alias set collab-canvas-[previous-hash].vercel.app collab-canvas-miriam.vercel.app
```

### 2. Canary Deployment

```bash
# Deploy preview
vercel --prod

# Route 10% traffic to new version (in Vercel dashboard)
# Monitor metrics
# Gradually increase to 100%
```

### 3. Rolling Deployment

Firebase hosting automatically does rolling deployments with zero downtime.

---

## Post-Deployment Verification

### Automated Checks

```bash
# 1. Check HTTP status
curl -I https://collab-canvas-miriam.vercel.app
# Should return: HTTP/2 200

# 2. Check bundle loads
curl https://collab-canvas-miriam.vercel.app | grep "<script"

# 3. Test API endpoint
curl -X POST https://collab-canvas-miriam.vercel.app/api/ai/command \
  -H "Content-Type: application/json" \
  -d '{"command": "create a circle"}'
```

### Manual Testing

Open browser to production URL and test:

- [ ] ✅ App loads and renders
- [ ] ✅ User can register/login
- [ ] ✅ Create all shape types
- [ ] ✅ Multi-select works
- [ ] ✅ Undo/redo functions
- [ ] ✅ AI commands execute
- [ ] ✅ Comments can be added
- [ ] ✅ Real-time sync works (test with 2 browsers)
- [ ] ✅ Keyboard shortcuts work
- [ ] ✅ Grid snapping works
- [ ] ✅ No console errors

### Performance Checks

```bash
# Lighthouse audit
npx lighthouse https://collab-canvas-miriam.vercel.app --view

# Target scores:
# - Performance: 90+
# - Accessibility: 95+
# - Best Practices: 95+
# - SEO: 100
```

---

## Monitoring & Logging

### Vercel Analytics

View in Vercel Dashboard:
- Page views
- Response times
- Error rates
- Geographic distribution

### Firebase Console

Monitor in Firebase:
- Firestore reads/writes
- RTDB connections
- Auth sign-ins
- Hosting bandwidth

### Custom Logging

Add custom logging in production:

```typescript
// src/utils/logger.ts
export const logEvent = (event: string, data?: any) => {
  if (import.meta.env.PROD) {
    // Send to analytics service
    console.log(`[${new Date().toISOString()}] ${event}`, data);
  }
};
```

---

## Rollback Procedures

### Vercel Rollback

```bash
# List recent deployments
vercel ls

# Get previous deployment URL
# Update alias to previous deployment
vercel alias set collab-canvas-[previous-hash].vercel.app collab-canvas-miriam.vercel.app

# Verify rollback
curl https://collab-canvas-miriam.vercel.app
```

### Firebase Rollback

```bash
# List deployment history
firebase hosting:versions:list

# Rollback to specific version
firebase hosting:rollback

# Or deploy previous commit
git checkout [previous-commit]
npm run build
firebase deploy --only hosting
```

### Database Rollback

**⚠️ IMPORTANT**: There is NO automatic database rollback!

**Backup Strategy**:
```bash
# Export Firestore data
firebase firestore:export gs://collab-canvas-2e4c5.appspot.com/backups/$(date +%Y%m%d)

# Export RTDB data
firebase database:get / --output backup-$(date +%Y%m%d).json
```

**Restore Process**:
```bash
# Import Firestore backup
firebase firestore:import gs://collab-canvas-2e4c5.appspot.com/backups/20251018

# Import RTDB backup
firebase database:set / backup-20251018.json
```

---

## CI/CD Setup (Optional)

### GitHub Actions

Create `.github/workflows/deploy.yml`:

```yaml
name: Deploy to Vercel

on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'
          
      - name: Install dependencies
        run: npm ci
        
      - name: Run tests
        run: npm run test:run
        
      - name: Build
        run: npm run build
        
      - name: Deploy to Vercel
        uses: amondnet/vercel-action@v25
        with:
          vercel-token: ${{ secrets.VERCEL_TOKEN }}
          vercel-org-id: ${{ secrets.VERCEL_ORG_ID }}
          vercel-project-id: ${{ secrets.VERCEL_PROJECT_ID }}
          vercel-args: '--prod'
```

---

## Environment-Specific Builds

### Development

```bash
npm run dev
# Runs on localhost:5173
# Uses .env.local
```

### Staging (Preview)

```bash
vercel
# Creates preview deployment
# URL: collab-canvas-[branch]-[hash].vercel.app
```

### Production

```bash
vercel --prod
# Deploys to production
# URL: collab-canvas-[hash].vercel.app
# Alias: collab-canvas-miriam.vercel.app
```

---

## Troubleshooting Deployments

### Build Fails

```bash
# Check TypeScript errors
npx tsc --noEmit

# Check for missing dependencies
npm install

# Clear cache and rebuild
rm -rf node_modules dist .vite
npm install
npm run build
```

### Deployment Fails

```bash
# Check Vercel logs
vercel logs [deployment-url]

# Check Firebase logs
firebase functions:log
```

### 404 Errors

Ensure SPA routing is configured:
- **Vercel**: `vercel.json` has rewrite rule
- **Firebase**: `firebase.json` has rewrite rule

### CORS Errors

Check Firebase configuration in production:
- Auth domain whitelisted
- API keys valid
- Security rules deployed

---

## Performance Optimization

### Caching Strategy

```javascript
// Service Worker (future enhancement)
workbox.routing.registerRoute(
  /\.(?:js|css|png|jpg|svg)$/,
  new workbox.strategies.CacheFirst({
    cacheName: 'assets-cache',
    plugins: [
      new workbox.expiration.ExpirationPlugin({
        maxEntries: 60,
        maxAgeSeconds: 30 * 24 * 60 * 60, // 30 days
      }),
    ],
  })
);
```

### CDN Configuration

**Vercel**: Automatic global CDN  
**Firebase**: Automatically uses Google's CDN

### Image Optimization

```bash
# Optimize images before deployment
npm install -g imageoptim-cli
imageoptim public/images/**/*
```

---

## Cost Monitoring

### Vercel Costs

**Free Tier Includes**:
- 100GB bandwidth/month
- Unlimited deployments
- 100 serverless function executions/day

**Monitor usage**: https://vercel.com/account/usage

### Firebase Costs

**Free Tier (Spark Plan)**:
- 10GB Firestore storage
- 50K reads/day
- 20K writes/day
- 1GB RTDB storage
- 10GB hosting bandwidth/month

**Monitor usage**: Firebase Console → Usage tab

**Upgrade to Blaze (Pay-as-you-go)** if needed

---

## Security Best Practices

### Pre-Deploy Security

```bash
# 1. Audit dependencies
npm audit fix

# 2. Remove debug code
grep -r "console.log\|debugger" src/

# 3. Check for exposed secrets
git log -p | grep -i "key\|secret\|password"

# 4. Enable security headers
# (Configured in vercel.json / firebase.json)
```

### Post-Deploy Security

- Enable Vercel's DDoS protection
- Set up Firebase App Check
- Monitor authentication logs
- Review security rules regularly

---

## Quick Reference

### Common Commands

```bash
# Development
npm run dev                 # Start dev server
node dev-server.js          # Start AI dev server

# Build
npm run build               # Production build
npm run preview             # Preview production build

# Test
npm test                    # Run tests
npm run test:run            # Run tests once

# Deploy
vercel --prod               # Deploy to Vercel
firebase deploy --only hosting  # Deploy to Firebase

# Manage
vercel ls                   # List deployments
firebase hosting:sites:list # List Firebase sites
```

### Important URLs

- **Production**: https://collab-canvas-miriam.vercel.app
- **Firebase Console**: https://console.firebase.google.com/project/collab-canvas-2e4c5
- **Vercel Dashboard**: https://vercel.com/miriamsimone/collab-canvas
- **GitHub Repo**: https://github.com/miriamsimone/collab-canvas

---

**Last Updated**: October 2025  
**Version**: 1.0

