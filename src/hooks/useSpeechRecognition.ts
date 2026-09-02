import { useState, useEffect, useRef, useCallback } from 'react';

export interface UseSpeechRecognitionOptions {
  onTranscript?: (transcript: string) => void;
  lang?: string;
  continuous?: boolean;
  interimResults?: boolean;
}

export function useSpeechRecognition(options?: UseSpeechRecognitionOptions) {
  const [isListening, setIsListening] = useState(false);
  const [isSpeechSupported, setIsSpeechSupported] = useState(false);
  const recognitionRef = useRef<any>(null);
  const optionsRef = useRef(options);
  optionsRef.current = options;

  useEffect(() => {
    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    setIsSpeechSupported(!!SpeechRecognition);
  }, []);

  const stopListening = useCallback(() => {
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch (_) {}
    }
    setIsListening(false);
  }, []);

  const startListening = useCallback((customOnTranscript?: (transcript: string) => void) => {
    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) return false;

    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch (_) {}
    }

    try {
      const recognition = new SpeechRecognition();
      recognition.continuous = optionsRef.current?.continuous ?? false;
      recognition.interimResults = optionsRef.current?.interimResults ?? false;
      recognition.lang = optionsRef.current?.lang ?? 'en-US';

      recognition.onstart = () => {
        setIsListening(true);
      };

      recognition.onresult = (event: any) => {
        const transcript = event.results[0]?.[0]?.transcript;
        if (transcript) {
          if (customOnTranscript) {
            customOnTranscript(transcript);
          } else if (optionsRef.current?.onTranscript) {
            optionsRef.current.onTranscript(transcript);
          }
        }
      };

      recognition.onerror = (event: any) => {
        console.warn('Speech recognition error:', event.error);
        setIsListening(false);
      };

      recognition.onend = () => {
        setIsListening(false);
      };

      recognitionRef.current = recognition;
      recognition.start();
      return true;
    } catch (err) {
      console.warn('Speech recognition initialization error:', err);
      setIsListening(false);
      return false;
    }
  }, []);

  const toggleListening = useCallback((customOnTranscript?: (transcript: string) => void) => {
    if (isListening) {
      stopListening();
    } else {
      startListening(customOnTranscript);
    }
  }, [isListening, startListening, stopListening]);

  return {
    isListening,
    isSpeechSupported,
    startListening,
    stopListening,
    toggleListening,
  };
}
