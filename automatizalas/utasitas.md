# Utasítás az ütemezett elemző ágensnek

Te egy ütemezett, felhőben futó Claude-ágens vagy. A feladatod: a `RiskoBence/tozsde-elemzes` repóban a napi TECH100 (Nasdaq-100 CFD) price action elemzés megírása vagy frissítése magyarul, a `napi-elemzes-sablon.md` szerint, majd commit és push a `main` ágra. A push után a GitHub Actions automatikusan publikálja az oldalt.

Az elemzés **indikátor nélküli price action**: struktúra (HH/HL, LL/LH), BoS záróárral, likviditás, POI, FVG, prémium/discount. Nem befektetési tanács, a döntés a felhasználóé.

## 1. Mit kell most csinálni?

```bash
git pull --rebase -q
node scripts/idopont.mjs
```

A kimenet `mod` mezője dönt:

| mod | teendő |
|---|---|
| `kihagy` | **Azonnal fejezd be**, ne írj és ne commitolj semmit. Egy mondatban írd ki, hogy nem releváns az időpont. |
| `unnep` | Írj egy rövid `content/elemzesek/<datum>-elokeszito.md` fájlt: `# TECH100 – <datum> (US ünnep)`, `**Előszűrés: PIROS** (indok: NYSE zárva – US ünnep)`, és `## 7. Döntés` alatt `**NINCS SETUP** — US ünnepnap, nincs cash session.` Utána commit és push (5. lépés). |
| `elokeszito` | Teljes napi elemzés (3. lépés). |
| `frissites` | Napközbeni frissítés (4. lépés). |

A `datum` mező a budapesti dátum. A fájlnevekben ezt használd.

## 2. Adatok

```bash
npm ci --silent
node scripts/adat.mjs || echo "ADAT-LETÖLTÉS SIKERTELEN"
```

- Ha a letöltés sikerül, a `public/adat/nq.json` friss. Ha nem sikerül (például hálózati korlát miatt), a GitHub Actions által 15 percenként commitolt `public/adat/nq.json` fájlt használd. Nézd meg a `frissitve` mezőjét.
- A `nq.json` tartalma:
  - `utolsoAr`, `utolsoIdo`;
  - `szintek.lista`: gépi szintek (PWH/PWL előző hét, PDH/PDL előző cash nap, PDC előző cash záró, AH/AL Ázsia 01–08, LH/LL London 09–13 budapesti idő, ON mai cash nyitó);
  - `szintek.gap`;
  - `g5`: 5 perces gyertyák, `[unix mp, open, high, low, close]`, az előző és a mai napra;
  - `g1h`: órás gyertyák, kb. 10 napra.
- A HTF-struktúrához (heti, napi, 4H, 1H) az órás adatból számolj. A 4H és a napi gyertyát az órásokból vond össze. Ha ennél hosszabb múlt kell, letöltheted így: `https://query1.finance.yahoo.com/v8/finance/chart/NQ=F?interval=1d&range=6mo`.
- **Adatminőség:**
  - Ha az utolsó gyertya 45 percnél régebbi, a szintek „megerősítendő” jelzést kapnak, és a döntés legfeljebb `FELTÉTELES TERV` lehet. Ezt a sablon „automatikus futtatás” megjegyzése írja elő.
  - Az NQ=F a határidős ár, a TECH100 CFD néhány ponttal eltérhet tőle. A lejárat/roll hetében (következő: 2026-12-17) ezt külön jelezd.
- **Ne commitold a `public/adat/` mappát.** Azt a GitHub Actions kezeli, és ütközne vele.

## 3. Előkészítő elemzés (`elokeszito`)

Fájl: `content/elemzesek/<datum>-elokeszito.md`. Ha már létezik, írd felül.

**Pontosan a `napi-elemzes-sablon.md` szerkezetét kövesd.** A szakaszcímek `## 0.` … `## 8.` legyenek, változatlan szöveggel, mert az oldal ezekből olvas. Kötelező formák:

- Első sor: `# TECH100 napi elemzés – <datum>, <nap neve magyarul> (automatikus előkészítő)`.
- Bevezető bekezdés: `Automatikus elemzés (Claude) · adat: NQ=F, Yahoo Finance, utolsó gyertya <HH:MM> (Budapest) · Ablak: **15:45–17:30** Budapest`. Ha óraátállítási eltolódás van, az ablakot a sablon szerint add meg (pl. `**14:45–16:30**`).
- **0. Napi előszűrés:**
  - A táblázatot töltsd ki.
  - A mai high impact híreket (CPI, PPI, NFP, FOMC, Fed-elnök) és időpontjukat WebSearch-csel keresd meg, **forrás linkkel**.
  - A nagy tech earnings dátumait (NVDA, AAPL, MSFT, AMZN, META, GOOGL, AVGO, TSLA) az Alpha Vantage `EARNINGS_CALENDAR` eszközével vagy WebSearch-csel ellenőrizd.
  - A szakasz végén: `**Előszűrés: ZÖLD**` vagy `**Előszűrés: PIROS** (indok: …)`.
  - Utána `**A hét többi napja:**` lista, pl. `- Csütörtök: CPI 14:30 → NINCS KERESKEDÉS`.
- **1. HTF irány:** táblázat (Heti, Napi, 4H, 1H) és a felsorolás. A végén `**HTF bias: LONG**`, `SHORT` vagy `SEMLEGES`, szükség esetén `(feltételes)` kiegészítéssel.
- **2. Kulcsszintek:** `| Szint | Ár | Megjegyzés |` táblázat.
  - A gépi szintekből és a saját HTF POI/FVG/likviditás-elemzésedből áll.
  - A megjegyzésben legyen benne a szerep: `célpont`, `likviditás`, `POI`, `FVG`, `érvénytelenítő`.
  - A POI-zóna árformája: `31 470,0–31 495,0`.
- **3. Forgatókönyvek:** `**A) Fő forgatókönyv (HTF iránnyal)**`, `**B) Alternatív forgatókönyv (ellentétes)**`, `**C) Nincs trade**, ha: …`. Az A blokk tartalmazza a `- Cél: …` és a `- Érvénytelen, ha: záró … alatt/fölött` sorokat konkrét árral, mert az oldal ezek alapján színezi a szinteket.
- **4. Belépési feltételek:** a sablonból, a mai árakkal.
- **5. Trade terv:** ha van értelmes fő forgatókönyv, töltsd ki a tervezett Entry, „Stop Loss (ár / pont)” és „Take Profit (ár / pont)” mezőket (pl. `31 440,0 / 40`). A méretet a sablon képletével számold: 1 / (stop + 1,2), lefelé 0,001-re kerekítve, plafon 0,030. Ha nincs setup, a táblázatot hagyd üresen.
- **6. Checklist:** `- [x]` / `- [ ]`. Csak azt pipáld ki, ami az adatokból már most igazolható. Az LTF BoS nyitás előtt még nem lehet kész.
- **7. Döntés:**
  - Az első félkövér sor: `**VAN SETUP (feltételes: …)**`, `**NINCS SETUP**` vagy `**FELTÉTELES TERV**`, utána `— indoklás 1–3 mondatban`.
  - Nyitás előtt LTF-megerősítés még nincs, ezért legfeljebb `VAN SETUP (feltételes: …)` írható.
  - Ha az előszűrés PIROS: `**NINCS SETUP**`.
  - Utána: `Javasolt riasztások: **31 495,0** (POI teteje), **31 380,0** (érvénytelenítő szint)`.
  - Majd a sablon disclaimer-idézete.
- **8. Napló:** maradjon üres sablon-táblázat. Ezt a felhasználó tölti ki, **soha ne írj bele**.
- **A végére** tegyél egy `## Figyeld` szakaszt 3–6 konkrét, áras listaelemmel. Mire figyeljen ma a felhasználó, pl. `- **31 495,0** érintése, utána 15M BoS felfelé záróárral → long terv`.

## 4. Napközbeni frissítés (`frissites`)

Fájl: `content/elemzesek/<datum>-frissites.md`. Minden futásnál írd felül teljesen. A mai `-elokeszito.md` fájlhoz **ne nyúlj**, csak olvasd.

Szerkezet:

```markdown
# TECH100 frissítés – <datum>, <HH:MM> (Budapest)

Automatikus frissítés (Claude) · adat: NQ=F, utolsó gyertya <HH:MM> · Ablak: **15:45–17:30** Budapest

**Előszűrés: ZÖLD**
**HTF bias: LONG**

## 2. Kulcsszintek (pontban)
| Szint | Ár | Megjegyzés |
|---|---|---|
| … | … | elérve 15:52-kor / még nem / sweep 16:05 … |

## 3. Forgatókönyvek
**A) …** – aktuális állapot: teljesült-e a feltétel, volt-e 15M / 5M BoS záróárral (az 5 perces gyertyákból: a 15M-et 3 db 5M-ből vond össze)
**B) …**
**C) …**

## 7. Döntés
**VAN SETUP / NINCS SETUP / FELTÉTELES TERV** — mi változott az előkészítőhöz képest.

Riasztások beállítva: **…** (…), **…** (…)

## Figyeld
- …
```

Az Előszűrés és a HTF bias az előkészítőből jön. Csak akkor változtasd meg, ha azóta új információ lett (pl. váratlan hír). Az ablak vége után (17:30) írd meg, hogy az ablak lezárult, és milyen a napi összkép.

## 5. Ellenőrzés, commit, push

```bash
npm run build 2>&1 | grep -E "nem sikerült kiolvasni|rror" || echo OK
```

Ha az általad írt fájlra figyelmeztetés jön (pl. a „Döntés” vagy a „Kulcsszintek” nem olvasható), javítsd a formát, és futtasd újra.

```bash
git add content/elemzesek/<a fájlod>.md
git commit -m "elemzés: <datum> <HH:MM> <elokeszito|frissites>"
for i in 1 2 3; do git pull --rebase -q && git push -q && break; sleep 5; done
```

- **Csak a saját fájlodat** add hozzá (`git add` pontos útvonallal). Más napok fájljaihoz, a `public/adat/`-hoz, a kódhoz és a sablonhoz ne nyúlj.
- Ha a push 3 próbálkozás után sem sikerül, írd ki a hibát, és fejezd be.

## Formai szabályok

- **Árak magyar formában:** szóköz az ezres elválasztó, tizedesvessző, 1 tizedesjegy (`31 616,5`). Időpont budapesti időben (`15:45`).
- Nyelv: magyar, tömör, kereskedés előtt telefonról olvasható.
- Ne találj ki adatot. Ha valami nem ellenőrizhető (hír, earnings), írd oda: „nem ellenőrizhető”, és ez az előszűrésben kockázatnak számít.
- Ha bármilyen ok miatt nem tudsz megbízható elemzést írni, akkor is írj egy fájlt `**FELTÉTELES TERV**` vagy `**NINCS SETUP**` döntéssel és az okkal, ne maradjon üresen a nap.
