import React, { useState, useRef, useEffect } from 'react';
import { Mic, MicOff, Loader2, Sparkles, Check, AlertCircle } from 'lucide-react';
import api from '../../services/api';

const VoiceTaskInput = ({ onTaskParsed, className = '' }) => {
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [parsing, setParsing] = useState(false);
  const [error, setError] = useState(null);
  const recognitionRef = useRef(null);

  useEffect(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      setError('Speech recognition not supported in this browser. Use Chrome/Edge.');
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.continuous = false;
    recognition.interimResults = true;
    recognition.lang = 'en-IN'; // Works seamlessly for English and Tanglish phrases

    recognition.onresult = (event) => {
      let currentTranscript = '';
      for (let i = 0; i < event.results.length; i++) {
        currentTranscript += event.results[i][0].transcript;
      }
      setTranscript(currentTranscript);
    };

    recognition.onerror = (event) => {
      console.warn('Speech recognition error:', event.error);
      setIsListening(false);
      if (event.error !== 'no-speech') {
        setError(`Microphone error: ${event.error}`);
      }
    };

    recognition.onend = () => {
      setIsListening(false);
    };

    recognitionRef.current = recognition;

    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.abort();
      }
    };
  }, []);

  const toggleListening = () => {
    if (!recognitionRef.current) {
      alert('Speech recognition is not supported in this browser. Please use Chrome or Edge.');
      return;
    }

    setError(null);

    if (isListening) {
      recognitionRef.current.stop();
      setIsListening(false);
      if (transcript.trim()) {
        handleParseTranscript(transcript);
      }
    } else {
      setTranscript('');
      try {
        recognitionRef.current.start();
        setIsListening(true);
      } catch (err) {
        console.warn('Recognition start error:', err);
      }
    }
  };

  const handleParseTranscript = async (text) => {
    if (!text || !text.trim()) return;

    try {
      setParsing(true);
      const res = await api.post('/ai/parse-voice-task', { transcript: text.trim() });
      if (res.data.success && res.data.taskData) {
        onTaskParsed(res.data.taskData);
        setTranscript('');
      }
    } catch (err) {
      console.error('Failed to parse voice task:', err);
      // Fallback simple parsing
      onTaskParsed({
        title: text.slice(0, 100),
        description: `Voice note: "${text}"`,
        priority: 'medium'
      });
    } finally {
      setParsing(false);
    }
  };

  // If user stopped speaking and we have a transcript
  useEffect(() => {
    if (!isListening && transcript.trim().length > 3 && !parsing) {
      handleParseTranscript(transcript);
    }
  }, [isListening]);

  return (
    <div className={`space-y-1.5 ${className}`}>
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={toggleListening}
          disabled={parsing}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all shadow-sm ${
            isListening
              ? 'bg-red-500 text-white animate-pulse ring-2 ring-red-400 ring-offset-1'
              : parsing
              ? 'bg-indigo-100 dark:bg-indigo-900/60 text-indigo-700 dark:text-indigo-300'
              : 'bg-indigo-50 hover:bg-indigo-100 dark:bg-indigo-950/60 dark:hover:bg-indigo-900 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800'
          }`}
          title="Click and speak to auto-fill task details (e.g. 'Create urgent task for payment integration by Friday')"
        >
          {parsing ? (
            <Loader2 className="w-3.5 h-3.5 animate-spin" />
          ) : isListening ? (
            <MicOff className="w-3.5 h-3.5" />
          ) : (
            <Mic className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
          )}

          <span>
            {parsing
              ? 'AI Parsing Voice...'
              : isListening
              ? 'Listening (Click to Stop)...'
              : '🎙️ Speak with AI Voice'}
          </span>
        </button>

        {isListening && (
          <span className="flex items-center gap-1 text-[11px] text-red-500 font-medium">
            <span className="w-2 h-2 rounded-full bg-red-500 animate-ping inline-block" />
            Listening...
          </span>
        )}
      </div>

      {transcript && isListening && (
        <div className="p-2 bg-indigo-50/60 dark:bg-indigo-950/40 rounded-lg text-xs text-indigo-900 dark:text-indigo-200 italic border border-indigo-100 dark:border-indigo-900">
          "{transcript}"
        </div>
      )}

      {error && (
        <div className="text-[11px] text-amber-600 dark:text-amber-400 flex items-center gap-1">
          <AlertCircle className="w-3 h-3" />
          {error}
        </div>
      )}
    </div>
  );
};

export default VoiceTaskInput;

