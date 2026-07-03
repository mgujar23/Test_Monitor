# Test Monitor Dashboard - Docker Image
# Multi-stage build for optimized production image

# Stage 1: Build frontend
FROM node:18-alpine AS frontend-builder
WORKDIR /app

# Copy package files
COPY package.json package-lock.json ./

# Install dependencies
RUN npm ci

# Copy source code
COPY . .

# Build React frontend with Vite
RUN npm run build

# Stage 2: Runtime
FROM node:18-alpine
WORKDIR /app

# Set environment to production
ENV NODE_ENV=production

# Copy package files from builder
COPY package.json package-lock.json ./

# Install production dependencies only
RUN npm ci --omit=dev

# Copy application code
COPY . .

# Copy built frontend from builder
COPY --from=frontend-builder /app/dist ./dist

# Create required directories
RUN mkdir -p cache logs config

# Expose port for the application
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
  CMD node -e "require('http').get('http://localhost:3000/api/health', (r) => {if (r.statusCode !== 200) throw new Error(r.statusCode)})"

# Default command to start the server
CMD ["npm", "start"]
