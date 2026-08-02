// types/globals.d.ts
declare global {
  interface Window {
    __RUNTIME_CONFIG__: {
      NEXT_PUBLIC_R2R_DEPLOYMENT_URL: string;
      R2R_DASHBOARD_DISABLE_TELEMETRY: string;
      SUPABASE_URL: string;
      SUPABASE_ANON_KEY: string;
      NEXT_PUBLIC_HATCHET_DASHBOARD_URL: string;
    };
  }
}

export {};
