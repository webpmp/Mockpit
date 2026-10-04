import React, { useState, useEffect, useRef } from 'react';
import { Send, Mic, ArrowLeft, Check, CheckCheck, MessageSquare } from 'lucide-react';
import { Conversation, QUICK_REPLY_CHIPS } from '../../data/mockPhoneData';
import { ContactAvatar } from '../ContactAvatar';
import { ComponentHeader } from '../ComponentRenderer';
import { MockpitInput } from '../MockpitInput';
import { useMockpitStore } from '../../store/useMockpitStore';
import { getBorderClasses } from '../../utils/borderOverrides';

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
  const conversations = useMockpitStore((s) => s.conversations);
  const selectedThreadId = useMockpitStore((s) => s.selectedMessagingThreadId);
  const setSelectedThreadId = useMockpitStore((s) => s.setSelectedMessagingThreadId);
  const sendUserMessage = useMockpitStore((s) => s.sendUserMessage);
  const createMessagingThread = useMockpitStore((s) => s.createMessagingThread);

  const [inputText, setInputText] = useState('');
  const [isListening, setIsListening] = useState(false);
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  const headerLabel = resolved.label || component.staticProps?.label || 'Messaging';
  const activeThread = conversations.find((c) => c.id === selectedThreadId);

  // Listen for open thread event from toast tap
  useEffect(() => {
    const handleOpenThread = (e: CustomEvent<any>) => {
      const threadId = e.detail?.threadId;
      if (threadId) {
        setSelectedThreadId(threadId);
      }
    };
    window.addEventListener('mockpit-open-thread' as any, handleOpenThread as any);
    return () => {
      window.removeEventListener('mockpit-open-thread' as any, handleOpenThread as any);
    };
  }, [setSelectedThreadId]);

  // Listen for message handoff event
  useEffect(() => {
    const handleMessageEvent = (e: CustomEvent<any>) => {
      const contact = e.detail;
      if (contact) {
        createMessagingThread(contact);
      }
    };
    window.addEventListener('mockpit-message-contact' as any, handleMessageEvent as any);
    return () => {
      window.removeEventListener('mockpit-message-contact' as any, handleMessageEvent as any);
    };
  }, [createMessagingThread]);

  useEffect(() => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollTop = scrollContainerRef.current.scrollHeight;
    }
  }, [activeThread?.messages, selectedThreadId]);

  const closeKeyboard = useMockpitStore((s) => s.closeKeyboard);

  const handleSendMessage = (textToSend?: string) => {
    const msgText = (textToSend !== undefined ? textToSend : inputText).trim();
    if (!msgText || !selectedThreadId) return;
    sendUserMessage(selectedThreadId, msgText);
    setInputText('');
    closeKeyboard();
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
  };

  return (
    <div
      className={`@container w-full h-full rounded-2xl bg-ds-surface/90 ${getBorderClasses(component.borderOverrides)} p-3.5 flex flex-col justify-between shadow-lg backdrop-blur-md transition-all duration-300 relative overflow-hidden ${baseOpacity}`}
      style={{ borderColor: isSelected ? customColor : undefined, opacity: styleOpacity }}
    >
      <ComponentHeader
        type="phoneMessaging"
        label={headerLabel}
        customColor={customColor}
        hidden={component.staticProps?.showHeader === 'false'}
        rightElement={
          selectedThreadId && (
            <button
              onClick={() => setSelectedThreadId(null)}
              className="text-xs font-mono text-ds-content-muted hover:text-ds-content flex items-center gap-1"
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
          <div className="flex items-center gap-2 h-9 min-h-[36px] max-h-[36px] pb-1.5 border-b border-ds-line-subtle/80 shrink-0">
            <ContactAvatar
              name={activeThread.name}
              avatarUrl={activeThread.avatarUrl}
              className="w-7 h-7"
              fontSizeClassName="text-xs"
            />
            <div className="min-w-0">
              <div className="text-xs font-bold text-ds-content truncate">{activeThread.name}</div>
              <div className="text-[9px] font-mono text-ds-content-muted truncate">
                {activeThread.number}
              </div>
            </div>
          </div>

          {/* Messages Bubbles List */}
          <div ref={scrollContainerRef} className="flex-1 min-h-0 overflow-y-auto py-2 space-y-2 no-scrollbar pr-1">
            {activeThread.messages.length === 0 ? (
              <div className="text-center py-6 text-xs font-mono text-ds-content-subtle">
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
                        <span className="text-[9px] font-mono text-ds-content-subtle bg-ds-background/60 px-2 py-0.5 rounded-full border border-ds-line-subtle">
                          {msg.timestamp}
                        </span>
                      </div>
                    )}
                    <div className={`flex ${isUser ? 'justify-end' : 'justify-start'}`}>
                      <div
                        className={`max-w-[80%] rounded-2xl px-3 py-1.5 text-xs font-medium shadow-md transition-all ${
                          isUser
                            ? 'text-ds-on-primary font-semibold rounded-br-xs'
                            : 'bg-ds-surface-raised text-ds-content rounded-bl-xs border border-ds-line/60'
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
          </div>

          {/* Quick-Reply Chips (Automotive Low-Distraction) */}
          <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-1 shrink-0">
            {QUICK_REPLY_CHIPS.map((chip) => (
              <button
                key={chip}
                onClick={() => handleSendMessage(chip)}
                className="shrink-0 bg-ds-surface-raised/80 hover:bg-ds-surface-hover text-ds-content border border-ds-line/60 px-2.5 py-1 rounded-full text-[10px] font-mono font-semibold transition-all active:scale-95 cursor-pointer whitespace-nowrap"
              >
                {chip}
              </button>
            ))}
          </div>

          {/* Input Row with Mic & Text Input */}
          <div className="flex items-center gap-1.5 pt-1.5 border-t border-ds-line-subtle/80 shrink-0">
            <button
              onClick={handleMicClick}
              className={`p-2 rounded-full border transition-all cursor-pointer shrink-0 ${
                isListening
                  ? 'bg-ds-error text-white border-ds-error animate-ping'
                  : 'bg-ds-surface-raised text-ds-content-secondary border-ds-line hover:bg-ds-surface-hover'
              }`}
              title="Voice reply"
            >
              <Mic className="w-3.5 h-3.5" />
            </button>

            <MockpitInput
              value={inputText}
              onChange={setInputText}
              onSubmit={(val) => handleSendMessage(val)}
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
                  ? 'text-ds-on-primary shadow-md hover:brightness-110'
                  : 'bg-ds-surface-raised text-ds-content-disabled border border-ds-line/50 cursor-not-allowed'
              }`}
              style={{
                backgroundColor: inputText.trim() ? customColor : undefined,
                boxShadow: inputText.trim() ? `0 0 10px color-mix(in srgb, ${customColor} 38%, transparent)` : undefined,
              }}
            >
              <Send className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      ) : (
        /* CONVERSATION INBOX LIST */
        <div className="flex-1 min-h-0 overflow-y-auto space-y-1.5 mt-2 no-scrollbar">
          {conversations.length === 0 ? (
            <div className="text-center py-8 text-xs font-mono text-ds-content-subtle">
              No messages in inbox
            </div>
          ) : (
            conversations.map((conv) => (
              <div
                key={conv.id}
                onClick={() => selectConversation(conv)}
                className="flex items-center justify-between p-2 rounded-xl bg-ds-background/50 border border-ds-line-subtle/80 hover:bg-ds-surface-raised/40 transition-colors cursor-pointer group"
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="relative shrink-0">
                    <ContactAvatar
                      name={conv.name}
                      avatarUrl={conv.avatarUrl}
                      className="w-9 h-9"
                      fontSizeClassName="text-xs"
                    />
                    {conv.unreadCount > 0 && (
                      <div className="absolute -top-0.5 -right-0.5 bg-ds-error text-white text-[9px] font-mono font-bold w-4 h-4 rounded-full flex items-center justify-center ring-2 ring-ds-surface">
                        {conv.unreadCount}
                      </div>
                    )}
                  </div>

                  <div className="min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <span
                        className={`text-xs font-bold truncate ${
                          conv.unreadCount > 0 ? 'text-ds-content' : 'text-ds-content-secondary'
                        }`}
                      >
                        {conv.name}
                      </span>
                    </div>
                    <p
                      className={`text-[11px] truncate max-w-full ${
                        conv.unreadCount > 0
                          ? 'font-bold text-ds-content'
                          : 'font-normal text-ds-content-muted font-mono'
                      }`}
                    >
                      {conv.lastMessage}
                    </p>
                  </div>
                </div>

                <div className="text-[9px] font-mono text-ds-content-subtle shrink-0 ml-2">
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
