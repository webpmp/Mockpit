import React, { useState, useEffect, useMemo } from 'react';
import { RefreshCw, AlertTriangle, Layers } from 'lucide-react';

/**
 * WeatherRadarCard
 *
 * Renders a glanceable live local weather radar tile map using RainViewer's public tile API
 * and Carto's light_all (Positron) base map tiles for high legibility.
 */
export interface WeatherRadarCardProps {
  lat: number;
  lon: number;
  zoom?: number;
  label?: string;
  refreshIntervalMinutes?: number;
  className?: string;
  onExpand?: () => void;
  variant?: 'compact' | 'full';
  sizeMode?: 'width' | 'height';
}

// Convert longitude to Slippy Map tile X
function lon2tile(lon: number, zoom: number): number {
  return Math.floor(((lon + 180) / 360) * Math.pow(2, zoom));
}

// Convert latitude to Slippy Map tile Y
function lat2tile(lat: number, zoom: number): number {
  return Math.floor(
    ((1 -
      Math.log(
        Math.tan((lat * Math.PI) / 180) + 1 / Math.cos((lat * Math.PI) / 180)
      ) /
        Math.PI) /
      2) *
      Math.pow(2, zoom)
  );
}

/**
 * Shared 3x3 Tile Mosaic Sub-Component
 * Renders a crisp Carto Positron (light_all) base map with RainViewer radar overlay
 * and centered target reticle, supporting an optional scale multiplier for landscape cover crop.
 */
const RadarTileMosaic: React.FC<{
  tileOffsets: { x: number; y: number }[];
  safeZoom: number;
  radarHost: string;
  radarPath: string | null;
  reticleSize?: 'sm' | 'lg';
  scale?: number;
}> = ({ tileOffsets, safeZoom, radarHost, radarPath, reticleSize = 'sm', scale = 1 }) => (
  <>
    {/* 3x3 Tile Grid Centered (768x768px native tile mosaic, scaled via transform) */}
    <div
      className="absolute grid grid-cols-3 grid-rows-3 w-[768px] h-[768px] pointer-events-none"
      style={{
        left: '50%',
        top: '50%',
        transform: `translate(-50%, -50%) scale(${scale})`,
      }}
    >
      {tileOffsets.map((tile) => {
        // Carto light_all (Positron) provides clean, high-contrast, light neutral-gray cartography
        const baseMapUrl = `https://a.basemaps.cartocdn.com/light_all/${safeZoom}/${tile.x}/${tile.y}.png`;
        const radarTileUrl = radarPath
          ? `${radarHost}${radarPath}/256/${safeZoom}/${tile.x}/${tile.y}/2/1_1.png`
          : null;

        return (
          <div key={`${tile.x}-${tile.y}`} className="relative w-[256px] h-[256px] bg-slate-200">
            {/* Base Carto Light Tile at 90% opacity */}
            <img
              src={baseMapUrl}
              alt=""
              aria-hidden="true"
              referrerPolicy="no-referrer"
              className="absolute inset-0 w-full h-full object-cover opacity-90"
            />
            {/* RainViewer Weather Radar Tile Overlay */}
            {radarTileUrl && (
              <img
                src={radarTileUrl}
                alt=""
                aria-hidden="true"
                referrerPolicy="no-referrer"
                className="absolute inset-0 w-full h-full object-cover z-10 opacity-90"
              />
            )}
          </div>
        );
      })}
    </div>

    {/* Static Reticle / Local Area Center Marker */}
    <div className="absolute z-20 flex items-center justify-center pointer-events-none">
      <div className="relative flex items-center justify-center">
        {reticleSize === 'lg' ? (
          <>
            <div className="w-8 h-8 rounded-full border border-sky-500/40 absolute" />
            <div className="w-4 h-4 rounded-full bg-sky-500/25 border border-sky-500 flex items-center justify-center shadow-lg">
              <div className="w-2 h-2 rounded-full bg-sky-500 shadow-[0_0_6px_#0284c7]" />
            </div>
          </>
        ) : (
          <>
            <div className="w-6 h-6 rounded-full border border-sky-500/40 absolute" />
            <div className="w-3.5 h-3.5 rounded-full bg-sky-500/25 border border-sky-500 flex items-center justify-center shadow-lg">
              <div className="w-1.5 h-1.5 rounded-full bg-sky-500" />
            </div>
          </>
        )}
      </div>
    </div>
  </>
);

export const WeatherRadarCard: React.FC<WeatherRadarCardProps> = ({
  lat,
  lon,
  zoom = 7,
  label = 'LOCAL RADAR',
  refreshIntervalMinutes = 5,
  className = '',
  onExpand,
  variant = 'compact',
  sizeMode = 'width',
}) => {
  // RainViewer free tier tile API max zoom is 7. Strictly clamp 0..7.
  const safeZoom = Math.max(0, Math.min(7, Math.round(zoom)));

  const [radarHost, setRadarHost] = useState<string>('https://tilecache.rainviewer.com');
  const [radarPath, setRadarPath] = useState<string | null>(null);
  const [frameTime, setFrameTime] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [hasError, setHasError] = useState<boolean>(false);

  // Compute central tile and 3x3 surrounding tiles
  const centerTile = useMemo(() => {
    const x = lon2tile(lon, safeZoom);
    const y = lat2tile(lat, safeZoom);
    return { x, y };
  }, [lat, lon, safeZoom]);

  const tileOffsets = useMemo(() => {
    const tiles: { dx: number; dy: number; x: number; y: number }[] = [];
    for (let dy = -1; dy <= 1; dy++) {
      for (let dx = -1; dx <= 1; dx++) {
        tiles.push({
          dx,
          dy,
          x: centerTile.x + dx,
          y: centerTile.y + dy,
        });
      }
    }
    return tiles;
  }, [centerTile]);

  const fetchRadarData = async () => {
    try {
      setIsLoading(true);
      setHasError(false);
      const res = await fetch('https://api.rainviewer.com/public/weather-maps.json');
      if (!res.ok) throw new Error(`Radar API responded with status ${res.status}`);
      const data = await res.json();
      
      const host = data.host || 'https://tilecache.rainviewer.com';
      setRadarHost(host);

      // Grab the latest past radar frame (or nowcast if past is empty)
      const pastFrames = data.radar?.past;
      if (Array.isArray(pastFrames) && pastFrames.length > 0) {
        const latest = pastFrames[pastFrames.length - 1];
        setRadarPath(latest.path);
        setFrameTime(latest.time);
      } else if (Array.isArray(data.radar?.nowcast) && data.radar.nowcast.length > 0) {
        const latest = data.radar.nowcast[0];
        setRadarPath(latest.path);
        setFrameTime(latest.time);
      } else {
        throw new Error('No radar frames available');
      }
    } catch (err) {
      console.warn('[WeatherRadarCard] Failed to load RainViewer radar frames:', err);
      setHasError(true);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchRadarData();
    const intervalMs = Math.max(1, refreshIntervalMinutes) * 60 * 1000;
    const interval = setInterval(fetchRadarData, intervalMs);
    return () => clearInterval(interval);
  }, [lat, lon, refreshIntervalMinutes]);

  const formattedTime = useMemo(() => {
    if (!frameTime) return null;
    const date = new Date(frameTime * 1000);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  }, [frameTime]);

  const isFull = variant === 'full';

  // ──────────────────────────────────────────────────────────────────────────
  // FULL VARIANT: 575px Bounded Square Map with Cover Crop (scale=1.5)
  // ──────────────────────────────────────────────────────────────────────────
  if (isFull) {
    return (
      <div
        id="weather-radar-card"
        className={`relative w-full aspect-square max-w-[575px] max-h-[575px] rounded-2xl overflow-hidden bg-slate-200 border border-slate-800/90 select-none shadow-2xl ${className}`}
      >
        {hasError ? (
          <div className="flex flex-col items-center justify-center w-full h-full gap-2 text-slate-700 p-4 text-center">
            <AlertTriangle className="w-6 h-6 text-amber-600" />
            <span className="text-xs font-mono font-bold">RADAR FEED TEMPORARILY UNAVAILABLE</span>
            <button
              onClick={fetchRadarData}
              className="mt-1 px-3 py-1 text-xs font-mono font-bold bg-slate-800 hover:bg-slate-700 rounded-lg text-slate-100 border border-slate-700 transition-colors cursor-pointer"
            >
              Retry
            </button>
          </div>
        ) : (
          <div className="relative w-full h-full overflow-hidden flex items-center justify-center">
            <RadarTileMosaic
              tileOffsets={tileOffsets}
              safeZoom={safeZoom}
              radarHost={radarHost}
              radarPath={radarPath}
              reticleSize="lg"
              scale={1.5}
            />

            {/* Bottom-left: Intensity legend overlay chip */}
            <div className="absolute bottom-3 left-3 z-20 flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-950/85 backdrop-blur-sm border border-slate-800 text-[10px] font-mono shadow-md text-slate-200">
              <span className="text-slate-400 uppercase font-bold">INTENSITY:</span>
              <span className="inline-block w-2 h-2 rounded-full bg-emerald-400" title="Light" />
              <span className="inline-block w-2 h-2 rounded-full bg-amber-400" title="Moderate" />
              <span className="inline-block w-2 h-2 rounded-full bg-rose-500" title="Heavy" />
            </div>

            {/* Top-right: Enlarged Refresh button (meets >=44x44px minimum tap target) */}
            <button
              id="weather-radar-refresh-btn"
              onClick={fetchRadarData}
              disabled={isLoading}
              className="absolute top-3 right-3 z-20 min-w-[44px] min-h-[44px] flex items-center justify-center rounded-lg bg-slate-950/85 backdrop-blur-sm border border-slate-800 text-slate-300 hover:text-slate-100 transition-colors disabled:opacity-50 cursor-pointer shadow-md"
              title="Refresh Radar"
              aria-label="Refresh radar"
            >
              <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
            </button>

            {/* Bottom-right: Source Watermark */}
            <div className="absolute bottom-3 right-3 z-20 px-2.5 py-1 rounded-lg bg-slate-950/85 backdrop-blur-sm border border-slate-800 text-[10px] font-mono text-slate-400 flex items-center gap-1.5 shadow-md">
              <Layers className="w-3 h-3" />
              RAINVIEWER • CARTO
            </div>
          </div>
        )}
      </div>
    );
  }

  // ──────────────────────────────────────────────────────────────────────────
  // COMPACT VARIANT (Weather Screen):
  // Clean, no internal header row. Entire square radar map is clickable to full radar view.
  // ──────────────────────────────────────────────────────────────────────────
  return (
    <div
      id="weather-radar-card"
      role={onExpand ? 'button' : undefined}
      tabIndex={onExpand ? 0 : undefined}
      onClick={onExpand}
      onKeyDown={
        onExpand
          ? (e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                onExpand();
              }
            }
          : undefined
      }
      className={`bg-slate-900/80 backdrop-blur-sm border border-slate-800 rounded-2xl p-2.5 sm:p-3 flex flex-col items-center justify-center shadow-lg text-slate-100 ${
        onExpand ? 'cursor-pointer' : ''
      } ${className}`}
    >
      <div
        className={
          sizeMode === 'height'
            ? 'relative h-full w-auto aspect-square mx-auto rounded-xl overflow-hidden bg-slate-200 border border-slate-800/90 select-none flex items-center justify-center'
            : 'relative w-full aspect-square max-h-[340px] mx-auto rounded-xl overflow-hidden bg-slate-200 border border-slate-800/90 select-none flex items-center justify-center'
        }
      >
        {hasError ? (
          <div className="flex flex-col items-center gap-1.5 text-slate-700 p-3 text-center">
            <AlertTriangle className="w-5 h-5 text-amber-600" />
            <span className="text-[11px] font-mono font-bold">RADAR FEED TEMPORARILY UNAVAILABLE</span>
            <button
              onClick={(e) => {
                e.stopPropagation();
                fetchRadarData();
              }}
              className="mt-1 px-2.5 py-0.5 text-[10px] font-mono font-bold bg-slate-800 hover:bg-slate-700 rounded-md text-slate-100 border border-slate-700 transition-colors cursor-pointer"
            >
              Retry
            </button>
          </div>
        ) : (
          <div className="relative w-full h-full overflow-hidden flex items-center justify-center">
            <RadarTileMosaic
              tileOffsets={tileOffsets}
              safeZoom={safeZoom}
              radarHost={radarHost}
              radarPath={radarPath}
              reticleSize="sm"
            />
          </div>
        )}
      </div>
    </div>
  );
};
