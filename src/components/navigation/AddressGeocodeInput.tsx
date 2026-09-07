import React, { useState, useRef, useEffect, useCallback } from 'react';
import { MockpitInput } from '../MockpitInput';
import { geocodeAddress, GeocodeResult } from '../../utils/geocoding';
import { KeyboardSlideDirection } from '../../types';

export interface AddressGeocodeInputProps {
  value: string;
  onChange: (value: string) => void;
  onResolved: (lat: number, lng: number, displayName: string, geocode?: GeocodeResult) => void;
  onUnresolved?: () => void;
  componentId: string;
  placeholder?: string;
  keyboardSlideDirection?: KeyboardSlideDirection | 'default';
  icon?: React.ReactNode;
  wrapperClassName?: string;
  className?: string;
  id?: string;
  showStatus?: boolean;
  alreadyResolved?: boolean;
}

export const AddressGeocodeInput: React.FC<AddressGeocodeInputProps> = ({
  value,
  onChange,
  onResolved,
  onUnresolved,
  componentId,
  placeholder = 'Enter a city or landmark...',
  keyboardSlideDirection = 'default',
  icon,
  wrapperClassName = '',
  className = '',
  id,
  showStatus = true,
  alreadyResolved = false,
}) => {
  const [status, setStatus] = useState<'idle' | 'resolving' | 'success' | 'failed'>('idle');
  const [resolvedDisplay, setResolvedDisplay] = useState<string | null>(null);
  const lastGeocodedQueryRef = useRef<string>(alreadyResolved ? value.trim() : '');
  const isMountedRef = useRef<boolean>(true);

  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  const triggerGeocode = useCallback(
    async (queryToGeocode: string) => {
      const trimmed = queryToGeocode.trim();
      if (!trimmed) {
        setStatus('idle');
        setResolvedDisplay(null);
        return;
      }

      if (trimmed === lastGeocodedQueryRef.current) {
        return;
      }

      setStatus('resolving');
      const res = await geocodeAddress(trimmed);

      if (!isMountedRef.current) return;

      if (res) {
        lastGeocodedQueryRef.current = trimmed;
        setStatus('success');
        setResolvedDisplay(res.displayName);
        onResolved(res.lat, res.lng, res.displayName, res);
      } else {
        setStatus('failed');
        if (onUnresolved) onUnresolved();
      }
    },
    [onResolved, onUnresolved]
  );

  const handleBlur = () => {
    if (value && value.trim() !== lastGeocodedQueryRef.current) {
      triggerGeocode(value);
    }
  };

  const handleEnter = () => {
    if (value && value.trim() !== lastGeocodedQueryRef.current) {
      triggerGeocode(value);
    }
  };

  const handleSubmit = (submittedVal: string) => {
    if (submittedVal && submittedVal.trim() !== lastGeocodedQueryRef.current) {
      triggerGeocode(submittedVal);
    }
  };

  return (
    <div className={`w-full space-y-1 ${wrapperClassName}`}>
      <MockpitInput
        id={id}
        value={value}
        onChange={(newVal) => {
          onChange(newVal);
          if (status !== 'idle' && newVal !== lastGeocodedQueryRef.current) {
            setStatus('idle');
          }
        }}
        onSubmit={handleSubmit}
        onEnter={handleEnter}
        onBlur={handleBlur}
        placeholder={placeholder}
        componentId={componentId}
        keyboardSlideDirection={keyboardSlideDirection}
        icon={icon}
        className={className}
      />

      {showStatus && status !== 'idle' && (
        <div className="text-[0.625rem] font-mono px-1 flex items-center gap-1.5 transition-all">
          {status === 'resolving' && (
            <span className="text-sky-400 flex items-center gap-1">
              <span className="inline-block w-1.5 h-1.5 rounded-full bg-sky-400 animate-ping" />
              Resolving…
            </span>
          )}
          {status === 'success' && (
            <span className="text-emerald-400 truncate" title={resolvedDisplay || 'Location set'}>
              ✓ Location set
            </span>
          )}
          {status === 'failed' && (
            <span className="text-amber-400">
              ⚠ Couldn't find that address — using last known location
            </span>
          )}
        </div>
      )}
    </div>
  );
};
