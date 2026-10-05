import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import {
  Search,
  Mic,
  Radio,
  X,
  Play,
  Volume2,
  ChevronDown,
  ChevronUp,
  Activity,
} from 'lucide-react';
import { ComponentInstance } from '../types';
import { DEFAULT_COMPONENT_LABELS } from './ComponentRenderer';
import { MockpitInput } from './MockpitInput';
import {
  SEARCHABLE_CATALOG,
  MOCK_NLU_LOOKUP,
  SearchCatalogItem,
} from '../data/mediaData';
import { useSpeechRecognition } from '../hooks/useSpeechRecognition';
import { useMockpitStore } from '../store/useMockpitStore';
import { getBorderClasses } from '../utils/borderOverrides';

export interface MusicSearchWidgetProps {
  component: ComponentInstance;
  resolved: Record<string, any>;
  isSelected?: boolean;
  customColor: string;
  baseOpacity: string;
  styleOpacity: number;
}

export const MusicSearchWidget: React.FC<MusicSearchWidgetProps> = ({
  component,
  resolved,
  isSelected,
  customColor,
  baseOpacity,
  styleOpacity,
}) => {
  const [query, setQuery] = useState('');
  const [isFocused, setIsFocused] = useState(false);
  const [isRecognizingAudio, setIsRecognizingAudio] = useState(false);
  const [recognizedResult, setRecognizedResult] = useState<string | null>(null);
  const [lastPlayedId, setLastPlayedId] = useState<string | null>(null);
  const [isSpokenWordExpanded, setIsSpokenWordExpanded] = useState(false);
  const [focusedIndex, setFocusedIndex] = useState<number>(-1);

  const setCurrentTrack = useMockpitStore((s) => s.setCurrentTrack);
  const closeKeyboard = useMockpitStore((s) => s.closeKeyboard);
  const searchInputRef = useRef<HTMLInputElement>(null);

  const containerRef = useRef<HTMLDivElement>(null);
  const [containerWidth, setContainerWidth] = useState<number>(component.width || 580);
  const [containerHeight, setContainerHeight] = useState<number>(component.height || 220);

  // Resize observer to detect container width & height for responsive reflow
  useEffect(() => {
    if (!containerRef.current) return;
    const observer = new ResizeObserver((entries) => {
      for (const entry of entries) {
        if (entry.contentRect) {
          setContainerWidth(entry.contentRect.width);
          setContainerHeight(entry.contentRect.height);
        }
      }
    });
    observer.observe(containerRef.current);
    return () => observer.disconnect();
  }, []);

  const isNarrow = containerWidth < 480;
  const isShort = containerHeight < 140;
  const showHeader = !isNarrow && !isShort && component.staticProps?.showHeader !== 'false';

  // Speech Recognition hook integration (reusing shared hook for speech-to-text)
  const {
    isListening,
    isSpeechSupported,
    toggleListening: rawToggleListening,
    stopListening,
  } = useSpeechRecognition({
    onTranscript: (transcript) => {
      if (transcript) {
        setQuery(transcript);
        setIsFocused(true);
      }
    },
  });

  const handleToggleListening = useCallback(() => {
    if (isRecognizingAudio) {
      setIsRecognizingAudio(false);
      return;
    }
    if (isListening) {
      stopListening();
    } else {
      rawToggleListening();
    }
  }, [isListening, isRecognizingAudio, rawToggleListening, stopListening]);

  // Ambient song recognition (identify ambient audio / hum-to-search) simulation
  const handleIdentifyMusic = useCallback(() => {
    if (isListening) {
      stopListening();
    }
    if (isRecognizingAudio) {
      setIsRecognizingAudio(false);
      return;
    }

    setIsRecognizingAudio(true);
    setRecognizedResult(null);

    // Fixed 1.5s simulated delay as required by spec §6
    setTimeout(() => {
      setIsRecognizingAudio(false);
      const songTitle = 'Salad Days';
      setRecognizedResult('Mac DeMarco — Salad Days');
      setQuery(songTitle);
    }, 1500);
  }, [isListening, isRecognizingAudio, stopListening]);

  // Physical controls simulation: Alt/Option+M triggers voice search
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.altKey || e.metaKey) && e.key.toLowerCase() === 'm') {
        e.preventDefault();
        handleToggleListening();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleToggleListening]);

  // NLU & Search matching algorithm
  const { musicResults, spokenWordResults, nluMatchTitle } = useMemo(() => {
    const cleanQuery = query.trim().toLowerCase();
    if (!cleanQuery) {
      return { musicResults: [], spokenWordResults: [], nluMatchTitle: null };
    }

    // Check exact or partial NLU phrase lookup
    for (const [nluKey, data] of Object.entries(MOCK_NLU_LOOKUP)) {
      if (cleanQuery.includes(nluKey) || nluKey.includes(cleanQuery)) {
        const music = data.results.filter((item) => item.contentType === 'music');
        const spoken = data.results.filter(
          (item) => item.contentType === 'podcast' || item.contentType === 'audiobook'
        );
        return {
          musicResults: music,
          spokenWordResults: spoken,
          nluMatchTitle: data.queryLabel,
        };
      }
    }

    // Direct federated catalog search (title, artist, album)
    const matched = SEARCHABLE_CATALOG.filter((item) => {
      const matchText = `${item.title} ${item.artist} ${item.album || ''}`.toLowerCase();
      return matchText.includes(cleanQuery);
    });

    const music = matched.filter((item) => item.contentType === 'music');
    const spoken = matched.filter(
      (item) => item.contentType === 'podcast' || item.contentType === 'audiobook'
    );

    return {
      musicResults: music,
      spokenWordResults: spoken,
      nluMatchTitle: null,
    };
  }, [query]);

  // Autocomplete suggestions (fires after 2 characters as specified in §10)
  const autocompleteSuggestions = useMemo(() => {
    const cleanQuery = query.trim().toLowerCase();
    if (!cleanQuery || cleanQuery.length < 2) return [];

    const cannedPhrases = [
      'indie rock',
      'workout hype',
      'something chill for the drive',
      'Mac DeMarco',
      'The Weeknd',
      'Harry Styles',
      'Daft Punk',
      'The Daily',
      'Atomic Habits',
      'Project Hail Mary',
    ];

    return cannedPhrases.filter(
      (phrase) =>
        phrase.toLowerCase().includes(cleanQuery) &&
        phrase.toLowerCase() !== cleanQuery
    );
  }, [query]);

  const allVisibleItems = useMemo(() => {
    const items: SearchCatalogItem[] = [...musicResults];
    if (isSpokenWordExpanded) {
      items.push(...spokenWordResults);
    }
    return items;
  }, [musicResults, spokenWordResults, isSpokenWordExpanded]);

  // Arrow key navigation through list items
  const handleContainerKeyDown = (e: React.KeyboardEvent) => {
    if (allVisibleItems.length === 0 && autocompleteSuggestions.length === 0) return;

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      const max = allVisibleItems.length > 0 ? allVisibleItems.length : autocompleteSuggestions.length;
      setFocusedIndex((prev) => (prev + 1) % max);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      const max = allVisibleItems.length > 0 ? allVisibleItems.length : autocompleteSuggestions.length;
      setFocusedIndex((prev) => (prev - 1 + max) % max);
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (allVisibleItems.length > 0 && focusedIndex >= 0 && focusedIndex < allVisibleItems.length) {
        handlePlayItem(allVisibleItems[focusedIndex]);
      } else if (autocompleteSuggestions.length > 0 && focusedIndex >= 0 && focusedIndex < autocompleteSuggestions.length) {
        setQuery(autocompleteSuggestions[focusedIndex]);
        setFocusedIndex(-1);
      }
    }
  };

  const clearSearch = () => {
    setQuery('');
    setRecognizedResult(null);
    setFocusedIndex(-1);
  };

  const handlePlayItem = (item: SearchCatalogItem) => {
    setLastPlayedId(item.id);
    if (item.linkedTrackId) {
      setCurrentTrack(item.linkedTrackId);
    }
    setTimeout(() => {
      setLastPlayedId(null);
    }, 2000);
    clearSearch();
    closeKeyboard({ isCancelled: false });
    searchInputRef.current?.blur();
  };

  const headerLabel =
    resolved.label ||
    component.staticProps?.label ||
    DEFAULT_COMPONENT_LABELS.mediaSearch ||
    'Music Search';

  const hasQuery = query.trim().length > 0;
  const isExpanded = isFocused || hasQuery || isListening || isRecognizingAudio;

  return (
    <div
      ref={containerRef}
      id={`component-${component.type}`}
      data-component-type="mediaSearch"
      onKeyDown={handleContainerKeyDown}
      tabIndex={0}
      className={`relative w-full h-full rounded-2xl bg-ds-surface/90 ${getBorderClasses(component.borderOverrides)} p-3.5 flex flex-col justify-between shadow-lg backdrop-blur-md transition-all duration-300 outline-none ${baseOpacity}`}
      style={{ borderColor: isSelected ? customColor : undefined, opacity: styleOpacity }}
    >
      {/* Header Row (shown at wider sizes, §3) */}
      {showHeader && (
        <div className="flex items-center justify-between h-9 pb-2 border-b border-ds-line-subtle/60 shrink-0">
          <div className="flex items-center gap-1.5 min-w-0">
            <Search className="w-3.5 h-3.5 text-ds-primary shrink-0" />
            <span className="text-xs font-bold uppercase tracking-wider text-ds-content-muted truncate">
              {headerLabel}
            </span>
          </div>
          <span className="text-[0.5625rem] font-mono text-ds-content-muted uppercase tracking-wider shrink-0">
            ALL SOURCES
          </span>
        </div>
      )}

      {/* Input Row (always present, at any size, §4) */}
      <div className="my-1.5 flex items-center gap-2.5 shrink-0">
        <div className="flex-1 min-w-0">
          <MockpitInput
            ref={searchInputRef}
            value={query}
            onChange={(val) => {
              setQuery(val);
              setFocusedIndex(-1);
            }}
            onFocus={() => setIsFocused(true)}
            onBlur={() => {
              setTimeout(() => setIsFocused(false), 250);
            }}
            placeholder='Search songs, artists, "play something..."'
            componentId={component.id}
            keyboardSlideDirection={component.staticProps?.keyboardSlideDirection as any}
            icon={<Search className="w-3.5 h-3.5 text-ds-content-subtle shrink-0" />}
            className="min-h-[44px] font-mono text-xs text-ds-content placeholder-ds-content-subtle"
            rightElement={
              hasQuery ? (
                <button
                  type="button"
                  onClick={clearSearch}
                  className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-ds-surface-raised text-ds-content-muted hover:text-ds-content transition-colors mr-1"
                  title="Clear search"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              ) : undefined
            }
          />
        </div>

        {/* Trailing Circular Mic / Recognition Button (44×44px minimum, §6) */}
        <div className="flex items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={handleToggleListening}
            className={`w-11 h-11 min-w-[44px] min-h-[44px] rounded-full flex items-center justify-center border transition-colors ${
              isListening
                ? 'bg-ds-warning/20 border-ds-warning/80 text-ds-warning ring-2 ring-ds-warning'
                : isSpeechSupported
                ? 'bg-ds-surface-raised/80 hover:bg-ds-surface-hover border-ds-line text-ds-content-muted hover:text-ds-content'
                : 'bg-ds-surface-raised/40 border-ds-line-subtle text-ds-content-disabled cursor-not-allowed'
            }`}
            title={
              isListening
                ? 'Listening... click to stop'
                : isSpeechSupported
                ? 'Voice Search (Speech Recognition)'
                : 'Voice search not supported'
            }
          >
            <Mic className="w-4 h-4" />
          </button>

          {/* Music Identification (ambient audio / hum-to-search simulation, §6) */}
          <button
            type="button"
            onClick={handleIdentifyMusic}
            className={`w-11 h-11 min-w-[44px] min-h-[44px] rounded-full flex items-center justify-center border transition-colors ${
              isRecognizingAudio
                ? 'bg-ds-primary/20 border-ds-primary/80 text-ds-primary ring-2 ring-ds-primary'
                : 'bg-ds-surface-raised/80 hover:bg-ds-surface-hover border-ds-line text-ds-content-muted hover:text-ds-content'
            }`}
            title={
              isRecognizingAudio
                ? 'Identifying ambient audio...'
                : 'Identify Playing Music (Ambient / Hum)'
            }
          >
            {isRecognizingAudio ? (
              <Activity className="w-4 h-4 text-ds-primary" />
            ) : (
              <Radio className="w-4 h-4" />
            )}
          </button>
        </div>
      </div>

      {/* Floating Results Dropdown (replaces inline Dynamic Content / Hint Row) */}
      {(isListening || isRecognizingAudio || hasQuery || (isFocused && autocompleteSuggestions.length > 0)) && (
        <div className="absolute left-0 right-0 top-full mt-1.5 z-40 bg-ds-background border border-ds-line-subtle rounded-xl shadow-2xl p-2 max-h-[320px] overflow-hidden">
          {isListening ? (
            <div className="w-full flex items-center justify-center text-xs font-mono text-ds-warning bg-ds-warning/10 border border-ds-warning/30 rounded-xl p-2">
              <span className="font-bold">Listening…</span>
              <span className="ml-2 text-[0.6875rem] text-ds-warning/80">Speak a song title, artist, or genre</span>
            </div>
          ) : isRecognizingAudio ? (
            <div className="w-full flex items-center justify-center text-xs font-mono text-ds-primary bg-ds-primary/10 border border-ds-primary/30 rounded-xl p-2">
              <span className="font-bold">Identifying song…</span>
              <span className="ml-2 text-[0.6875rem] text-ds-primary/80">Listening to ambient audio</span>
            </div>
          ) : hasQuery ? (
            /* Results View (§8 & §9) */
            <div className="w-full flex flex-col">
              {nluMatchTitle && (
                <div className="text-[0.6875rem] font-mono text-ds-primary mb-1 flex items-center gap-1.5 px-1">
                  <span>Smart Intent: {nluMatchTitle}</span>
                </div>
              )}

              <div className="space-y-2 overflow-y-auto pr-1 custom-scrollbar max-h-[280px]">
                {/* Songs Section (Music only, §8) */}
                {musicResults.length > 0 && (
                  <div className="space-y-1.5">
                    <div className="text-[0.625rem] font-mono uppercase tracking-wider text-ds-content-muted px-1">
                      Songs & Tracks ({musicResults.length})
                    </div>
                    {musicResults.map((item, idx) => {
                      const isItemFocused = focusedIndex === idx;
                      return (
                        <div
                          key={item.id}
                          onClick={() => handlePlayItem(item)}
                          className={`p-2 rounded-xl border flex items-center justify-between cursor-pointer transition-colors group min-h-[44px] ${
                            isItemFocused
                              ? 'bg-ds-surface-raised border-ds-primary'
                              : 'bg-ds-background/60 hover:bg-ds-surface-raised/80 border-ds-line-subtle/80'
                          }`}
                        >
                          <div className="flex items-center gap-2.5 min-w-0 pr-2">
                            <div className="w-8 h-8 rounded-lg bg-ds-surface-raised flex items-center justify-center shrink-0 border border-ds-line">
                              {lastPlayedId === item.id ? (
                                <Volume2 className="w-4 h-4 text-ds-success" />
                              ) : (
                                <Play className="w-3.5 h-3.5 text-ds-content-muted group-hover:text-ds-primary fill-current" />
                              )}
                            </div>
                            <div className="min-w-0">
                              <div className="text-xs font-bold text-ds-content truncate group-hover:text-white">
                                {item.title}
                              </div>
                              <div className="text-[0.625rem] text-ds-content-muted font-mono truncate">
                                {item.artist} {item.album ? `· ${item.album}` : ''} · {item.sourceLabel}
                              </div>
                            </div>
                          </div>

                          {item.duration && (
                            <span className="text-[0.625rem] font-mono text-ds-content-muted shrink-0">
                              {item.duration}
                            </span>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}

                {/* Spoken Word Section (Podcasts & Audiobooks, collapsed by default, §8) */}
                {spokenWordResults.length > 0 && (
                  <div className="space-y-1.5 pt-1 border-t border-ds-line-subtle/60">
                    <button
                      type="button"
                      onClick={() => setIsSpokenWordExpanded((prev) => !prev)}
                      className="w-full flex items-center justify-between px-2 py-1.5 rounded-lg bg-ds-background/40 hover:bg-ds-surface-raised/60 border border-ds-line-subtle/80 text-[0.6875rem] font-mono text-ds-content-secondary transition-colors min-h-[36px]"
                    >
                      <span>Podcasts & audiobooks ({spokenWordResults.length})</span>
                      {isSpokenWordExpanded ? (
                        <ChevronUp className="w-3.5 h-3.5 text-ds-content-muted" />
                      ) : (
                        <ChevronDown className="w-3.5 h-3.5 text-ds-content-muted" />
                      )}
                    </button>

                    {isSpokenWordExpanded && (
                      <div className="space-y-1.5 pl-1">
                        {spokenWordResults.map((item, idx) => {
                          const overallIdx = musicResults.length + idx;
                          const isItemFocused = focusedIndex === overallIdx;
                          return (
                            <div
                              key={item.id}
                              onClick={() => handlePlayItem(item)}
                              className={`p-2 rounded-xl border flex items-center justify-between cursor-pointer transition-colors group min-h-[44px] ${
                                isItemFocused
                                  ? 'bg-ds-surface-raised border-ds-primary'
                                  : 'bg-ds-background/60 hover:bg-ds-surface-raised/80 border-ds-line-subtle/80'
                              }`}
                            >
                              <div className="flex items-center gap-2.5 min-w-0 pr-2">
                                <div className="w-8 h-8 rounded-lg bg-ds-surface-raised flex items-center justify-center shrink-0 border border-ds-line">
                                  {lastPlayedId === item.id ? (
                                    <Volume2 className="w-4 h-4 text-ds-success" />
                                  ) : (
                                    <Play className="w-3.5 h-3.5 text-ds-content-muted group-hover:text-ds-primary fill-current" />
                                  )}
                                </div>
                                <div className="min-w-0">
                                  <div className="text-xs font-bold text-ds-content truncate group-hover:text-white">
                                    {item.title}
                                  </div>
                                  <div className="text-[0.625rem] text-ds-content-muted font-mono truncate">
                                    {item.artist} · {item.sourceLabel}
                                  </div>
                                </div>
                              </div>

                              {item.duration && (
                                <span className="text-[0.625rem] font-mono text-ds-content-muted shrink-0">
                                  {item.duration}
                                </span>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                )}

                {musicResults.length === 0 && spokenWordResults.length === 0 && (
                  <div className="text-[0.6875rem] text-ds-content-subtle italic p-2 text-center font-mono">
                    No matching music, podcasts, or audiobooks found
                  </div>
                )}
              </div>
            </div>
          ) : (
            /* Autocomplete List (§10) */
            <div className="space-y-2 overflow-y-auto pr-1 custom-scrollbar max-h-[280px]">
              <div className="text-[0.625rem] font-mono text-ds-content-subtle uppercase tracking-wider px-1">
                Suggestions
              </div>
              <div className="space-y-2">
                {autocompleteSuggestions.map((suggestion, idx) => (
                  <button
                    key={suggestion}
                    type="button"
                    onClick={() => {
                      setQuery(suggestion);
                      setFocusedIndex(-1);
                    }}
                    className={`w-full p-2.5 rounded-xl border text-left font-mono text-xs flex items-center justify-between min-h-[44px] transition-colors ${
                      focusedIndex === idx
                        ? 'bg-ds-surface-raised border-ds-primary text-ds-primary'
                        : 'bg-ds-background/70 hover:bg-ds-surface-raised/80 border-ds-line-subtle text-ds-content-secondary'
                    }`}
                  >
                    <span className="truncate">{suggestion}</span>
                    <span className="text-[0.625rem] text-ds-content-subtle font-mono">Search</span>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default MusicSearchWidget;
