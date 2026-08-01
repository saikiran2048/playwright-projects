/** Parses a display string like "$1,500" into a number. */
export function parsePrice(text: string | null): number {
  if (!text) return 0;
  return parseFloat(text.replace(/[$,]/g, ''));
}