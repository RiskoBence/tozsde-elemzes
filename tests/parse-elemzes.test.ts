import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import { fajlnevbol, parseElemzes, szamErtek } from '../src/lib/parse-elemzes';

const fixture = (nev: string) => readFileSync(fileURLToPath(new URL(`./fixtures/${nev}`, import.meta.url)), 'utf8');
const sablon = readFileSync(fileURLToPath(new URL('../napi-elemzes-sablon.md', import.meta.url)), 'utf8');

const minta = parseElemzes('2026-10-12-elokeszito.md', fixture('2026-10-12-elokeszito.md'))!;

describe('fájlnév és dátum', () => {
  it('kiolvassa a dátumot és a slugot', () => {
    expect(fajlnevbol('content/elemzesek/2026-10-12-elokeszito.md')).toEqual({ datum: '2026-10-12', slug: 'elokeszito' });
    expect(minta.datum).toBe('2026-10-12');
    expect(minta.id).toBe('2026-10-12-elokeszito');
  });

  it('érvénytelen fájlnévnél null', () => {
    expect(fajlnevbol('jegyzet.md')).toBeNull();
    expect(fajlnevbol('2026-02-30-x.md')).toBeNull();
    expect(parseElemzes('jegyzet.md', '# x')).toBeNull();
  });

  it('a címet az első # sorból veszi', () => {
    expect(minta.cim).toBe('TECH100 napi elemzés – 2026-10-12, hétfő (előkészítő)');
  });
});

describe('jelvények', () => {
  it('előszűrés: ZÖLD + indok', () => {
    expect(minta.eloszures).toMatchObject({ cimke: 'ZÖLD', tonus: 'zold' });
    expect(minta.eloszures?.reszlet).toMatch(/nincs high impact hír/);
  });

  it('előszűrés: „eredménye” alak, PIROS', () => {
    const e = parseElemzes('2026-10-09-x.md', '**Előszűrés eredménye:** PIROS (indok: NFP)')!;
    expect(e.eloszures).toMatchObject({ cimke: 'PIROS', tonus: 'piros', reszlet: 'NFP' });
  });

  it('HTF bias feltételes → sárga', () => {
    expect(minta.bias).toMatchObject({ cimke: 'LONG', tonus: 'sarga' });
  });

  it('döntés: VAN SETUP zárójeles kiegészítéssel', () => {
    expect(minta.dontes).toMatchObject({ kategoria: 'VAN', cimke: 'VAN SETUP', felteteles: true, tonus: 'sarga' });
    expect(minta.dontes?.reszlet).toMatch(/^feltételes: csak 31 470–31 495/);
    expect(minta.dontes?.indoklasHtml).toMatch(/HTF bull/);
  });

  it('döntés: NINCS SETUP → piros', () => {
    const e = parseElemzes('2026-10-09-x.md', '## 7. Döntés\n\n**NINCS SETUP** — piros előszűrés.')!;
    expect(e.dontes).toMatchObject({ kategoria: 'NINCS', tonus: 'piros', reszlet: null });
  });

  it('frontmatter elsőbbséget kap', () => {
    const e = parseElemzes('2026-10-13-x.md', '---\ndontes: NINCS SETUP\nbias: SHORT\n---\n# Cím\n\n## 7. Döntés\n\n**VAN SETUP**')!;
    expect(e.dontes?.kategoria).toBe('NINCS');
    expect(e.bias?.cimke).toBe('SHORT');
  });
});

describe('kulcsszintek', () => {
  it('beolvassa a táblázatot, ár szerint csökkenő sorrendben', () => {
    expect(minta.kulcsszintek).toHaveLength(9);
    const ertekek = minta.kulcsszintek.map((k) => k.ertek);
    expect(ertekek).toEqual([...ertekek].sort((a, b) => b! - a!));
    expect(minta.kulcsszintek[0]).toMatchObject({ szint: 'Heti csúcs (előző hét)', ar: '31 980,0', ertek: 31980 });
  });

  it('az árat eredeti formában hagyja', () => {
    const zaro = minta.kulcsszintek.find((k) => k.szint.startsWith('Előző cash záró'))!;
    expect(zaro.ar).toBe('31 616,5');
    expect(zaro.ertek).toBe(31616.5);
    const poi = minta.kulcsszintek.find((k) => k.szint.startsWith('HTF POI'))!;
    expect(poi.arak).toEqual(['31 470,0', '31 495,0']);
  });

  it('csoportosít: célpont / POI / érvénytelenítő', () => {
    const csoport = (eleje: string) => minta.kulcsszintek.find((k) => k.szint.startsWith(eleje))!.csoport;
    expect(csoport('Előző napi csúcs')).toBe('celpont');
    expect(csoport('HTF POI')).toBe('poi');
    expect(csoport('1H FVG')).toBe('poi');
    expect(csoport('Előző napi alj')).toBe('ervenytelenito');
  });

  it('magyar számformátum', () => {
    expect(szamErtek('31 616,5')).toBe(31616.5);
    expect(szamErtek('31 616,5')).toBe(31616.5);
    expect(szamErtek('nincs')).toBeNull();
  });
});

describe('egyéb blokkok', () => {
  it('riasztások a félkövér árakból', () => {
    expect(minta.riasztasok).toEqual([
      { ar: '31 495,0', cimke: 'POI teteje' },
      { ar: '31 380,0', cimke: 'érvénytelenítő szint' },
    ]);
  });

  it('a hét többi napja', () => {
    expect(minta.hetFigyelmeztetes).toHaveLength(4);
    expect(minta.hetFigyelmeztetes[2]).toContain('CPI 14:30 → NINCS KERESKEDÉS');
  });

  it('forgatókönyvek A/B/C', () => {
    expect(minta.forgatokonyvek.map((f) => f.betu)).toEqual(['A', 'B', 'C']);
    expect(minta.forgatokonyvek[2].html).toContain('chopol');
  });

  it('checklist kipipált / nyitott', () => {
    expect(minta.checklist).toHaveLength(7);
    expect(minta.checklist.filter((c) => c.kesz)).toHaveLength(4);
  });

  it('kereskedési ablak', () => {
    expect(minta.ablak).toBe('15:45–17:30');
  });

  it('a linkek új lapon nyílnak, a táblázat görgethető wrapperben van', () => {
    const html = minta.szakaszok.map((s) => s.html).join('');
    expect(html).toMatch(/<a href="https:\/\/www\.investing\.com[^"]*"[^>]*target="_blank"/);
    expect(html).toContain('<div class="tabla-wrap"><table>');
  });
});

describe('hibatűrés', () => {
  it('hiányzó szakaszoknál sem dob hibát', () => {
    const e = parseElemzes('2026-10-14-ures.md', 'csak egy sor szöveg')!;
    expect(e.cim).toBe('ures');
    expect(e.dontes).toBeNull();
    expect(e.eloszures).toBeNull();
    expect(e.kulcsszintek).toEqual([]);
    expect(e.forgatokonyvek).toEqual([]);
  });

  it('más címmel / számozással is megtalálja a szakaszt', () => {
    const e = parseElemzes('2026-10-14-x.md', '## Döntés\n\n**NINCS SETUP**\n\n## Szintek\n\n| Szint | Ár | Megjegyzés |\n|---|---|---|\n| PDH | 31 000,0 | cél |')!;
    expect(e.dontes?.kategoria).toBe('NINCS');
    expect(e.kulcsszintek[0].ar).toBe('31 000,0');
  });

  it('a kitöltetlen sablonból nem olvas ki hamis értékeket', () => {
    const e = parseElemzes('2026-10-15-sablon.md', sablon)!;
    expect(e.eloszures).toBeNull();
    expect(e.bias).toBeNull();
    expect(e.dontes).toBeNull();
    expect(e.kulcsszintek).toEqual([]);
    expect(e.riasztasok).toEqual([]);
    expect(e.szakaszok).toHaveLength(9);
  });
});
