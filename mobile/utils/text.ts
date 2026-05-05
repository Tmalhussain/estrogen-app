/**
 * Strip Arabic diacritical marks (tashkeel) from text.
 * Used for fuzzy search matching — allows searching without exact diacritics.
 */
export function stripDiacritics(text: string): string {
  // Arabic tashkeel: Fathatan–Sukun (064B-0652), superscript Alef (0670),
  // Quranic signs (0610-061A)
  return text.replace(/[\u064B-\u065F\u0610-\u061A\u0670]/g, '');
}
