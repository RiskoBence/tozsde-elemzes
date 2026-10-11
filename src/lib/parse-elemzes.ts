/**
 * Napi TECH100 elemzés parsolása (a `napi-elemzes-sablon.md` szerkezetéhez igazítva).
 *
 * Minden kinyerés hibatűrő: ha egy szakasz vagy sor hiányzik, az érték `null` / üres lista,
 * és a hozzá tartozó blokk egyszerűen nem jelenik meg. Ha van frontmatter, az elsőbbséget kap.
 */
import { renderInline, renderMarkdown } from './markdown';
import { SZAM_RE, szamErtek } from './szam';

export { szamErtek };

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

export interface TradeTerv {
  /** Entry ár eredeti formában, pl. „31 480,0”. */
  entry: string | null;
  entryErtek: number | null;
  stopPont: number | null;
  tpPont: number | null;
  /** LONG: vétel a belépésnél, eladás a TP-n / SL-en; SHORT: fordítva. */
  irany: 'LONG' | 'SHORT' | null;
  slAr: number | null;
  tpAr: number | null;
}

export interface Trade {
  irany: string;
  entry: string;
  sl: string;
  tp: string;
  meret: string;
  /** Az Eredmény cella eredeti szövege. */
  eredmeny: string;
  usd: number | null;
  r: number | null;
  /** true = igen, false = nem, null = nincs kitöltve */
  szabaly: boolean | null;
  tanulsag: string;
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
  tradeTerv: TradeTerv | null;
  naplo: Trade[];
  erzelmiAllapot: string | null;
  /** „## Figyeld” szakasz listaelemei (HTML) – mire kell figyelni ma. */
  figyeld: string[];
  bevezetoHtml: string | null;
  szakaszok: Szakasz[];
  /** Szakaszok, amelyek megvannak, de nem sikerült belőlük kiolvasni a várt adatot. */
  figyelmeztetesek: string[];
}

export const ALAP_ABLAK = '15:45–17:30';

const FAJLNEV_RE = /^(\d{4})-(\d{2})-(\d{2})(?:-(.+?))?(?:\.md)?$/i;

export function fajlnevbol(fajlnev: string): { datum: string; slug: string } | null {
  const alap = fajlnev.split(/[\\/]/).pop() ?? fajlnev;
  const m = alap.match(FAJLNEV_RE);
  if (!m) return null;
  const [, ev, ho, nap, slug] = m;
  const d = new Date(Date.UTC(+ev, +ho - 1, +nap));
  if (d.getUTCMonth() !== +ho - 1 || d.getUTCDate() !== +nap) return null;
  return { datum: `${ev}-${ho}-${nap}`, slug: slug ?? '' };
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

// ---------- trade terv (5.) és napló (8.) ----------

/** Előjeles magyar szám: „+1,8”, „−1”, „-0,5” → szám. A unicode mínuszt (−) és a gondolatjelet (–) is kezeli. */
export function elojelesSzam(szoveg: string): number | null {
  const m = szoveg.match(/([+\-−–])?\s*(\d{1,3}(?:[   ]\d{3})+(?:,\d+)?|\d+(?:[.,]\d+)?)/);
  if (!m) return null;
  const n = Number(m[2].replace(/[   ]/g, '').replace(',', '.'));
  if (!Number.isFinite(n)) return null;
  return m[1] && m[1] !== '+' ? -n : n;
}

/** „+1,8 USD / +2R” → { usd: 1.8, r: 2 }; „BE” → 0 / 0. */
export function eredmenyBol(szoveg: string): { usd: number | null; r: number | null } {
  const s = boldTorles(szoveg);
  if (/^\s*(BE|break\s*even|nullszaldó|0)\s*$/i.test(s)) return { usd: 0, r: 0 };
  const usdM = s.match(/([+\-−–]?\s*\d[\d   ]*(?:[.,]\d+)?)\s*(?:USD|\$)/i) ?? s.match(/\$\s*([+\-−–]?\s*\d+(?:[.,]\d+)?)/);
  const rM = s.match(/([+\-−–]?\s*\d+(?:[.,]\d+)?)\s*R\b/);
  return { usd: usdM ? elojelesSzam(usdM[1]) : null, r: rM ? elojelesSzam(rM[1]) : null };
}

function tablaOszlop(fejlec: string[], re: RegExp): number {
  return fejlec.findIndex((f) => re.test(boldTorles(f)));
}

function tradeTerv(md: string): TradeTerv | null {
  const t = elsoTablazat(md);
  if (!t) return null;
  const sor = (re: RegExp) => boldTorles(t.sorok.find((s) => re.test(boldTorles(s[0] ?? '')))?.[1] ?? '');
  const pontResz = (cella: string): number | null => {
    if (!cella) return null;
    const reszek = cella.split('/');
    if (reszek.length > 1) return szamErtek(reszek[1]);
    const n = szamErtek(cella);
    return n !== null && n < 1000 ? n : null; // egyetlen kis szám: pont
  };
  /** Az „ár / pont” cella ár része (ár-nagyságú szám a perjel előtt). */
  const arResz = (cella: string): number | null => {
    const n = cella ? szamErtek(cella.split('/')[0]) : null;
    return n !== null && n >= 1000 ? n : null;
  };
  const iranyCella = sor(/^long\s*\/\s*short|^irány/i);
  const long = /\b(long|vétel|buy)\b/i.test(iranyCella);
  const short = /\b(short|eladás|sell)\b/i.test(iranyCella);

  const entry = sor(/^entry/i);
  const slCella = sor(/^stop\s*loss|^SL\b/i);
  const tpCella = sor(/^take\s*profit|^TP\b/i);
  const entryErtek = entry ? szamErtek(entry) : null;
  let stopPont = pontResz(slCella);
  let tpPont = pontResz(tpCella);
  let slAr = arResz(slCella);
  let tpAr = arResz(tpCella);
  let irany: TradeTerv['irany'] = long === short ? null : long ? 'LONG' : 'SHORT'; // mindkettő = kitöltetlen sablon

  // Hiányzó irány: a TP / SL helyzetéből
  if (!irany && entryErtek !== null) {
    if (tpAr !== null) irany = tpAr > entryErtek ? 'LONG' : 'SHORT';
    else if (slAr !== null) irany = slAr < entryErtek ? 'LONG' : 'SHORT';
  }
  // Hiányzó ár a pontból, hiányzó pont az árból
  if (entryErtek !== null && irany) {
    const elojel = irany === 'LONG' ? 1 : -1;
    if (slAr === null && stopPont !== null) slAr = entryErtek - elojel * stopPont;
    if (tpAr === null && tpPont !== null) tpAr = entryErtek + elojel * tpPont;
    if (stopPont === null && slAr !== null) stopPont = Math.abs(entryErtek - slAr);
    if (tpPont === null && tpAr !== null) tpPont = Math.abs(tpAr - entryErtek);
  }

  const terv: TradeTerv = {
    entry: entry && /\d/.test(entry) ? entry : null,
    entryErtek,
    stopPont,
    tpPont,
    irany,
    slAr,
    tpAr,
  };
  return terv.entry || terv.stopPont ? terv : null;
}

function naplo(md: string): Trade[] {
  const t = elsoTablazat(md);
  if (!t) return [];
  const i = {
    irany: tablaOszlop(t.fejlec, /^irány/i),
    entry: tablaOszlop(t.fejlec, /^entry/i),
    sl: tablaOszlop(t.fejlec, /^SL\b|^stop/i),
    tp: tablaOszlop(t.fejlec, /^TP\b|^take/i),
    meret: tablaOszlop(t.fejlec, /^méret/i),
    eredmeny: tablaOszlop(t.fejlec, /^eredmény/i),
    szabaly: tablaOszlop(t.fejlec, /szabály/i),
    tanulsag: tablaOszlop(t.fejlec, /^tanulság/i),
  };
  if (i.irany < 0) return [];
  const cella = (s: string[], idx: number) => (idx >= 0 ? boldTorles(s[idx] ?? '') : '');
  return t.sorok
    .filter((s) => cella(s, i.irany) !== '')
    .map((s) => {
      const eredmeny = cella(s, i.eredmeny);
      const szabaly = cella(s, i.szabaly);
      return {
        irany: cella(s, i.irany),
        entry: cella(s, i.entry),
        sl: cella(s, i.sl),
        tp: cella(s, i.tp),
        meret: cella(s, i.meret),
        eredmeny,
        ...eredmenyBol(eredmeny),
        szabaly: /^(igen|i|yes|✓|✔|x)\b/i.test(szabaly) ? true : /^(nem|n|no|✗|✕)\b/i.test(szabaly) ? false : null,
        tanulsag: cella(s, i.tanulsag),
      };
    });
}

function listaElemek(md: string): string[] {
  return md
    .split('\n')
    .map((sor) => sor.match(/^\s*(?:[-*+]|\d+[.)])\s+(?!\[[ xX]\])(.+)$/)?.[1].trim())
    .filter((e): e is string => !!e)
    .map(renderInline);
}

function erzelmiAllapot(md: string): string | null {
  const m = md.match(/Érzelmi állapot[^:\n]*:\s*(.+)$/im);
  const v = m ? boldTorles(m[1]) : '';
  return v && !/^_+$/.test(v) ? v : null;
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
  const sz5 = keresSzakasz(nyers, 5, /trade\s*terv/i);
  const sz6 = keresSzakasz(nyers, 6, /checklist|ellenőrzőlista/i);
  const sz7 = keresSzakasz(nyers, 7, /döntés/i);
  const sz8 = keresSzakasz(nyers, 8, /napló/i);
  const szFigyeld = nyers.find((sz) => /figyeld|mit\s+kell\s+figyelni|figyelendő/i.test(sz.cim));

  const eloszuresSor =
    cimkesSor(sz0?.md ?? '', /Előszűrés(?:\s+eredménye)?/) ?? cimkesSor(teljes, /Előszűrés(?:\s+eredménye)?/);
  const biasSor = cimkesSor(sz1?.md ?? '', /HTF\s+bias/) ?? cimkesSor(teljes, /HTF\s+bias/);

  const fmDontes = fmErtek(fm, 'dontes', 'döntés');
  const dontes = fmDontes ? dontesJelveny(fmDontes) : dontesSorbol(sz7?.md ?? '') ?? dontesSorbol(teljes);

  const szakaszMd = sz3?.md ?? '';
  const celok = forgatokonyvSorArai(szakaszMd, /^\s*[-*]\s*\**\s*Cél/i);
  const ervenytelenek = forgatokonyvSorArai(szakaszMd, /^\s*[-*]\s*\**\s*Érvénytelen/i);

  const eredmeny: Omit<Elemzes, 'figyelmeztetesek'> = {
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
    tradeTerv: sz5 ? tradeTerv(sz5.md) : null,
    naplo: sz8 ? naplo(sz8.md) : [],
    erzelmiAllapot: sz8 ? erzelmiAllapot(sz8.md) : null,
    figyeld: szFigyeld ? listaElemek(szFigyeld.md) : [],
    bevezetoHtml: bevezeto ? renderMarkdown(bevezeto) : null,
    szakaszok: nyers.map((s) => ({ ...s, html: renderMarkdown(s.md) })),
  };

  // Ellenőrzés: csak az a szakasz számít hibának, amely megvan, de nem olvasható ki belőle a várt adat.
  // (Egy rövid frissítő fájl, amelyből szándékosan hiányoznak szakaszok, nem kap figyelmeztetést.)
  const figyelmeztetesek: string[] = [];
  if (sz0 && !eredmeny.eloszures) figyelmeztetesek.push('Előszűrés (várt: **Előszűrés: ZÖLD** vagy PIROS)');
  if (sz1 && !eredmeny.bias) figyelmeztetesek.push('HTF bias (várt: **HTF bias: LONG / SHORT / SEMLEGES**)');
  if (sz2 && eredmeny.kulcsszintek.length === 0) figyelmeztetesek.push('Kulcsszintek (várt: Szint | Ár | Megjegyzés táblázat kitöltött árakkal)');
  if (sz3 && eredmeny.forgatokonyvek.length === 0) figyelmeztetesek.push('Forgatókönyvek (várt: **A) …**, **B) …** blokkok)');
  if (sz6 && eredmeny.checklist.length === 0) figyelmeztetesek.push('Checklist (várt: - [x] / - [ ] sorok)');
  if (sz7 && !eredmeny.dontes) figyelmeztetesek.push('Döntés (várt: **VAN SETUP** / **NINCS SETUP** félkövéren)');
  const olvashatatlan = eredmeny.naplo.filter((t) => t.eredmeny && t.usd === null && t.r === null).length;
  if (olvashatatlan) figyelmeztetesek.push(`Napló: ${olvashatatlan} trade eredménye nem olvasható (várt: +1,8 USD / +2R)`);

  return { ...eredmeny, figyelmeztetesek };
}
