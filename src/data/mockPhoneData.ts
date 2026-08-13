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
  messages: ChatMessage[];
}

export const INITIAL_CONTACTS: Contact[] = [
  { id: 'c1', name: 'Alex Morgan', number: '+1 (555) 019-2834', favorite: true, missedCall: true },
  { id: 'c2', name: 'Brooklyn Carter', number: '+1 (555) 014-9921', favorite: true },
  { id: 'c3', name: 'Carlos Mendez', number: '+1 (555) 017-3382', favorite: false },
  { id: 'c4', name: 'David Chen', number: '+1 (555) 012-7744', favorite: true, unreadMsg: true },
  { id: 'c5', name: 'Elena Rostova', number: '+1 (555) 018-4411', favorite: false },
  { id: 'c6', name: 'Fiona Gallagher', number: '+1 (555) 011-8822', favorite: false },
  { id: 'c7', name: 'George Miller', number: '+1 (555) 016-5533', favorite: false },
  { id: 'c8', name: 'Hannah Abbott', number: '+1 (555) 013-6677', favorite: true },
  { id: 'c9', name: 'Isaac Newton', number: '+1 (555) 015-2299', favorite: false },
  { id: 'c10', name: 'Jessica Taylor', number: '+1 (555) 019-1100', favorite: false },
];

export const INITIAL_CALL_LOGS: CallLogItem[] = [
  { id: 'l1', name: 'Alex Morgan', number: '+1 (555) 019-2834', type: 'missed', time: '10:42 AM' },
  { id: 'l2', name: 'Brooklyn Carter', number: '+1 (555) 014-9921', type: 'outgoing', time: '9:15 AM' },
  { id: 'l3', name: 'David Chen', number: '+1 (555) 012-7744', type: 'incoming', time: 'Yesterday' },
  { id: 'l4', name: '+1 (555) 019-8800', number: '+1 (555) 019-8800', type: 'missed', time: 'Yesterday' },
  { id: 'l5', name: 'Carlos Mendez', number: '+1 (555) 017-3382', type: 'outgoing', time: 'Aug 10' },
];

export const INITIAL_CONVERSATIONS: Conversation[] = [
  {
    id: 'm1',
    contactId: 'c4',
    name: 'David Chen',
    number: '+1 (555) 012-7744',
    unreadCount: 2,
    lastMessage: 'Are we still meeting at the charging station?',
    lastTimestamp: '10:45 AM',
    messages: [
      { id: 'msg1', sender: 'contact', text: 'Hey, heading out now!', timestamp: '10:40 AM' },
      { id: 'msg2', sender: 'contact', text: 'Are we still meeting at the charging station?', timestamp: '10:45 AM' },
    ],
  },
  {
    id: 'm2',
    contactId: 'c1',
    name: 'Alex Morgan',
    number: '+1 (555) 019-2834',
    unreadCount: 0,
    lastMessage: 'Thanks for the ride!',
    lastTimestamp: 'Yesterday',
    messages: [
      { id: 'msg3', sender: 'user', text: 'I am on my way.', timestamp: 'Yesterday 6:00 PM' },
      { id: 'msg4', sender: 'contact', text: 'Thanks for the ride!', timestamp: 'Yesterday 6:15 PM' },
    ],
  },
  {
    id: 'm3',
    contactId: 'c2',
    name: 'Brooklyn Carter',
    number: '+1 (555) 014-9921',
    unreadCount: 0,
    lastMessage: 'See you soon 👍',
    lastTimestamp: 'Aug 9',
    messages: [
      { id: 'msg5', sender: 'contact', text: 'See you soon 👍', timestamp: 'Aug 9 4:30 PM' },
    ],
  },
];

export const QUICK_REPLY_CHIPS = [
  'On my way 🚗',
  'Call you back',
  'Running late ⏱️',
  '👍',
  'Driving right now',
];
