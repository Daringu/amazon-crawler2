export function cleanLink(url: string) {
  try {
    const parsed = new URL(url);
    const segments = parsed.pathname.split('/');

    // Check if last segment starts with 'ref=' and remove it if yes
    if (segments.length && segments[segments.length - 1].startsWith('ref=')) {
      segments.pop();
    }

    // Rebuild pathname without last ref= segment
    const cleanPath = segments.join('/');

    return parsed.origin + cleanPath;
  } catch {
    return url; // fallback
  }
}
