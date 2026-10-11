import { describe, expect, it } from 'vitest';
// @ts-expect-error – .mjs modul típusdeklaráció nélkül
import { modMeghatarozasa } from '../scripts/idopont.mjs';

const mod = (iso: string) => modMeghatarozasa(Date.parse(iso) / 1000).mod;

describe('ágens időpont-kapu (New York-i idő)', () => {
  it('nyári időszámítás (EDT): 13:15 UTC = 09:15 ET → előkészítő', () => {
    expect(mod('2026-10-13T13:15:00Z')).toBe('elokeszito');
    expect(modMeghatarozasa(Date.parse('2026-10-13T13:15:00Z') / 1000)).toMatchObject({ datum: '2026-10-13', bpIdo: '15:15', etIdo: '09:15' });
  });

  it('frissítések 10:15 és 11:15 ET-kor, a 12:15 és a 08:15 kimarad', () => {
    expect(mod('2026-10-13T14:15:00Z')).toBe('frissites');
    expect(mod('2026-10-13T15:15:00Z')).toBe('frissites');
    expect(mod('2026-10-13T16:15:00Z')).toBe('kihagy');
    expect(mod('2026-10-13T12:15:00Z')).toBe('kihagy');
  });

  it('eltérő átállási hét (EU már téli, US még nyári): 13:15 UTC = 14:15 Budapest = 09:15 ET', () => {
    expect(modMeghatarozasa(Date.parse('2026-10-27T13:15:00Z') / 1000)).toMatchObject({ mod: 'elokeszito', bpIdo: '14:15' });
  });

  it('téli időszámítás (EST): 14:15 UTC = 09:15 ET', () => {
    expect(mod('2026-11-10T14:15:00Z')).toBe('elokeszito');
    expect(mod('2026-11-10T13:15:00Z')).toBe('kihagy');
  });

  it('hétvége és ünnep', () => {
    expect(mod('2026-10-10T13:15:00Z')).toBe('kihagy');
    expect(mod('2026-11-26T14:15:00Z')).toBe('unnep');
    expect(mod('2026-11-26T15:15:00Z')).toBe('kihagy');
  });
});
