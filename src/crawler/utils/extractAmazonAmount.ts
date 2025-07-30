/**
 * Extracts and parses the first number-like amount in a string.
 * Handles k/M/B, optional +, and both US/EU number formats.
 */
export function extractAmazonAmount(input: string): number {
  if (!input) return 0;

  // Match number + optional suffix like k/M/B and optional +
  const match = input.match(/[\d.,]+(?:\s?[kKmMbB])?\+?/);
  if (!match) return 0;

  let amountStr = match[0].replace(/\s+/g, '').replace(/\+$/, '');

  let multiplier = 1;

  if (/k$/i.test(amountStr)) {
    multiplier = 1_000;
    amountStr = amountStr.slice(0, -1);
  } else if (/m$/i.test(amountStr)) {
    multiplier = 1_000_000;
    amountStr = amountStr.slice(0, -1);
  } else if (/b$/i.test(amountStr)) {
    multiplier = 1_000_000_000;
    amountStr = amountStr.slice(0, -1);
  }

  // Detect format: both . and ,
  if (amountStr.includes('.') && amountStr.includes(',')) {
    // Assume European: . is thousands, , is decimal
    amountStr = amountStr.replace(/\./g, '').replace(',', '.');
  } else if (amountStr.includes(',') && !amountStr.includes('.')) {
    // Only , → assume decimal
    amountStr = amountStr.replace(',', '.');
  } else {
    // Only . or neither: US-style, remove thousands separators
    amountStr = amountStr.replace(/,/g, '');
  }

  const num = parseFloat(amountStr);
  if (isNaN(num)) return 0;

  return num * multiplier;
}
