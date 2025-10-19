#!/bin/bash
# Create Firebase Storage bucket using Firebase CLI

echo "🪣 Creating Firebase Storage bucket..."

# Get the project ID
PROJECT_ID="collab-canvas-2e4c5"

# Use gcloud to create the bucket (Firebase Storage uses Google Cloud Storage)
echo "Creating bucket: gs://${PROJECT_ID}.appspot.com"

# Try to create with gcloud if available
if command -v gcloud &> /dev/null; then
    gcloud storage buckets create gs://${PROJECT_ID}.appspot.com \
        --project=${PROJECT_ID} \
        --location=us-central1 \
        --uniform-bucket-level-access
else
    echo "❌ gcloud not found. Please create the bucket manually:"
    echo ""
    echo "1. Go to: https://console.firebase.google.com/project/${PROJECT_ID}/storage"
    echo "2. Click 'Get Started'"
    echo "3. Choose 'Start in production mode'"
    echo "4. Select location: us-central1"
    echo "5. Click 'Done'"
    echo ""
fi
