#!/bin/bash

# This script cleans up the Kubernetes cluster and redeploys all resources.
# Combined all commands into a single script for ease of use.

# Delete all resources and PVCs (Can be slow)
kubectl delete all --all
kubectl delete pvc --all

# Delete all secrets
kubectl delete secret --all

# Create a new JWT secret
SECRET=$(python3 -c "import secrets; print(secrets.token_urlsafe(32))")
kubectl create secret generic jwt-secret --from-literal=SECRET=$SECRET
echo "Kubernetes secret 'jwt-secret' created with SECRET: $SECRET"

# Apply all manifests
kubectl apply -f k8s/ --recursive

# Wait for the frontend pod to be ready
echo "Waiting for frontend-service pod to be ready..."
kubectl rollout status deployment/frontend-service

# Open the frontend in the browser using minikube
minikube service frontend-service