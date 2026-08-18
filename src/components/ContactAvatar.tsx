import React, { useState } from 'react';
import { getAvatarColor, getInitials } from '../utils/avatarHash';
import { CONTACT_PHOTO_MAP } from '../data/mockPhoneData';

export interface ContactAvatarProps {
  name?: string;
  avatarUrl?: string;
  className?: string;
  fontSizeClassName?: string;
  showFallbackMonogramOnly?: boolean;
  alt?: string;
}

export const ContactAvatar: React.FC<ContactAvatarProps> = ({
  name = '',
  avatarUrl,
  className = 'w-8 h-8',
  fontSizeClassName = 'text-xs',
  showFallbackMonogramOnly = false,
  alt,
}) => {
  const [imageError, setImageError] = useState(false);

  // Look up photo by explicit prop or map lookup by contact name
  const resolvedUrl = avatarUrl || (name ? CONTACT_PHOTO_MAP[name] : undefined);

  const showPhoto = Boolean(resolvedUrl) && !imageError && !showFallbackMonogramOnly;

  if (showPhoto) {
    return (
      <div
        className={`rounded-full overflow-hidden shrink-0 flex items-center justify-center bg-slate-800 ${className}`}
      >
        <img
          src={resolvedUrl}
          alt={alt || name || 'Contact Avatar'}
          onError={() => setImageError(true)}
          className="w-full h-full object-cover rounded-full"
        />
      </div>
    );
  }

  return (
    <div
      className={`rounded-full flex items-center justify-center text-slate-100 font-bold shrink-0 ${className} ${fontSizeClassName}`}
      style={{ backgroundColor: getAvatarColor(name) }}
    >
      {getInitials(name)}
    </div>
  );
};
