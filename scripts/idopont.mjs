#!/usr/bin/env node
// Megmondja az ütemezett ágensnek, mit kell most csinálnia (New York-i idő szerint, így az
// óraátállítás és az EU/US eltérő átállási hetei automatikusan rendben vannak).
//   elokeszito  – 09:00–09:44 ET (a cash nyitás előtt): teljes napi elemzés
//   frissites   – 10:00–10:44 és 11:00–11:44 ET: napközbeni frissítés
//   unnep       – NYSE-ünnepnap, az előkészítő időpontjában: rövid „nincs kereskedés” fájl
//   kihagy      – minden más időpont: semmit nem kell tenni
// Kimenet (JSON): { mod, datum (budapesti), etIdo, bpIdo }
// Teszteléshez: node scripts/idopont.mjs --mod elokeszito
import { helyiIdo } from './lib/szintek.mjs';

// NYSE teljes zárvatartási napok (forrás: nyse.com/markets/hours-calendars)
const UNNEPEK = new Set([
  '2026-01-01', '2026-01-19', '2026-02-16', '2026-04-03', '2026-05-25', '2026-06-19', '2026-07-03',
  '2026-09-07', '2026-11-26', '2026-12-25',
  '2027-01-01', '2027-01-18', '2027-02-15', '2027-03-26', '2027-05-31', '2027-06-18', '2027-07-05',
  '2027-09-06', '2027-11-25', '2027-12-24',
]);

export function modMeghatarozasa(t = Date.now() / 1000) {
  const et = helyiIdo(t, 'America/New_York');
  const bp = helyiIdo(t, 'Europe/Budapest');
  const hhmm = (p) => `${String(Math.floor(p / 60)).padStart(2, '0')}:${String(p % 60).padStart(2, '0')}`;
  const alap = { datum: bp.datum, etIdo: hhmm(et.perc), bpIdo: hhmm(bp.perc) };
  if (et.hetNapja >= 6) return { mod: 'kihagy', ...alap };
  const ora = Math.floor(et.perc / 60);
  const perc = et.perc % 60;
  if (perc >= 45) return { mod: 'kihagy', ...alap };
  if (UNNEPEK.has(et.datum)) return { mod: ora === 9 ? 'unnep' : 'kihagy', ...alap };
  if (ora === 9) return { mod: 'elokeszito', ...alap };
  if (ora === 10 || ora === 11) return { mod: 'frissites', ...alap };
  return { mod: 'kihagy', ...alap };
}

if (import.meta.url === `file://${process.argv[1]}` || process.argv[1]?.endsWith('idopont.mjs')) {
  const i = process.argv.indexOf('--mod');
  const eredmeny = modMeghatarozasa();
  if (i > 0 && process.argv[i + 1]) eredmeny.mod = process.argv[i + 1];
  console.log(JSON.stringify(eredmeny));
}
