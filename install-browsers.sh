#!/bin/bash
# Install Playwright browsers for production deployment
# This script should be run during the build phase on your deployment platform

echo "Installing system dependencies for Chromium..."
npx playwright install-deps chromium

echo "Installing Playwright Chromium browser..."
npx playwright install chromium

echo "Browser installation complete!"
