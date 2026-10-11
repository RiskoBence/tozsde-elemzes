Építs egy modern, mobilbarát statikus weboldalt a napi Nasdaq-100 (TECH100 CFD) price action elemzéseimhez. Az oldal minden nap a legfrissebb elemzést mutatja, és archívumot ad a korábbi napokhoz. Telefonról is gyorsan olvashatónak kell lennie, mert kereskedés előtt főleg onnan nézem.

## Stack
- Astro (legfrissebb stabil verzió) + TypeScript, Content Collections a markdown fájlokhoz.
- Stílus: Tailwind CSS. Nincs nehéz UI-könyvtár, nincs backend, nincs adatbázis.
- Kimenet: teljesen statikus build (`npm run build` → `dist/`).
- Deploy: GitHub Pages, GitHub Actions workflow-val, ami minden push után újraépít és publikál. Írd meg a `.github/workflows/deploy.yml`-t, és a README-ben írd le lépésről lépésre, hogyan kapcsolom be a Pages-t.

## Adatforrás (a legfontosabb rész)
- Az elemzések a `content/elemzesek/` mappában vannak, napi markdown fájlokként. Fájlnév: `YYYY-MM-DD-<valami>.md` (pl. `2026-10-12-elokeszito.md`). Egy naphoz több fájl is lehet (pl. előkészítő + napközbeni frissítés).
- A fájloknak NINCS frontmatterje. A dátumot a fájlnévből olvasd ki, a címet az első `# ` címsorból. Ne követeld meg a frontmattert, de ha később lesz (pl. `dontes`, `bias`), azt használd elsőbbséggel.
- A fájlok egy kötött sablont követnek (`napi-elemzes-sablon.md`, másold a repóba referenciának). Számozott szakaszok `## 0.` … `## 8.`: előszűrés, HTF irány, kulcsszintek, forgatókönyvek, belépési feltételek, trade terv, checklist, döntés, napló. Nézd meg a mintafájlt, és a parsolást ehhez igazítsd, de legyen hibatűrő: ha egy szakasz hiányzik vagy más a címe, az oldal ne törjön el, csak az a blokk maradjon ki.
- Új nap hozzáadása = új .md fájl bemásolása + push. Kódot ehhez ne kelljen módosítani.

## Amit build-időben ki kell nyerni a markdownból
- Előszűrés eredménye: a `**Előszűrés: ZÖLD**` / `PIROS` sor (vagy `**Előszűrés eredménye:**`). Színes jelvényként jelenjen meg.
- HTF bias: a `**HTF bias: ...**` sor (LONG / SHORT / SEMLEGES, esetleg „feltételes”).
- Döntés: a `## 7. Döntés` szakasz első félkövér sora (`VAN SETUP` / `NINCS SETUP`, zárójeles kiegészítéssel). Ez a nap legfontosabb jelvénye.
- Kulcsszintek: a `## 2.` szakasz táblázata (Szint | Ár | Megjegyzés).
- Riasztások: a „Javasolt riasztások” / „Riasztások beállítva” sorban félkövérrel szereplő árak.
- A hét többi napja: ha van ilyen lista (pl. „CPI 14:30 → NINCS KERESKEDÉS”), azt külön figyelmeztető blokkban mutasd.
Az árak magyar formátumúak (szóköz ezres elválasztó, tizedesvessző, pl. `31 616,5`). Így jelenítsd meg őket, ne alakítsd át.

## Oldalak
1. Főoldal `/` = a legfrissebb nap:
   - Felül egy „mai összkép” kártyasor: dátum + nap neve magyarul, Előszűrés jelvény, HTF bias, Döntés jelvény, kereskedési ablak (15:45–17:30 Budapest).
   - Kulcsszintek kártya: árszerint csökkenő sorrendben, a mostani zóna logikája szerint vizuálisan csoportosítva (célpontok / POI / érvénytelenítő). Egy szint koppintásra másolható (vágólapra), hogy a brókerben gyorsan beírhassam a riasztást.
   - Forgatókönyvek (A / B / C) külön kártyákon, A zöldes, B sárgás, C szürke kiemeléssel.
   - Checklist a `- [x]` / `- [ ]` elemekből, kipipált és nyitott állapottal (csak megjelenítés, nem szerkeszthető).
   - Alatta a teljes elemzés szövege összecsukható szakaszokban (accordion), a táblázatok vízszintesen görgethetők mobilon.
2. Archívum `/archivum`: időrendben fordított lista, naponként egy sor a dátummal, Döntés és Előszűrés jelvénnyel. Szűrés hónapra és döntésre (VAN / NINCS SETUP).
3. Napi oldal `/nap/YYYY-MM-DD`: ugyanaz a nézet, mint a főoldal, előző / következő nap navigációval. Ha egy naphoz több fájl van, fülekkel váltson köztük.
4. `/sablon`: a sablon megjelenítése referenciának.

## Design
- Modern, letisztult „trading desk” hangulat: alapból sötét téma, világos téma váltóval (rendszerbeállítást követi, a választást localStorage-ben jegyzi meg).
- Mobile-first: 360 px szélességen is olvasható, nincs vízszintes oldalgörgetés, nagy koppintható elemek.
- Jelvényszínek: ZÖLD/VAN SETUP = zöld, PIROS/NINCS SETUP = piros, feltételes = sárga. A színek mellett mindig legyen szöveg is (ne csak szín hordozza a jelentést).
- Számoknál tabular-nums (egymás alá rendezett számjegyek). Betű: Inter vagy rendszer sans-serif, a szintekhez monospace.
- Nincs grafikon, indikátor vagy élő árfolyam: ez szándékos, a stratégia indikátor nélküli.

## Egyéb követelmények
- Minden oldal alján fix szöveg: „A döntés és a felelősség a tiéd. Ez elemzés, nem befektetési tanács, és nem ígér profitot.”
- A felület magyar nyelvű (dátumok `hu-HU` formában, Europe/Budapest időzóna).
- Az oldal tetején jelezd, mikor frissült utoljára (a legfrissebb fájl dátuma).
- PWA alapok: manifest és ikon, hogy a telefon kezdőképernyőjére tehessem. Offline cache nem kell.
- `noindex` meta és `robots.txt` tiltás: ne kerüljön keresőbe.
- A markdownban lévő linkek új lapon nyíljanak.
- Lighthouse mobil pontszám legalább 90 minden kategóriában.

## Munkamenet
1. Először nézd meg a `content/elemzesek/` mintafájlt és a sablont, és röviden írd le, hogyan fogod parsolni a szakaszokat.
2. Hozd létre a projektet, a parsolót tedd külön modulba (`src/lib/parse-elemzes.ts`), és írj hozzá néhány egyszerű tesztet (Vitest) a mintafájlra: dátum, döntés, előszűrés, kulcsszint-táblázat.
3. Építsd meg az oldalakat, futtasd a `npm run build`-et, és javítsd a hibákat.
4. Végül README: hogyan futtatom helyben (`npm install`, `npm run dev`), hogyan adok hozzá új napot, hogyan deployolok.