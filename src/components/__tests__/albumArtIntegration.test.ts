import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  primaryArtist,
  escapeLuceneQuery,
  getCoverArtCacheKey,
  coverArtUrl,
  CoverArtCacheEntry,
} from '../../services/musicBrainzService';
import {
  SAMPLE_TRACKS,
  DISCOVERY_TRACKS_TRENDING,
  DISCOVERY_TRACKS_FORYOU,
} from '../../data/mediaData';

describe('Album Art Integration & Release-Group Resolution (v1.4)', () => {
  it('1. Correctly strips featured and collaborating artists to primary artist', () => {
    assert.equal(primaryArtist('The Weeknd ft. Daft Punk'), 'The Weeknd');
    assert.equal(primaryArtist('The Weeknd feat. Daft Punk'), 'The Weeknd');
    assert.equal(primaryArtist('The Weeknd featuring Daft Punk'), 'The Weeknd');
    assert.equal(primaryArtist('The Kid LAROI & Justin Bieber'), 'The Kid LAROI');
    assert.equal(primaryArtist('Post Malone & Swae Lee'), 'Post Malone');
    assert.equal(primaryArtist('Drake x 21 Savage'), 'Drake');
    assert.equal(primaryArtist('Dua Lipa'), 'Dua Lipa');
    assert.equal(primaryArtist('Ed Sheeran'), 'Ed Sheeran');
    assert.equal(primaryArtist(''), '');
  });

  it('2. Properly escapes Lucene reserved characters in search terms', () => {
    // Escapes +, -, &&, ||, !, (, ), {, }, [, ], ^, ", ~, *, ?, :, \, /
    assert.equal(escapeLuceneQuery('='), '=');
    assert.equal(escapeLuceneQuery('F*CK LOVE 3: OVER YOU'), 'F\\*CK LOVE 3\\: OVER YOU');
    assert.equal(escapeLuceneQuery('AC/DC'), 'AC\\/DC');
    assert.equal(escapeLuceneQuery('What? (Deluxe) [2024]'), 'What\\? \\(Deluxe\\) \\[2024\\]');
    assert.equal(escapeLuceneQuery('Normal Album Title'), 'Normal Album Title');
  });

  it('3. Generates consistent and normalized cache keys', () => {
    const key1 = getCoverArtCacheKey('The Weeknd ft. Daft Punk', 'Starboy');
    const key2 = getCoverArtCacheKey('The Weeknd', 'Starboy');
    const key3 = getCoverArtCacheKey('the weeknd', 'starboy');
    assert.equal(key1, 'the weeknd::starboy');
    assert.equal(key2, 'the weeknd::starboy');
    assert.equal(key3, 'the weeknd::starboy');

    const keyKidLaroi = getCoverArtCacheKey('The Kid LAROI & Justin Bieber', 'F*CK LOVE 3: OVER YOU');
    assert.equal(keyKidLaroi, 'the kid laroi::f*ck love 3: over you');
  });

  it('4. Generates valid Cover Art Archive release-group URLs', () => {
    const mbid = '76df3287-6cda-33eb-8e9a-044b5e15ffdd';
    assert.equal(
      coverArtUrl(mbid, 250),
      'https://coverartarchive.org/release-group/76df3287-6cda-33eb-8e9a-044b5e15ffdd/front-250'
    );
    assert.equal(
      coverArtUrl(mbid, 500),
      'https://coverartarchive.org/release-group/76df3287-6cda-33eb-8e9a-044b5e15ffdd/front-500'
    );
  });

  it('5. Correctly resolves CoverArtCacheEntry with candidate fallback indexing', () => {
    const entry: CoverArtCacheEntry = {
      candidates: ['mbid-candidate-0', 'mbid-candidate-1', 'mbid-candidate-2'],
      candidateIndex: 0,
      status: 'found',
      resolvedAt: Date.now(),
    };

    assert.equal(
      coverArtUrl(entry, 250),
      'https://coverartarchive.org/release-group/mbid-candidate-0/front-250'
    );

    // Advance to candidate 1
    entry.candidateIndex = 1;
    assert.equal(
      coverArtUrl(entry, 250),
      'https://coverartarchive.org/release-group/mbid-candidate-1/front-250'
    );

    // When status is not-found, returns null
    entry.status = 'not-found';
    assert.equal(coverArtUrl(entry, 250), null);
  });

  it('6. Formulates exact fielded Lucene query with releasegroup field', () => {
    const artist = 'The Kid LAROI & Justin Bieber';
    const album = 'F*CK LOVE 3: OVER YOU';
    const cleanArtist = primaryArtist(artist);
    const escapedArtist = escapeLuceneQuery(cleanArtist);
    const escapedAlbum = escapeLuceneQuery(album);
    const query = `artist:"${escapedArtist}" AND releasegroup:"${escapedAlbum}"`;

    assert.equal(
      query,
      'artist:"The Kid LAROI" AND releasegroup:"F\\*CK LOVE 3\\: OVER YOU"'
    );
  });

  it('7. Validates all sample and discovery tracks have valid artist and album data for cover resolution', () => {
    SAMPLE_TRACKS.forEach((track) => {
      assert.ok(track.artist.length > 0, `Track ${track.id} must have artist`);
      assert.ok(track.album.length > 0, `Track ${track.id} must have album`);
      const key = getCoverArtCacheKey(track.artist, track.album);
      assert.ok(key.includes('::'), `Cache key must be formatted as artist::album`);
    });

    [...DISCOVERY_TRACKS_TRENDING, ...DISCOVERY_TRACKS_FORYOU].forEach((track) => {
      assert.ok(track.artist.length > 0, `Discovery track ${track.id} must have artist`);
      assert.ok(track.album.length > 0, `Discovery track ${track.id} must have album`);
      const key = getCoverArtCacheKey(track.artist, track.album);
      assert.ok(key.includes('::'), `Cache key must be formatted as artist::album`);
    });
  });
});

