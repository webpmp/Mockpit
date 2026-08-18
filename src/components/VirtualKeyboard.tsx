import React, { useState, useEffect, useRef } from 'react';
import { X, Delete, Mic, MicOff } from 'lucide-react';
import { useMockpitStore } from '../store/useMockpitStore';
import { KeyboardSlideDirection } from '../types';

export const VirtualKeyboard: React.FC = () => {
  const isKeyboardVisible = useMockpitStore((s) => s.isKeyboardVisible);
  const activeInputState = useMockpitStore((s) => s.activeInputState);
  const globalDirection = useMockpitStore((s) => s.keyboardSlideDirection);
  const componentsByScreen = useMockpitStore((s) => s.componentsByScreen);
  const closeKeyboard = useMockpitStore((s) => s.closeKeyboard);
  const typeKeyboardKey = useMockpitStore((s) => s.typeKeyboardKey);
  const backspaceKeyboardKey = useMockpitStore((s) => s.backspaceKeyboardKey);
  const clearKeyboardKey = useMockpitStore((s) => s.clearKeyboardKey);

  const [mode, setMode] = useState<'qwerty' | 'symbols'>('qwerty');
  const [isCaps, setIsCaps] = useState<boolean>(true);
  const [pressedKeys, setPressedKeys] = useState<Set<string>>(new Set());

  // Animation lifecycle state
  const [renderKeyboard, setRenderKeyboard] = useState<boolean>(false);
  const [animateIn, setAnimateIn] = useState<boolean>(false);
  const [cachedInputState, setCachedInputState] = useState(activeInputState);

  // Keep last active input state so slide-out animation renders cleanly
  useEffect(() => {
    if (activeInputState) {
      setCachedInputState(activeInputState);
    }
  }, [activeInputState]);

  // Handle slide-in / slide-out mounting and animation
  useEffect(() => {
    if (isKeyboardVisible) {
      setRenderKeyboard(true);
      const timer = setTimeout(() => {
        setAnimateIn(true);
      }, 20);
      return () => clearTimeout(timer);
    } else {
      setAnimateIn(false);
      const timer = setTimeout(() => {
        setRenderKeyboard(false);
      }, 300);
      return () => clearTimeout(timer);
    }
  }, [isKeyboardVisible]);

  // Speech Recognition state
  const [isListening, setIsListening] = useState(false);
  const [isSpeechSupported, setIsSpeechSupported] = useState(false);
  const recognitionRef = useRef<any>(null);

  useEffect(() => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    setIsSpeechSupported(!!SpeechRecognition);
  }, []);

  const toggleListening = () => {
    if (!isSpeechSupported) return;

    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) return;

    if (isListening) {
      if (recognitionRef.current) {
        try {
          recognitionRef.current.stop();
        } catch (_) {}
      }
      setIsListening(false);
      return;
    }

    try {
      const recognition = new SpeechRecognition();
      recognition.continuous = false;
      recognition.interimResults = false;
      recognition.lang = 'en-US';

      recognition.onstart = () => {
        setIsListening(true);
      };

      recognition.onresult = (event: any) => {
        const transcript = event.results[0]?.[0]?.transcript;
        if (transcript) {
          typeKeyboardKey(transcript);
        }
      };

      recognition.onerror = (event: any) => {
        console.warn('Speech recognition error:', event.error);
        setIsListening(false);
      };

      recognition.onend = () => {
        setIsListening(false);
      };

      recognitionRef.current = recognition;
      recognition.start();
    } catch (err) {
      console.warn('Speech recognition initialization error:', err);
      setIsListening(false);
    }
  };

  // Physical keyboard passthrough & pressed key state tracking
  const handleEnterCommit = () => {
    const active = useMockpitStore.getState().activeInputState;
    if (active?.onSubmit) {
      active.onSubmit(active.value);
    } else if (active?.onEnter) {
      active.onEnter();
    } else {
      closeKeyboard();
    }
  };

  useEffect(() => {
    if (!isKeyboardVisible) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      // Allow browser shortcuts (Cmd+R, Ctrl+Shift+I, etc.)
      if (e.metaKey || e.ctrlKey || e.altKey) return;

      const key = e.key;
      const keyLower = key.toLowerCase();

      // Track pressed key for visual feedback
      setPressedKeys((prev) => {
        const next = new Set(prev);
        next.add(keyLower);
        return next;
      });

      if (key === 'Escape') {
        e.preventDefault();
        closeKeyboard();
        return;
      }

      if (key === 'Enter') {
        e.preventDefault();
        handleEnterCommit();
        return;
      }

      if (key === 'Backspace') {
        e.preventDefault();
        backspaceKeyboardKey();
        return;
      }

      if (key === 'Tab' || key === ' ') {
        e.preventDefault();
        typeKeyboardKey(' ');
        return;
      }

      if (key === 'Shift') {
        setIsCaps((prev) => !prev);
        return;
      }

      if (key.length === 1) {
        e.preventDefault();
        typeKeyboardKey(key);
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      const keyLower = e.key.toLowerCase();
      setPressedKeys((prev) => {
        const next = new Set(prev);
        next.delete(keyLower);
        return next;
      });
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
      setPressedKeys(new Set());
    };
  }, [isKeyboardVisible, closeKeyboard, backspaceKeyboardKey, typeKeyboardKey]);

  if (!renderKeyboard || !cachedInputState) return null;

  // Resolve effective slide direction
  let effectiveDirection: KeyboardSlideDirection = globalDirection;

  if (
    cachedInputState.keyboardSlideDirectionOverride &&
    cachedInputState.keyboardSlideDirectionOverride !== 'default'
  ) {
    effectiveDirection = cachedInputState.keyboardSlideDirectionOverride;
  } else if (cachedInputState.componentId) {
    // Check component staticProps override
    for (const screenList of Object.values(componentsByScreen)) {
      const comp = screenList.find((c) => c.id === cachedInputState.componentId);
      if (comp && comp.staticProps?.keyboardSlideDirection) {
        const dir = comp.staticProps.keyboardSlideDirection as KeyboardSlideDirection | 'default';
        if (dir && dir !== 'default' && ['bottom', 'top', 'left', 'right'].includes(dir)) {
          effectiveDirection = dir as KeyboardSlideDirection;
          break;
        }
      }
    }
  }

  // Directional positioning and transform styles
  let basePositionClass = '';
  let transformClass = '';

  switch (effectiveDirection) {
    case 'top':
      basePositionClass = 'absolute top-6 left-1/2 -translate-x-1/2 z-50 w-[70%] max-w-none';
      transformClass = animateIn ? 'translate-y-0 opacity-100' : '-translate-y-[120%] opacity-0';
      break;
    case 'left':
      basePositionClass = 'absolute left-6 top-1/2 -translate-y-1/2 z-50 w-[70%] max-w-none';
      transformClass = animateIn ? 'translate-x-0 opacity-100' : '-translate-x-[120%] opacity-0';
      break;
    case 'right':
      basePositionClass = 'absolute right-6 top-1/2 -translate-y-1/2 z-50 w-[70%] max-w-none';
      transformClass = animateIn ? 'translate-x-0 opacity-100' : 'translate-x-[120%] opacity-0';
      break;
    case 'bottom':
    default:
      basePositionClass = 'absolute bottom-6 left-1/2 -translate-x-1/2 z-50 w-[70%] max-w-none';
      transformClass = animateIn ? 'translate-y-0 opacity-100' : 'translate-y-[120%] opacity-0';
      break;
  }

  const handleKeyClick = (char: string) => {
    const finalChar = isCaps ? char.toUpperCase() : char.toLowerCase();
    typeKeyboardKey(finalChar);
  };

  const isKeyPressed = (keyIdentifier: string) => {
    return pressedKeys.has(keyIdentifier.toLowerCase());
  };

  const qwertyRow1 = ['q', 'w', 'e', 'r', 't', 'y', 'u', 'i', 'o', 'p'];
  const qwertyRow2 = ['a', 's', 'd', 'f', 'g', 'h', 'j', 'k', 'l'];
  const qwertyRow3 = ['z', 'x', 'c', 'v', 'b', 'n', 'm'];

  const symbolsRow1 = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '0'];
  const symbolsRow2 = ['@', '#', '$', '%', '&', '*', '-', '+', '(', ')'];
  const symbolsRow3 = ['!', '"', "'", ':', ';', '/', '?', '.'];

  const getKeyStyle = (keyIdentifier: string) => {
    const active = isKeyPressed(keyIdentifier);
    if (active) {
      return 'bg-sky-500/40 border-sky-400 text-sky-100 scale-95 shadow-[0_0_12px_rgba(56,189,248,0.5)]';
    }
    return 'bg-slate-900 hover:bg-slate-800 active:bg-sky-500/30 border-slate-800/80 text-slate-100 shadow-sm active:scale-95';
  };

  return (
    <>
      {/* Backdrop with transition */}
      <div
        className={`absolute inset-0 z-40 bg-black/40 backdrop-blur-[1px] transition-opacity duration-300 ${
          animateIn ? 'opacity-100' : 'opacity-0'
        }`}
        onClick={closeKeyboard}
      />

      {/* Main Keyboard Panel */}
      <div
        className={`${basePositionClass} transition-all duration-300 ease-out transform ${transformClass} bg-slate-950/95 border border-slate-800 shadow-2xl backdrop-blur-xl rounded-2xl p-3 sm:p-4 text-slate-100 flex flex-col gap-2.5 selection:bg-none select-none`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Minimal Header Row with Close (X) Button Only */}
        <div className="flex items-center justify-end">
          <button
            onClick={closeKeyboard}
            className="p-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-slate-200 border border-slate-800 transition-colors cursor-pointer"
            title="Close Keyboard"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Keypad Grid */}
        <div className="flex flex-col gap-3">
          {mode === 'qwerty' ? (
            <>
              {/* Row 1 */}
              <div className="flex justify-center gap-1.5 sm:gap-2">
                {qwertyRow1.map((char) => (
                  <button
                    key={char}
                    onClick={() => handleKeyClick(char)}
                    className={`flex-1 h-14 sm:h-16 rounded-xl border text-sm sm:text-base font-mono font-bold flex items-center justify-center transition-all cursor-pointer ${getKeyStyle(
                      char
                    )}`}
                  >
                    {isCaps ? char.toUpperCase() : char.toLowerCase()}
                  </button>
                ))}
              </div>

              {/* Row 2 */}
              <div className="flex justify-center gap-1.5 sm:gap-2 px-3 sm:px-4">
                {qwertyRow2.map((char) => (
                  <button
                    key={char}
                    onClick={() => handleKeyClick(char)}
                    className={`flex-1 h-14 sm:h-16 rounded-xl border text-sm sm:text-base font-mono font-bold flex items-center justify-center transition-all cursor-pointer ${getKeyStyle(
                      char
                    )}`}
                  >
                    {isCaps ? char.toUpperCase() : char.toLowerCase()}
                  </button>
                ))}
              </div>

              {/* Row 3 */}
              <div className="flex justify-center gap-1.5 sm:gap-2">
                <button
                  onClick={() => setIsCaps(!isCaps)}
                  className={`px-3 sm:px-5 h-14 sm:h-16 rounded-xl border font-mono text-xs sm:text-sm font-bold flex items-center justify-center transition-all cursor-pointer shrink-0 ${
                    isKeyPressed('shift') || isCaps
                      ? 'bg-sky-500/30 border-sky-500/60 text-sky-200'
                      : 'bg-slate-900 border-slate-800/80 text-slate-400 hover:text-slate-200'
                  }`}
                  title="Toggle Caps / Shift"
                >
                  <span>ABC</span>
                </button>

                {qwertyRow3.map((char) => (
                  <button
                    key={char}
                    onClick={() => handleKeyClick(char)}
                    className={`flex-1 h-14 sm:h-16 rounded-xl border text-sm sm:text-base font-mono font-bold flex items-center justify-center transition-all cursor-pointer ${getKeyStyle(
                      char
                    )}`}
                  >
                    {isCaps ? char.toUpperCase() : char.toLowerCase()}
                  </button>
                ))}

                <button
                  onClick={backspaceKeyboardKey}
                  className={`px-3 sm:px-5 h-14 sm:h-16 rounded-xl border flex items-center justify-center transition-all cursor-pointer shrink-0 ${
                    isKeyPressed('backspace')
                      ? 'bg-sky-500/40 border-sky-400 text-sky-100 scale-95 shadow-[0_0_12px_rgba(56,189,248,0.5)]'
                      : 'bg-slate-900 hover:bg-slate-800 border-slate-800/80 text-slate-300 hover:text-slate-100'
                  }`}
                  title="Backspace"
                >
                  <Delete className="w-4 h-4" />
                </button>
              </div>
            </>
          ) : (
            <>
              {/* Symbols Row 1 */}
              <div className="flex justify-center gap-1.5 sm:gap-2">
                {symbolsRow1.map((char) => (
                  <button
                    key={char}
                    onClick={() => typeKeyboardKey(char)}
                    className={`flex-1 h-14 sm:h-16 rounded-xl border text-sm sm:text-base font-mono font-bold flex items-center justify-center transition-all cursor-pointer ${getKeyStyle(
                      char
                    )}`}
                  >
                    {char}
                  </button>
                ))}
              </div>

              {/* Symbols Row 2 */}
              <div className="flex justify-center gap-1.5 sm:gap-2">
                {symbolsRow2.map((char) => (
                  <button
                    key={char}
                    onClick={() => typeKeyboardKey(char)}
                    className={`flex-1 h-14 sm:h-16 rounded-xl border text-sm sm:text-base font-mono font-bold flex items-center justify-center transition-all cursor-pointer ${getKeyStyle(
                      char
                    )}`}
                  >
                    {char}
                  </button>
                ))}
              </div>

              {/* Symbols Row 3 */}
              <div className="flex justify-center gap-1.5 sm:gap-2">
                {symbolsRow3.map((char) => (
                  <button
                    key={char}
                    onClick={() => typeKeyboardKey(char)}
                    className={`flex-1 h-14 sm:h-16 rounded-xl border text-sm sm:text-base font-mono font-bold flex items-center justify-center transition-all cursor-pointer ${getKeyStyle(
                      char
                    )}`}
                  >
                    {char}
                  </button>
                ))}

                <button
                  onClick={backspaceKeyboardKey}
                  className={`px-3 sm:px-5 h-14 sm:h-16 rounded-xl border flex items-center justify-center transition-all cursor-pointer shrink-0 ${
                    isKeyPressed('backspace')
                      ? 'bg-sky-500/40 border-sky-400 text-sky-100 scale-95 shadow-[0_0_12px_rgba(56,189,248,0.5)]'
                      : 'bg-slate-900 hover:bg-slate-800 border-slate-800/80 text-slate-300 hover:text-slate-100'
                  }`}
                  title="Backspace"
                >
                  <Delete className="w-4 h-4" />
                </button>
              </div>
            </>
          )}

          {/* Bottom Control Row */}
          <div className="flex justify-between items-center gap-3 pt-2">
            <button
              onClick={() => setMode(mode === 'qwerty' ? 'symbols' : 'qwerty')}
              className="px-3 sm:px-4 h-14 sm:h-16 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-xs sm:text-sm font-mono font-bold text-slate-300 flex items-center justify-center transition-all cursor-pointer"
            >
              {mode === 'qwerty' ? '?123' : 'ABC'}
            </button>

            {/* Speech Recognition Mic Button */}
            <button
              onClick={toggleListening}
              disabled={!isSpeechSupported}
              className={`px-3 sm:px-4 h-14 sm:h-16 rounded-xl border flex items-center justify-center gap-1.5 font-mono text-xs sm:text-sm font-bold transition-all cursor-pointer ${
                isListening
                  ? 'bg-rose-500/30 border-rose-500 text-rose-200 animate-pulse'
                  : isSpeechSupported
                  ? 'bg-slate-900 hover:bg-slate-800 border-slate-800 text-slate-300 hover:text-slate-100'
                  : 'bg-slate-900/50 border-slate-800/50 text-slate-600 opacity-50 cursor-not-allowed'
              }`}
              title={
                isSpeechSupported
                  ? isListening
                    ? 'Listening... Click to stop'
                    : 'Voice Input (Speech Recognition)'
                  : 'Speech recognition not supported in this browser'
              }
            >
              {isListening ? (
                <MicOff className="w-4 h-4 text-rose-400" />
              ) : (
                <Mic className="w-4 h-4 text-sky-400" />
              )}
              <span className="hidden sm:inline">{isListening ? 'Listening...' : 'Voice'}</span>
            </button>

            <button
              onClick={() => typeKeyboardKey(' ')}
              className={`flex-1 h-14 sm:h-16 rounded-xl border text-xs sm:text-sm font-mono font-bold flex items-center justify-center transition-all cursor-pointer shadow-sm ${
                isKeyPressed(' ')
                  ? 'bg-sky-500/40 border-sky-400 text-sky-100 scale-98 shadow-[0_0_12px_rgba(56,189,248,0.5)]'
                  : 'bg-slate-900 hover:bg-slate-800 active:bg-sky-500/20 border-slate-800/80 text-slate-300'
              }`}
            >
            </button>

            <button
              onClick={clearKeyboardKey}
              className="px-3 sm:px-4 h-14 sm:h-16 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-xs sm:text-sm font-mono font-bold text-slate-300 hover:text-slate-100 flex items-center justify-center transition-all cursor-pointer"
              title="Clear text"
            >
              Clear
            </button>

            {/* Sole Enter Commit Action Button */}
            <button
              onClick={handleEnterCommit}
              className={`px-4 sm:px-6 h-14 sm:h-16 rounded-xl font-mono text-xs sm:text-sm font-bold flex items-center justify-center transition-all cursor-pointer shadow-sm border ${
                isKeyPressed('enter')
                  ? 'bg-sky-500/40 border-sky-400 text-sky-100'
                  : 'bg-slate-800 hover:bg-slate-700 text-slate-200 border-slate-700'
              }`}
            >
              <span>Enter</span>
            </button>
          </div>
        </div>
      </div>
    </>
  );
};

