# Firebase Storage CORS Setup Guide

## The Issue
You're seeing a CORS error when trying to upload audio recordings. This is because Firebase Storage needs CORS (Cross-Origin Resource Sharing) configured to allow browser uploads.

## 🚀 Quick Solution (Try This First)

1. **Open Firebase Console Storage Tab**:
   - Go to: https://console.firebase.google.com/project/collab-canvas-2e4c5/storage
   - Click through the Storage tab to make sure it's fully initialized
   - You should see your bucket: `collab-canvas-2e4c5.appspot.com`

2. **Refresh Your Browser**:
   - Go back to http://localhost:5174/
   - Try recording again - the error might be resolved

## 🔧 If That Doesn't Work: Install Google Cloud SDK

### Step 1: Install Google Cloud SDK

```bash
# Download and install
curl https://sdk.cloud.google.com | bash

# Restart your shell
exec -l $SHELL

# Verify installation
gcloud --version
```

### Step 2: Run the Setup Script

```bash
cd /Users/miriam/Desktop/collab-canvas
./setup-storage-cors.sh
```

This script will:
- Authenticate with Google Cloud
- Set the correct project
- Apply the CORS configuration from `cors.json`

### Step 3: Test the Recording

- Refresh your browser at http://localhost:5174/
- Try recording audio again
- It should work now! 🎉

## 📝 Manual CORS Configuration (Alternative)

If you prefer to do it manually:

```bash
# Authenticate
gcloud auth login

# Set project
gcloud config set project collab-canvas-2e4c5

# Apply CORS
gsutil cors set cors.json gs://collab-canvas-2e4c5.appspot.com

# Verify CORS
gsutil cors get gs://collab-canvas-2e4c5.appspot.com
```

## 🔍 Troubleshooting

### Error: "command not found: gsutil"
- Google Cloud SDK is not installed
- Follow Step 1 above to install it

### Error: "AccessDeniedException: 403"
- Run `gcloud auth login` to authenticate
- Make sure you're using the same Google account that owns the Firebase project

### Error: "BucketNotFoundException: 404"
- The storage bucket doesn't exist
- Go to Firebase Console and make sure Storage is enabled
- Try creating a test file in the Storage tab

## ✅ How to Verify It's Working

1. Open browser developer console (F12)
2. Select a rectangle or circle
3. Click the record button
4. Grant microphone permission
5. Speak for a few seconds
6. Click stop
7. Check the console for success messages (not errors)
8. Play button should appear - click to hear your recording

## 📋 What the CORS Configuration Does

The `cors.json` file allows:
- All origins (`*`) to access the storage
- GET, POST, PUT, DELETE, HEAD methods
- Content-Type and Authorization headers
- 1 hour cache for preflight requests

This is necessary for browser-based uploads to work properly.

