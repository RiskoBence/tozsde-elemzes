import { describe, expect, it } from 'vitest';
import { meretSzamitas } from '../src/lib/meret';
import { bemenetSzam, huSzam } from '../src/lib/szam';

describe('méretkalkulátor (sablon példái)', () => {
  it.each([
    [30, 0.03, true],
    [40, 0.024, false],
    [60, 0.016, false],
    [100, 0.009, false],
    [200, 0.004, false],
  ])('%i pont → %f', (stop, meret, plafon) => {
    const e = meretSzamitas({ stopPont: stop })!;
    expect(e.meret).toBe(meret);
    expect(e.plafonAktiv).toBe(plafon);
  });

  it('30 pontnál a plafon miatt ~0,94 USD a kockázat', () => {
    expect(meretSzamitas({ stopPont: 30 })!.kockazatUsd).toBeCloseTo(0.936, 3);
  });

  it('margin és R:R', () => {
    const e = meretSzamitas({ stopPont: 40, entry: 31480, tpPont: 80 })!;
    expect(e.marginUsd).toBeCloseTo(0.024 * 31480 * 0.05, 6);
    expect(e.rr).toBe(2);
  });

  it('érvénytelen stop → null', () => {
    expect(meretSzamitas({ stopPont: 0 })).toBeNull();
    expect(meretSzamitas({ stopPont: -5 })).toBeNull();
    expect(meretSzamitas({ stopPont: null })).toBeNull();
  });
});

describe('számformátum', () => {
  it('bemenet: vessző, pont, szóköz', () => {
    expect(bemenetSzam('40,5')).toBe(40.5);
    expect(bemenetSzam('31 480.0')).toBe(31480);
    expect(bemenetSzam('abc')).toBeNull();
  });

  it('magyar kimenet', () => {
    expect(huSzam(31616.5, 1)).toBe('31 616,5');
    expect(huSzam(0.024, 3)).toBe('0,024');
    expect(huSzam(-36.5, 1, true)).toBe('−36,5');
    expect(huSzam(264, 1, true)).toBe('+264,0');
  });
});
