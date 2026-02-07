/**
 * Returns the path for a public asset, prefixed with basePath when the app
 * is served under a custom context path (e.g. /r2r-dashboard-dev).
 * Use for img src, next/image src, and any other absolute paths under public/.
 */
export function assetPath(path: string): string {
  const base = (process.env.NEXT_PUBLIC_BASE_PATH || '').replace(/\/$/, '');
  const normalizedPath = path.startsWith('/') ? path : `/${path}`;
  return base ? `${base}${normalizedPath}` : normalizedPath;
}
