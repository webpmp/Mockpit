import React, { useState, useEffect, useRef } from 'react';
import { Send, Mic, ArrowLeft, Check, CheckCheck, MessageSquare } from 'lucide-react';
import { Conversation, INITIAL_CONVERSATIONS, QUICK_REPLY_CHIPS } from '../../data/mockPhoneData';
import { getAvatarColor, getInitials } from '../../utils/avatarHash';
import { ComponentHeader } from '../ComponentRenderer';
import { MockpitInput } from '../MockpitInput';

interface PhoneMessagingWidgetProps {
  component: any;
  resolved: Record<string, any>;
  isSelected?: boolean;
  customColor: string;
  baseOpacity: string;
  styleOpacity: number;
}

export const PhoneMessagingWidget: React.FC<PhoneMessagingWidgetProps> = ({
  component,
  resolved,
  isSelected,
  customColor,
  baseOpacity,
  styleOpacity,
}) => {
  const [conversations, setConversations] = useState<Conversation[]>(INITIAL_CONVERSATIONS);
  const [selectedThreadId, setSelectedThreadId] = useState<string | null>(null);
  const [inputText, setInputText] = useState('');
  const [isListening, setIsListening] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const headerLabel = resolved.label || component.staticProps?.label || 'Messaging';

  const activeThread = conversations.find((c) => c.id === selectedThreadId);

  // Listen for message handoff event
  useEffect(() => {
    const handleMessageEvent = (e: CustomEvent<any>) => {
      const contact = e.detail;
      if (contact) {
        let existing = conversations.find((c) => c.contactId === contact.id || c.name === contact.name);
        if (existing) {
          setSelectedThreadId(existing.id);
        } else {
          // Create new conversation thread
          const newConv: Conversation = {
            id: `m-${Date.now()}`,
            contactId: contact.id,
            name: contact.name,
            number: contact.number,
            unreadCount: 0,
            lastMessage: 'Started a message thread',
            lastTimestamp: 'Just now',
            messages: [],
          };
          setConversations((prev) => [newConv, ...prev]);
          setSelectedThreadId(newConv.id);
        }
      }
    };
    window.addEventListener('mockpit-message-contact' as any, handleMessageEvent as any);
    return () => {
      window.removeEventListener('mockpit-message-contact' as any, handleMessageEvent as any);
    };
  }, [conversations]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [activeThread?.messages]);

  const handleSendMessage = (textToSend?: string) => {
    const msgText = (textToSend || inputText).trim();
    if (!msgText || !selectedThreadId) return;

    const newMsg = {
      id: `msg-${Date.now()}`,
      sender: 'user' as const,
      text: msgText,
      timestamp: 'Just now',
    };

    setConversations((prev) =>
      prev.map((c) => {
        if (c.id === selectedThreadId) {
          return {
            ...c,
            lastMessage: msgText,
            lastTimestamp: 'Just now',
            messages: [...c.messages, newMsg],
          };
        }
        return c;
      })
    );

    setInputText('');
  };

  const handleMicClick = () => {
    if (isListening) return;
    setIsListening(true);
    // Simulate speech-to-text dictation
    setTimeout(() => {
      setIsListening(false);
      handleSendMessage('Hands-free voice response sent.');
    }, 2200);
  };

  const selectConversation = (conv: Conversation) => {
    setSelectedThreadId(conv.id);
    // Clear unread count
    if (conv.unreadCount > 0) {
      setConversations((prev) =>
        prev.map((c) => (c.id === conv.id ? { ...c, unreadCount: 0 } : c))
      );
    }
  };

  return (
    <div
      className={`@container w-full h-full rounded-2xl bg-slate-900/90 border border-slate-800 p-3.5 flex flex-col justify-between shadow-lg backdrop-blur-md transition-all duration-300 relative overflow-hidden ${baseOpacity}`}
      style={{ borderColor: isSelected ? customColor : undefined, opacity: styleOpacity }}
    >
      <ComponentHeader
        type="phoneMessaging"
        label={headerLabel}
        customColor={customColor}
        rightElement={
          selectedThreadId && (
            <button
              onClick={() => setSelectedThreadId(null)}
              className="text-xs font-mono text-slate-400 hover:text-slate-200 flex items-center gap-1"
            >
              <ArrowLeft className="w-3 h-3" /> Inbox
            </button>
          )
        }
      />

      {activeThread ? (
        /* THREAD VIEW */
        <div className="flex-1 min-h-0 flex flex-col justify-between mt-1">
          {/* Thread Header Info */}
          <div className="flex items-center gap-2 pb-2 border-b border-slate-800/80 shrink-0">
            <div
              className="w-7 h-7 rounded-full flex items-center justify-center text-slate-100 font-bold text-xs shrink-0"
              style={{ backgroundColor: getAvatarColor(activeThread.name) }}
            >
              {getInitials(activeThread.name)}
            </div>
            <div className="min-w-0">
              <div className="text-xs font-bold text-slate-100 truncate">{activeThread.name}</div>
              <div className="text-[9px] font-mono text-slate-400 truncate">
                {activeThread.number}
              </div>
            </div>
          </div>

          {/* Messages Bubbles List */}
          <div className="flex-1 min-h-0 overflow-y-auto py-2 space-y-2 no-scrollbar pr-1">
            {activeThread.messages.length === 0 ? (
              <div className="text-center py-6 text-xs font-mono text-slate-500">
                No messages yet. Send a quick reply below.
              </div>
            ) : (
              activeThread.messages.map((msg, idx) => {
                const isUser = msg.sender === 'user';
                const showTimestamp = idx === 0 || msg.timestamp !== activeThread.messages[idx - 1].timestamp;

                return (
                  <React.Fragment key={msg.id}>
                    {showTimestamp && (
                      <div className="text-center my-1">
                        <span className="text-[9px] font-mono text-slate-500 bg-slate-950/60 px-2 py-0.5 rounded-full border border-slate-800">
                          {msg.timestamp}
                        </span>
                      </div>
                    )}
                    <div className={`flex ${isUser ? 'justify-end' : 'justify-start'}`}>
                      <div
                        className={`max-w-[80%] rounded-2xl px-3 py-1.5 text-xs font-medium shadow-md transition-all ${
                          isUser
                            ? 'text-slate-950 font-semibold rounded-br-xs'
                            : 'bg-slate-800 text-slate-100 rounded-bl-xs border border-slate-700/60'
                        }`}
                        style={{
                          backgroundColor: isUser ? customColor : undefined,
                        }}
                      >
                        {msg.text}
                      </div>
                    </div>
                  </React.Fragment>
                );
              })
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Quick-Reply Chips (Automotive Low-Distraction) */}
          <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-1 shrink-0">
            {QUICK_REPLY_CHIPS.map((chip) => (
              <button
                key={chip}
                onClick={() => handleSendMessage(chip)}
                className="shrink-0 bg-slate-800/80 hover:bg-slate-700 text-slate-200 border border-slate-700/60 px-2.5 py-1 rounded-full text-[10px] font-mono font-semibold transition-all active:scale-95 cursor-pointer whitespace-nowrap"
              >
                {chip}
              </button>
            ))}
          </div>

          {/* Input Row with Mic & Text Input */}
          <div className="flex items-center gap-1.5 pt-1.5 border-t border-slate-800/80 shrink-0">
            <button
              onClick={handleMicClick}
              className={`p-2 rounded-full border transition-all cursor-pointer shrink-0 ${
                isListening
                  ? 'bg-red-500 text-white border-red-400 animate-ping'
                  : 'bg-slate-800 text-slate-300 border-slate-700 hover:bg-slate-700'
              }`}
              title="Voice reply"
            >
              <Mic className="w-3.5 h-3.5" />
            </button>

            <MockpitInput
              value={inputText}
              onChange={setInputText}
              onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
              placeholder={isListening ? 'Listening...' : 'Type message...'}
              componentId={component.id}
              keyboardSlideDirection={component.staticProps?.keyboardSlideDirection as any}
              wrapperClassName="flex-1 min-w-0"
            />

            <button
              onClick={() => handleSendMessage()}
              disabled={!inputText.trim()}
              className={`p-2 rounded-full transition-all shrink-0 cursor-pointer ${
                inputText.trim()
                  ? 'bg-sky-500 hover:bg-sky-400 text-slate-950 shadow-md'
                  : 'bg-slate-800 text-slate-600 border border-slate-700/50 cursor-not-allowed'
              }`}
            >
              <Send className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      ) : (
        /* CONVERSATION INBOX LIST */
        <div className="flex-1 min-h-0 overflow-y-auto space-y-1.5 mt-2 no-scrollbar">
          {conversations.length === 0 ? (
            <div className="text-center py-8 text-xs font-mono text-slate-500">
              No messages in inbox
            </div>
          ) : (
            conversations.map((conv) => (
              <div
                key={conv.id}
                onClick={() => selectConversation(conv)}
                className="flex items-center justify-between p-2 rounded-xl bg-slate-950/50 border border-slate-800/80 hover:bg-slate-800/40 transition-colors cursor-pointer group"
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="relative shrink-0">
                    <div
                      className="w-9 h-9 rounded-full flex items-center justify-center text-slate-100 font-bold text-xs"
                      style={{ backgroundColor: getAvatarColor(conv.name) }}
                    >
                      {getInitials(conv.name)}
                    </div>
                    {conv.unreadCount > 0 && (
                      <div className="absolute -top-0.5 -right-0.5 bg-red-500 text-white text-[9px] font-mono font-bold w-4 h-4 rounded-full flex items-center justify-center ring-2 ring-slate-900">
                        {conv.unreadCount}
                      </div>
                    )}
                  </div>

                  <div className="min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <span
                        className={`text-xs font-bold truncate ${
                          conv.unreadCount > 0 ? 'text-slate-100' : 'text-slate-300'
                        }`}
                      >
                        {conv.name}
                      </span>
                    </div>
                    <p
                      className={`text-[11px] truncate max-w-full ${
                        conv.unreadCount > 0
                          ? 'font-bold text-slate-200'
                          : 'font-normal text-slate-400 font-mono'
                      }`}
                    >
                      {conv.lastMessage}
                    </p>
                  </div>
                </div>

                <div className="text-[9px] font-mono text-slate-500 shrink-0 ml-2">
                  {conv.lastTimestamp}
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
};
