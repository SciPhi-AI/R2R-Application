# Builder Stage
FROM node:22-alpine AS builder
WORKDIR /app

# Install pnpm
RUN npm install -g pnpm

# Copy package.json and pnpm-lock.yaml
COPY package.json pnpm-lock.yaml* ./

# Install dependencies
RUN pnpm install --frozen-lockfile

# Copy the rest of the application code
COPY . .

# Build the Next.js application
RUN pnpm build

# Production Stage
FROM node:22-alpine AS runner
WORKDIR /app

# Install pnpm
RUN npm install -g pnpm

# Set node environment to production
ENV NODE_ENV=production
ENV HOSTNAME="0.0.0.0"

# Copy necessary files from builder stage
COPY --from=builder /app/next.config.js ./
COPY --from=builder /app/public ./public
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static

# Copy the startup script
COPY startup.sh /app/startup.sh

# Ensure the startup script is executable
RUN chmod +x /app/startup.sh

# Expose the port the app runs on
EXPOSE 3000

# Define the command to run the startup script
CMD ["/app/startup.sh"]
