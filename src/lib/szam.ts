/** Magyar formátumú szám: szóköz / nbsp ezres elválasztó, tizedesvessző (pl. „31 616,5”). */
export const SZAM_RE = /\d{1,3}(?:[   ]\d{3})+(?:,\d+)?|\d+(?:,\d+)?/g;

/** „31 616,5” → 31616.5 */
export function szamErtek(szoveg: string): number | null {
  const m = szoveg.match(SZAM_RE);
  if (!m) return null;
  const n = Number(m[0].replace(/[   ]/g, '').replace(',', '.'));
  return Number.isFinite(n) ? n : null;
}

/** Beviteli mező értéke → szám. Elfogad tizedesvesszőt, tizedespontot és szóközt: „40”, „40,5”, „31 480.0”. */
export function bemenetSzam(szoveg: string): number | null {
  const tiszta = szoveg.trim().replace(/[   ]/g, '').replace(',', '.');
  if (!/^-?\d+(\.\d+)?$/.test(tiszta)) return null;
  const n = Number(tiszta);
  return Number.isFinite(n) ? n : null;
}

/** Szám → magyar formátum, pl. huSzam(31616.5, 1) → „31 616,5”, huSzam(0.024, 3) → „0,024”. */
export function huSzam(n: number, tizedes = 1, elojel = false): string {
  const s = new Intl.NumberFormat('hu-HU', {
    minimumFractionDigits: tizedes,
    maximumFractionDigits: tizedes,
    signDisplay: elojel ? 'exceptZero' : 'auto',
  }).format(n);
  // Az Intl keskeny nbsp-t (U+202F / U+00A0) használ; a markdownban sima szóköz van, hogy egyezzen a kettő.
  return s.replace(/[  ]/g, ' ').replace('-', '−');
}
