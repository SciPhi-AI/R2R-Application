#!/bin/sh

# Function to replace placeholders with environment variables
replace_env_vars() {
  echo "Replacing environment variables in env-config.js..."
  sed -i "s|__NEXT_PUBLIC_R2R_DEPLOYMENT_URL__|${NEXT_PUBLIC_R2R_DEPLOYMENT_URL}|g" /app/public/env-config.js
  sed -i "s|__NEXT_PUBLIC_R2R_DEFAULT_EMAIL__|${NEXT_PUBLIC_R2R_DEFAULT_EMAIL}|g" /app/public/env-config.js
  sed -i "s|__NEXT_PUBLIC_R2R_DEFAULT_PASSWORD__|${NEXT_PUBLIC_R2R_DEFAULT_PASSWORD}|g" /app/public/env-config.js
  sed -i "s|__R2R_DASHBOARD_DISABLE_TELEMETRY__|${R2R_DASHBOARD_DISABLE_TELEMETRY}|g" /app/public/env-config.js
  sed -i "s|__SUPABASE_URL__|${SUPABASE_URL}|g" /app/public/env-config.js
  sed -i "s|__SUPABASE_ANON_KEY__|${SUPABASE_ANON_KEY}|g" /app/public/env-config.js
  sed -i "s|__NEXT_PUBLIC_HATCHET_DASHBOARD_URL__|${NEXT_PUBLIC_HATCHET_DASHBOARD_URL}|g" /app/public/env-config.js
  sed -i "s|__NEXT_PUBLIC_SENTRY_DSN__|${NEXT_PUBLIC_SENTRY_DSN}|g" /app/public/env-config.js
}

# Replace environment variables
replace_env_vars

# Start the Next.js server
exec node server.js
