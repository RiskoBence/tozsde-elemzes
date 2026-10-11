import { describe, expect, it } from 'vitest';
import { tervSzimulacio, type Gyertya } from '../src/lib/terv-szimulacio';

const g = (t: number, h: number, l: number): Gyertya => [t, (h + l) / 2, h, l, (h + l) / 2];

describe('trade terv visszajátszása', () => {
  const long = { irany: 'LONG' as const, entry: 100, sl: 90, tp: 130 };
  const short = { irany: 'SHORT' as const, entry: 100, sl: 110, tp: 70 };

  it('LONG: belépés, majd TP', () => {
    const e = tervSzimulacio([g(1, 120, 105), g(2, 106, 99), g(3, 125, 101), g(4, 131, 120)], long);
    expect(e).toEqual({ belepes: { t: 2, ar: 100 }, kilepes: { t: 4, ar: 130, tipus: 'TP' }, r: 3 });
  });

  it('LONG: belépés, majd SL', () => {
    const e = tervSzimulacio([g(1, 104, 99), g(2, 101, 89)], long);
    expect(e.kilepes).toEqual({ t: 2, ar: 90, tipus: 'SL' });
    expect(e.r).toBe(-1);
  });

  it('SHORT: belépés, majd TP (fordított irány)', () => {
    const e = tervSzimulacio([g(1, 95, 80), g(2, 101, 96), g(3, 98, 69)], short);
    expect(e).toEqual({ belepes: { t: 2, ar: 100 }, kilepes: { t: 3, ar: 70, tipus: 'TP' }, r: 3 });
  });

  it('ugyanazon a gyertyán SL és belépés → SL (konzervatív)', () => {
    expect(tervSzimulacio([g(1, 101, 89)], long).kilepes?.tipus).toBe('SL');
  });

  it('nincs belépés / nyitott pozíció / kezdő időpont', () => {
    expect(tervSzimulacio([g(1, 120, 105)], long).belepes).toBeNull();
    expect(tervSzimulacio([g(1, 104, 99), g(2, 110, 95)], long)).toMatchObject({ belepes: { t: 1 }, kilepes: null });
    expect(tervSzimulacio([g(1, 104, 99), g(5, 120, 105)], long, 3).belepes).toBeNull();
  });
});
