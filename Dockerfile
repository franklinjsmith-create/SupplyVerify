# Build stage
FROM node:20-slim AS builder

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install all dependencies (including dev dependencies needed for build)
RUN npm ci

# Install Playwright system dependencies and Chromium browser
RUN npx playwright install-deps chromium && \
    npx playwright install chromium

# Copy application files
COPY . .

# Build the application
RUN npm run build

# Production stage
FROM node:20-slim

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install all dependencies (Vite is needed at runtime to serve frontend)
RUN npm ci

# Install Playwright system dependencies and Chromium browser
RUN npx playwright install-deps chromium && \
    npx playwright install chromium

# Copy built application from builder
COPY --from=builder /app/dist ./dist

# Expose port
EXPOSE 5000

# Set environment to production
ENV NODE_ENV=production

# Start the application
CMD ["npm", "start"]
