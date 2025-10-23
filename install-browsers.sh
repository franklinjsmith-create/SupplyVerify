#!/bin/bash
# Install required Linux libraries for Playwright Chromium
echo "Installing system dependencies for Playwright..."
apt-get update && apt-get install -y \
    libglib2.0-0 libnss3 libatk1.0-0 libatk-bridge2.0-0 libcups2 \
    libdrm2 libxkbcommon0 libatspi2.0-0 libxcomposite1 libxdamage1 \
    libxfixes3 libxrandr2 libgbm1 libpango-1.0-0 libcairo2 libasound2 \
    libgtk-3-0 wget unzip xdg-utils

# Install Playwright Chromium
echo "Installing Playwright Chromium browser..."
npx playwright install chromium --with-deps

echo "Browser installation complete!"
