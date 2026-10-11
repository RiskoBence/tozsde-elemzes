/**
 * Napi TECH100 elemzés parsolása (a `napi-elemzes-sablon.md` szerkezetéhez igazítva).
 *
 * Minden kinyerés hibatűrő: ha egy szakasz vagy sor hiányzik, az érték `null` / üres lista,
 * és a hozzá tartozó blokk egyszerűen nem jelenik meg. Ha van frontmatter, az elsőbbséget kap.
 */
import { renderInline, renderMarkdown } from './markdown';

export type Tonus = 'zold' | 'piros' | 'sarga' | 'semleges';

export interface Jelveny {
  /** Rövid felirat a jelvényen, pl. „ZÖLD”, „VAN SETUP”, „LONG”. */
  cimke: string;
  tonus: Tonus;
  /** Kiegészítés (zárójeles rész, indok). */
  reszlet: string | null;
}

export interface Dontes extends Jelveny {
  kategoria: 'VAN' | 'NINCS' | 'FELTETELES' | null;
  felteteles: boolean;
  /** A döntés utáni indoklás HTML-ként. */
  indoklasHtml: string | null;
}

export type SzintCsoport = 'celpont' | 'poi' | 'ervenytelenito' | 'egyeb';

export interface Kulcsszint {
  szint: string;
  /** Az ár pontosan úgy, ahogy a markdownban szerepel (pl. „31 616,5”). */
  ar: string;
  /** Az árban szereplő egyes számok (tartománynál kettő), eredeti formában. */
  arak: string[];
  megjegyzes: string;
  /** Rendezéshez: az első szám értéke. */
  ertek: number | null;
  csoport: SzintCsoport;
}

export interface Riasztas {
  ar: string;
  cimke: string | null;
}

export interface Forgatokonyv {
  betu: string;
  cim: string;
  html: string;
}

export interface ChecklistElem {
  kesz: boolean;
  html: string;
}

export interface Szakasz {
  szam: number | null;
  cim: string;
  md: string;
  html: string;
}

export interface Elemzes {
  /** Fájlnév kiterjesztés nélkül, pl. `2026-10-12-elokeszito`. */
  id: string;
  datum: string;
  slug: string;
  cim: string;
  eloszures: Jelveny | null;
  bias: Jelveny | null;
  dontes: Dontes | null;
  ablak: string;
  kulcsszintek: Kulcsszint[];
  riasztasok: Riasztas[];
  hetFigyelmeztetes: string[];
  forgatokonyvek: Forgatokonyv[];
  checklist: ChecklistElem[];
  bevezetoHtml: string | null;
  szakaszok: Szakasz[];
}

export const ALAP_ABLAK = '15:45–17:30';

const FAJLNEV_RE = /^(\d{4})-(\d{2})-(\d{2})(?:-(.+?))?(?:\.md)?$/i;

/** Magyar formátumú szám: szóköz / nbsp ezres elválasztó, tizedesvessző. */
const SZAM_RE = /\d{1,3}(?:[   ]\d{3})+(?:,\d+)?|\d+(?:,\d+)?/g;

export function fajlnevbol(fajlnev: string): { datum: string; slug: string } | null {
  const alap = fajlnev.split(/[\\/]/).pop() ?? fajlnev;
  const m = alap.match(FAJLNEV_RE);
  if (!m) return null;
  const [, ev, ho, nap, slug] = m;
  const d = new Date(Date.UTC(+ev, +ho - 1, +nap));
  if (d.getUTCMonth() !== +ho - 1 || d.getUTCDate() !== +nap) return null;
  return { datum: `${ev}-${ho}-${nap}`, slug: slug ?? '' };
}

/** „31 616,5” → 31616.5 */
export function szamErtek(szoveg: string): number | null {
  const m = szoveg.match(SZAM_RE);
  if (!m) return null;
  const n = Number(m[0].replace(/[   ]/g, '').replace(',', '.'));
  return Number.isFinite(n) ? n : null;
}

function boldTorles(s: string): string {
  return s.replace(/\*\*/g, '').replace(/__/g, '').trim();
}

function zarojel(s: string): { fo: string; reszlet: string | null } {
  const m = s.match(/^([^(]*?)\s*\((.*)\)\s*$/);
  if (m) return { fo: m[1].trim(), reszlet: m[2].trim() || null };
  return { fo: s.trim(), reszlet: null };
}

// ---------- frontmatter (ha a parsoló nyers fájlt kap) ----------

function frontmatterLevalaszt(md: string): { adat: Record<string, string>; torzs: string } {
  const m = md.match(/^﻿?---\r?\n([\s\S]*?)\r?\n---\r?\n?/);
  if (!m) return { adat: {}, torzs: md.replace(/^﻿/, '') };
  const adat: Record<string, string> = {};
  for (const sor of m[1].split(/\r?\n/)) {
    const kv = sor.match(/^\s*([\wáéíóöőúüű-]+)\s*:\s*(.*?)\s*$/i);
    if (kv) adat[kv[1].toLowerCase()] = kv[2].replace(/^["']|["']$/g, '');
  }
  return { adat, torzs: md.slice(m[0].length) };
}

function fmErtek(fm: Record<string, unknown>, ...kulcsok: string[]): string | null {
  for (const k of kulcsok) {
    const v = fm[k];
    if (typeof v === 'string' && v.trim()) return v.trim();
  }
  return null;
}

// ---------- szakaszok ----------

export function szakaszokra(torzs: string): { cim: string | null; bevezeto: string; szakaszok: Omit<Szakasz, 'html'>[] } {
  const sorok = torzs.replace(/\r\n?/g, '\n').split('\n');
  let cim: string | null = null;
  const bevezeto: string[] = [];
  const szakaszok: Omit<Szakasz, 'html'>[] = [];
  let aktualis: { szam: number | null; cim: string; sorok: string[] } | null = null;
  let kodban = false;

  for (const sor of sorok) {
    if (/^\s*(```|~~~)/.test(sor)) kodban = !kodban;
    if (!kodban && cim === null && /^#\s+/.test(sor)) {
      cim = sor.replace(/^#\s+/, '').trim();
      continue;
    }
    const h2 = !kodban && sor.match(/^##\s+(.*)$/);
    if (h2) {
      if (aktualis) szakaszok.push({ szam: aktualis.szam, cim: aktualis.cim, md: aktualis.sorok.join('\n').trim() });
      const cimSzoveg = h2[1].trim();
      const szam = cimSzoveg.match(/^(\d+)[.)]/);
      aktualis = { szam: szam ? Number(szam[1]) : null, cim: cimSzoveg, sorok: [] };
      continue;
    }
    (aktualis ? aktualis.sorok : bevezeto).push(sor);
  }
  if (aktualis) szakaszok.push({ szam: aktualis.szam, cim: aktualis.cim, md: aktualis.sorok.join('\n').trim() });
  return { cim, bevezeto: bevezeto.join('\n').trim(), szakaszok };
}

function keresSzakasz<T extends { szam: number | null; cim: string }>(lista: T[], szam: number, kulcsszo: RegExp): T | undefined {
  return (
    lista.find((s) => s.szam === szam && kulcsszo.test(s.cim)) ??
    lista.find((s) => kulcsszo.test(s.cim)) ??
    lista.find((s) => s.szam === szam)
  );
}

// ---------- jelvények ----------

/** Egy `**Címke:** érték` vagy `**Címke: érték**` sor értéke (bold jelek nélkül). */
function cimkesSor(md: string, cimke: RegExp): string | null {
  for (const sor of md.split('\n')) {
    const tiszta = sor.replace(/^\s*(?:[-*+]\s+|>\s*)/, '');
    const m = tiszta.match(new RegExp(`^\\*\\*\\s*(?:${cimke.source})\\s*:?\\s*(?:\\*\\*)?\\s*(.*)$`, 'i'));
    if (m) {
      const ertek = boldTorles(m[1]);
      return ertek || null;
    }
  }
  return null;
}

export function eloszuresJelveny(ertek: string | null): Jelveny | null {
  if (!ertek) return null;
  const v = boldTorles(ertek);
  const zold = /\bZ[ÖO]LD\b/i.test(v);
  const piros = /\bPIROS\b/i.test(v);
  if (zold === piros) return null; // nincs kitöltve („ZÖLD / PIROS”) vagy értelmezhetetlen
  const indok = v
    .replace(/^\s*(Z[ÖO]LD|PIROS)\s*/i, '')
    .replace(/^[—–:-]\s*/, '')
    .replace(/^\((.*)\)$/, '$1')
    .replace(/^indok:\s*/i, '')
    .trim();
  return {
    cimke: zold ? 'ZÖLD' : 'PIROS',
    tonus: zold ? 'zold' : 'piros',
    reszlet: indok || null,
  };
}

export function biasJelveny(ertek: string | null): Jelveny | null {
  if (!ertek) return null;
  const v = boldTorles(ertek);
  const talalt = ['LONG', 'SHORT', 'SEMLEGES'].filter((k) => new RegExp(`\\b${k}\\b`, 'i').test(v));
  if (talalt.length !== 1) return null; // kitöltetlen sablon: „LONG / SHORT / SEMLEGES”
  const irany = talalt[0];
  const feltetelesE = /feltételes/i.test(v);
  const maradek = v.replace(new RegExp(`\\b${irany}\\b`, 'i'), '').trim();
  const reszlet = maradek.replace(/^[—–:-]\s*/, '').replace(/^\((.*)\)$/, '$1').trim() || null;
  return {
    cimke: irany,
    tonus: feltetelesE ? 'sarga' : irany === 'LONG' ? 'zold' : irany === 'SHORT' ? 'piros' : 'semleges',
    reszlet,
  };
}

export function dontesJelveny(boldResz: string | null, indoklas: string | null = null): Dontes | null {
  if (!boldResz) return null;
  const v = boldTorles(boldResz);
  const van = /\bVAN\s+SETUP\b/i.test(v);
  const nincs = /\bNINCS\s+SETUP\b/i.test(v);
  const feltTerv = /feltételes\s+terv/i.test(v);
  if (van && nincs) return null; // kitöltetlen sablon: „VAN SETUP / NINCS SETUP”
  if (!van && !nincs && !feltTerv) return null;
  const { reszlet } = zarojel(v);
  const felteteles = /feltételes/i.test(v);
  const kategoria = nincs ? 'NINCS' : van ? 'VAN' : 'FELTETELES';
  const ind = indoklas?.replace(/^\s*[—–:-]+\s*/, '').trim();
  return {
    cimke: kategoria === 'NINCS' ? 'NINCS SETUP' : kategoria === 'VAN' ? 'VAN SETUP' : 'FELTÉTELES TERV',
    tonus: kategoria === 'NINCS' ? 'piros' : felteteles ? 'sarga' : 'zold',
    reszlet,
    kategoria,
    felteteles,
    indoklasHtml: ind ? renderInline(ind) : null,
  };
}

function dontesSorbol(md: string): Dontes | null {
  for (const sor of md.split('\n')) {
    const m = sor.match(/^\s*(?:[-*+]\s+|>\s*)?\*\*(.+?)\*\*(.*)$/);
    if (!m) continue;
    const d = dontesJelveny(m[1], m[2]);
    if (d) return d;
  }
  return null;
}

// ---------- táblázat ----------

function cellak(sor: string): string[] {
  return sor
    .trim()
    .replace(/^\|/, '')
    .replace(/\|$/, '')
    .split(/(?<!\\)\|/)
    .map((c) => c.replace(/\\\|/g, '|').trim());
}

export function elsoTablazat(md: string): { fejlec: string[]; sorok: string[][] } | null {
  const sorok = md.split('\n');
  for (let i = 0; i < sorok.length - 1; i++) {
    if (/^\s*\|.*\|\s*$/.test(sorok[i]) && /^\s*\|?\s*:?-{2,}/.test(sorok[i + 1])) {
      const fejlec = cellak(sorok[i]);
      const adat: string[][] = [];
      for (let j = i + 2; j < sorok.length && /^\s*\|/.test(sorok[j]); j++) adat.push(cellak(sorok[j]));
      return { fejlec, sorok: adat };
    }
  }
  return null;
}

function csoportKulcsszobol(szoveg: string): SzintCsoport {
  if (/érvénytelen|invalid/i.test(szoveg)) return 'ervenytelenito';
  if (/\bPOI\b|\bFVG\b|imbalance|\bOB\b|order\s*block/i.test(szoveg)) return 'poi';
  if (/cél|target|likvidit|csúcs|alj|\bP[DW][HL]\b|high|low/i.test(szoveg)) return 'celpont';
  return 'egyeb';
}

function kulcsszintek(md: string, celok: number[], ervenytelenek: number[]): Kulcsszint[] {
  const t = elsoTablazat(md);
  if (!t) return [];
  const idx = (re: RegExp, alap: number) => {
    const i = t.fejlec.findIndex((f) => re.test(boldTorles(f)));
    return i >= 0 ? i : alap;
  };
  const iSzint = idx(/^szint/i, 0);
  const iAr = idx(/^ár\b/i, 1);
  const iMegj = idx(/^megjegyz/i, 2);
  const egyezik = (n: number | null, lista: number[]) => n !== null && lista.some((x) => Math.abs(x - n) < 0.01);

  const eredmeny: Kulcsszint[] = [];
  for (const sor of t.sorok) {
    const ar = boldTorles(sor[iAr] ?? '');
    if (!ar || !/\d/.test(ar)) continue; // kitöltetlen sor
    const szint = boldTorles(sor[iSzint] ?? '');
    const megjegyzes = boldTorles(sor[iMegj] ?? '');
    const arak = ar.match(SZAM_RE) ?? [];
    const ertekek = arak.map(szamErtek);
    const ertek = ertekek[0] ?? null;
    let csoport: SzintCsoport;
    if (ertekek.some((e) => egyezik(e, ervenytelenek))) csoport = 'ervenytelenito';
    else if (ertekek.some((e) => egyezik(e, celok))) csoport = 'celpont';
    else csoport = csoportKulcsszobol(`${szint} ${megjegyzes}`);
    eredmeny.push({ szint, ar, arak, megjegyzes, ertek, csoport });
  }
  return eredmeny.sort((a, b) => (b.ertek ?? -Infinity) - (a.ertek ?? -Infinity));
}

// ---------- forgatókönyvek ----------

function forgatokonyvek(md: string): Forgatokonyv[] {
  const lista: { betu: string; cim: string; sorok: string[] }[] = [];
  for (const sor of md.split('\n')) {
    const m = sor.match(/^\s*\*\*\s*([A-Z])\)\s*(.*?)\*\*(.*)$/);
    if (m) {
      lista.push({ betu: m[1], cim: m[2].trim(), sorok: m[3].trim() ? [m[3].trim().replace(/^[,:]\s*/, '')] : [] });
    } else if (lista.length) {
      lista[lista.length - 1].sorok.push(sor);
    }
  }
  return lista.map((f) => ({ betu: f.betu, cim: f.cim, html: renderMarkdown(f.sorok.join('\n').trim()) }));
}

function forgatokonyvSorArai(md: string, kulcs: RegExp): number[] {
  const eredmeny: number[] = [];
  let aBlokk = false;
  for (const sor of md.split('\n')) {
    const fejlec = sor.match(/^\s*\*\*\s*([A-Z])\)/);
    if (fejlec) aBlokk = fejlec[1] === 'A';
    if (aBlokk && kulcs.test(sor)) {
      for (const s of sor.match(SZAM_RE) ?? []) {
        const n = szamErtek(s);
        if (n !== null && n >= 100) eredmeny.push(n);
      }
    }
  }
  return eredmeny;
}

// ---------- egyéb blokkok ----------

function checklist(md: string): ChecklistElem[] {
  const elemek: ChecklistElem[] = [];
  for (const sor of md.split('\n')) {
    const m = sor.match(/^\s*[-*+]\s+\[([ xX])\]\s+(.+)$/);
    if (m) elemek.push({ kesz: m[1].toLowerCase() === 'x', html: renderInline(m[2].trim()) });
  }
  return elemek;
}

function riasztasok(md: string): Riasztas[] {
  const eredmeny: Riasztas[] = [];
  for (const sor of md.split('\n')) {
    if (!/riaszt[áa]s/i.test(sor)) continue;
    const re = /\*\*([^*]*\d[^*]*)\*\*\s*(?:\(([^)]*)\))?/g;
    let m: RegExpExecArray | null;
    while ((m = re.exec(sor))) {
      const ar = m[1].trim();
      if (ar.replace(/\D/g, '').length < 3) continue;
      eredmeny.push({ ar, cimke: m[2]?.trim() || null });
    }
  }
  return eredmeny;
}

const NAPNEV_RE = /^(hétfő|kedd|szerda|csütörtök|péntek|szombat|vasárnap)/i;

function hetFigyelmeztetes(md: string): string[] {
  const sorok = md.split('\n');
  const listaElem = (s: string) => s.match(/^\s*[-*+]\s+(?!\[[ xX]\])(.+)$/)?.[1].trim();

  // 1) Címkézett blokk: „A hét többi napja:” / „Heti naptár” után következő lista.
  const kezdet = sorok.findIndex((s) => /hét\s+(többi|további|hátralévő)\s+nap|heti\s+(hír)?naptár|a\s+hét\s+(hírei|eseményei)/i.test(s) && !/^\s*[-*+]\s/.test(s));
  if (kezdet >= 0) {
    const elemek: string[] = [];
    for (let i = kezdet + 1; i < sorok.length; i++) {
      const e = listaElem(sorok[i]);
      if (e) elemek.push(e);
      else if (sorok[i].trim() === '' && elemek.length === 0) continue;
      else break;
    }
    if (elemek.length) return elemek.map(renderInline);
  }

  // 2) Tartalék: napnévvel kezdődő listaelemek, amelyekben „NINCS KERESKEDÉS” szerepel.
  return sorok
    .map(listaElem)
    .filter((e): e is string => !!e && NAPNEV_RE.test(boldTorles(e)) && /NINCS\s+KERESKED/i.test(e))
    .map(renderInline);
}

function ablak(md: string): string {
  const m = md.match(/Ablak[^:\n]*:\s*\**\s*(\d{1,2}:\d{2})\s*[–—-]\s*(\d{1,2}:\d{2})/i);
  return m ? `${m[1]}–${m[2]}` : ALAP_ABLAK;
}

// ---------- fő függvény ----------

/**
 * @param fajlnev pl. `2026-10-12-elokeszito.md` (útvonal is lehet)
 * @param tartalom a markdown (frontmatterrel vagy anélkül)
 * @param frontmatter már feldolgozott frontmatter (pl. Astro content collectionből) – elsőbbséget kap
 * @returns `null`, ha a fájlnévből nem olvasható ki dátum
 */
export function parseElemzes(fajlnev: string, tartalom: string, frontmatter: Record<string, unknown> = {}): Elemzes | null {
  const nev = fajlnevbol(fajlnev);
  if (!nev) return null;

  const { adat, torzs } = frontmatterLevalaszt(tartalom);
  const fm: Record<string, unknown> = { ...adat, ...frontmatter };
  const { cim, bevezeto, szakaszok: nyers } = szakaszokra(torzs);
  const teljes = torzs.replace(/\r\n?/g, '\n');

  const sz0 = keresSzakasz(nyers, 0, /előszűrés|elöszűrés/i);
  const sz1 = keresSzakasz(nyers, 1, /HTF|magasabb idősík|irány/i);
  const sz2 = keresSzakasz(nyers, 2, /kulcsszint|szintek/i);
  const sz3 = keresSzakasz(nyers, 3, /forgatókönyv/i);
  const sz6 = keresSzakasz(nyers, 6, /checklist|ellenőrzőlista/i);
  const sz7 = keresSzakasz(nyers, 7, /döntés/i);

  const eloszuresSor =
    cimkesSor(sz0?.md ?? '', /Előszűrés(?:\s+eredménye)?/) ?? cimkesSor(teljes, /Előszűrés(?:\s+eredménye)?/);
  const biasSor = cimkesSor(sz1?.md ?? '', /HTF\s+bias/) ?? cimkesSor(teljes, /HTF\s+bias/);

  const fmDontes = fmErtek(fm, 'dontes', 'döntés');
  const dontes = fmDontes ? dontesJelveny(fmDontes) : dontesSorbol(sz7?.md ?? '') ?? dontesSorbol(teljes);

  const szakaszMd = sz3?.md ?? '';
  const celok = forgatokonyvSorArai(szakaszMd, /^\s*[-*]\s*\**\s*Cél/i);
  const ervenytelenek = forgatokonyvSorArai(szakaszMd, /^\s*[-*]\s*\**\s*Érvénytelen/i);

  return {
    id: `${nev.datum}${nev.slug ? `-${nev.slug}` : ''}`,
    datum: nev.datum,
    slug: nev.slug,
    cim: fmErtek(fm, 'cim', 'cím', 'title') ?? cim ?? (nev.slug || nev.datum),
    eloszures: eloszuresJelveny(fmErtek(fm, 'eloszures', 'előszűrés', 'elszures') ?? eloszuresSor),
    bias: biasJelveny(fmErtek(fm, 'bias', 'htf_bias') ?? biasSor),
    dontes,
    ablak: fmErtek(fm, 'ablak') ?? ablak(teljes),
    kulcsszintek: sz2 ? kulcsszintek(sz2.md, celok, ervenytelenek) : [],
    riasztasok: riasztasok(sz7?.md ?? '').length ? riasztasok(sz7?.md ?? '') : riasztasok(teljes),
    hetFigyelmeztetes: hetFigyelmeztetes(teljes),
    forgatokonyvek: sz3 ? forgatokonyvek(sz3.md) : [],
    checklist: checklist(sz6?.md ?? '').length ? checklist(sz6?.md ?? '') : checklist(teljes),
    bevezetoHtml: bevezeto ? renderMarkdown(bevezeto) : null,
    szakaszok: nyers.map((s) => ({ ...s, html: renderMarkdown(s.md) })),
  };
}
