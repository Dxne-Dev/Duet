import type { LyricLine, Singer } from "@/db/schema";

export type LrcLibSearchResult = {
  id: number;
  name: string;
  trackName: string;
  artistName: string;
  albumName: string;
  duration: number;
  instrumental: boolean;
  plainLyrics: string | null;
  syncedLyrics: string | null;
};

/**
 * Recherche des paroles synchronisées sur LRCLIB
 */
export async function searchLrcLib(query: string): Promise<LrcLibSearchResult[]> {
  try {
    const url = `https://lrclib.net/api/search?q=${encodeURIComponent(query)}`;
    const response = await fetch(url, {
      headers: {
        "User-Agent": "VocalDuelApp/1.0.0 (https://github.com)",
      },
      next: { revalidate: 3600 },
    });

    if (!response.ok) return [];
    const data = (await response.json()) as LrcLibSearchResult[];
    return Array.isArray(data) ? data : [];
  } catch {
    return [];
  }
}

/**
 * Récupère directement les paroles synchronisées d'un morceau
 */
export async function getLrcLibLyrics(
  trackName: string,
  artistName: string,
): Promise<LrcLibSearchResult | null> {
  try {
    const url = `https://lrclib.net/api/get?track_name=${encodeURIComponent(
      trackName,
    )}&artist_name=${encodeURIComponent(artistName)}`;

    const response = await fetch(url, {
      headers: {
        "User-Agent": "VocalDuelApp/1.0.0 (https://github.com)",
      },
    });

    if (!response.ok) {
      // Fallback vers search si get exact échoue
      const searchResults = await searchLrcLib(`${artistName} ${trackName}`);
      const withLyrics = searchResults.find((r) => r.syncedLyrics);
      return withLyrics || null;
    }

    return (await response.json()) as LrcLibSearchResult;
  } catch {
    return null;
  }
}

/**
 * Parse un texte de paroles au format .lrc (ex: "[00:15.20] Paroles...")
 * et répartit automatiquement les voix (A, B, BOTH).
 */
export function parseLrcToLyricLines(
  syncedLyrics: string,
  maxDuration?: number,
): LyricLine[] {
  if (!syncedLyrics) return [];

  const rawLines = syncedLyrics.split("\n");
  const parsed: { at: number; text: string }[] = [];

  const timeRegex = /^\[(\d{2}):(\d{2})(?:\.(\d{2,3}))?\]\s*(.*)$/;

  for (const line of rawLines) {
    const trimmed = line.trim();
    if (!trimmed) continue;

    const match = timeRegex.exec(trimmed);
    if (!match) continue;

    const minutes = parseInt(match[1], 10);
    const seconds = parseInt(match[2], 10);
    const msFraction = match[3] || "0";
    const millis =
      msFraction.length === 2
        ? parseInt(msFraction, 10) * 10
        : parseInt(msFraction, 10);

    const at = Math.round((minutes * 60 + seconds + millis / 1000) * 10) / 10;
    const text = match[4]?.trim();

    if (text && text.length > 0) {
      parsed.push({ at, text });
    }
  }

  if (parsed.length === 0) return [];

  // Découpage et attribution des rôles A, B, BOTH
  const result: LyricLine[] = [];
  let currentSinger: Singer = "A";
  let lineCountInBlock = 0;

  for (let i = 0; i < parsed.length; i += 1) {
    const current = parsed[i];
    const next = parsed[i + 1];

    // Calcul de la fin de la phrase (ou 4 secondes pour la dernière phrase)
    let end = next ? next.at : current.at + 4;
    if (end <= current.at) end = current.at + 3;

    // Si on dépasse la durée max demandée, on coupe
    if (maxDuration && current.at >= maxDuration) break;

    // Détection heuristique du refrain ou alternance des strophes
    // Changement de voix toutes les 2 phrases ou sur un grand intervalle (> 4s)
    const gap = next ? next.at - current.at : 0;
    lineCountInBlock += 1;

    let singer: Singer = currentSinger;

    // Si c'est une ligne de refrain ou très intense / répétée, on peut alterner
    if (lineCountInBlock >= 2 || gap > 4.5) {
      currentSinger = currentSinger === "A" ? "B" : "A";
      lineCountInBlock = 0;
    }

    result.push({
      at: current.at,
      end,
      singer,
      text: current.text,
    });
  }

  return result;
}
