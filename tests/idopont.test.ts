import { describe, expect, it } from 'vitest';
// @ts-expect-error – .mjs modul típusdeklaráció nélkül
import { modMeghatarozasa } from '../scripts/idopont.mjs';

const m = (iso: string) => modMeghatarozasa(Date.parse(iso) / 1000);

describe('ágens időpont-kapu', () => {
  it('nyári időszámítás: London 07:00 / 07:30 UTC, NY 13:15 / 14:00 UTC', () => {
    expect(m('2026-10-13T07:00:00Z')).toMatchObject({ mod: 'teljes', slot: '1-london', bpIdo: '09:00', fajl: 'content/elemzesek/2026-10-13-1-london.md' });
    expect(m('2026-10-13T07:30:00Z')).toMatchObject({ mod: 'frissites', slot: '2-london-30', bpIdo: '09:30' });
    expect(m('2026-10-13T13:15:00Z')).toMatchObject({ mod: 'teljes', slot: '3-ny-elott', bpIdo: '15:15' });
    expect(m('2026-10-13T14:00:00Z')).toMatchObject({ mod: 'frissites', slot: '4-ny-utan', bpIdo: '16:00' });
  });

  it('a téli időpontra szóló párindítás nyáron kimarad (a rutin saját slotjaival)', () => {
    const r = (iso: string, engedett: string[]) => modMeghatarozasa(Date.parse(iso) / 1000, null, engedett).mod;
    const egesz = ['1-london', '4-ny-utan'];
    const negyed = ['3-ny-elott'];
    const fel = ['2-london-30'];
    expect(r('2026-10-13T08:00:00Z', egesz)).toBe('kihagy');
    expect(r('2026-10-13T08:30:00Z', fel)).toBe('kihagy');
    expect(r('2026-10-13T14:15:00Z', negyed)).toBe('kihagy'); // engedett nélkül a 4-ny-utan tűrésébe esne
    expect(r('2026-10-13T15:00:00Z', egesz)).toBe('kihagy');
    expect(r('2026-10-13T14:00:00Z', egesz)).toBe('frissites');
  });

  it('téli időszámítás: London 08:00 UTC, NY 14:15 / 15:00 UTC', () => {
    expect(m('2026-11-10T08:00:00Z')).toMatchObject({ slot: '1-london', bpIdo: '09:00' });
    expect(m('2026-11-10T08:30:00Z')).toMatchObject({ slot: '2-london-30' });
    expect(m('2026-11-10T14:15:00Z')).toMatchObject({ slot: '3-ny-elott', bpIdo: '15:15' });
    expect(m('2026-11-10T15:00:00Z')).toMatchObject({ slot: '4-ny-utan', bpIdo: '16:00' });
    expect(m('2026-11-10T07:00:00Z').mod).toBe('kihagy');
  });

  it('eltérő átállási hét (EU téli, US nyári): London 09:00, NY 14:15 / 15:00 Budapest', () => {
    expect(m('2026-10-27T08:00:00Z')).toMatchObject({ slot: '1-london', bpIdo: '09:00' });
    expect(m('2026-10-27T13:15:00Z')).toMatchObject({ slot: '3-ny-elott', bpIdo: '14:15' });
    expect(m('2026-10-27T14:00:00Z')).toMatchObject({ slot: '4-ny-utan', bpIdo: '15:00' });
  });

  it('20 perc tűrés a késő indításra', () => {
    expect(m('2026-10-13T13:33:00Z').slot).toBe('3-ny-elott');
    expect(m('2026-10-13T13:36:00Z').mod).toBe('kihagy');
  });

  it('hétvége és NYSE-ünnep', () => {
    expect(m('2026-10-10T07:00:00Z').mod).toBe('kihagy');
    expect(m('2026-11-26T08:00:00Z')).toMatchObject({ mod: 'unnep', slot: '1-london' });
    expect(m('2026-11-26T14:15:00Z').mod).toBe('kihagy');
  });

  it('kényszerített slot teszteléshez', () => {
    expect(modMeghatarozasa(Date.parse('2026-10-11T10:00:00Z') / 1000, '3-ny-elott')).toMatchObject({ mod: 'teljes', slot: '3-ny-elott' });
  });
});
