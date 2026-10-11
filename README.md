# TECH100 napi elemzés

Statikus, mobilbarát oldal a napi Nasdaq-100 (TECH100 CFD) price action elemzésekhez. Az oldal Astro + Tailwind alapú, nincs backendje, és GitHub Pages-en fut.

- `/`: a legfrissebb nap (összkép, kulcsszintek ártávolsággal, forgatókönyvek, méretkalkulátor, checklist, teljes szöveg)
- `/archivum/`: az összes nap, hónapra és döntésre szűrhető
- `/nap/YYYY-MM-DD/`: egy adott nap, előző / következő navigációval
- `/statisztika/`: a 8. Napló táblázatokból számolt összesítés (win rate, R, USD, szabálykövetés, havi bontás)
- `/sablon/`: a `napi-elemzes-sablon.md` referenciának (a lábléc linkjéről érhető el)

A fejlécben látszik a kereskedési ablak állapota budapesti idő szerint (pl. „Ablak 15:45-kor nyit (2 ó 10 p múlva)”, „● Ablak nyitva”). Ha hétköznap még nincs mai elemzés, figyelmeztetés jelenik meg.

## Helyi futtatás

Node.js 22.12+ kell (ajánlott: 24).

```bash
npm install
npm run dev       # http://localhost:4321/tozsde-elemzes/
npm test          # parsoló-tesztek (Vitest)
npm run build     # statikus build → dist/
npm run preview   # a buildelt oldal helyben
```

## Új nap hozzáadása

1. Tegyél egy új fájlt a `content/elemzesek/` mappába ilyen névvel: `YYYY-MM-DD-<valami>.md`, például `2026-10-13-elokeszito.md`.
2. Commit + push a `main` ágra. Kb. 1–2 perc múlva frissül az oldal.

Kódot ehhez nem kell módosítani.

- **Több fájl egy naphoz** (pl. `-elokeszito` és `-frissites`): a napi oldalon fülekkel lehet váltani köztük. A fülek fájlnév szerint, ábécérendben követik egymást, és alapból az **utolsó** nyílik meg. Az archívum is ennek a fájlnak a jelvényeit mutatja.
- **Frontmatter nem kell.** A dátum a fájlnévből jön, a cím az első `# ` sorból. Ha mégis írsz frontmattert, ezek a mezők felülírják a szövegből kiolvasott értéket:

  ```yaml
  ---
  dontes: NINCS SETUP (CPI nap)
  bias: SHORT
  eloszures: PIROS
  ablak: 14:45–16:30
  ---
  ```
- Ha a fájlnév nem `YYYY-MM-DD-…` formájú, a build egy figyelmeztetéssel kihagyja, de nem törik el.

### Mit olvas ki az oldal a markdownból?

A parsoló a `src/lib/parse-elemzes.ts` fájlban van, és a sablon szerkezetét követi. Ha valamelyik rész hiányzik, csak az a blokk marad ki.

| Blokk | Honnan |
|---|---|
| Előszűrés jelvény | `**Előszűrés: ZÖLD**` vagy `**Előszűrés eredménye:** PIROS (indok: …)` |
| HTF bias | `**HTF bias: LONG (feltételes)**` |
| Döntés | a `## 7. Döntés` szakasz első félkövér sora: `**VAN SETUP (…)**` / `**NINCS SETUP**` |
| Kulcsszintek | a `## 2.` szakasz első táblázata (`Szint \| Ár \| Megjegyzés`) |
| Szintek csoportja | ha egy ár az A forgatókönyv „Cél” sorában szerepel → célpont, ha az „Érvénytelen” sorában → érvénytelenítő; különben kulcsszó alapján (POI/FVG → POI) |
| Riasztások | a „Javasolt riasztások” / „Riasztások beállítva” sorban **félkövérrel** írt árak |
| A hét többi napja | az „A hét többi napja:” sort követő lista |
| Forgatókönyvek | a `## 3.` szakaszban a `**A) …**`, `**B) …**`, `**C) …**` blokkok |
| Checklist | `- [x]` / `- [ ]` sorok a `## 6.` szakaszból |
| Kereskedési ablak | `Ablak: **15:45–17:30**`; ha nincs megadva: 15:45–17:30 |

A szakaszokat a szám (`## 7.`) vagy a cím kulcsszava („Döntés”) alapján találja meg, így a kisebb címeltérések nem okoznak gondot. A kitöltetlen sablon-helyőrzőket (`ZÖLD / PIROS`) nem olvassa be értékként.

Az árak pontosan úgy jelennek meg, ahogy a markdownban vannak (`31 616,5`). Másoláskor (ha egy árra koppintasz) a szóköz kimarad, így `31616,5` kerül a vágólapra. Ha a bróker tizedespontot vár, írd át a `src/components/Kulcsszintek.astro` fájlban a `masolhato` függvényt.


### Napló a statisztikához

A `/statisztika` oldal a `## 8. Napló` táblázat azon soraiból számol, ahol az **Irány** ki van töltve:

| # | Irány | Entry | SL | TP | Méret | Eredmény (USD / R) | Szabályt betartottam? | Tanulság |
|---|---|---|---|---|---|---|---|---|
| 1 | Short | 31 520,0 | 31 560,0 | 31 440,0 | 0,024 | +1,9 USD / +2R | igen | türelem kifizetődött |

- **Eredmény:** `+1,9 USD / +2R`, `−1 USD / −1R`, csak `+2R` vagy `BE` (nullszaldó) is jó. A win rate az R előjeléből számol, ha nincs R, akkor a USD-ből.
- **Szabályt betartottam?:** `igen` / `nem`.
- Ha egy naphoz több fájl tartozik, csak a legutolsó kitöltött napló számít, így nincs duplán számolás.

### Méretkalkulátor

Képlet: méret = 1 USD / (stop pont + 1,2), lefelé kerekítve 0,001-re, legfeljebb 0,030. Ha az `## 5. Trade terv` táblázatban van Entry és „Stop Loss (ár / pont)”, a kalkulátor ezekkel indul. A keretek (kockázat, spread, plafon, margin arány) a `src/lib/beallitasok.ts` fájlban vannak, ha változnak, csak ott kell átírni.

### Ha valami nem olvasódik be

Ha egy szakasz megvan, de nem sikerült belőle kiolvasni a várt adatot (pl. a Döntés nincs félkövéren, vagy a kulcsszint-táblázatban nincs ár), a build figyelmeztet:

- a GitHub **Actions** futás összegzőjében sárga „warning” sorként, a fájl nevével;
- a napi oldal alján is megjelenik: „Ebből a fájlból nem sikerült kiolvasni: …”.

A build ettől nem bukik el. Egy rövid frissítő fájl, amelyből szándékosan hiányoznak szakaszok, nem kap figyelmeztetést.

## Automatikus elemzés és diagram

Hétköznaponként 4 automatikus elemzés készül (budapesti idő; az EU/US eltérő átállási hetén a NY-futások egy órával korábban):

| Futás | Időpont | Fájl (fül a napi oldalon) | Tartalom |
|---|---|---|---|
| London nyitás | 09:00 | `<dátum>-1-london.md` („London nyitás”) | teljes elemzés a sablon szerint, terv a NY-ablakra |
| London +30 | 09:30 | `<dátum>-2-london-30.md` („London +30”) | frissítés: Ázsia-sweep, BoS, változik-e a terv |
| NY előtt | 15:15 | `<dátum>-3-ny-elott.md` („NY előtt”) | **fő elemzés** a 15:45–17:30-as ablakra |
| NY +30 | 16:00 | `<dátum>-4-ny-utan.md` („NY +30”) | frissítés: belépési feltétel, 15M/5M BoS, terv állapota |

- **Diagram-adat (GitHub Actions):** 15 percenként 06–08 és 12–16 óra UTC között. A `scripts/adat.mjs` letölti az NQ=F gyertyákat, kiszámolja a gépi szinteket, és újraépíti az oldalt.
- **Időzítés:** 3 Claude-rutin van (:00, :15, :30 percre), mindegyik a nyári és a téli időpontban is elindul. A `scripts/idopont.mjs` a londoni és a New York-i idő, valamint a NYSE-ünnepnapok alapján dönti el, kell-e dolgozni, így az óraátállítás automatikusan rendben van. A nem releváns indítás azonnal kilép.
- **Az ágens viselkedése** az `automatizalas/utasitas.md` fájlban van. Ha módosítani akarsz rajta (pl. más formát, több figyelendőt), elég ezt átírni és pusholni, a rutinhoz nem kell nyúlni.
- **Diagram:**
  - NQ=F (Nasdaq-100 határidős) 5M / 15M / 1H gyertyák, rajta az elemzés szintjei csoportszínekkel, a riasztások szaggatott vonallal, kérésre a gépi szintek (PDH, PDL, PWH, Ázsia, London, …), és az ablak jelölése.
  - Alatta az állapot: utolsó ár, a legközelebbi szint felette és alatta, a ma elért szintek, és a „Figyeld” lista.
  - A TECH100 CFD néhány ponttal eltérhet az NQ=F-től.
- **Az adat** a `public/adat/` mappába kerül. Ezt csak a GitHub Actions commitolja (`adat: NQ=F …` commitok). Napi pillanatkép is készül, így a régi napoknál is megmarad a diagram.
- Ha valamelyik ütemezett futás elmarad (a GitHub cron 5–15 percet késhet), a következő pótolja.

## Deploy GitHub Pages-re (első beállítás)

1. Hozz létre egy új repót a GitHubon **`tozsde-elemzes`** néven (lehet privát is, ha Pro/Team csomagod van; ingyenes fióknál a Pages csak publikus repóval megy).
2. Töltsd fel a projektet (a mappában):
   ```bash
   git init -b main
   git add .
   git commit -m "Első verzió"
   git remote add origin https://github.com/<felhasználónév>/tozsde-elemzes.git
   git push -u origin main
   ```
3. A GitHubon a repóban: **Settings → Pages**.
4. A **Build and deployment → Source** legyen **GitHub Actions** (nem „Deploy from a branch”).
5. Az **Actions** fülön látszik a „Deploy GitHub Pages” futás. Ha lement, az oldal itt érhető el:
   `https://<felhasználónév>.github.io/tozsde-elemzes/`
6. Telefonon nyisd meg az oldalt, és válaszd a **Hozzáadás a kezdőképernyőhöz** lehetőséget (iOS: Megosztás menü, Android: Chrome menü).

Ezután minden push a `main` ágra lefuttatja a teszteket, újraépíti és publikálja az oldalt. Kézzel is indítható az Actions fülön (Run workflow).

**Más repónév vagy saját domain:** a workflow a Pages beállításból automatikusan veszi az alútvonalat, ezért a deployhoz nem kell semmit átírni. Helyben (`npm run dev`) az `astro.config.mjs` alapértéke, a `/tozsde-elemzes` érvényes. Ezt felülírhatod a `BASE_PATH` környezeti változóval.

## Keresők kizárása

Minden oldalon van `<meta name="robots" content="noindex, nofollow">`, és a buildbe bekerül egy `robots.txt` is (`Disallow: /`). Projekt-oldalnál (`…github.io/tozsde-elemzes/`) a keresők csak a domain gyökerében lévő `robots.txt`-t olvassák, ezért itt valójában a `noindex` meta a hatásos védelem. Ez minden oldalon benne van. Ne feledd: ha a repó publikus, a markdown fájlok a GitHubon bárki számára olvashatók.

## Projektstruktúra

```
content/elemzesek/          napi elemzések (.md)
napi-elemzes-sablon.md      a sablon (referencia, /sablon oldal)
src/lib/parse-elemzes.ts    markdown → strukturált adat (jelvények, szintek, …)
src/lib/markdown.ts         markdown → HTML (új lapon nyíló linkek, görgethető táblák)
src/lib/napok.ts            fájlok napokba csoportosítása, rendezés, build-figyelmeztetések
src/lib/statisztika.ts      napló-összesítés
src/lib/meret.ts            méretkalkulátor (keretek: src/lib/beallitasok.ts)
src/lib/ablak.ts            kereskedési ablak állapota budapesti idő szerint
src/components/Diagram.astro  diagram (lightweight-charts) + állapot + Figyeld
scripts/adat.mjs            NQ=F letöltés + gépi szintek → public/adat/
scripts/idopont.mjs         az ágens időpont-kapuja (NY idő, NYSE-ünnepek)
automatizalas/utasitas.md   az ütemezett Claude-ágens utasítása
src/components/             nézet-komponensek (összkép, kulcsszintek, fülek, …)
src/pages/                  oldalak
tests/                      Vitest tesztek + fixture
.github/workflows/deploy.yml
```

---

A döntés és a felelősség a tiéd. Ez elemzés, nem befektetési tanács, és nem ígér profitot.
