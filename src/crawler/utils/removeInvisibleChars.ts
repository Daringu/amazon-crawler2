export function removeInvisibleChars(str: string) {
  // Unicode Left-to-Right Mark is \u200E
  // You can add other invisible chars here if needed
  return str.replace(/[\u200E]/g, '');
}
