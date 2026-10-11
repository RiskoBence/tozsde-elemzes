#!/usr/bin/env node
// NQ=F (Nasdaq-100 határidős, a TECH100 CFD legközelebbi nyilvános megfelelője) letöltése a Yahoo Finance-ról,
// gépi kulcsszintek számítása, és kiírás a public/adat/ mappába:
//   public/adat/nq.json              – a legfrissebb adat (diagram + szintek)
//   public/adat/nap/YYYY-MM-DD.json  – napi pillanatkép az archívumhoz
// Hiba esetén nem írja felül a meglévő fájlokat, és 1-es kóddal lép ki.
import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { kereskedesiNap, napokGyertyai, szintekSzamitasa, yahooGyertyak } from './lib/szintek.mjs';

const GYOKER = join(dirname(fileURLToPath(import.meta.url)), '..');
const KI = join(GYOKER, 'public', 'adat');
const SZIMBOLUM = 'NQ=F';

async function letolt(intervallum, idoszak) {
  const url = `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(SZIMBOLUM)}?interval=${intervallum}&range=${idoszak}`;
  let utolsoHiba;
  for (let probalkozas = 1; probalkozas <= 3; probalkozas++) {
    try {
      const v = await fetch(url, { headers: { 'User-Agent': 'Mozilla/5.0 (tozsde-elemzes)' }, signal: AbortSignal.timeout(20_000) });
      if (!v.ok) throw new Error(`HTTP ${v.status}`);
      return yahooGyertyak(await v.json());
    } catch (e) {
      utolsoHiba = e;
      await new Promise((r) => setTimeout(r, 2000 * probalkozas));
    }
  }
  throw new Error(`${SZIMBOLUM} ${intervallum} letöltése sikertelen: ${utolsoHiba?.message}`);
}

const g5 = await letolt('5m', '5d');
const g1h = await letolt('60m', '1mo');
if (g5.length === 0) throw new Error('Üres 5 perces adatsor');

const datum = kereskedesiNap();
const szintek = szintekSzamitasa(g5, g1h, datum);
const utolso = g5.at(-1);
const napok = [szintek.elozoNap, datum].filter(Boolean);

const adat = (gyertyak5) => ({
  forras: `Yahoo Finance ${SZIMBOLUM}`,
  szimbolum: SZIMBOLUM,
  frissitve: new Date().toISOString(),
  utolsoAr: utolso[4],
  utolsoIdo: new Date(utolso[0] * 1000).toISOString(),
  datum,
  szintek,
  g5: gyertyak5,
  g1h: g1h.slice(-24 * 10),
});

mkdirSync(join(KI, 'nap'), { recursive: true });
writeFileSync(join(KI, 'nq.json'), JSON.stringify(adat(napokGyertyai(g5, napok))));
writeFileSync(join(KI, 'nap', `${datum}.json`), JSON.stringify(adat(napokGyertyai(g5, napok))));

const fmt = (x) => x.toLocaleString('hu-HU', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
console.log(`NQ=F adat frissítve: ${datum}, utolsó ár ${fmt(utolso[4])} (${new Date(utolso[0] * 1000).toISOString()})`);
for (const s of szintek.lista) console.log(`  ${s.kulcs.padEnd(4)} ${fmt(s.ar).padStart(10)}  ${s.nev}`);
