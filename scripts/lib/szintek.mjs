// Gépi kulcsszintek számítása NQ=F gyertyákból. Tiszta függvények (tesztelhetők, hálózat nélkül).
// Gyertya formátum: [t (unix mp), open, high, low, close]

const formazok = new Map();
function formazo(tz) {
  if (!formazok.has(tz)) {
    formazok.set(
      tz,
      new Intl.DateTimeFormat('en-US', {
        timeZone: tz,
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        hourCycle: 'h23',
        weekday: 'short',
      }),
    );
  }
  return formazok.get(tz);
}

const HETNAP = { Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6, Sun: 7 };

/** Unix mp → { datum: 'YYYY-MM-DD', perc: éjfél óta, hetNapja: 1–7 } az adott időzónában. */
export function helyiIdo(t, tz) {
  const r = Object.fromEntries(formazo(tz).formatToParts(new Date(t * 1000)).map((p) => [p.type, p.value]));
  return { datum: `${r.year}-${r.month}-${r.day}`, perc: Number(r.hour) * 60 + Number(r.minute), hetNapja: HETNAP[r.weekday] };
}

const ET = 'America/New_York';
const BP = 'Europe/Budapest';
const CASH_NYIT = 9 * 60 + 30; // 09:30 ET
const CASH_ZAR = 16 * 60; // 16:00 ET

function hl(gyertyak) {
  if (!gyertyak.length) return null;
  return {
    csucs: Math.max(...gyertyak.map((g) => g[2])),
    alj: Math.min(...gyertyak.map((g) => g[3])),
  };
}

/** A hétfő dátuma (YYYY-MM-DD) egy adott naphoz. */
function hetfo(datum) {
  const d = new Date(`${datum}T12:00:00Z`);
  const nap = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() - (nap - 1));
  return d.toISOString().slice(0, 10);
}

/** A kereskedési nap: a budapesti mai nap, hétvégén az utolsó hétköznap. */
export function kereskedesiNap(most = Date.now() / 1000) {
  let t = most;
  for (let i = 0; i < 7; i++) {
    const h = helyiIdo(t, BP);
    if (h.hetNapja <= 5) return h.datum;
    t -= 86400;
  }
  return helyiIdo(most, BP).datum;
}

/**
 * Gépi szintek a `datum` kereskedési napra.
 * @param g5 5 perces gyertyák (legalább az előző kereskedési nappal együtt)
 * @param g1h órás gyertyák (az előző hét miatt)
 */
export function szintekSzamitasa(g5, g1h, datum) {
  const et = g5.map((g) => ({ g, ...helyiIdo(g[0], ET) }));
  const bp = g5.map((g) => ({ g, ...helyiIdo(g[0], BP) }));
  const cash = (d) => et.filter((x) => x.datum === d && x.perc >= CASH_NYIT && x.perc < CASH_ZAR).map((x) => x.g);

  // Előző cash nap: a legutóbbi ET-dátum a `datum` előtt, amelyen volt cash session.
  const elozoNapok = [...new Set(et.map((x) => x.datum))].filter((d) => d < datum && cash(d).length > 0).sort();
  const elozo = elozoNapok.at(-1) ?? null;
  const elozoCash = elozo ? cash(elozo) : [];
  const elozoHL = hl(elozoCash);
  const elozoZaro = elozoCash.at(-1)?.[4] ?? null;

  const maiCash = cash(datum);
  const nyito = maiCash[0]?.[1] ?? null;
  const asia = hl(bp.filter((x) => x.datum === datum && x.perc >= 60 && x.perc < 8 * 60).map((x) => x.g));
  const london = hl(bp.filter((x) => x.datum === datum && x.perc >= 9 * 60 && x.perc < 13 * 60).map((x) => x.g));

  // Előző hét (hétfő–péntek ET), órás gyertyákból.
  const elozoHetfo = new Date(Date.parse(`${hetfo(datum)}T12:00:00Z`) - 7 * 86400000).toISOString().slice(0, 10);
  const elozoHet = hl(
    g1h.filter((g) => {
      const h = helyiIdo(g[0], ET);
      return h.hetNapja <= 5 && hetfo(h.datum) === elozoHetfo;
    }),
  );

  const lista = [];
  const add = (kulcs, nev, ar) => ar != null && Number.isFinite(ar) && lista.push({ kulcs, nev, ar });
  add('PWH', 'Előző heti csúcs', elozoHet?.csucs);
  add('PWL', 'Előző heti alj', elozoHet?.alj);
  add('PDH', 'Előző napi csúcs (PDH)', elozoHL?.csucs);
  add('PDL', 'Előző napi alj (PDL)', elozoHL?.alj);
  add('PDC', 'Előző cash záró (22:00)', elozoZaro);
  add('AH', 'Ázsia csúcs (01–08)', asia?.csucs);
  add('AL', 'Ázsia alj (01–08)', asia?.alj);
  add('LH', 'London csúcs (09–13)', london?.csucs);
  add('LL', 'London alj (09–13)', london?.alj);
  add('ON', 'Mai cash nyitó', nyito);
  lista.sort((a, b) => b.ar - a.ar);

  return {
    datum,
    elozoNap: elozo,
    gap: nyito != null && elozoZaro != null ? nyito - elozoZaro : null,
    maiCash: hl(maiCash),
    lista,
  };
}

/** Yahoo chart API válasz → gyertyák (a hiányos sorok nélkül). */
export function yahooGyertyak(valasz) {
  const r = valasz?.chart?.result?.[0];
  if (!r?.timestamp) throw new Error(`Váratlan Yahoo-válasz: ${JSON.stringify(valasz?.chart?.error ?? valasz).slice(0, 200)}`);
  const q = r.indicators.quote[0];
  const kerekit = (x) => Math.round(x * 100) / 100;
  return r.timestamp
    .map((t, i) => [t, q.open[i], q.high[i], q.low[i], q.close[i]])
    .filter((g) => g.slice(1).every((x) => x != null && Number.isFinite(x)))
    .map(([t, ...arak]) => [t, ...arak.map(kerekit)]);
}

/** Csak a megadott ET-dátumokhoz tartozó gyertyák. */
export function napokGyertyai(g, datumok) {
  const halmaz = new Set(datumok);
  return g.filter((x) => halmaz.has(helyiIdo(x[0], ET).datum) || halmaz.has(helyiIdo(x[0], BP).datum));
}
