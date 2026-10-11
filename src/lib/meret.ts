import { KERETEK, type Keretek } from './beallitasok';

export interface MeretBemenet {
  stopPont: number | null;
  /** Entry ár a margin becsléséhez. */
  entry?: number | null;
  tpPont?: number | null;
}

export interface MeretEredmeny {
  /** A plafon és a kerekítés előtti érték. */
  nyers: number;
  meret: number;
  plafonAktiv: boolean;
  /** A ténylegesen kockáztatott összeg: méret × (stop + spread). */
  kockazatUsd: number;
  marginUsd: number | null;
  rr: number | null;
}

/**
 * Méret = kockázat / (stop pont + spread), lefelé kerekítve a lépésközre, a plafonnál nem nagyobb.
 * Pl. 40 pont → 1 / 41,2 = 0,02427 → 0,024.
 */
export function meretSzamitas({ stopPont, entry = null, tpPont = null }: MeretBemenet, k: Keretek = KERETEK): MeretEredmeny | null {
  if (stopPont === null || !Number.isFinite(stopPont) || stopPont <= 0) return null;
  const nyers = k.kockazatUsd / (stopPont + k.spreadPont);
  const lepesek = Math.floor(nyers / k.meretLepes + 1e-9);
  const kerekitett = Number((lepesek * k.meretLepes).toFixed(6));
  const meret = Math.min(kerekitett, k.meretPlafon);
  return {
    nyers,
    meret,
    plafonAktiv: kerekitett > k.meretPlafon,
    kockazatUsd: meret * (stopPont + k.spreadPont),
    marginUsd: entry && entry > 0 ? meret * entry * k.marginArany : null,
    rr: tpPont && tpPont > 0 ? tpPont / stopPont : null,
  };
}
