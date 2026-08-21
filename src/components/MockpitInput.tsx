import React, { useId } from 'react';
import { KeyboardSlideDirection } from '../types';
import { useMockpitStore } from '../store/useMockpitStore';

export const INPUT_FIELD_HEIGHT_CLASS = 'h-10';

export interface MockpitInputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'onChange'> {
  value: string;
  onChange: (value: string) => void;
  onSubmit?: (value: string) => void;
  onCancel?: () => void;
  onEnter?: () => void;
  componentId?: string;
  keyboardSlideDirection?: KeyboardSlideDirection | 'default';
  icon?: React.ReactNode;
  wrapperClassName?: string;
}

export const MockpitInput: React.FC<MockpitInputProps> = ({
  value,
  onChange,
  onSubmit,
  onCancel,
  onEnter,
  componentId,
  keyboardSlideDirection = 'default',
  icon,
  wrapperClassName = '',
  className = '',
  placeholder = 'Type here...',
  type = 'text',
  onFocus,
  ...props
}) => {
  const generatedId = useId();
  const inputId = props.id || generatedId;
  const openKeyboard = useMockpitStore((s) => s.openKeyboard);
  const closeKeyboard = useMockpitStore((s) => s.closeKeyboard);
  const activeInputState = useMockpitStore((s) => s.activeInputState);
  const isKeyboardVisible = useMockpitStore((s) => s.isKeyboardVisible);

  const inputRef = React.useRef<HTMLInputElement>(null);
  const isActive = isKeyboardVisible && activeInputState?.inputId === inputId;

  React.useEffect(() => {
    if (props.autoFocus && inputRef.current) {
      inputRef.current.focus();
    }
  }, [props.autoFocus]);

  const handleFocus = (e: React.FocusEvent<HTMLInputElement>) => {
    openKeyboard({
      inputId,
      componentId,
      value,
      placeholder,
      keyboardSlideDirectionOverride: keyboardSlideDirection as KeyboardSlideDirection | 'default',
      onChange,
      onSubmit,
      onCancel,
      onEnter,
    });

    if (onFocus) {
      onFocus(e);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newVal = e.target.value;
    onChange(newVal);
    useMockpitStore.getState().updateActiveInputValue(newVal);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      if (onSubmit) {
        onSubmit(value);
      } else if (onEnter) {
        onEnter();
      } else {
        closeKeyboard();
      }
    }
    if (props.onKeyDown) {
      props.onKeyDown(e);
    }
  };

  return (
    <div
      className={`relative flex items-center transition-all rounded-xl ${INPUT_FIELD_HEIGHT_CLASS} ${
        isActive ? 'z-50 relative ring-2 ring-sky-500/80 shadow-[0_0_12px_rgba(56,189,248,0.3)]' : ''
      } ${wrapperClassName}`}
    >
      {icon && (
        <div className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none flex items-center justify-center z-10">
          {icon}
        </div>
      )}
      <input
        ref={inputRef}
        id={inputId}
        type={type}
        value={value}
        onChange={handleChange}
        onFocus={handleFocus}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        className={`w-full h-full bg-slate-950 border border-slate-800 rounded-xl px-2.5 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-sky-500/80 font-mono antialiased transition-colors ${
          icon ? 'pl-8 pr-2.5' : ''
        } ${className}`}
        {...props}
      />
    </div>
  );
};
