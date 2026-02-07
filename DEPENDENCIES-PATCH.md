# Dependencies Patch – Vulnerability Reduction and Major Upgrades

## Summary

This document describes dependency changes applied to reduce known vulnerabilities and to perform **major version upgrades** (Next.js 15, React 19, Sentry 10, TypeScript 5.6). For code changes and migration details, see **MAJOR-UPGRADES.md**.

## Major Upgrades Applied

- **next** 14.2.35 → **15.4.10**
- **react** / **react-dom** 18.3.1 → **^19.0.0**
- **@sentry/nextjs** ^9 → **^10**
- **eslint-config-next** 14.2.35 → **15.4.10**
- **typescript** 5.5.2 → **^5.6.0**
- **@types/react** 18.3.3 → **^19.0.0**, **@types/react-dom** added **^19.0.0**

## Changes Applied (security and cleanup)

### 1. Next.js (security) – now at 15.4.10

- **From:** `14.2.5` (then 14.2.35)
- **To:** `15.4.10`
- **Reason:** Addresses CVEs (e.g. CVE-2024-51479, CVE-2024-46982, Dec 2025 CVEs). Next 15 requires React 19.

### 2. PostHog removal

- **Removed:** `posthog-js`
- **Reason:** Telemetry to external PostHog is disabled; the client is no longer used and has been removed to reduce bundle size and external dependencies.

## Optional Upgrades (manual)

After applying the patch, run:

```bash
pnpm audit
pnpm update --latest
```

Review breaking changes before updating major versions. Suggested conservative updates:

| Package              | Current  | Suggested | Notes                    |
|----------------------|----------|-----------|--------------------------|
| eslint               | ^8.57.1  | ^9.x      | Major; update config     |
| eslint-config-next   | 15.4.10  | 15.4.10   | Match Next.js version    |
| @sentry/nextjs       | ^10      | ^10.x     | Already upgraded         |

## Applying the patch

The project already includes the dependency changes above. If you need to re-apply from a clean tree:

1. In `package.json`, set the versions listed in **Major Upgrades Applied** and remove `"posthog-js"` if still present.
2. Run `pnpm install --no-frozen-lockfile`.
3. Run `pnpm build` to verify.
4. See **MAJOR-UPGRADES.md** for any required code changes (JSX types, Suspense, react-spring, Sentry config).
