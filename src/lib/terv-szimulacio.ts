/**
 * A trade terv „visszajátszása” a gyertyákon: hol teljesült volna a limit belépés, és utána
 * a TP vagy az SL. Csak tájékoztató: a 15M/5M BoS-megerősítést NEM vizsgálja.
 */

/** [unix mp, open, high, low, close] */
export type Gyertya = [number, number, number, number, number];

export interface SzimTerv {
  irany: 'LONG' | 'SHORT';
  entry: number;
  sl: number | null;
  tp: number | null;
}

export interface SzimEredmeny {
  belepes: { t: number; ar: number } | null;
  kilepes: { t: number; ar: number; tipus: 'TP' | 'SL' } | null;
  /** R-ben (TP: tp-pont / stop-pont, SL: −1), ha mindkettő ismert. */
  r: number | null;
}

/**
 * @param gyertyak időrendben
 * @param kezdet csak az ennél nem korábbi gyertyák számítanak (pl. az ablak nyitása), unix mp
 */
export function tervSzimulacio(gyertyak: Gyertya[], terv: SzimTerv, kezdet = 0): SzimEredmeny {
  const ures: SzimEredmeny = { belepes: null, kilepes: null, r: null };
  const lista = gyertyak.filter((g) => g[0] >= kezdet);
  const i = lista.findIndex(([, , h, l]) => l <= terv.entry && h >= terv.entry);
  if (i < 0) return ures;
  const belepes = { t: lista[i][0], ar: terv.entry };

  const long = terv.irany === 'LONG';
  for (let j = i; j < lista.length; j++) {
    const [t, , h, l] = lista[j];
    // A belépő gyertyán csak a stopot nézzük (konzervatív: nem tudjuk, a gyertyán belül mi jött előbb).
    const slTalalt = terv.sl !== null && (long ? l <= terv.sl : h >= terv.sl);
    const tpTalalt = j > i && terv.tp !== null && (long ? h >= terv.tp : l <= terv.tp);
    if (slTalalt) return { belepes, kilepes: { t, ar: terv.sl!, tipus: 'SL' }, r: -1 };
    if (tpTalalt) {
      const stop = terv.sl !== null ? Math.abs(terv.entry - terv.sl) : null;
      return { belepes, kilepes: { t, ar: terv.tp!, tipus: 'TP' }, r: stop ? Math.abs(terv.tp! - terv.entry) / stop : null };
    }
  }
  return { belepes, kilepes: null, r: null };
}
