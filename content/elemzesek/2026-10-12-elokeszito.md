# TECH100 napi elemzés – 2026-10-12, hétfő (előkészítő)

Price action, indikátorok nélkül. Minden távolság **pontban**. MINTA fájl – a valódi elemzés formátumának bemutatására.

**Rögzített keretek**
- Instrumentum: TECH100 CFD, Trading 212
- Ablak: **15:45–17:30** Budapest
- Max **2 trade/nap**

---

## 0. Napi előszűrés (ha bármelyik piros → NINCS KERESKEDÉS)

| Ellenőrzés | Eredmény |
|---|---|
| Dátum, nap | 2026-10-12, hétfő |
| Óraátállítás-eltolódás? | nem → nyitás 15:30, ablak 15:45–17:30 |
| High impact hír ma | nincs |
| Nagy tech earnings | nincs |
| Opciós lejárat | nem |
| US ünnep / rövidített nap | Columbus Day – kötvénypiac zárva, részvénypiac nyitva |
| TECH100 lejárat/roll közel? | nem (köv.: 2026-12-17 15:00) |
| Saját állapot | kipihent |

**Előszűrés: ZÖLD** (indok: nincs high impact hír, nincs earnings az ablakban)

**A hét többi napja:**
- Kedd: nincs kiemelt hír
- Szerda: FOMC jegyzőkönyv 20:00 → az ablakot nem érinti
- Csütörtök: CPI 14:30 → NINCS KERESKEDÉS
- Péntek: opciós lejárat → csak fél méret

## 1. Magasabb idősík (HTF) irány

| Idősík | Struktúra | Utolsó igazolt csúcs | Utolsó igazolt alj | Utolsó BoS | Irány |
|---|---|---|---|---|---|
| Heti | HH/HL | 31 980,0 | 30 850,0 | 31 420,0 | bull |
| Napi | HH/HL | 31 880,5 | 31 210,0 | 31 616,5 | bull |
| 4H | LL/LH | 31 880,5 | 31 455,0 | 31 520,0 | bear (korrekció) |
| 1H | range | 31 720,0 | 31 455,0 | – | range |

- Trendirányú BoS előtt volt-e ≥50% korrekció? igen
- HTF és 4H egyezik? nem → a 4H mozgás korrekció
- Ár a napi range discount felében (0.5 szint: 31 545,0)

**HTF bias: LONG (feltételes)**

## 2. Kulcsszintek (pontban)

| Szint | Ár | Megjegyzés |
|---|---|---|
| Heti csúcs (előző hét) | 31 980,0 | célpont, buy-side likviditás |
| Előző napi csúcs (PDH) | 31 880,5 | célpont |
| London csúcs | 31 720,0 | likviditás |
| Előző cash záró (22:00) | 31 616,5 | gap mérete: 25 pont |
| Napi 0.5 szint | 31 545,0 | equilibrium |
| HTF POI (4H bullish OB) | 31 470,0–31 495,0 | bullish, zóna: 31 470–31 495 |
| 1H FVG | 31 455,0 | betöltetlen |
| Előző napi alj (PDL) | 31 380,0 | érvénytelenítő |
| Ázsia alj | 31 410,5 | likviditás |

## 3. Forgatókönyvek

**A) Fő forgatókönyv (HTF iránnyal)**
- Feltétel: az ár eléri a 31 470–31 495 HTF POI-t / sweepeli az Ázsia aljat (31 410,5)
- Megerősítés: 15M → 5M BoS záróárral felfelé
- Belépés: limit az LTF POI-ra ~31 480
- Cél: PDH 31 880,5
- Érvénytelen, ha: záró 31 380,0 alatt

**B) Alternatív forgatókönyv (ellentétes)**
- Feltétel: 4H záró 31 380,0 alatt
- Ekkor: nincs trade addig, amíg új struktúra nem épül

**C) Nincs trade**, ha: az ár 31 545 körül chopol, vagy az ablakban nem jön BoS.

## 4. Belépési feltételek (LTF, csak 15:45 után)

1. Az ár a kijelölt POI-ban / discountban
2. 15M BoS a HTF irányába, záróárral
3. 5M / 1M BoS ugyanarra

## 5. Trade terv (kitöltés setupnál)

| Mező | Érték |
|---|---|
| Long / Short | Long |
| Entry | 31 480,0 |
| Stop Loss (ár / pont) | 31 440,0 / 40 |
| Take Profit (ár / pont) | 31 880,5 / 400 |
| R:R | 1 : 10 |
| Méret | 0,024 |

## 6. Checklist

- [x] Napi/heti struktúra iránya
- [ ] 4H és 1H iránya egyezik
- [x] BoS 4H, 1H
- [ ] BoS 15M, 5M, 1M
- [ ] Limit az utolsó POI-ra
- [x] Nincs high impact hír / nagy tech earnings az ablakban
- [x] Ma még < 2 trade és nincs −2 USD veszteség

**Ha bármi hiányzik: NINCS KERESKEDÉS.**

Forrás: [Investing.com gazdasági naptár](https://www.investing.com/economic-calendar/)

## 7. Döntés

**VAN SETUP (feltételes: csak 31 470–31 495 érintése + 15M BoS után)** — a HTF bull, a 4H korrekció a discount zónába fut. Belépés csak megerősítés után.

Javasolt riasztások: **31 495,0** (POI teteje), **31 380,0** (érvénytelenítő szint)

> A döntés és a felelősség a tiéd. Ez elemzés, nem befektetési tanács, és nem ígér profitot.

## 8. Napló (nap végén)

| # | Irány | Entry | SL | TP | Méret | Eredmény | Szabály? | Tanulság |
|---|---|---|---|---|---|---|---|---|
| 1 | | | | | | | | |
