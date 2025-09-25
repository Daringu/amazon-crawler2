export function cleanLink(url: string, language: string): string {
  try {
    const parsed = new URL(url);

    // --- 1. Clean up "ref=" from query params ---
    parsed.searchParams.delete('ref');

    // --- 2. Set or replace language param ---
    parsed.searchParams.set('language', language);

    // --- 3. Clean up "ref=" segments in pathname ---
    const segments = parsed.pathname.split('/').filter(Boolean);

    if (segments.length && segments[segments.length - 1].startsWith('ref=')) {
      segments.pop();
    }

    parsed.pathname = '/' + segments.join('/');

    return parsed.toString();
  } catch {
    return url; // fallback if invalid URL
  }
}

//TODO: need to check if link from best sellers
