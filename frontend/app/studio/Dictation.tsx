'use client';

import {useEffect, useRef, useState} from 'react';

type Recognition = {
  lang: string;
  continuous: boolean;
  interimResults: boolean;
  onresult: ((event: {results: ArrayLike<ArrayLike<{transcript: string}>>}) => void) | null;
  onerror: ((event: {error: string}) => void) | null;
  onend: (() => void) | null;
  start(): void;
  stop(): void;
  abort(): void;
};
type RecognitionWindow = Window & {
  SpeechRecognition?: new () => Recognition;
  webkitSpeechRecognition?: new () => Recognition;
};

export default function Dictation({onTranscript}: {onTranscript: (text: string) => void}) {
  const [available, setAvailable] = useState(false);
  const [status, setStatus] = useState('');
  const [listening, setListening] = useState(false);
  const active = useRef<Recognition | null>(null);

  useEffect(() => {
    const browser = window as RecognitionWindow;
    setAvailable(Boolean(browser.SpeechRecognition || browser.webkitSpeechRecognition));
    return () => {
      const recognition = active.current;
      active.current = null;
      if (!recognition) return;
      recognition.onresult = recognition.onerror = recognition.onend = null;
      recognition.abort();
    };
  }, []);

  function start() {
    const browser = window as RecognitionWindow;
    const SpeechRecognition = browser.SpeechRecognition ?? browser.webkitSpeechRecognition;
    if (!SpeechRecognition || active.current) return;
    const recognition = new SpeechRecognition();
    recognition.lang = 'en-US';
    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.onresult = event => {
      const text = Array.from(event.results, result => result[0]?.transcript ?? '').join(' ').trim().slice(0, 2000);
      if (text) {
        onTranscript(text);
        setStatus('Transcript ready. Review it before retrieving evidence.');
      } else setStatus('No speech was transcribed. You can type the question.');
    };
    recognition.onerror = event => {
      setStatus(event.error === 'not-allowed' ? 'Microphone access was denied. You can type the question.'
        : 'Dictation could not complete. You can type the question.');
    };
    recognition.onend = () => {
      active.current = null;
      setListening(false);
      setStatus(current => current === 'Listening…' || current === 'Finishing…' ? 'Dictation ended. You can try again or type.' : current);
    };
    active.current = recognition;
    try {
      recognition.start();
      setListening(true);
      setStatus('Listening…');
    } catch {
      active.current = null;
      setStatus('Dictation could not start. You can type the question.');
    }
  }

  return <div>
    <small>{available ? 'Dictation uses your browser’s speech service, which may process audio remotely.'
      : 'Dictation is unavailable in this browser. Type a question to retrieve evidence.'}</small>
    {available && <button type="button" onClick={() => {
      if (!active.current) {start();return;}
      setStatus('Finishing…');
      active.current.stop();
    }}>{listening ? 'Stop dictation' : 'Dictate question'}</button>}
    {status && <small role="status">{status}</small>}
  </div>;
}
