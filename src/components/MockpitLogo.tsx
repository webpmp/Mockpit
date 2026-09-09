import React, { useState } from 'react';

export interface MockpitLogoProps {
  className?: string;
  width?: number;
  height?: number;
  id?: string;
}

/**
 * MockpitLogo
 * Renders the official Mockpit automotive emblem from /logo/logo-mockpit-white.png
 * with transparent background.
 */
export const MockpitLogo: React.FC<MockpitLogoProps> = ({
  className = 'w-[40px] h-[40px] min-w-[40px] min-h-[40px]',
  width = 40,
  height = 40,
  id = 'mockpit-logo',
}) => {
  const [hasError, setHasError] = useState(false);

  if (hasError) {
    return (
      <div
        id={id}
        style={{ width, height }}
        className={`flex items-center justify-center bg-slate-900 rounded-lg border border-slate-800 text-sky-400 font-bold text-xs select-none ${className}`}
      >
        M
      </div>
    );
  }

  return (
    <img
      id={id}
      src="/logo/logo-mockpit-small.png"
      alt="Mockpit Logo"
      width={width}
      height={height}
      referrerPolicy="no-referrer"
      onError={() => setHasError(true)}
      className={`object-contain select-none pointer-events-none drop-shadow-[0_0_12px_rgba(56,189,248,0.3)] ${className}`}
    />
  );
};

