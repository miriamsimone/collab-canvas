# Firebase CORS Setup Instructions

## Problem
You're seeing this error: `Failed to load resource: the server responded with a status of 400`

This happens because Firebase Firestore is blocking requests from localhost.

## Solution

### Step 1: Configure Firebase Console
1. Go to: https://console.firebase.google.com/project/collab-canvas-2e4c5
2. Click **"Authentication"** in left sidebar
3. Click **"Settings"** tab at the top
4. Scroll down to **"Authorized domains"** section
5. Click **"Add domain"** and add these domains:
   - `localhost`
   - `127.0.0.1`
   - `localhost:5173` (optional, for specific port)

### Step 2: Clear Browser Cache
- Press **Ctrl+Shift+R** (Windows/Linux) or **Cmd+Shift+R** (Mac)
- Or open in Incognito/Private window

### Step 3: Test Application
- Navigate to `http://localhost:5173/`
- You should now see the canvas working properly

## Expected Results After Fix
✅ No more 400 errors  
✅ Canvas renders with toolbar  
✅ Can create rectangles  
✅ Multiplayer cursors work  
✅ Real-time collaboration functions  

## Still Having Issues?
If you continue to see errors after adding localhost to authorized domains:
1. Wait 2-3 minutes for Firebase changes to propagate
2. Clear browser cache completely
3. Restart the dev server: `npm run dev`
