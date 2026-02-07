# Major Library Upgrades

This document describes the major version upgrades applied to the R2R Dashboard and the code changes made for compatibility.

## Summary of Upgrades

| Package | From | To | Notes |
|---------|------|-----|-------|
| **next** | 14.2.35 | **15.4.10** | Next.js 15 (patched), requires React 19 |
| **react** | 18.3.1 | **^19.0.0** | React 19 |
| **react-dom** | 18.3.1 | **^19.0.0** | React 19 |
| **@sentry/nextjs** | ^9 | **^10** | Sentry SDK v10 |
| **eslint-config-next** | 14.2.35 | **15.4.10** | Match Next.js |
| **@types/react** | 18.3.3 | **^19.0.0** | React 19 types |
| **@types/react-dom** | (none) | **^19.0.0** | React 19 types |
| **typescript** | 5.5.2 | **^5.6.0** | TypeScript 5.6+ |

## Code and Config Changes

### 1. React 19 / TypeScript: `JSX` namespace

In React 19 types, the global `JSX` namespace is not available by default. Use `React.JSX` instead.

**Files changed:** `src/pages/settings.tsx`

- `: JSX.Element` → `: React.JSX.Element`
- `Record<string, JSX.Element[]>` → `Record<string, React.JSX.Element[]>`

### 2. Next.js 15: `useSearchParams` and Suspense

Next.js 15 recommends wrapping components that use `useSearchParams()` in a `<Suspense>` boundary so the rest of the page can stay static.

**Files changed:** `src/pages/chat.tsx`

- Wrapped the main chat page content in `<Suspense fallback={<ChatPageFallback />}>`.
- Default export is now a wrapper that renders `<Suspense><Index /></Suspense>`.

### 3. @react-spring/web with React 19 types

`animated.path` and `animated.g` from `@react-spring/web` have typings that don’t yet match React 19 and SVG/animated props. Type assertions were added so the app still type-checks.

**Files changed:** `src/components/knowledgeGraph.tsx`

- **animated.path:** Passed `d` and `fill` via a spread with `as unknown as React.SVGProps<SVGPathElement>` so the interpolated `d` is accepted.
- **animated.g:** Introduced an `AnimatedG` alias typed as `React.FC<SVGProps<SVGGElement> & { children?: React.ReactNode }>` so `children` are accepted. `style={{ opacity: props.opacity }}` is cast with `as unknown as React.CSSProperties` so `SpringValue<number>` is accepted.

### 4. TypeScript: React types path

The custom `paths` entry for `react` in `tsconfig.json` was removed so TypeScript uses the default React 19 types from `node_modules`.

**Files changed:** `tsconfig.json`

- Removed `"react": ["./node_modules/@types/react"]` from `compilerOptions.paths`.

### 5. @sentry/nextjs v10: config options

Sentry v10 moved some options under a `webpack` object and deprecated the old top-level names.

**Files changed:** `next.config.js`

- `disableLogger: true` → `webpack: { treeshake: { removeDebugLogging: true } }`
- `reactComponentAnnotation: { enabled: true }` → `webpack: { reactComponentAnnotation: { enabled: true } }`
- `automaticVercelMonitors: true` → `webpack: { automaticVercelMonitors: true }`
- Removed deprecated top-level options; kept `org`, `project`, `silent`, `widenClientFileUpload`, `tunnelRoute`.

## Peer Dependency Warnings

After `pnpm install` you may see peer dependency warnings for:

- **@react-spring/web** – expects React 18; works with React 19 at runtime; types may be strict.
- **@visx/\*** – same as above.
- **lucide-react** – same as above.
- **next-themes** – same as above.

These are version-range only; the app builds and runs with React 19. Upstream packages will likely add React 19 to their peer ranges in future releases.

## Optional Follow-ups

- **ESLint 9:** The project still uses ESLint 8. Migrating to ESLint 9 and the flat config would be a separate change.
- **next-themes:** If you see theme/hydration issues with React 19, consider upgrading `next-themes` when a React 19–compatible version is available or pinning to a commit that supports it.
- **Sentry config file:** Next.js recommends moving Sentry client setup from `sentry.client.config.ts` into `instrumentation-client.ts` when using Turbopack; optional for the current setup.

## Verification

After pulling these changes:

```bash
pnpm install --no-frozen-lockfile
pnpm build
pnpm start
```

Then open the app (with `NEXT_PUBLIC_BASE_PATH` set if you use a custom context path) and run through main flows (login, chat, settings, analytics) to confirm behavior.
