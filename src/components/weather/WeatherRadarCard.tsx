import React, { useState, useEffect, useMemo } from 'react';
import { RefreshCw, AlertTriangle, Layers } from 'lucide-react';

/**
 * WeatherRadarCard
 *
 * Renders a glanceable live local weather radar tile map using RainViewer's public tile API.
 * 
 * Note: May accept a responsive size or overlay mode prop in the future for cross-screen
 * placement (e.g. Navigation or On-Demand Vehicle status overlay).
 */
export interface WeatherRadarCardProps {
  lat: number;
  lon: number;
  zoom?: number;
  label?: string;
  refreshIntervalMinutes?: number;
  className?: string;
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

export const WeatherRadarCard: React.FC<WeatherRadarCardProps> = ({
  lat,
  lon,
  zoom = 7,
  label = 'LOCAL RADAR',
  refreshIntervalMinutes = 5,
  className = '',
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

  return (
    <div
      id="weather-radar-card"
      className={`bg-slate-900/80 backdrop-blur-sm border border-slate-800 rounded-2xl p-4 flex flex-col shadow-lg text-slate-100 transition-all ${className}`}
    >
      {/* Header (No decorative icon / no blinking per driver safety guidelines) */}
      <div className="flex items-center justify-between pb-2.5 border-b border-slate-800/80">
        <div>
          <div id="weather-radar-label" className="text-sm font-black font-mono tracking-wider text-slate-200 uppercase">
            {label}
          </div>
          <div className="text-[10px] font-mono text-slate-400">
            {formattedTime ? `UPDATED ${formattedTime}` : 'RAINVIEWER LIVE TILES'}
          </div>
        </div>

        {/* Action / Refresh & Intensity Legend */}
        <div className="flex items-center gap-3">
          <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-slate-950/70 border border-slate-800 text-[10px] font-mono">
            <span className="text-slate-500 uppercase">INTENSITY:</span>
            <span className="inline-block w-2 h-2 rounded-full bg-emerald-400" title="Light" />
            <span className="inline-block w-2 h-2 rounded-full bg-amber-400" title="Moderate" />
            <span className="inline-block w-2 h-2 rounded-full bg-rose-500" title="Heavy" />
          </div>

          <button
            id="weather-radar-refresh-btn"
            onClick={fetchRadarData}
            disabled={isLoading}
            className="p-1.5 rounded-lg bg-slate-950/60 hover:bg-slate-800 border border-slate-800 text-slate-400 hover:text-slate-200 transition-colors disabled:opacity-50 cursor-pointer"
            title="Refresh Radar"
            aria-label="Refresh radar"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Radar Map Canvas Container (Reduced to h-28 md:h-32 for glanceable mini preview) */}
      <div className="relative mt-2.5 w-full h-28 md:h-32 rounded-xl overflow-hidden bg-slate-950 border border-slate-800/90 flex items-center justify-center select-none">
        {hasError ? (
          <div className="flex flex-col items-center gap-1.5 text-slate-400 p-2 text-center">
            <AlertTriangle className="w-5 h-5 text-amber-400" />
            <span className="text-[11px] font-mono">RADAR FEED TEMPORARILY UNAVAILABLE</span>
            <button
              onClick={fetchRadarData}
              className="mt-0.5 px-2.5 py-0.5 text-[11px] font-mono font-bold bg-slate-800 hover:bg-slate-700 rounded-lg text-slate-200 border border-slate-700 transition-colors cursor-pointer"
            >
              Retry
            </button>
          </div>
        ) : (
          <div className="relative w-full h-full overflow-hidden flex items-center justify-center">
            {/* 3x3 Tile Grid Centered */}
            <div
              className="absolute grid grid-cols-3 grid-rows-3 w-[768px] h-[768px] pointer-events-none"
              style={{
                left: '50%',
                top: '50%',
                transform: 'translate(-50%, -50%)',
              }}
            >
              {tileOffsets.map((tile) => {
                const baseMapUrl = `https://a.basemaps.cartocdn.com/dark_all/${safeZoom}/${tile.x}/${tile.y}.png`;
                const radarTileUrl = radarPath
                  ? `${radarHost}${radarPath}/256/${safeZoom}/${tile.x}/${tile.y}/2/1_1.png`
                  : null;

                return (
                  <div key={`${tile.x}-${tile.y}`} className="relative w-[256px] h-[256px] bg-slate-950">
                    {/* Base Carto Dark Tile */}
                    <img
                      src={baseMapUrl}
                      alt=""
                      aria-hidden="true"
                      referrerPolicy="no-referrer"
                      className="absolute inset-0 w-full h-full object-cover opacity-70"
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

            {/* Static Reticle / Local Area Center Marker (No blinking/ping per driver guidelines) */}
            <div className="absolute z-20 flex items-center justify-center pointer-events-none">
              <div className="relative flex items-center justify-center">
                <div className="w-6 h-6 rounded-full border border-sky-400/30 absolute" />
                <div className="w-3.5 h-3.5 rounded-full bg-sky-500/20 border border-sky-400 flex items-center justify-center shadow-lg">
                  <div className="w-1.5 h-1.5 rounded-full bg-sky-400" />
                </div>
              </div>
            </div>

            {/* Status / Coordinate Overlay Chip */}
            <div className="absolute bottom-2 left-2 z-20 px-2 py-0.5 rounded bg-slate-950/80 backdrop-blur-sm border border-slate-800 text-[10px] font-mono text-slate-400">
              {lat.toFixed(2)}°N, {Math.abs(lon).toFixed(2)}°W • ZOOM {safeZoom}X
            </div>

            {/* Source Watermark */}
            <div className="absolute bottom-2 right-2 z-20 px-2 py-0.5 rounded bg-slate-950/80 backdrop-blur-sm border border-slate-800 text-[9px] font-mono text-slate-500 flex items-center gap-1">
              <Layers className="w-2.5 h-2.5" />
              RAINVIEWER • CARTO
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

