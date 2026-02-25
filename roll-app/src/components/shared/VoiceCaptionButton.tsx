'use client';

import { useState, useRef, useCallback } from 'react';
import { Mic, MicOff } from 'lucide-react';

interface VoiceCaptionButtonProps {
  onTranscript: (text: string) => void;
  disabled?: boolean;
}

export function VoiceCaptionButton({ onTranscript, disabled }: VoiceCaptionButtonProps) {
  const [isListening, setIsListening] = useState(false);
  const recognitionRef = useRef<SpeechRecognition | null>(null);

  const isSupported = typeof window !== 'undefined' && (
    'SpeechRecognition' in window || 'webkitSpeechRecognition' in window
  );

  const toggleListening = useCallback(() => {
    if (isListening) {
      recognitionRef.current?.stop();
      setIsListening(false);
      return;
    }

    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) return;

    const recognition = new SpeechRecognition();
    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.lang = 'en-US';

    recognition.onresult = (event: SpeechRecognitionEvent) => {
      const transcript = event.results[0]?.[0]?.transcript;
      if (transcript) {
        onTranscript(transcript);
      }
      setIsListening(false);
    };

    recognition.onerror = () => {
      setIsListening(false);
    };

    recognition.onend = () => {
      setIsListening(false);
    };

    recognitionRef.current = recognition;
    recognition.start();
    setIsListening(true);
  }, [isListening, onTranscript]);

  if (!isSupported) return null;

  return (
    <button
      type="button"
      onClick={toggleListening}
      disabled={disabled}
      className={[
        'p-1.5 rounded-full transition-colors',
        isListening
          ? 'bg-[var(--color-error)]/10 text-[var(--color-error)] animate-pulse'
          : 'text-[var(--color-ink-tertiary)] hover:text-[var(--color-ink-secondary)] hover:bg-[var(--color-surface-sunken)]',
        disabled ? 'opacity-40 pointer-events-none' : '',
      ].join(' ')}
      aria-label={isListening ? 'Stop recording' : 'Record voice caption'}
      title={isListening ? 'Stop recording' : 'Speak your caption'}
    >
      {isListening ? <MicOff size={16} /> : <Mic size={16} />}
    </button>
  );
}

// Add SpeechRecognition types for browsers that support it
declare global {
  interface Window {
    SpeechRecognition: typeof SpeechRecognition;
    webkitSpeechRecognition: typeof SpeechRecognition;
  }
}
