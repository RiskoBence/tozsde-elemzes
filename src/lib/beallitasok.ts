/**
 * Kereskedési keretek a `napi-elemzes-sablon.md` „Rögzített keretek” részéből.
 * Ha a számlaméret, a kockázat vagy a spread változik, csak itt kell átírni.
 */
export const KERETEK = {
  /** Kockázat trade-enként (USD). */
  kockazatUsd: 1,
  /** A stophoz hozzáadott spread (pont). */
  spreadPont: 1.2,
  /** Méret lépésköze (lefelé kerekítés). */
  meretLepes: 0.001,
  /** Méret plafon. */
  meretPlafon: 0.03,
  /** Margin arány a becsléshez (méret × ár × 5%). */
  marginArany: 0.05,
} as const;

export type Keretek = { [K in keyof typeof KERETEK]: number };
