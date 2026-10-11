import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import { eredmenyBol, parseElemzes } from '../src/lib/parse-elemzes';
import { haviBontas, osszesites } from '../src/lib/statisztika';

const fixture = (nev: string) => parseElemzes(nev, readFileSync(fileURLToPath(new URL(`./fixtures/${nev}`, import.meta.url)), 'utf8'))!;
const zaro = fixture('2026-10-13-zaro.md');
const elokeszito = fixture('2026-10-12-elokeszito.md');

describe('napló parsolása', () => {
  it('csak a kitöltött sorok számítanak', () => {
    expect(zaro.naplo).toHaveLength(2);
    expect(zaro.naplo[0]).toMatchObject({ irany: 'Short', usd: 1.9, r: 2, szabaly: true, tanulsag: 'türelem kifizetődött' });
    expect(zaro.naplo[1]).toMatchObject({ usd: -1, r: -1, szabaly: false });
    expect(elokeszito.naplo).toEqual([]);
  });

  it('érzelmi állapot', () => {
    expect(zaro.erzelmiAllapot).toBe('a második trade-nél FOMO');
  });

  it('eredmény-formák', () => {
    expect(eredmenyBol('+1,8 USD / +2R')).toEqual({ usd: 1.8, r: 2 });
    expect(eredmenyBol('−0,5R')).toEqual({ usd: null, r: -0.5 });
    expect(eredmenyBol('BE')).toEqual({ usd: 0, r: 0 });
    expect(eredmenyBol('nyertem')).toEqual({ usd: null, r: null });
  });

  it('trade terv a kalkulátorhoz', () => {
    expect(zaro.tradeTerv).toEqual({ entry: '31 520,0', entryErtek: 31520, stopPont: 40, tpPont: 80, irany: 'SHORT', slAr: 31560, tpAr: 31440 });
    expect(elokeszito.tradeTerv).toMatchObject({ entry: '31 480,0', stopPont: 40, tpPont: 400, irany: 'LONG', slAr: 31440, tpAr: 31880.5 });
  });

  it('trade terv: irány és ár a pontból, kitöltetlen sablonnál nincs irány', () => {
    const terv = (sorok: string) => parseElemzes('2026-10-14-x.md', `## 5. Trade terv\n\n| Mező | Érték |\n|---|---|\n${sorok}`)!.tradeTerv;
    expect(terv('| Long / Short | Short |\n| Entry | 31 500,0 |\n| Stop Loss (ár / pont) | / 30 |\n| Take Profit (ár / pont) | / 90 |')).toMatchObject({
      irany: 'SHORT',
      slAr: 31530,
      tpAr: 31410,
    });
    expect(terv('| Entry | 31 500,0 |\n| Take Profit (ár / pont) | 31 600,0 / 100 |')).toMatchObject({ irany: 'LONG', tpAr: 31600 });
    expect(terv('| Long / Short | |\n| Entry | |\n| Stop Loss (ár / pont) | / |')).toBeNull();
  });
});

describe('statisztika', () => {
  const napok = [
    { datum: '2026-10-12', elemzesek: [elokeszito] },
    { datum: '2026-10-13', elemzesek: [zaro] },
  ];

  it('összesítés', () => {
    const o = osszesites(napok);
    expect(o.napok).toBe(2);
    expect(o.setup).toMatchObject({ VAN: 2 });
    expect(o.tradek).toHaveLength(2);
    expect(o.nyero).toBe(1);
    expect(o.veszto).toBe(1);
    expect(o.winRate).toBe(0.5);
    expect(o.osszR).toBe(1);
    expect(o.osszUsd).toBeCloseTo(0.9, 6);
    expect(o.szabalyArany).toBe(0.5);
    expect(o.maxVisszaesesR).toBe(1);
  });

  it('egy napon belül nincs duplán számolás', () => {
    const o = osszesites([{ datum: '2026-10-13', elemzesek: [zaro, { ...zaro, id: 'masolat' }] }]);
    expect(o.tradek).toHaveLength(2);
  });

  it('havi bontás', () => {
    const h = haviBontas(napok);
    expect(h).toHaveLength(1);
    expect(h[0]).toMatchObject({ honap: '2026-10', napok: 2, tradek: 2, nyero: 1, veszto: 1, osszR: 1 });
  });
});

describe('Figyeld szakasz', () => {
  it('listaelemek HTML-ként', () => {
    const e = parseElemzes('2026-10-14-x.md', '## Figyeld\n\n- **31 495,0** érintése után 15M BoS\n1. CPI 14:30\n- [ ] ez checklist, nem kell')!;
    expect(e.figyeld).toEqual(['<strong>31 495,0</strong> érintése után 15M BoS', 'CPI 14:30']);
    expect(zaro.figyeld).toEqual([]);
  });
});

describe('parse-ellenőrzés', () => {
  it('hibátlan fájlnál nincs figyelmeztetés', () => {
    expect(elokeszito.figyelmeztetesek).toEqual([]);
    expect(zaro.figyelmeztetesek).toEqual([]);
  });

  it('elírt döntés és üres kulcsszint-tábla', () => {
    const e = parseElemzes(
      '2026-10-14-x.md',
      '## 2. Kulcsszintek\n\n| Szint | Ár | Megjegyzés |\n|---|---|---|\n| PDH | | |\n\n## 7. Döntés\n\nVAN SETUP, de nincs félkövéren',
    )!;
    expect(e.figyelmeztetesek).toHaveLength(2);
    expect(e.figyelmeztetesek[0]).toMatch(/^Kulcsszintek/);
    expect(e.figyelmeztetesek[1]).toMatch(/^Döntés/);
  });

  it('rövid frissítő fájl (hiányzó szakaszok) nem kap figyelmeztetést', () => {
    expect(parseElemzes('2026-10-14-frissites.md', '## 7. Döntés\n\n**NINCS SETUP**')!.figyelmeztetesek).toEqual([]);
  });
});
