export interface Contact {
  id: string;
  name: string;
  number: string;
  favorite: boolean;
  missedCall?: boolean;
  unreadMsg?: boolean;
  avatarUrl?: string;
}

export interface CallLogItem {
  id: string;
  name: string;
  number: string;
  type: 'incoming' | 'outgoing' | 'missed';
  time: string;
  avatarUrl?: string;
}

export interface ChatMessage {
  id: string;
  sender: 'user' | 'contact';
  text: string;
  timestamp: string;
}

export interface Conversation {
  id: string;
  contactId: string;
  name: string;
  number: string;
  unreadCount: number;
  lastMessage: string;
  lastTimestamp: string;
  avatarUrl?: string;
  messages: ChatMessage[];
}

export const CONTACT_PHOTO_MAP: Record<string, string> = {
  'Alex Morgan': 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=256&q=80',
  'Brooklyn Carter': 'https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=256&q=80',
  'Carlos Mendez': 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=256&q=80',
  'David Chen': 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=256&q=80',
  'Elena Rostova': 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=256&q=80',
  'Fiona Gallagher': 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=256&q=80',
  'George Miller': 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&w=256&q=80',
  'Hannah Abbott': 'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?auto=format&fit=crop&w=256&q=80',
  'Isaac Newton': 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?auto=format&fit=crop&w=256&q=80',
  'Jessica Taylor': 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?auto=format&fit=crop&w=256&q=80',
};

export const INITIAL_CONTACTS: Contact[] = [
  { id: 'c1', name: 'Alex Morgan', number: '+1 (555) 019-2834', favorite: true, missedCall: true, avatarUrl: CONTACT_PHOTO_MAP['Alex Morgan'] },
  { id: 'c2', name: 'Brooklyn Carter', number: '+1 (555) 014-9921', favorite: true, avatarUrl: CONTACT_PHOTO_MAP['Brooklyn Carter'] },
  { id: 'c3', name: 'Carlos Mendez', number: '+1 (555) 017-3382', favorite: false, avatarUrl: CONTACT_PHOTO_MAP['Carlos Mendez'] },
  { id: 'c4', name: 'David Chen', number: '+1 (555) 012-7744', favorite: true, unreadMsg: false, avatarUrl: CONTACT_PHOTO_MAP['David Chen'] },
  { id: 'c5', name: 'Elena Rostova', number: '+1 (555) 018-4411', favorite: false, avatarUrl: CONTACT_PHOTO_MAP['Elena Rostova'] },
  { id: 'c6', name: 'Fiona Gallagher', number: '+1 (555) 011-8822', favorite: false, avatarUrl: CONTACT_PHOTO_MAP['Fiona Gallagher'] },
  { id: 'c7', name: 'George Miller', number: '+1 (555) 016-5533', favorite: false, avatarUrl: CONTACT_PHOTO_MAP['George Miller'] },
  { id: 'c8', name: 'Hannah Abbott', number: '+1 (555) 013-6677', favorite: true, avatarUrl: CONTACT_PHOTO_MAP['Hannah Abbott'] },
  { id: 'c9', name: 'Isaac Newton', number: '+1 (555) 015-2299', favorite: false, avatarUrl: CONTACT_PHOTO_MAP['Isaac Newton'] },
  { id: 'c10', name: 'Jessica Taylor', number: '+1 (555) 019-1100', favorite: false, avatarUrl: CONTACT_PHOTO_MAP['Jessica Taylor'] },
];

export const INITIAL_CALL_LOGS: CallLogItem[] = [
  { id: 'l1', name: 'Alex Morgan', number: '+1 (555) 019-2834', type: 'missed', time: '10:42 AM', avatarUrl: CONTACT_PHOTO_MAP['Alex Morgan'] },
  { id: 'l2', name: 'Brooklyn Carter', number: '+1 (555) 014-9921', type: 'outgoing', time: '9:15 AM', avatarUrl: CONTACT_PHOTO_MAP['Brooklyn Carter'] },
  { id: 'l3', name: 'David Chen', number: '+1 (555) 012-7744', type: 'incoming', time: 'Yesterday', avatarUrl: CONTACT_PHOTO_MAP['David Chen'] },
  { id: 'l4', name: '+1 (555) 019-8800', number: '+1 (555) 019-8800', type: 'missed', time: 'Yesterday' },
  { id: 'l5', name: 'Carlos Mendez', number: '+1 (555) 017-3382', type: 'outgoing', time: 'Aug 10', avatarUrl: CONTACT_PHOTO_MAP['Carlos Mendez'] },
];

export const INITIAL_CONVERSATIONS: Conversation[] = [];

export const QUICK_REPLY_CHIPS = [
  'On my way 🚗',
  'Call you back',
  'Running late ⏱️',
  '👍',
  'Driving right now',
];
