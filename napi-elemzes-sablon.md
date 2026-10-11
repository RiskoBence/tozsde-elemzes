# Napi TECH100 elemzési sablon

Price action, indikátorok nélkül. Minden távolság **pontban**. Sorrend kötött: amíg egy lépés nincs kész, a következőre nem lépünk.

**Rögzített keretek** (Fönök, 2026-10-11)
- Instrumentum: TECH100 CFD, Trading 212 (struktúra a CFD charton, NQ1! csak megerősítésre)
- Számla: 100 USD élő · kockázat 1% = **1 USD** / trade
- Méret = 1 USD / (stop pont + 1,2 spread), lefelé 0,001-re kerekítve · plafon **0,030** (margin ~45 USD)
- Ablak: **15:45–17:30** Budapest (téli/nyári eltolódáskor 14:45–16:30)
- Max **2 trade/nap** · leállás 2 vesztes vagy −2 USD után · **nincs overnight** (23:00 swap)

---

## 0. Napi előszűrés (ha bármelyik piros → NINCS KERESKEDÉS)

| Ellenőrzés | Eredmény |
|---|---|
| Dátum, nap | |
| Óraátállítás-eltolódás? (EU/US eltérő hétvége) | igen / nem → nyitás __:__, ablak __:__–__:__ |
| High impact hír ma (CPI, PPI, NFP, FOMC, Fed-elnök) és időpontja | |
| Nagy tech earnings (NVDA, AAPL, MSFT, AMZN, META, GOOGL, AVGO, TSLA) tegnap zárás után / ma | |
| Opciós lejárat (havi 3. péntek / triple witching) | |
| US ünnep / rövidített nap | |
| TECH100 lejárat/roll közel? (köv.: 2026-12-17 15:00) | |
| Saját állapot: kipihent, figyelem megvan, nem telefonról | |

**Előszűrés eredménye:** ZÖLD / PIROS (indok: …)

## 1. Magasabb idősík (HTF) irány

| Idősík | Struktúra (HH/HL vagy LL/LH) | Utolsó igazolt csúcs | Utolsó igazolt alj | Utolsó BoS (záróár!) | Irány |
|---|---|---|---|---|---|
| Heti | | | | | bull / bear / range |
| Napi | | | | | |
| 4H | | | | | |
| 1H | | | | | |

- Trendirányú BoS előtt volt-e ≥50% korrekció (Fib 0.5)? igen / nem
- HTF és 4H egyezik? Ha nem: a 4H mozgás valószínűleg korrekció.
- Ár a napi range prémium vagy discount felében van? (napi swing csúcs–alj 0.5 szint: ____)

**HTF bias:** LONG / SHORT / SEMLEGES (csak megfigyelés)

## 2. Kulcsszintek (pontban)

| Szint | Ár | Megjegyzés |
|---|---|---|
| Heti csúcs / alj (előző hét) | | |
| Előző napi csúcs (PDH) / alj (PDL) | | |
| Előző cash záró (22:00) és mai nyitási gap | | gap mérete: __ pont |
| Ázsia csúcs / alj (01:00–08:00) | | likviditás |
| London csúcs / alj (09:00–13:00) | | likviditás |
| HTF POI (napi/4H) | | bullish / bearish, zóna: __–__ |
| HTF imbalance (FVG) | | betöltve? |
| 1H POI / FVG | | |
| Egyenlő csúcsok/aljak (likviditás-medence) | | |

## 3. Forgatókönyvek

**A) Fő forgatókönyv (HTF iránnyal)**
- Feltétel: az ár eléri ______ HTF POI-t / sweepeli ______ likviditást
- Megerősítés: 15M → 5M BoS záróárral ______ irányba
- Belépés: limit az LTF POI-ra ______
- Cél: előző igazolt HTF csúcs/alj ______
- Érvénytelen, ha: záró ______ fölött/alatt

**B) Alternatív forgatókönyv (ellentétes)**
- Feltétel: záró ______ alatt/fölött (HTF szint törése)
- Ekkor: nincs trade addig, amíg új struktúra nem épül, VAGY HTF elleni trade csak a teljes HTF-elleni checklisttel

**C) Nincs trade**, ha: az ár a range közepén (equilibrium) chopol, vagy az ablakban nem jön BoS.

## 4. Belépési feltételek (LTF, csak 15:45 után)

1. Az ár a kijelölt POI-ban / discountban (long) vagy prémiumban (short)
2. 15M BoS a HTF irányába, záróárral (kanóc nem számít)
3. 5M / 1M BoS ugyanarra
4. Új imbalance + POI az LTF-en, limit order rá
5. SL az igazolt LTF alj/csúcs mögött (+ spread)
6. TP az előző igazolt csúcs/alj, R:R ≥ 1:2
7. Nem a nyitás első 15 percében, nem a nyitási gyertya üldözése

## 5. Trade terv (kitöltés setupnál)

| Mező | Érték |
|---|---|
| Dátum / idő | |
| Long / Short | |
| Entry | |
| Stop Loss (ár / pont) | / |
| Take Profit (ár / pont) | / |
| R:R | 1 : |
| Méret = 1 / (stop + 1,2) → lefelé 0,001 | |
| Plafon 0,030 betartva? | |
| Kockáztatott összeg | ~__ USD |
| Becsült margin (méret × ár × 5%) | __ USD |

Példák: 30 pt → 0,032 → plafon miatt **0,030** (0,94 USD) · 40 pt → **0,024** · 60 pt → **0,016** · 100 pt → **0,009** · 200 pt → **0,004**

## 6. Checklist

- [ ] Napi/heti struktúra iránya
- [ ] 4H és 1H iránya egyezik
- [ ] BoS 4H, 1H
- [ ] BoS 15M, 5M, 1M
- [ ] Limit az utolsó POI-ra
- [ ] Értesítés a következő 15M-es BoS-ra
- [ ] Nincs high impact hír / nagy tech earnings az ablakban
- [ ] Belépés nem a US nyitás első 15 percében
- [ ] Ma még < 2 trade és nincs −2 USD veszteség
- [ ] Méret ≤ 0,030, pozíció 22:00 előtt zárva

HTF elleni trade-nél még: HTF ellentétes? 4H követi? 1H POI értesítés · 15M törés · limit az utolsó POI-ra.

**Ha bármi hiányzik: NINCS KERESKEDÉS.**

Megerősítés (nem jel): ES ugyanazt a BoS-t adja? · US10Y · DXY

## 7. Döntés

**VAN SETUP / NINCS SETUP** — indoklás 1–3 mondatban.

Riasztások beállítva: ______ (POI szint), ______ (érvénytelenítő szint)

> A döntés és a felelősség a tiéd. Ez elemzés, nem befektetési tanács, és nem ígér profitot.

## 8. Napló (nap végén)

| # | Irány | Entry | SL | TP | Méret | Eredmény (USD / R) | Szabályt betartottam? | Tanulság |
|---|---|---|---|---|---|---|---|---|
| 1 | | | | | | | | |
| 2 | | | | | | | | |

Érzelmi állapot (FOMO, mohóság, bosszú?): ______

---

### Megjegyzés az automatikus futtatáshoz
- Ha nincs friss chart (képernyőkép vagy pontos szintek), a 1–2. szakasz szintjei **„megerősítendő”** jelzést kapnak, és a döntés legfeljebb „feltételes terv”, nem setup.
- A hír- és earnings-naptárat minden nap frissen kell ellenőrizni, forrással.
- A szinteket TECH100 árban kell megadni; NQ1! szintek csak a spread/bázis eltéréssel korrigálva.
