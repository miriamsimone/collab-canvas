#!/bin/bash

# Setup script for Firebase Storage CORS configuration
# Run this script after installing Google Cloud SDK

echo "🔧 Setting up Firebase Storage CORS..."
echo ""

# Check if gcloud is installed
if ! command -v gcloud &> /dev/null; then
    echo "❌ Google Cloud SDK is not installed."
    echo ""
    echo "Please install it first:"
    echo "  curl https://sdk.cloud.google.com | bash"
    echo "  exec -l $SHELL"
    echo ""
    exit 1
fi

# Authenticate with Google Cloud
echo "📝 Authenticating with Google Cloud..."
gcloud auth login

# Set the project
echo "🎯 Setting project to collab-canvas-2e4c5..."
gcloud config set project collab-canvas-2e4c5

# Apply CORS configuration
echo "🌐 Applying CORS configuration..."
gsutil cors set cors.json gs://collab-canvas-2e4c5.appspot.com

echo ""
echo "✅ CORS configuration applied successfully!"
echo "🔄 Please refresh your browser and try recording again."

