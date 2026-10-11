/** A kereskedési ablak állapota a budapesti idő szerint. Böngészőben és Node-ban is fut. */

export interface BudapestiIdo {
  /** 'YYYY-MM-DD' */
  datum: string;
  /** 1 = hétfő … 7 = vasárnap */
  hetNapja: number;
  /** Az éjfél óta eltelt percek. */
  perc: number;
}

export type AblakAllapot =
  | { tipus: 'hetvege' }
  | { tipus: 'elotte'; hatra: number; nyit: string; zar: string }
  | { tipus: 'nyitva'; hatra: number; nyit: string; zar: string }
  | { tipus: 'lezarva'; nyit: string; zar: string };

const NAPOK: Record<string, number> = { Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6, Sun: 7 };

export function budapestiIdo(most: Date = new Date()): BudapestiIdo {
  const reszek = Object.fromEntries(
    new Intl.DateTimeFormat('en-US', {
      timeZone: 'Europe/Budapest',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      hourCycle: 'h23',
      weekday: 'short',
    })
      .formatToParts(most)
      .map((r) => [r.type, r.value]),
  );
  return {
    datum: `${reszek.year}-${reszek.month}-${reszek.day}`,
    hetNapja: NAPOK[reszek.weekday] ?? 1,
    perc: Number(reszek.hour) * 60 + Number(reszek.minute),
  };
}

function percbe(ido: string): number | null {
  const m = ido.match(/^(\d{1,2}):(\d{2})$/);
  return m ? Number(m[1]) * 60 + Number(m[2]) : null;
}

/** @param ablak pl. „15:45–17:30” */
export function ablakAllapot(ido: BudapestiIdo, ablak: string): AblakAllapot | null {
  if (ido.hetNapja >= 6) return { tipus: 'hetvege' };
  const [nyit, zar] = ablak.split(/\s*[–—-]\s*/);
  const kezdet = percbe(nyit ?? '');
  const veg = percbe(zar ?? '');
  if (kezdet === null || veg === null) return null;
  if (ido.perc < kezdet) return { tipus: 'elotte', hatra: kezdet - ido.perc, nyit, zar };
  if (ido.perc < veg) return { tipus: 'nyitva', hatra: veg - ido.perc, nyit, zar };
  return { tipus: 'lezarva', nyit, zar };
}

/** 130 → „2 ó 10 p”, 45 → „45 p” */
export function idotartam(perc: number): string {
  const o = Math.floor(perc / 60);
  const p = perc % 60;
  return o > 0 ? `${o} ó ${p} p` : `${p} p`;
}
