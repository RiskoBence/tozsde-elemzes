import { describe, expect, it } from 'vitest';
// @ts-expect-error – .mjs modul típusdeklaráció nélkül
import { helyiIdo, kereskedesiNap, szintekSzamitasa, yahooGyertyak } from '../scripts/lib/szintek.mjs';

/** 5 perces gyertya adott UTC időpontban */
const g = (iso: string, o: number, h: number, l: number, c: number) => [Date.parse(iso) / 1000, o, h, l, c];

// 2026-10-08 (csütörtök) és 2026-10-09 (péntek), EDT (UTC−4), CEST (UTC+2)
const g5 = [
  // csütörtök cash: 09:30–16:00 ET = 13:30–20:00 UTC
  g('2026-10-08T13:30:00Z', 100, 110, 95, 105),
  g('2026-10-08T17:00:00Z', 105, 130, 104, 120), // PDH 130
  g('2026-10-08T19:55:00Z', 120, 121, 90, 101), // PDL 90, záró 101
  g('2026-10-08T21:00:00Z', 101, 200, 50, 102), // cash után: nem számít
  // péntek Ázsia 01–08 Budapest = 23:00–06:00 UTC
  g('2026-10-08T23:30:00Z', 102, 108, 99, 104),
  g('2026-10-09T05:00:00Z', 104, 106, 97, 100),
  // péntek London 09–13 Budapest = 07:00–11:00 UTC
  g('2026-10-09T08:00:00Z', 100, 115, 98, 112),
  // péntek cash nyitó
  g('2026-10-09T13:30:00Z', 111, 112, 109, 110),
];
const g1h = [
  g('2026-09-29T14:00:00Z', 80, 140, 70, 90), // előző hét (szept. 28 – okt. 2)
  g('2026-10-06T14:00:00Z', 90, 300, 10, 95), // ez a hét: nem számít
];

describe('gépi szintek', () => {
  const sz = szintekSzamitasa(g5, g1h, '2026-10-09');
  const ar = (k: string) => sz.lista.find((s: { kulcs: string }) => s.kulcs === k)?.ar;

  it('előző cash nap csúcs / alj / záró', () => {
    expect(sz.elozoNap).toBe('2026-10-08');
    expect(ar('PDH')).toBe(130);
    expect(ar('PDL')).toBe(90);
    expect(ar('PDC')).toBe(101);
  });

  it('Ázsia és London (budapesti idő)', () => {
    expect(ar('AH')).toBe(108);
    expect(ar('AL')).toBe(97);
    expect(ar('LH')).toBe(115);
    expect(ar('LL')).toBe(98);
  });

  it('nyitó és gap', () => {
    expect(ar('ON')).toBe(111);
    expect(sz.gap).toBe(10);
  });

  it('előző hét', () => {
    expect(ar('PWH')).toBe(140);
    expect(ar('PWL')).toBe(70);
  });

  it('ár szerint csökkenő sorrend', () => {
    const arak = sz.lista.map((s: { ar: number }) => s.ar);
    expect(arak).toEqual([...arak].sort((a, b) => b - a));
  });
});

describe('segédfüggvények', () => {
  it('időzónák', () => {
    expect(helyiIdo(Date.parse('2026-10-09T13:30:00Z') / 1000, 'America/New_York')).toMatchObject({ datum: '2026-10-09', perc: 9 * 60 + 30 });
    expect(helyiIdo(Date.parse('2026-10-08T23:30:00Z') / 1000, 'Europe/Budapest')).toMatchObject({ datum: '2026-10-09', perc: 90 });
  });

  it('kereskedési nap hétvégén az utolsó hétköznap', () => {
    expect(kereskedesiNap(Date.parse('2026-10-11T10:00:00Z') / 1000)).toBe('2026-10-09');
    expect(kereskedesiNap(Date.parse('2026-10-12T10:00:00Z') / 1000)).toBe('2026-10-12');
  });

  it('Yahoo válasz: hiányos sorok kiszűrése', () => {
    const v = { chart: { result: [{ timestamp: [1, 2], indicators: { quote: [{ open: [1, null], high: [2, 2], low: [0.5, 1], close: [1.5, 1] }] } }] } };
    expect(yahooGyertyak(v)).toEqual([[1, 1, 2, 0.5, 1.5]]);
    expect(() => yahooGyertyak({ chart: { error: 'x' } })).toThrow();
  });
});
