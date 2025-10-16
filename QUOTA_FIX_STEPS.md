# Fix Quota Issues After Blaze Upgrade

## Why You're Still Seeing Quota Errors

Even after upgrading to Blaze plan, you might see quota errors due to:
- **Caching**: Firebase SDK caching old quota responses
- **Propagation delay**: Upgrade taking time to propagate
- **Connection persistence**: Old connections still using free tier limits

## 🔧 Solutions (Try in Order)

### Step 1: Clear Browser Cache & Restart
1. **Hard refresh** your Vercel app: Ctrl+Shift+R (Cmd+Shift+R on Mac)
2. **Or open incognito/private window**
3. **Clear all browser data** for your domain

### Step 2: Check Firebase Console
1. Go to: https://console.firebase.google.com/project/collab-canvas-2e4c5
2. **Click**: "Usage" or "Quota" in left sidebar
3. **Verify**: Blaze plan is active
4. **Check**: Current usage vs limits

### Step 3: Restart Firebase Connections
1. **Close all browser tabs** with your app
2. **Wait 2-3 minutes**
3. **Open fresh browser window**
4. **Test your app again**

### Step 4: Clear Firestore Data (If Needed)
1. **Firebase Console** → **Firestore Database**
2. **Delete old test data** to reduce usage
3. **Keep only essential documents**

## 🎯 Expected Timeline
- **Immediate**: Browser cache clearing should help
- **5-10 minutes**: Firebase connection refresh
- **30-60 minutes**: Full quota upgrade propagation

## 🚀 Test After Each Step
Try creating rectangles and moving cursor after each step to see if real-time features work.
