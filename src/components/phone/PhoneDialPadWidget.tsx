import React, { useState, useEffect, useRef, useMemo } from 'react';
import { Phone, PhoneOff, Delete, Mic, MicOff, Volume2, ArrowUpRight, ArrowDownLeft, Clock, Grid } from 'lucide-react';
import { CallLogItem, Contact, INITIAL_CALL_LOGS, INITIAL_CONTACTS } from '../../data/mockPhoneData';
import { ContactAvatar } from '../ContactAvatar';
import { ComponentHeader } from '../ComponentRenderer';
import { INPUT_FIELD_HEIGHT_CLASS } from '../MockpitInput';

interface PhoneDialPadWidgetProps {
  component: any;
  resolved: Record<string, any>;
  isSelected?: boolean;
  customColor: string;
  baseOpacity: string;
  styleOpacity: number;
}

const KEYPAD_KEYS = [
  { num: '1', letters: '' },
  { num: '2', letters: 'ABC' },
  { num: '3', letters: 'DEF' },
  { num: '4', letters: 'GHI' },
  { num: '5', letters: 'JKL' },
  { num: '6', letters: 'MNO' },
  { num: '7', letters: 'PQRS' },
  { num: '8', letters: 'TUV' },
  { num: '9', letters: 'WXYZ' },
  { num: '*', letters: '' },
  { num: '0', letters: '+' },
  { num: '#', letters: '' },
];

export const PhoneDialPadWidget: React.FC<PhoneDialPadWidgetProps> = ({
  component,
  resolved,
  isSelected,
  customColor,
  baseOpacity,
  styleOpacity,
}) => {
  const [activeTab, setActiveTab] = useState<'keypad' | 'recents'>('keypad');
  const [enteredNumber, setEnteredNumber] = useState('');
  const [isInCall, setIsInCall] = useState(false);
  const [callDuration, setCallDuration] = useState(0);
  const [isMuted, setIsMuted] = useState(false);
  const [isSpeaker, setIsSpeaker] = useState(false);
  const [contacts] = useState<Contact[]>(INITIAL_CONTACTS);
  const [callLogs, setCallLogs] = useState<CallLogItem[]>(INITIAL_CALL_LOGS);

  // Long press hold state for backspace
  const [holdProgress, setHoldProgress] = useState(0);
  const holdTimerRef = useRef<any>(null);
  const holdIntervalRef = useRef<any>(null);

  const headerLabel = resolved.label || component.staticProps?.label || 'Dial Pad';

  // Listen for handoff from Contacts widget
  useEffect(() => {
    const handleDialEvent = (e: CustomEvent<Contact>) => {
      const c = e.detail;
      if (c && c.number) {
        setEnteredNumber(c.number.replace(/[^\d+*#]/g, ''));
        setActiveTab('keypad');
        setIsInCall(true);
        setCallDuration(0);
      }
    };
    window.addEventListener('mockpit-dial-contact' as any, handleDialEvent as any);
    return () => {
      window.removeEventListener('mockpit-dial-contact' as any, handleDialEvent as any);
    };
  }, []);

  // Call duration timer
  useEffect(() => {
    let timer: any = null;
    if (isInCall) {
      timer = setInterval(() => {
        setCallDuration((prev) => prev + 1);
      }, 1000);
    } else {
      setCallDuration(0);
    }
    return () => clearInterval(timer);
  }, [isInCall]);

  const matchedContact = useMemo(() => {
    if (!enteredNumber || enteredNumber.length < 2) return null;
    const cleanEntered = enteredNumber.replace(/[^0-9]/g, '');
    return (
      contacts.find((c) => {
        const cleanContactNum = c.number.replace(/[^0-9]/g, '');
        return cleanContactNum.includes(cleanEntered) || cleanEntered.includes(cleanContactNum);
      }) || null
    );
  }, [enteredNumber, contacts]);

  const handleKeyPress = (num: string) => {
    setEnteredNumber((prev) => prev + num);
  };

  const handleBackspacePress = () => {
    setEnteredNumber((prev) => prev.slice(0, -1));
  };

  // Backspace Long Press Hold To Clear Logic
  const startHoldClear = () => {
    setHoldProgress(0);
    let start = Date.now();
    holdIntervalRef.current = setInterval(() => {
      const elapsed = Date.now() - start;
      const pct = Math.min(100, (elapsed / 500) * 100);
      setHoldProgress(pct);
      if (pct >= 100) {
        clearInterval(holdIntervalRef.current);
        setEnteredNumber('');
        setHoldProgress(0);
      }
    }, 30);
  };

  const stopHoldClear = () => {
    if (holdIntervalRef.current) clearInterval(holdIntervalRef.current);
    if (holdProgress < 100 && holdProgress > 0) {
      handleBackspacePress();
    }
    setHoldProgress(0);
  };

  const handleStartCall = () => {
    if (!enteredNumber) return;
    setIsInCall(true);
    setCallDuration(0);
    // Add to recents
    const newLog: CallLogItem = {
      id: `log-${Date.now()}`,
      name: matchedContact ? matchedContact.name : enteredNumber,
      number: enteredNumber,
      type: 'outgoing',
      time: 'Just now',
    };
    setCallLogs((prev) => [newLog, ...prev]);
  };

  const handleEndCall = () => {
    setIsInCall(false);
    setEnteredNumber('');
  };

  // Dynamic font size scaling for long numbers
  const getFontSizeClass = () => {
    const len = enteredNumber.length;
    if (len <= 8) return 'text-[clamp(22px,8.5cqw,60px)]';
    if (len <= 12) return 'text-[clamp(18px,7cqw,46px)]';
    if (len <= 16) return 'text-[clamp(15px,5.5cqw,36px)]';
    return 'text-[clamp(12px,4cqw,28px)]';
  };

  const formatDuration = (secs: number) => {
    const mins = Math.floor(secs / 60);
    const remainderSecs = secs % 60;
    return `${mins.toString().padStart(2, '0')}:${remainderSecs.toString().padStart(2, '0')}`;
  };

  return (
    <div
      className={`@container w-full h-full rounded-2xl bg-slate-900/90 border border-slate-800 p-3.5 flex flex-col justify-between shadow-lg backdrop-blur-md transition-all duration-300 relative overflow-hidden ${baseOpacity}`}
      style={{ borderColor: isSelected ? customColor : undefined, opacity: styleOpacity }}
    >
      <ComponentHeader
        type="phoneDialPad"
        label={headerLabel}
        customColor={customColor}
        rightElement={
          !isInCall && (
            <div className="flex bg-slate-950 p-0.5 rounded-lg border border-slate-800">
              <button
                onClick={() => setActiveTab('keypad')}
                className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold transition-all cursor-pointer ${
                  activeTab === 'keypad'
                    ? 'bg-slate-800 text-slate-100 shadow-sm'
                    : 'text-slate-500 hover:text-slate-300'
                }`}
              >
                Keypad
              </button>
              <button
                onClick={() => setActiveTab('recents')}
                className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold transition-all cursor-pointer ${
                  activeTab === 'recents'
                    ? 'bg-slate-800 text-slate-100 shadow-sm'
                    : 'text-slate-500 hover:text-slate-300'
                }`}
              >
                Recents
              </button>
            </div>
          )
        }
      />

      {isInCall ? (
        /* ACTIVE CALL STATE */
        <div className="flex-1 min-h-0 flex flex-col items-center justify-between py-2 text-center my-auto">
          <div className="flex flex-col items-center my-auto">
            {matchedContact ? (
              <ContactAvatar
                name={matchedContact.name}
                avatarUrl={matchedContact.avatarUrl}
                className="w-16 h-16 mb-2 shadow-xl border-2 border-slate-700/80 animate-pulse"
                fontSizeClassName="text-xl"
              />
            ) : (
              <div className="w-16 h-16 rounded-full bg-blue-600 flex items-center justify-center text-slate-100 font-bold text-xl mb-2 shadow-xl border-2 border-slate-700/80 animate-pulse">
                <Phone className="w-8 h-8" />
              </div>
            )}
            <h3 className="text-base font-black text-slate-100 tracking-tight">
              {matchedContact ? matchedContact.name : enteredNumber}
            </h3>
            <span className="text-xs font-mono text-emerald-400 font-semibold mt-0.5">
              Call in progress • {formatDuration(callDuration)}
            </span>
          </div>

          <div className="w-full flex items-center justify-center gap-4 my-2">
            <button
              onClick={() => setIsMuted(!isMuted)}
              className={`p-3 rounded-full border transition-all cursor-pointer ${
                isMuted
                  ? 'bg-amber-500 text-slate-950 border-amber-400'
                  : 'bg-slate-800 text-slate-200 border-slate-700 hover:bg-slate-700'
              }`}
            >
              {isMuted ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
            </button>

            <button
              onClick={handleEndCall}
              className="w-14 h-14 rounded-full bg-red-600 hover:bg-red-500 text-white flex items-center justify-center shadow-lg transition-transform active:scale-90 cursor-pointer"
            >
              <PhoneOff className="w-6 h-6 fill-current" />
            </button>

            <button
              onClick={() => setIsSpeaker(!isSpeaker)}
              className={`p-3 rounded-full border transition-all cursor-pointer ${
                isSpeaker
                  ? 'bg-sky-500 text-slate-950 border-sky-400'
                  : 'bg-slate-800 text-slate-200 border-slate-700 hover:bg-slate-700'
              }`}
            >
              <Volume2 className="w-5 h-5" />
            </button>
          </div>
        </div>
      ) : activeTab === 'keypad' ? (
        /* KEYPAD TAB */
        <div className="flex-1 min-h-0 flex flex-col justify-between mt-1">
          {/* Display & Matched Contact (Plain Typography directly above Keypad) */}
          <div className="flex items-center justify-between min-h-[clamp(44px,11cqh,80px)] px-2 py-1 relative w-full overflow-hidden my-1">
            {/* Matched Contact Info */}
            {matchedContact ? (
              <div className="flex items-center gap-2 min-w-0 max-w-[45%]">
                <ContactAvatar
                  name={matchedContact.name}
                  avatarUrl={matchedContact.avatarUrl}
                  className="w-[clamp(22px,6cqw,38px)] h-[clamp(22px,6cqw,38px)] shrink-0"
                  fontSizeClassName="text-[clamp(10px,2.8cqw,16px)]"
                />
                <span className="text-[clamp(12px,3cqw,20px)] font-bold text-slate-200 truncate">
                  {matchedContact.name}
                </span>
              </div>
            ) : (
              <div />
            )}

            {/* Number Readout with Blinking Cursor */}
            <div className="flex items-center text-right font-mono font-bold text-slate-100 tracking-wider ml-auto">
              <span className={`${getFontSizeClass()} truncate max-w-full`}>
                {enteredNumber}
              </span>
              <span className="w-0.5 h-[clamp(22px,8.5cqw,60px)] bg-sky-400 ml-1 animate-pulse shrink-0" />
            </div>
          </div>

          {/* 3x4 Keypad Grid */}
          <div className="grid grid-cols-3 gap-[clamp(6px,2cqw,24px)] my-[clamp(6px,1.8cqh,20px)]">
            {KEYPAD_KEYS.map((k) => (
              <button
                key={k.num}
                onClick={() => handleKeyPress(k.num)}
                className="bg-slate-800/80 hover:bg-slate-700/90 active:scale-95 border border-slate-700/50 rounded-[clamp(10px,2.5cqw,22px)] py-[clamp(8px,2.5cqh,28px)] px-[clamp(4px,1.8cqw,18px)] flex flex-col items-center justify-center transition-all cursor-pointer group select-none"
              >
                <span className="text-[clamp(18px,7.5cqw,58px)] font-black text-slate-100 leading-none group-active:text-sky-300">
                  {k.num}
                </span>
                {k.letters ? (
                  <span className="text-[clamp(8px,2.8cqw,20px)] font-mono font-semibold text-slate-400 leading-none mt-[clamp(2px,0.8cqh,8px)]">
                    {k.letters}
                  </span>
                ) : (
                  <span className="h-[clamp(8px,2.8cqw,20px)] mt-[clamp(2px,0.8cqh,8px)]" />
                )}
              </button>
            ))}
          </div>

          {/* Bottom Action Row: Call Button & Backspace */}
          <div className="flex items-center justify-center relative min-h-[clamp(48px,12cqh,96px)] my-1">
            <button
              onClick={handleStartCall}
              disabled={!enteredNumber}
              className={`w-[clamp(42px,12cqw,84px)] h-[clamp(42px,12cqw,84px)] rounded-full flex items-center justify-center shadow-lg transition-all active:scale-90 cursor-pointer ${
                enteredNumber
                  ? 'bg-emerald-500 hover:bg-emerald-400 text-slate-950 shadow-emerald-500/20'
                  : 'bg-slate-800 text-slate-600 border border-slate-700/50 cursor-not-allowed'
              }`}
            >
              <Phone className="w-[clamp(18px,5.5cqw,38px)] h-[clamp(18px,5.5cqw,38px)] fill-current" />
            </button>

            {enteredNumber.length > 0 && (
              <button
                onMouseDown={startHoldClear}
                onMouseUp={stopHoldClear}
                onMouseLeave={stopHoldClear}
                onTouchStart={startHoldClear}
                onTouchEnd={stopHoldClear}
                className="absolute right-2.5 p-[clamp(8px,2.5cqw,18px)] rounded-full bg-slate-800/80 hover:bg-slate-700 text-slate-300 active:scale-90 transition-all cursor-pointer relative overflow-hidden"
              >
                {/* Hold Progress Bar */}
                {holdProgress > 0 && (
                  <div
                    className="absolute inset-0 bg-red-500/40 transition-all"
                    style={{ width: `${holdProgress}%` }}
                  />
                )}
                <Delete className="w-[clamp(16px,4.5cqw,32px)] h-[clamp(16px,4.5cqw,32px)] relative z-10" />
              </button>
            )}
          </div>
        </div>
      ) : (
        /* RECENTS TAB */
        <div className="flex-1 min-h-0 overflow-y-auto space-y-1 mt-2 no-scrollbar">
          {callLogs.map((log) => (
            <div
              key={log.id}
              onClick={() => {
                setEnteredNumber(log.number.replace(/[^\d+*#]/g, ''));
                setActiveTab('keypad');
              }}
              className="flex items-center justify-between p-2 rounded-xl bg-slate-950/40 border border-slate-800/60 hover:bg-slate-800/40 transition-colors cursor-pointer group"
            >
              <div className="flex items-center gap-2.5 min-w-0">
                <ContactAvatar
                  name={log.name}
                  avatarUrl={log.avatarUrl}
                  className="w-8 h-8 shrink-0"
                  fontSizeClassName="text-xs"
                />
                <div className="min-w-0">
                  <div className="flex items-center gap-1">
                    <span
                      className={`text-xs font-bold truncate ${
                        log.type === 'missed' ? 'text-red-400' : 'text-slate-200'
                      }`}
                    >
                      {log.name}
                    </span>
                    {log.type === 'missed' && (
                      <ArrowDownLeft className="w-3 h-3 text-red-500 shrink-0" />
                    )}
                    {log.type === 'outgoing' && (
                      <ArrowUpRight className="w-3 h-3 text-slate-500 shrink-0" />
                    )}
                  </div>
                  <div className="text-[10px] font-mono text-slate-400">{log.number}</div>
                </div>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <span className="text-[10px] font-mono text-slate-500">{log.time}</span>
                <Phone className="w-3.5 h-3.5 text-slate-500 group-hover:text-emerald-400 transition-colors" />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
