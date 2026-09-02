/**
 * MusicBrainz & Cover Art Archive Service (v1.4)
 *
 * Provides throttled MusicBrainz release-group lookup (>= 1100ms interval),
 * Lucene query escaping, collaborator artist normalization,
 * Cover Art Archive release-group image URL generation, candidate fallback chains, and localStorage caching.
 */

export type CoverArtStatus = 'loading' | 'found' | 'not-found' | 'error';

export interface CoverArtCacheEntry {
  candidates: string[];       // release-group MBIDs, best match first
  candidateIndex: number;     // which one we're currently trying
  status: CoverArtStatus;
  resolvedAt: number;
  mbid?: string | null;       // currently active candidate MBID
  coverUrl?: string | null;   // currently active cover URL
}

export const COVER_ART_CACHE_STORAGE_KEY = 'mockpit:coverArtCache:v1';

/**
 * Normalizes artist credit to the primary billed artist by stripping featured/collaborating artists.
 * MusicBrainz indexes release searches against the primary artist credit.
 * E.g. "The Weeknd ft. Daft Punk" -> "The Weeknd"
 *      "The Kid LAROI & Justin Bieber" -> "The Kid LAROI"
 *      "Post Malone & Swae Lee" -> "Post Malone"
 */
export function primaryArtist(displayArtist: string): string {
  if (!displayArtist) return '';
  return displayArtist
    .split(/\s+(?:ft\.|feat\.|featuring|&|x)\s+/i)[0]
    .trim();
}

/**
 * Escapes reserved Lucene query syntax characters: + - && || ! ( ) { } [ ] ^ " ~ * ? : \ /
 * Necessary for albums like "=" (Ed Sheeran) or "F*CK LOVE 3: OVER YOU" (The Kid LAROI).
 */
export function escapeLuceneQuery(value: string): string {
  if (!value) return '';
  return value.replace(/[+\-&|!(){}[\]^"~*?:\\/]/g, '\\$&');
}

/**
 * Generates a consistent, normalized cache key for artist and album pairing.
 */
export function getCoverArtCacheKey(artist: string, album: string): string {
  const normArtist = primaryArtist(artist || '').toLowerCase();
  const normAlbum = (album || '').trim().toLowerCase();
  return `${normArtist}::${normAlbum}`;
}

/**
 * Constructs the Cover Art Archive URL for a given release-group MBID or Cache Entry.
 */
export function coverArtUrl(
  target: string | CoverArtCacheEntry | null | undefined,
  size: 250 | 500 = 250
): string | null {
  if (!target) return null;
  if (typeof target === 'string') {
    return `https://coverartarchive.org/release-group/${target}/front-${size}`;
  }
  if (target.status !== 'found' || !target.candidates || target.candidates.length === 0) {
    return null;
  }
  const mbid = target.candidates[target.candidateIndex ?? 0];
  return mbid ? `https://coverartarchive.org/release-group/${mbid}/front-${size}` : null;
}

/**
 * Request Throttling Queue
 * MusicBrainz rate limits to ~1 req/sec. We enforce a minimum interval of 1100ms between calls.
 */
const MIN_REQUEST_INTERVAL_MS = 1100;
let lastRequestTimestamp = 0;
const requestQueue: Array<() => Promise<void>> = [];
let isQueueActive = false;

async function runQueue() {
  if (isQueueActive || requestQueue.length === 0) return;
  isQueueActive = true;

  while (requestQueue.length > 0) {
    const task = requestQueue.shift();
    if (task) {
      const now = Date.now();
      const timeElapsed = now - lastRequestTimestamp;
      if (timeElapsed < MIN_REQUEST_INTERVAL_MS) {
        await new Promise((resolve) => setTimeout(resolve, MIN_REQUEST_INTERVAL_MS - timeElapsed));
      }
      lastRequestTimestamp = Date.now();
      try {
        await task();
      } catch (err) {
        console.error('MusicBrainz request queue error:', err);
      }
    }
  }

  isQueueActive = false;
}

function queueMusicBrainzCall<T>(fn: () => Promise<T>): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    requestQueue.push(async () => {
      try {
        const result = await fn();
        resolve(result);
      } catch (err) {
        reject(err);
      }
    });
    runQueue();
  });
}

/**
 * Fielded search against MusicBrainz release-group endpoint (returns up to 5 candidate MBIDs).
 * Fielded on artist and releasegroup (Lucene index field for release-group).
 */
export async function searchReleaseGroupRaw(artist: string, album: string): Promise<string[]> {
  const cleanArtist = primaryArtist(artist);
  const escapedArtist = escapeLuceneQuery(cleanArtist);
  const escapedAlbum = escapeLuceneQuery(album);

  const queryStr = `artist:"${escapedArtist}" AND releasegroup:"${escapedAlbum}"`;
  const encodedQuery = encodeURIComponent(queryStr);
  const endpoint = `/api/musicbrainz/release-group/?query=${encodedQuery}&fmt=json&limit=5`;

  const response = await fetch(endpoint, {
    headers: {
      Accept: 'application/json',
    },
  });

  if (!response.ok) {
    throw new Error(`MusicBrainz search failed: ${response.status}`);
  }

  const data = await response.json();
  const releaseGroups = data?.['release-groups'];
  if (Array.isArray(releaseGroups)) {
    return releaseGroups.map((rg: { id: string }) => rg.id).filter(Boolean);
  }

  return [];
}

/**
 * Queued and throttled MusicBrainz release-group search.
 */
export function searchReleaseGroupQueued(artist: string, album: string): Promise<string[]> {
  return queueMusicBrainzCall(() => searchReleaseGroupRaw(artist, album));
}

/**
 * LocalStorage persistence helpers.
 */
export function loadSavedCoverArtCache(): Record<string, CoverArtCacheEntry> {
  try {
    if (typeof localStorage !== 'undefined') {
      const saved = localStorage.getItem(COVER_ART_CACHE_STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed && typeof parsed === 'object') {
          return parsed;
        }
      }
    }
  } catch (e) {
    console.error('Failed to load cover art cache from localStorage', e);
  }
  return {};
}

export function saveCoverArtCache(cache: Record<string, CoverArtCacheEntry>): void {
  try {
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem(COVER_ART_CACHE_STORAGE_KEY, JSON.stringify(cache));
    }
  } catch (e) {
    console.error('Failed to save cover art cache to localStorage', e);
  }
}

