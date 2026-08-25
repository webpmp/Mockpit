import React, { useState, useEffect } from 'react';
import { useWeatherStore } from '../../store/useWeatherStore';
import { useMockpitStore } from '../../store/useMockpitStore';
import { MockpitInput } from '../MockpitInput';

export interface WeatherLocationControlProps {
  headingClassName?: string;
}

export const WeatherLocationControl: React.FC<WeatherLocationControlProps> = ({
  headingClassName = 'text-xl md:text-2xl',
}) => {
  const resolvedLocation = useWeatherStore((s) => s.resolvedLocation);
  const locationInput = useWeatherStore((s) => s.locationInput);
  const setLocationInput = useWeatherStore((s) => s.setLocationInput);
  const fetchWeather = useWeatherStore((s) => s.fetchWeather);

  const openKeyboard = useMockpitStore((s) => s.openKeyboard);
  const closeKeyboard = useMockpitStore((s) => s.closeKeyboard);

  const [isEditingLocation, setIsEditingLocation] = useState(false);
  const [editInput, setEditInput] = useState(locationInput);

  useEffect(() => {
    setEditInput(locationInput);
  }, [locationInput]);

  useEffect(() => {
    return () => {
      if (useMockpitStore.getState().activeInputState?.inputId === 'weather-inline-location-input') {
        useMockpitStore.getState().closeKeyboard();
      }
    };
  }, []);

  const locationDisplayName = (resolvedLocation?.name || locationInput || 'San Mateo, California').toUpperCase();

  const commitLocation = (valueToCommit: string) => {
    const trimmed = valueToCommit.trim();
    if (trimmed) {
      setLocationInput(trimmed);
      fetchWeather();
    } else {
      const fallbackVal = locationInput || resolvedLocation?.name || 'San Mateo, California';
      setEditInput(fallbackVal);
    }
    setIsEditingLocation(false);
    closeKeyboard({ isCancelled: false });
  };

  const handleLocationSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    commitLocation(editInput);
  };

  const handleOpenLocationKeyboard = () => {
    const currentVal = locationInput || resolvedLocation?.name || 'San Mateo, California';
    setEditInput('');
    setIsEditingLocation(true);

    openKeyboard({
      inputId: 'weather-inline-location-input',
      value: '',
      initialValue: currentVal,
      placeholder: 'City, State, or Zip Code...',
      keyboardSlideDirectionOverride: 'bottom',
      onChange: (val: string) => {
        setEditInput(val);
      },
      onSubmit: (val: string) => {
        commitLocation(val);
      },
      onCancel: () => {
        const fallbackVal = locationInput || resolvedLocation?.name || 'San Mateo, CA';
        setEditInput(fallbackVal);
        setIsEditingLocation(false);
      },
      onEnter: () => {
        const activeVal = useMockpitStore.getState().activeInputState?.value ?? editInput;
        commitLocation(activeVal);
      },
    });
  };

  return (
    <div className="relative z-50">
      {isEditingLocation ? (
        <form onSubmit={handleLocationSubmit} className="flex items-center gap-2 min-h-[44px] relative z-50">
          <MockpitInput
            id="weather-inline-location-input"
            autoFocus
            value={editInput}
            onChange={(val) => setEditInput(val)}
            onSubmit={(val) => commitLocation(val)}
            placeholder="City, State, or Zip..."
            wrapperClassName="z-50 relative"
            className="bg-slate-900 border border-sky-500 rounded-xl px-3 py-2 text-base font-mono text-slate-100 uppercase font-bold focus:outline-none focus:ring-1 focus:ring-sky-400 min-w-[240px]"
          />
          <button
            id="weather-inline-save-btn"
            type="submit"
            className="px-3.5 py-2 min-h-[44px] min-w-[44px] rounded-xl bg-sky-600 hover:bg-sky-500 text-white text-xs font-mono font-bold transition-all cursor-pointer shadow-md flex items-center justify-center"
          >
            Save
          </button>
          <button
            id="weather-inline-cancel-btn"
            type="button"
            onClick={() => {
              const fallbackVal = locationInput || resolvedLocation?.name || 'San Mateo, California';
              setEditInput(fallbackVal);
              setIsEditingLocation(false);
              closeKeyboard({ isCancelled: true });
            }}
            className="px-3 py-2 min-h-[44px] min-w-[44px] rounded-xl bg-slate-900 border border-slate-800 hover:bg-slate-800 text-slate-400 hover:text-slate-200 text-xs font-mono font-bold transition-all cursor-pointer flex items-center justify-center"
          >
            Cancel
          </button>
        </form>
      ) : (
        <button
          id="weather-location-heading-btn"
          type="button"
          onClick={handleOpenLocationKeyboard}
          className="min-h-[44px] min-w-[44px] flex items-center gap-2.5 text-left group cursor-pointer rounded-xl px-2 py-1 -ml-2 hover:bg-slate-900/80 transition-colors"
          title="Click to edit location"
        >
          <h1
            id="weather-location-heading"
            className={`${headingClassName} font-black font-mono tracking-tight text-slate-100 uppercase group-hover:text-sky-400 transition-colors`}
          >
            {locationDisplayName}
          </h1>
        </button>
      )}
    </div>
  );
};
