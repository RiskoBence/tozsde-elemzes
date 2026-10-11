#!/usr/bin/env node
// Megmondja az ütemezett ágensnek, mit kell most csinálnia. A London-futások londoni, a NY-futások
// New York-i idő szerint számolnak, így az óraátállítás (és az EU/US eltérő átállási hetei) automatikusan rendben van.
//
//   slot          időpont (helyi)          budapesti idő   mod
//   1-london      08:00 London (nyitás)    09:00           teljes     – teljes napi elemzés
//   2-london-30   08:30 London             09:30           frissites  – London első fél órája
//   3-ny-elott    09:15 New York           15:15*          teljes     – fő elemzés a NY-ablakra
//   4-ny-utan     10:00 New York           16:00*          frissites  – NY nyitás után fél órával
//   (* az EU/US eltérő átállási hetén egy órával korábban)
//
// Minden slotnál 20 perc a tűrés (az ütemező késhet). Más időpontban: mod = "kihagy".
// NYSE-ünnepnapon az első slot egy rövid „nincs kereskedés” fájlt ír (mod = "unnep"), a többi kihagy.
// Kimenet (JSON): { mod, slot, fajl, datum (budapesti), bpIdo, etIdo }
// Minden rutin csak a saját slotjait futtathatja (különben pl. a :15-ös rutin nyári 10:15 ET-s indítása
// beleesne a „4-ny-utan” tűrésébe):  node scripts/idopont.mjs --engedett 1-london,4-ny-utan
// Teszteléshez: node scripts/idopont.mjs --slot 3-ny-elott
import { helyiIdo } from './lib/szintek.mjs';

// NYSE teljes zárvatartási napok (forrás: nyse.com/markets/hours-calendars)
const UNNEPEK = new Set([
  '2026-01-01', '2026-01-19', '2026-02-16', '2026-04-03', '2026-05-25', '2026-06-19', '2026-07-03',
  '2026-09-07', '2026-11-26', '2026-12-25',
  '2027-01-01', '2027-01-18', '2027-02-15', '2027-03-26', '2027-05-31', '2027-06-18', '2027-07-05',
  '2027-09-06', '2027-11-25', '2027-12-24',
]);

export const SLOTOK = [
  { slot: '1-london', tz: 'Europe/London', perc: 8 * 60, mod: 'teljes' },
  { slot: '2-london-30', tz: 'Europe/London', perc: 8 * 60 + 30, mod: 'frissites' },
  { slot: '3-ny-elott', tz: 'America/New_York', perc: 9 * 60 + 15, mod: 'teljes' },
  { slot: '4-ny-utan', tz: 'America/New_York', perc: 10 * 60, mod: 'frissites' },
];
const TURES = 20;

const hhmm = (p) => `${String(Math.floor(p / 60)).padStart(2, '0')}:${String(p % 60).padStart(2, '0')}`;

export function modMeghatarozasa(t = Date.now() / 1000, kenyszeritettSlot = null, engedett = null) {
  const bp = helyiIdo(t, 'Europe/Budapest');
  const et = helyiIdo(t, 'America/New_York');
  const alap = { datum: bp.datum, bpIdo: hhmm(bp.perc), etIdo: hhmm(et.perc) };
  const eredmeny = (s, mod) => ({ mod, slot: s.slot, fajl: `content/elemzesek/${bp.datum}-${s.slot}.md`, ...alap });

  if (kenyszeritettSlot) {
    const s = SLOTOK.find((x) => x.slot === kenyszeritettSlot);
    if (!s) throw new Error(`Ismeretlen slot: ${kenyszeritettSlot}`);
    return eredmeny(s, s.mod);
  }
  if (bp.hetNapja >= 6) return { mod: 'kihagy', slot: null, fajl: null, ...alap };

  const s = SLOTOK.filter((x) => !engedett || engedett.includes(x.slot)).find((x) => {
    const helyi = helyiIdo(t, x.tz);
    return helyi.perc >= x.perc && helyi.perc < x.perc + TURES;
  });
  if (!s) return { mod: 'kihagy', slot: null, fajl: null, ...alap };
  if (UNNEPEK.has(et.datum)) return s === SLOTOK[0] ? eredmeny(s, 'unnep') : { mod: 'kihagy', slot: null, fajl: null, ...alap };
  return eredmeny(s, s.mod);
}

if (process.argv[1]?.endsWith('idopont.mjs')) {
  const arg = (nev) => {
    const i = process.argv.indexOf(nev);
    return i > 0 ? process.argv[i + 1] : null;
  };
  console.log(JSON.stringify(modMeghatarozasa(Date.now() / 1000, arg('--slot'), arg('--engedett')?.split(',') ?? null)));
}
