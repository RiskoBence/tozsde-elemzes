import { getCollection } from 'astro:content';
import { parseElemzes, type Elemzes } from './parse-elemzes';

export interface Nap {
  datum: string;
  /** A naphoz tartozó elemzések fájlnév szerinti sorrendben. */
  elemzesek: Elemzes[];
  /** A nap „hivatalos” elemzése az összesítőkhöz: a sorrendben utolsó (legfrissebb). */
  fo: Elemzes;
}

let gyorsitotar: Nap[] | null = null;

/** Az összes nap, időrendben csökkenően (legfrissebb elöl). */
export async function osszesNap(): Promise<Nap[]> {
  if (gyorsitotar) return gyorsitotar;
  const bejegyzesek = await getCollection('elemzesek');
  const napok = new Map<string, Elemzes[]>();

  for (const b of bejegyzesek) {
    const fajlnev = `${b.id.split('/').pop()}.md`;
    const elemzes = parseElemzes(fajlnev, b.body ?? '', b.data as Record<string, unknown>);
    if (!elemzes) {
      console.warn(`[elemzesek] Kihagyva, a fájlnévből nem olvasható ki dátum: ${b.id}.md (elvárt: YYYY-MM-DD-valami.md)`);
      continue;
    }
    const lista = napok.get(elemzes.datum) ?? [];
    lista.push(elemzes);
    napok.set(elemzes.datum, lista);
  }

  gyorsitotar = [...napok.entries()]
    .map(([datum, lista]) => {
      const rendezett = lista.sort((a, b) => a.id.localeCompare(b.id));
      return { datum, elemzesek: rendezett, fo: rendezett[rendezett.length - 1] };
    })
    .sort((a, b) => b.datum.localeCompare(a.datum));
  return gyorsitotar;
}

/** A legfrissebb fájl dátuma („utoljára frissítve”). */
export async function utolsoFrissites(): Promise<string | null> {
  return (await osszesNap())[0]?.datum ?? null;
}
