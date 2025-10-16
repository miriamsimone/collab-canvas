# 🔍 Firestore CORS Error Debug Guide

## Current Issue
Getting CORS errors from Firestore Listen/channel even after adding authorized domain.
This suggests Firestore itself is blocking the real-time connections.

## 🛠️ Debug Steps

### Step 1: Check Firebase Console Settings
1. **Go to**: https://console.firebase.google.com/project/collab-canvas-2e4c5
2. **Check Authentication → Settings → Authorized domains**:
   - Should have: `collab-canvas-miriam.vercel.app`
   - Should have: `localhost` (for development)
3. **Check Firestore → Rules**: Verify rules are deployed correctly

### Step 2: Verify App is Using Correct Config
Open browser dev tools and check:
- Console logs should show "Firebase initialized successfully for local development"
- Network tab should show requests to correct project ID
- Check if user is authenticated properly

### Step 3: Try Different Browsers
- Test in Chrome incognito
- Test in Firefox/Safari
- Sometimes browser security policies differ

### Step 4: Check Firestore Security Rules
The rules should allow authenticated users. Current rules should be:
```
allow read, write: if request.auth != null;
```

## 🔧 Potential Fixes

### Option 1: Temporary Open Rules (Testing Only)
Temporarily make Firestore completely open to test if it's a rules issue:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /{document=**} {
      allow read, write: if true; // TEMPORARY - INSECURE
    }
  }
}
```

### Option 2: Add More Domains
Add these domains to Firebase authorized domains:
- `vercel.app`
- `*.vercel.app` 
- The specific Vercel domain without protocol

### Option 3: Check Firebase Project Settings
- Project settings → General tab
- Make sure it's a public project
- Check if there are any additional restrictions

## 🎯 Expected Behavior
After fixing CORS, you should see:
- ✅ Network requests succeed
- ✅ Real-time listeners connect
- ✅ No CORS errors in console
- ✅ Collaborative features work
