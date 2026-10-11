import { describe, expect, it } from 'vitest';
import { ablakAllapot, budapestiIdo, idotartam } from '../src/lib/ablak';

const ido = (hetNapja: number, ora: number, perc: number) => ({ datum: '2026-10-13', hetNapja, perc: ora * 60 + perc });

describe('kereskedési ablak állapota', () => {
  it('hétvége', () => {
    expect(ablakAllapot(ido(6, 16, 0), '15:45–17:30')).toEqual({ tipus: 'hetvege' });
  });

  it('nyitás előtt', () => {
    expect(ablakAllapot(ido(2, 13, 35), '15:45–17:30')).toMatchObject({ tipus: 'elotte', hatra: 130 });
  });

  it('nyitva, a határokon is', () => {
    expect(ablakAllapot(ido(2, 15, 45), '15:45–17:30')).toMatchObject({ tipus: 'nyitva', hatra: 105 });
    expect(ablakAllapot(ido(2, 17, 29), '15:45–17:30')).toMatchObject({ tipus: 'nyitva', hatra: 1 });
  });

  it('zárás után', () => {
    expect(ablakAllapot(ido(2, 17, 30), '15:45–17:30')).toMatchObject({ tipus: 'lezarva' });
  });

  it('eltolódott ablak és hibás formátum', () => {
    expect(ablakAllapot(ido(3, 15, 0), '14:45-16:30')).toMatchObject({ tipus: 'nyitva', zar: '16:30' });
    expect(ablakAllapot(ido(3, 15, 0), 'valami')).toBeNull();
  });

  it('budapesti idő (nyári és téli időszámítás)', () => {
    expect(budapestiIdo(new Date('2026-07-14T13:50:00Z'))).toEqual({ datum: '2026-07-14', hetNapja: 2, perc: 15 * 60 + 50 });
    expect(budapestiIdo(new Date('2026-12-14T14:50:00Z'))).toEqual({ datum: '2026-12-14', hetNapja: 1, perc: 15 * 60 + 50 });
  });

  it('időtartam szöveg', () => {
    expect(idotartam(130)).toBe('2 ó 10 p');
    expect(idotartam(45)).toBe('45 p');
  });
});
