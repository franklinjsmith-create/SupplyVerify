#!/bin/bash
# Install Playwright browsers for production deployment
# This script should be run during the build phase on your deployment platform

echo "Installing Playwright Chromium browser..."
npx playwright install chromium --with-deps

echo "Browser installation complete!"
