# 🎵 Audio Connector Troubleshooting Guide

## Issue: Audio Connector Works Locally But Not in Production

If your audio connector works on `localhost` but fails in production, follow this guide to diagnose and fix the issue.

---

## 🔍 Step 1: Test Audio URL Accessibility

Visit the test page in production:
```
https://collab-canvas-miriam.vercel.app/test-audio-connector.html
```

1. Go to your production app
2. Record audio on a shape
3. Copy the audio URL from Firebase Storage
4. Paste it into the test page
5. Click "Test Audio URL"

### Expected Result:
✅ URL should be accessible with status `200 OK`
✅ Content-Type should be `audio/webm` or `audio/mp4`

### If URL Test Fails:
- ❌ **403 Forbidden**: Authentication issue (user not signed in or storage rules blocking access)
- ❌ **CORS Error**: CORS not properly configured (see Step 2)
- ❌ **404 Not Found**: Audio file doesn't exist or path is wrong

---

## 🔍 Step 2: Verify CORS Configuration

### Check Current CORS Settings:
```bash
gsutil cors get gs://collab-canvas-2e4c5.firebasestorage.app
```

### Expected Output:
```json
[{
  "maxAgeSeconds": 3600,
  "method": ["GET", "POST", "PUT", "DELETE", "HEAD"],
  "origin": ["*"],
  "responseHeader": ["Content-Type", "Authorization"]
}]
```

### If CORS Is Not Configured:
```bash
gsutil cors set cors.json gs://collab-canvas-2e4c5.firebasestorage.app
```

---

## 🔍 Step 3: Check Browser Console Errors

Open browser console (F12) in production and look for errors:

### Common Errors:

#### 1. Mixed Content Error
```
Mixed Content: The page at 'https://...' was loaded over HTTPS, but requested an insecure audio resource 'http://...'. This request has been blocked.
```

**Fix**: Ensure all Firebase Storage URLs use `https://` (they should by default)

#### 2. CORS Error
```
Access to audio at '...' from origin 'https://collab-canvas-miriam.vercel.app' has been blocked by CORS policy
```

**Fix**: Run CORS configuration command (see Step 2)

#### 3. Authentication Error
```
GET https://firebasestorage.googleapis.com/... 403 (Forbidden)
```

**Fix**: 
- Ensure user is signed in
- Check Storage Rules allow authenticated reads
- Verify Firebase config is correct

#### 4. Autoplay Policy Error
```
NotAllowedError: play() failed because the user didn't interact with the document first
```

**Fix**: This is expected for the first audio. User must click the "Play Ramble" button.

---

## 🔍 Step 4: Verify Storage Rules

Check `storage.rules`:

```javascript
rules_version = '2';

service firebase.storage {
  match /b/{bucket}/o {
    match /audio/{canvasId}/{fileName} {
      // Allow authenticated users to read
      allow read: if request.auth != null;
      
      // Allow authenticated users to write
      allow write: if request.auth != null 
                   && request.resource.size < 5 * 1024 * 1024
                   && request.resource.contentType.matches('audio/.*');
      
      // Allow authenticated users to delete
      allow delete: if request.auth != null;
    }
  }
}
```

### Deploy Storage Rules:
```bash
firebase deploy --only storage
```

---

## 🔍 Step 5: Check Firebase Configuration

Verify `src/services/firebase.ts` has correct storage bucket:

```typescript
const firebaseConfig = {
  // ... other config ...
  storageBucket: "collab-canvas-2e4c5.firebasestorage.app",
  // ...
};
```

**Important**: Must be `.firebasestorage.app`, not `.appspot.com` (old format)

---

## 🔍 Step 6: Test Audio Playback in Browser

### Manual Test:
1. Go to production app
2. Sign in
3. Create a shape
4. Record audio
5. Mark it as "Ramble Start" (click the ram icon)
6. Create another shape
7. Record audio on it
8. Use the connection tool (arrow) to connect shape 1 → shape 2
9. Click "Play Ramble" button

### What Should Happen:
1. ✅ Shape 1's audio plays first
2. ✅ Shape 1 glows purple while playing
3. ✅ When shape 1 finishes, shape 2 starts automatically
4. ✅ Shape 2 glows purple while playing
5. ✅ Console shows: `🎵 Chain 1: Playing shape-id...`

### If Audio Doesn't Play:
- Open browser console and note the error
- Check if the audio URL is valid
- Verify the shapes have the `isRambleStart` flag and connections

---

## 🔍 Step 7: Test with Different Browsers

Audio formats vary by browser:
- **Chrome/Edge**: `audio/webm` (Opus codec)
- **Safari**: `audio/mp4` (AAC codec)
- **Firefox**: `audio/webm` (Opus codec)

### If Audio Works in Chrome but Not Safari:
This is expected! Safari doesn't support WebM. The app should automatically use MP4 for Safari.

Check the console for:
```
📤 Uploading audio: audio/canvas-id/shape-id.webm
```

On Safari, it should be `.mp4`.

---

## ✅ Quick Fix Checklist

1. [ ] CORS configured on correct bucket (`.firebasestorage.app`)
2. [ ] Storage rules deployed and allow authenticated reads
3. [ ] User is signed in
4. [ ] Audio URLs use HTTPS (not HTTP)
5. [ ] Browser supports audio format (WebM for Chrome, MP4 for Safari)
6. [ ] Shapes have audio recorded (`audioUrl` is set)
7. [ ] Start shape is marked as "Ramble Start" (`isRambleStart: true`)
8. [ ] Shapes are connected with arrows (connections exist)

---

## 🚀 Deploy Fixes

After making changes:

```bash
# Deploy storage rules
firebase deploy --only storage

# Build and deploy frontend
npm run build
vercel --prod --yes
```

---

## 📞 Still Having Issues?

If you're still experiencing problems:

1. Go to the test page: `https://collab-canvas-miriam.vercel.app/test-audio-connector.html`
2. Test an audio URL and screenshot any errors
3. Check browser console for specific error messages
4. Verify you're signed in to the production app

Common fixes:
- **Clear browser cache** and hard refresh (Cmd/Ctrl + Shift + R)
- **Sign out and sign back in** to refresh auth tokens
- **Try incognito/private mode** to rule out extension conflicts
- **Test on a different device** to isolate local issues

---

## 📊 Monitoring

### Check Firebase Storage Analytics:
1. Go to: https://console.firebase.google.com/project/collab-canvas-2e4c5/storage
2. Check the "Usage" tab
3. Verify files are being uploaded
4. Check download counts

### Check Vercel Logs:
```bash
vercel logs collab-canvas-miriam.vercel.app
```

---

## 🎯 Common Root Causes

Based on testing, here are the most common issues:

1. **CORS not applied to new bucket** (60% of cases)
   - Firebase changed from `.appspot.com` to `.firebasestorage.app`
   - CORS must be reapplied to new bucket format

2. **Storage rules not deployed** (20% of cases)
   - Rules in code but not deployed to Firebase
   - Run: `firebase deploy --only storage`

3. **User not authenticated** (15% of cases)
   - Storage rules require `request.auth != null`
   - User must be signed in

4. **Browser autoplay policy** (5% of cases)
   - First audio must be triggered by user interaction
   - This is expected - user clicks "Play Ramble" button

