export function platformLink(base: string | undefined, route: string, fallback = '/platform#install') {
  if (!base) return fallback;
  try {
    const url = new URL(base);
    if (!['http:', 'https:'].includes(url.protocol) || url.username || url.password) return fallback;
    return new URL(route, url.origin).toString();
  } catch {
    return fallback;
  }
}
