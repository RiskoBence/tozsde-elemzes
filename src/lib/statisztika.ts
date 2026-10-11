import type { Elemzes, Trade } from './parse-elemzes';

export interface NapAdat {
  datum: string;
  /** A nap elemzései fájlnév szerinti sorrendben (az utolsó a legfrissebb). */
  elemzesek: Elemzes[];
}

export interface DatumozottTrade extends Trade {
  datum: string;
}

export interface Osszesites {
  napok: number;
  setup: { VAN: number; NINCS: number; FELTETELES: number; nincsAdat: number };
  pirosNapok: number;
  tradek: DatumozottTrade[];
  nyero: number;
  veszto: number;
  nullas: number;
  /** nyerő / (nyerő + vesztő); a nullás trade-ek nem számítanak bele. */
  winRate: number | null;
  osszR: number;
  atlagR: number | null;
  osszUsd: number;
  /** igen / (igen + nem) */
  szabalyArany: number | null;
  /** A kumulált R legnagyobb csúcs–völgy esése. */
  maxVisszaesesR: number;
}

export interface HaviSor {
  honap: string;
  napok: number;
  tradek: number;
  nyero: number;
  veszto: number;
  osszR: number;
  osszUsd: number;
}

/** A trade előjele: elsődlegesen R, ha az nincs, USD alapján. */
export function tradeEredmeny(t: Trade): number | null {
  return t.r ?? t.usd;
}

/** Egy nap trade-jei: a legutolsó olyan fájlból, amelyben van kitöltött napló (így nincs duplán számolás). */
export function napTradejei(nap: NapAdat): DatumozottTrade[] {
  const forras = [...nap.elemzesek].reverse().find((e) => e.naplo.length > 0);
  return forras ? forras.naplo.map((t) => ({ ...t, datum: nap.datum })) : [];
}

function osszeg(lista: (number | null)[]): number {
  return lista.reduce<number>((a, b) => a + (b ?? 0), 0);
}

export function osszesites(napok: NapAdat[]): Osszesites {
  const idorend = [...napok].sort((a, b) => a.datum.localeCompare(b.datum));
  const setup = { VAN: 0, NINCS: 0, FELTETELES: 0, nincsAdat: 0 };
  let pirosNapok = 0;
  const tradek: DatumozottTrade[] = [];

  for (const nap of idorend) {
    const fo = nap.elemzesek[nap.elemzesek.length - 1];
    const kat = fo?.dontes?.kategoria;
    if (kat) setup[kat]++;
    else setup.nincsAdat++;
    if (nap.elemzesek.some((e) => e.eloszures?.tonus === 'piros')) pirosNapok++;
    tradek.push(...napTradejei(nap));
  }

  const eredmenyek = tradek.map(tradeEredmeny);
  const nyero = eredmenyek.filter((e) => e !== null && e > 0).length;
  const veszto = eredmenyek.filter((e) => e !== null && e < 0).length;
  const nullas = eredmenyek.filter((e) => e === 0).length;
  const rLista = tradek.map((t) => t.r).filter((r): r is number => r !== null);
  const igen = tradek.filter((t) => t.szabaly === true).length;
  const nem = tradek.filter((t) => t.szabaly === false).length;

  let kum = 0;
  let csucs = 0;
  let maxVisszaesesR = 0;
  for (const r of rLista) {
    kum += r;
    csucs = Math.max(csucs, kum);
    maxVisszaesesR = Math.max(maxVisszaesesR, csucs - kum);
  }

  return {
    napok: napok.length,
    setup,
    pirosNapok,
    tradek,
    nyero,
    veszto,
    nullas,
    winRate: nyero + veszto > 0 ? nyero / (nyero + veszto) : null,
    osszR: osszeg(rLista),
    atlagR: rLista.length ? osszeg(rLista) / rLista.length : null,
    osszUsd: osszeg(tradek.map((t) => t.usd)),
    szabalyArany: igen + nem > 0 ? igen / (igen + nem) : null,
    maxVisszaesesR,
  };
}

/** Havi bontás, a legfrissebb hónap elöl. */
export function haviBontas(napok: NapAdat[]): HaviSor[] {
  const honapok = new Map<string, NapAdat[]>();
  for (const n of napok) {
    const h = n.datum.slice(0, 7);
    honapok.set(h, [...(honapok.get(h) ?? []), n]);
  }
  return [...honapok.entries()]
    .sort((a, b) => b[0].localeCompare(a[0]))
    .map(([honap, lista]) => {
      const o = osszesites(lista);
      return { honap, napok: o.napok, tradek: o.tradek.length, nyero: o.nyero, veszto: o.veszto, osszR: o.osszR, osszUsd: o.osszUsd };
    });
}
