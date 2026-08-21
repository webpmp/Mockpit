import React, { useState, useMemo, useRef } from 'react';
import { Search, Star, Phone, MessageSquare, ArrowLeft, X } from 'lucide-react';
import { Contact, INITIAL_CONTACTS } from '../../data/mockPhoneData';
import { ContactAvatar } from '../ContactAvatar';
import { ComponentHeader } from '../ComponentRenderer';
import { MockpitInput } from '../MockpitInput';

interface PhoneContactsWidgetProps {
  component: any;
  resolved: Record<string, any>;
  isSelected?: boolean;
  customColor: string;
  baseOpacity: string;
  styleOpacity: number;
  onCallHandoff?: (contact: Contact) => void;
  onMessageHandoff?: (contact: Contact) => void;
}

export const PhoneContactsWidget: React.FC<PhoneContactsWidgetProps> = ({
  component,
  resolved,
  isSelected,
  customColor,
  baseOpacity,
  styleOpacity,
  onCallHandoff,
  onMessageHandoff,
}) => {
  const [contacts, setContacts] = useState<Contact[]>(INITIAL_CONTACTS);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedContact, setSelectedContact] = useState<Contact | null>(null);
  const listRef = useRef<HTMLDivElement>(null);

  const headerLabel = resolved.label || component.staticProps?.label || 'Contacts';

  // Toggle favorite state for a contact
  const toggleFavorite = (id: string, e?: React.MouseEvent) => {
    e?.stopPropagation();
    setContacts((prev) =>
      prev.map((c) => (c.id === id ? { ...c, favorite: !c.favorite } : c))
    );
    if (selectedContact?.id === id) {
      setSelectedContact((prev) => (prev ? { ...prev, favorite: !prev.favorite } : null));
    }
  };

  const favorites = useMemo(() => contacts.filter((c) => c.favorite), [contacts]);

  const filteredContacts = useMemo(() => {
    if (!searchQuery.trim()) return contacts;
    const q = searchQuery.toLowerCase();
    return contacts.filter(
      (c) => c.name.toLowerCase().includes(q) || c.number.includes(q)
    );
  }, [contacts, searchQuery]);

  // Alphabetically grouped sections
  const groupedSections = useMemo(() => {
    const sorted = [...filteredContacts].sort((a, b) => a.name.localeCompare(b.name));
    const groups: Record<string, Contact[]> = {};
    sorted.forEach((contact) => {
      const letter = contact.name.charAt(0).toUpperCase() || '#';
      if (!groups[letter]) groups[letter] = [];
      groups[letter].push(contact);
    });
    return groups;
  }, [filteredContacts]);

  const availableLetters = useMemo(() => Object.keys(groupedSections).sort(), [groupedSections]);

  const scrollToLetter = (letter: string) => {
    const el = document.getElementById(`section-${component.id}-${letter}`);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  const handleCall = (contact: Contact) => {
    if (onCallHandoff) {
      onCallHandoff(contact);
    } else {
      // Fallback custom event for cross-widget sync
      window.dispatchEvent(
        new CustomEvent('mockpit-dial-contact', { detail: contact })
      );
    }
  };

  const handleMessage = (contact: Contact) => {
    if (onMessageHandoff) {
      onMessageHandoff(contact);
    } else {
      window.dispatchEvent(
        new CustomEvent('mockpit-message-contact', { detail: contact })
      );
    }
  };

  return (
    <div
      className={`@container w-full h-full rounded-2xl bg-slate-900/90 border border-slate-800 p-3.5 flex flex-col justify-between shadow-lg backdrop-blur-md transition-all duration-300 relative overflow-hidden ${baseOpacity}`}
      style={{ borderColor: isSelected ? customColor : undefined, opacity: styleOpacity }}
    >
      <ComponentHeader
        type="phoneContacts"
        label={headerLabel}
        customColor={customColor}
        rightElement={
          selectedContact && (
            <button
              onClick={() => setSelectedContact(null)}
              className="text-xs font-mono text-slate-400 hover:text-slate-200 flex items-center gap-1"
            >
              <ArrowLeft className="w-3 h-3" /> Back
            </button>
          )
        }
      />

      {selectedContact ? (
        /* DETAIL VIEW */
        <div className="flex-1 min-h-0 flex flex-col items-center justify-center py-2 px-3 text-center my-auto">
          <div className="relative mb-3">
            <ContactAvatar
              name={selectedContact.name}
              avatarUrl={selectedContact.avatarUrl}
              className="w-20 h-20 shadow-xl border-2 border-slate-700/80"
              fontSizeClassName="text-2xl"
            />
            {selectedContact.favorite && (
              <div className="absolute -bottom-1 -right-1 bg-amber-400 text-slate-950 p-1.5 rounded-full shadow">
                <Star className="w-3.5 h-3.5 fill-current" />
              </div>
            )}
          </div>

          <h3 className="text-lg font-black text-slate-100 tracking-tight leading-tight">
            {selectedContact.name}
          </h3>
          <p className="text-xs font-mono text-slate-400 mt-0.5">{selectedContact.number}</p>

          {/* Action Buttons */}
          <div className="flex items-center justify-center gap-5 mt-6">
            <button
              onClick={() => handleCall(selectedContact)}
              className="flex flex-col items-center gap-1.5 group cursor-pointer"
            >
              <div className="w-12 h-12 rounded-full bg-emerald-500 hover:bg-emerald-400 text-slate-950 flex items-center justify-center shadow-lg transition-transform group-active:scale-90">
                <Phone className="w-5 h-5 fill-current" />
              </div>
              <span className="text-[10px] font-mono font-bold text-slate-300">Call</span>
            </button>

            <button
              onClick={() => handleMessage(selectedContact)}
              className="flex flex-col items-center gap-1.5 group cursor-pointer"
            >
              <div className="w-12 h-12 rounded-full bg-sky-500 hover:bg-sky-400 text-slate-950 flex items-center justify-center shadow-lg transition-transform group-active:scale-90">
                <MessageSquare className="w-5 h-5 fill-current" />
              </div>
              <span className="text-[10px] font-mono font-bold text-slate-300">Message</span>
            </button>

            <button
              onClick={() => toggleFavorite(selectedContact.id)}
              className="flex flex-col items-center gap-1.5 group cursor-pointer"
            >
              <div
                className={`w-12 h-12 rounded-full border flex items-center justify-center shadow-lg transition-transform group-active:scale-90 ${
                  selectedContact.favorite
                    ? 'bg-amber-400 text-slate-950 border-amber-300'
                    : 'bg-slate-800 text-slate-300 border-slate-700 hover:bg-slate-700'
                }`}
              >
                <Star className={`w-5 h-5 ${selectedContact.favorite ? 'fill-current' : ''}`} />
              </div>
              <span className="text-[10px] font-mono font-bold text-slate-300">
                {selectedContact.favorite ? 'Favorited' : 'Favorite'}
              </span>
            </button>
          </div>
        </div>
      ) : (
        /* CONTACTS LIST VIEW */
        <div className="flex-1 min-h-0 flex flex-col mt-2">
          {/* Search Bar */}
          <div className="relative mb-2 shrink-0">
            <MockpitInput
              value={searchQuery}
              onChange={setSearchQuery}
              placeholder="Search contacts..."
              componentId={component.id}
              keyboardSlideDirection={component.staticProps?.keyboardSlideDirection as any}
              icon={<Search className="w-3.5 h-3.5 text-slate-400" />}
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 z-10"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Favorites Row */}
          {favorites.length > 0 && !searchQuery && (
            <div className="mb-2 shrink-0 border-b border-slate-800/80 pb-2">
              <span className="text-[9px] font-mono font-bold text-slate-400 uppercase tracking-wider block mb-1">
                Favorites
              </span>
              <div className="flex items-center gap-2.5 overflow-x-auto no-scrollbar py-1">
                {favorites.map((fav) => (
                  <button
                    key={fav.id}
                    onClick={() => setSelectedContact(fav)}
                    className="flex flex-col items-center shrink-0 group cursor-pointer"
                  >
                    <div className="relative">
                      <ContactAvatar
                        name={fav.name}
                        avatarUrl={fav.avatarUrl}
                        className="w-10 h-10 border border-slate-700/80 shadow transition-transform group-hover:scale-105"
                        fontSizeClassName="text-xs"
                      />
                      <div className="absolute -bottom-0.5 -right-0.5 bg-amber-400 text-slate-950 p-0.5 rounded-full">
                        <Star className="w-2.5 h-2.5 fill-current" />
                      </div>
                    </div>
                    <span className="text-[10px] text-slate-300 font-mono mt-1 max-w-[56px] truncate">
                      {fav.name.split(' ')[0]}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Full List */}
          <div className="flex-1 min-h-0 flex relative overflow-hidden">
            <div
              ref={listRef}
              className="flex-1 min-h-0 overflow-y-auto pr-1 space-y-2 no-scrollbar"
            >
              {availableLetters.length === 0 ? (
                <div className="text-center py-8 text-xs font-mono text-slate-500">
                  No contacts found
                </div>
              ) : (
                availableLetters.map((letter) => (
                  <div key={letter} id={`section-${component.id}-${letter}`}>
                    <div className="sticky top-0 bg-slate-900/95 backdrop-blur text-[10px] font-mono font-bold text-slate-400 uppercase py-0.5 px-1 border-b border-slate-800/60 z-10">
                      {letter}
                    </div>
                    <div className="divide-y divide-slate-800/40">
                      {groupedSections[letter].map((contact) => (
                        <div
                          key={contact.id}
                          onClick={() => setSelectedContact(contact)}
                          className="flex items-center justify-between py-2 px-1 hover:bg-slate-800/40 rounded-lg cursor-pointer transition-colors group"
                        >
                          <div className="flex items-center gap-2.5 min-w-0">
                            <div className="relative shrink-0">
                              <ContactAvatar
                                name={contact.name}
                                avatarUrl={contact.avatarUrl}
                                className="w-8 h-8"
                                fontSizeClassName="text-xs"
                              />
                              {contact.favorite && (
                                <div className="absolute -bottom-0.5 -right-0.5 bg-amber-400 text-slate-950 p-0.5 rounded-full">
                                  <Star className="w-2 h-2 fill-current" />
                                </div>
                              )}
                              {(contact.missedCall || contact.unreadMsg) && (
                                <div className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-red-500 ring-2 ring-slate-900" />
                              )}
                            </div>
                            <div className="min-w-0">
                              <div className="text-xs font-bold text-slate-200 truncate group-hover:text-slate-100">
                                {contact.name}
                              </div>
                              <div className="text-[10px] font-mono text-slate-400 truncate">
                                {contact.number}
                              </div>
                            </div>
                          </div>

                          <button
                            onClick={(e) => toggleFavorite(contact.id, e)}
                            className="p-1 text-slate-600 hover:text-amber-400 transition-colors"
                          >
                            <Star
                              className={`w-3.5 h-3.5 ${
                                contact.favorite ? 'fill-amber-400 text-amber-400' : ''
                              }`}
                            />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
