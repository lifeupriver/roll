'use client';

import { useState, useRef, useCallback, useEffect } from 'react';
import { Mic, MicOff } from 'lucide-react';

interface VoiceCaptionButtonProps {
  onTranscript: (text: string) => void;
  disabled?: boolean;
}

export function VoiceCaptionButton({ onTranscript, disabled }: VoiceCaptionButtonProps) {
  const [isListening, setIsListening] = useState(false);
  const [isSupported, setIsSupported] = useState(false);
  const recognitionRef = useRef<SpeechRecognitionInstance | null>(null);
  const silenceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    setIsSupported(
      typeof window !== 'undefined' &&
        ('SpeechRecognition' in window || 'webkitSpeechRecognition' in window)
    );
  }, []);

  const stopListening = useCallback(() => {
    if (silenceTimerRef.current) {
      clearTimeout(silenceTimerRef.current);
      silenceTimerRef.current = null;
    }
    recognitionRef.current?.stop();
    recognitionRef.current = null;
    setIsListening(false);
  }, []);

  const toggleListening = useCallback(() => {
    if (isListening) {
      stopListening();
      return;
    }

    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) return;

    const recognition = new SpeechRecognition();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = 'en-US';

    let fullTranscript = '';

    recognition.onresult = (event) => {
      // Reset silence timer on speech
      if (silenceTimerRef.current) clearTimeout(silenceTimerRef.current);
      silenceTimerRef.current = setTimeout(stopListening, 3000);

      let interim = '';
      for (let i = 0; i < event.results.length; i++) {
        const result = event.results[i];
        if (result[0]) {
          if (result.isFinal) {
            fullTranscript += result[0].transcript;
          } else {
            interim += result[0].transcript;
          }
        }
      }
      onTranscript(fullTranscript + interim);
    };

    recognition.onerror = () => {
      stopListening();
    };

    recognition.onend = () => {
      setIsListening(false);
    };

    recognitionRef.current = recognition;
    recognition.start();
    setIsListening(true);

    // Auto-stop after 3 seconds of silence
    silenceTimerRef.current = setTimeout(stopListening, 3000);
  }, [isListening, onTranscript, stopListening]);

  // Clean up on unmount
  useEffect(() => {
    return () => {
      recognitionRef.current?.stop();
      if (silenceTimerRef.current) clearTimeout(silenceTimerRef.current);
    };
  }, []);

  if (!isSupported) return null;

  return (
    <button
      type="button"
      onClick={toggleListening}
      disabled={disabled}
      className={[
        'min-w-[44px] min-h-[44px] flex items-center justify-center rounded-full transition-colors relative',
        isListening
          ? 'bg-[var(--color-heart)] text-white'
          : 'text-[var(--color-ink-tertiary)] hover:text-[var(--color-ink-secondary)] hover:bg-[var(--color-surface-sunken)]',
        disabled ? 'opacity-40 pointer-events-none' : '',
      ].join(' ')}
      aria-label={isListening ? 'Stop recording' : 'Record voice caption'}
      title={isListening ? 'Stop recording' : 'Speak your caption'}
    >
      {isListening ? <MicOff size={18} /> : <Mic size={18} />}
      {isListening && (
        <span className="absolute top-1 right-1 w-2.5 h-2.5 rounded-full bg-[var(--color-heart)] animate-pulse" />
      )}
    </button>
  );
}

// Add SpeechRecognition types for browsers that support it
interface SpeechRecognitionResult {
  readonly isFinal: boolean;
  readonly [index: number]: { transcript: string } | undefined;
}

interface SpeechRecognitionEvent extends Event {
  readonly results: {
    readonly length: number;
    readonly [index: number]: SpeechRecognitionResult;
  };
  readonly resultIndex: number;
}

interface SpeechRecognitionInstance {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  onresult: ((event: SpeechRecognitionEvent) => void) | null;
  onerror: ((event: Event) => void) | null;
  onend: (() => void) | null;
  start: () => void;
  stop: () => void;
}

interface SpeechRecognitionConstructor {
  new (): SpeechRecognitionInstance;
}

declare global {
  interface Window {
    SpeechRecognition: SpeechRecognitionConstructor;
    webkitSpeechRecognition: SpeechRecognitionConstructor;
  }
}
