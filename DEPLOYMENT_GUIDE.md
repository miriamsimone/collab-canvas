# 🚀 CollabCanvas Deployment Guide

This guide documents the complete deployment process for the CollabCanvas application to ensure consistent deployments and URL management.

## 📋 Quick Deployment Checklist

✅ **Complete these steps for every deployment:**

1. Clean build directory and build project
2. Deploy to Vercel production
3. **🔥 CRITICAL: Update the alias to point to new deployment**
4. Verify both URLs are working
5. Test application functionality

## 🔧 Full Deployment Process

### Step 1: Pre-deployment Setup

```bash
# Ensure you're in the project directory
cd /path/to/collab-canvas

# Clean any problematic untracked files if needed
# (only if reverting from a different commit)
rm -f src/components/MultiplayerCursors.tsx src/services/realtimeService.ts database.rules.json

# Build the project
npm run build
```

### Step 2: Deploy to Vercel

```bash
# Deploy to production
npx vercel --prod --yes
```

**Note the deployment URL** - it will look like:
`https://collab-canvas-[HASH]-miriam-simones-projects.vercel.app`

### Step 3: 🎯 Update Alias (CRITICAL STEP)

```bash
# Update the alias to point to the new deployment
npx vercel alias set collab-canvas-[NEW-HASH]-miriam-simones-projects.vercel.app collab-canvas-miriam.vercel.app
```

**Replace `[NEW-HASH]` with the actual hash from your deployment URL.**

### Step 4: Verify Deployment

```bash
# Test both URLs
curl -I https://collab-canvas-miriam.vercel.app
curl -I https://collab-canvas-[NEW-HASH]-miriam-simones-projects.vercel.app

# Both should return HTTP 200 and have recent timestamps
```

## 🌐 Current URL Configuration

### Production URLs
- **🎯 Primary (Short)**: https://collab-canvas-miriam.vercel.app
- **🔗 Full URL**: https://collab-canvas-[CURRENT-HASH]-miriam-simones-projects.vercel.app

### 📊 Checking Current Aliases

```bash
# View all current aliases
npx vercel alias ls

# Should show collab-canvas-miriam.vercel.app pointing to latest deployment
```

## ⚠️ Important Notes

### Why Alias Update is Critical

1. **Consistent URLs**: Users bookmark the short URL (`collab-canvas-miriam.vercel.app`)
2. **Documentation**: All docs reference the short URL
3. **Firebase Config**: May have the short URL in CORS settings
4. **User Experience**: Clean, memorable URL vs. random hash

### Common Pitfalls

❌ **DON'T FORGET**: Updating the alias after deployment
❌ **DON'T**: Deploy without testing the build first
❌ **DON'T**: Leave old aliases pointing to outdated versions

✅ **DO**: Always verify both URLs work after deployment
✅ **DO**: Test application functionality on the live site
✅ **DO**: Update any documentation if deployment URLs change

## 🔄 Rollback Process

If you need to rollback to a previous deployment:

```bash
# 1. Find previous deployment hash
npx vercel list

# 2. Update alias to previous deployment
npx vercel alias set collab-canvas-[PREVIOUS-HASH]-miriam-simones-projects.vercel.app collab-canvas-miriam.vercel.app

# 3. Verify rollback
curl -I https://collab-canvas-miriam.vercel.app
```

## 📋 Deployment Log Template

Use this template to track deployments:

```
## Deployment - [DATE]
- **From Commit**: [COMMIT_HASH] - [COMMIT_MESSAGE]
- **Full URL**: https://collab-canvas-[HASH]-miriam-simones-projects.vercel.app
- **Alias Updated**: ✅ collab-canvas-miriam.vercel.app
- **Verification**: ✅ Both URLs responding
- **Functionality Test**: ✅ [Brief test results]
- **Notes**: [Any special considerations]
```

## 🚨 Emergency Procedures

### If Short URL Stops Working

1. Check current aliases: `npx vercel alias ls`
2. Verify target deployment exists: `npx vercel list`
3. Re-create alias if needed: `npx vercel alias set [FULL-URL] collab-canvas-miriam.vercel.app`

### If Deployment Fails

1. Check build logs: `npm run build`
2. Clear cache: `rm -rf dist/ && npm run build`
3. Check for TypeScript errors: `npx tsc --noEmit`
4. Remove problematic untracked files

## 📞 Automation Ideas

Consider creating a deployment script:

```bash
#!/bin/bash
# deploy.sh - Automated deployment with alias update

echo "🚀 Starting deployment..."

# Build
npm run build
if [ $? -ne 0 ]; then
    echo "❌ Build failed"
    exit 1
fi

# Deploy
DEPLOY_URL=$(npx vercel --prod --yes | grep -o 'https://collab-canvas-[^.]*\.vercel\.app')
echo "✅ Deployed to: $DEPLOY_URL"

# Update alias
npx vercel alias set "$DEPLOY_URL" collab-canvas-miriam.vercel.app
echo "✅ Alias updated"

# Verify
curl -I https://collab-canvas-miriam.vercel.app
echo "🎉 Deployment complete!"
```

## 📝 Deployment Log

### Latest Deployment - October 18, 2025
- **URL**: `https://collab-canvas-7kpkf00yt-miriam-simones-projects.vercel.app`
- **Alias**: `https://collab-canvas-miriam.vercel.app` ✅
- **Features**: Secure AI Canvas Agent + Complete RTDB Integration
  - ✅ **NEW: Secure AI Integration** - Server-side OpenAI API (no client-side key exposure)
  - ✅ **NEW: AI Commands** - Natural language rectangle creation ("create a red rectangle")
  - ✅ **NEW: Vercel API Routes** - `/api/ai/command` for secure AI processing
  - ✅ Smooth cursor movement (50ms → 10-20ms latency)
  - ✅ Real-time object dragging and resizing
  - ✅ Grace period snap-back prevention
  - ✅ Dual RTDB/Firestore storage strategy
- **Security**: ✅ API keys protected server-side only
- **Status**: Production Ready with AI 🚀🤖

---

**🔥 REMEMBER**: Always update the alias after deployment - it's not automatic!
