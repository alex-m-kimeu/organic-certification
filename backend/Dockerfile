# Use Node.js 22 Debian image for production (better Chrome support than Alpine)
FROM node:22 AS base

# Install system dependencies and Google Chrome for Puppeteer
RUN apt-get update \
    && apt-get install -y wget gnupg curl dumb-init \
    && wget -q -O - https://dl-ssl.google.com/linux/linux_signing_key.pub | gpg --dearmor -o /usr/share/keyrings/googlechrome-linux-keyring.gpg \
    && echo "deb [arch=amd64 signed-by=/usr/share/keyrings/googlechrome-linux-keyring.gpg] https://dl-ssl.google.com/linux/chrome/deb/ stable main" > /etc/apt/sources.list.d/google.list \
    && apt-get update \
    && apt-get install -y google-chrome-stable fonts-ipafont-gothic fonts-wqy-zenhei fonts-thai-tlwg fonts-khmeros fonts-kacst fonts-freefont-ttf \
    # Add missing dependencies from Puppeteer troubleshooting docs
    libxss1 libgconf-2-4 libxtst6 libxrandr2 libasound2 libpangocairo-1.0-0 libatk1.0-0 \
    libcairo-gobject2 libgtk-3-0 libgdk-pixbuf2.0-0 libxcomposite1 libxcursor1 libxdamage1 \
    libxext6 libxfixes3 libxi6 libxrender1 libxss1 libglib2.0-0 libnss3 libxrandr2 \
    libasound2 libatk1.0-0 libdrm2 libxkbcommon0 libatspi2.0-0 dbus dbus-x11 \
    --no-install-recommends \
    && rm -rf /var/lib/apt/lists/*

# Create app directory and user with proper groups (following Puppeteer docs)
RUN groupadd -r pptruser && useradd -r -g pptruser -G audio,video pptruser \
    && mkdir -p /home/pptruser/Downloads \
    && chown -R pptruser:pptruser /home/pptruser

# Set Puppeteer environment variables
ENV PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true \
    PUPPETEER_EXECUTABLE_PATH=/usr/bin/google-chrome-stable

WORKDIR /app

# Build stage - includes dev dependencies for TypeScript compilation
FROM base AS builder

# Copy package files
COPY package*.json ./
COPY prisma/schema.prisma ./prisma/

# Install ALL dependencies (including dev dependencies for TypeScript compilation)
RUN npm ci && npm cache clean --force

# Generate Prisma client
RUN npx prisma generate

# Copy source code
COPY . .

# Build TypeScript using production config
RUN npx tsc -p tsconfig.build.json

# Production stage - only runtime dependencies
FROM base AS production

# Copy package files
COPY package*.json ./
COPY prisma/schema.prisma ./prisma/

# Install only production dependencies
RUN npm ci --only=production && npm cache clean --force

# Generate Prisma client for production
RUN npx prisma generate

# Copy built application from builder stage
COPY --from=builder /app/dist ./dist

# Copy route files for Swagger documentation (keep source routes for API docs)
COPY --from=builder /app/src/routes ./src/routes
COPY --from=builder /app/src/controllers ./src/controllers
COPY --from=builder /app/src/config/swagger.ts ./src/config/swagger.ts
COPY --from=builder /app/src/app.ts ./src/app.ts

# CRITICAL: Copy certificate templates
COPY --from=builder /app/src/templates ./src/templates

# Create storage directory for PDFs with proper permissions
RUN mkdir -p /app/storage/certificates && chown -R pptruser:pptruser /app/storage

# Change ownership of app directory
RUN chown -R pptruser:pptruser /app

# Switch to non-root user
USER pptruser

# Expose port
EXPOSE 8080

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=60s --retries=3 \
    CMD curl -f http://localhost:8080/health || exit 1

# Use dumb-init to handle signals properly
ENTRYPOINT ["dumb-init", "--"]

# Start the application
CMD ["node", "dist/server.js"]