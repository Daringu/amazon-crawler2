export function parseStringArray(input: string): string[] {
  return input
    .replace(/^\[|\]$/g, "")
    .split(",")
    .map((s) => s.trim().replace(/^"(.*)"$/, "$1"))
    .filter((s) => s.length > 0);
}
