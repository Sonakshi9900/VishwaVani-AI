import { useState, useEffect, useRef } from 'react';
import { Mic, MicOff, Volume2, Square, Loader2 } from 'lucide-react';

// Language Map with specific Regional BCP-47 codes
const LANGUAGE_CODES = {
    'Hindi': 'hi-IN',
    'English': 'en-US',
    'Bengali': 'bn-IN',
    'Tamil': 'ta-IN',
    'Telugu': 'te-IN',
    'Marathi': 'mr-IN',
    'Gujarati': 'gu-IN',
    'Kannada': 'kn-IN',
    'Malayalam': 'ml-IN',
    'Punjabi': 'pa-IN',
    'Urdu': 'ur-PK',
    'Sanskrit': 'sa-IN'
};

// ========== VOICE INPUT COMPONENT ==========
export const VoiceInput = ({ onTranscript, isListening, setIsListening, disabled, selectedLanguage = 'Hindi' }) => {
    const [supported, setSupported] = useState(true);
    const recognitionRef = useRef(null);

    useEffect(() => {
        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        
        if (!SpeechRecognition) {
            setSupported(false);
            return;
        }

        const recognition = new SpeechRecognition();
        recognition.continuous = false;
        recognition.interimResults = true;
        
        // Desktop support ke liye language fallback
        const langCode = LANGUAGE_CODES[selectedLanguage] || 'hi-IN';
        recognition.lang = langCode;

        recognition.onresult = (event) => {
            let finalTranscript = '';
            for (let i = event.resultIndex; i < event.results.length; i++) {
                const transcript = event.results[i][0].transcript;
                if (event.results[i].isFinal) {
                    finalTranscript += transcript;
                }
            }
            if (finalTranscript) {
                onTranscript(finalTranscript);
                if (setIsListening) setIsListening(false);
            }
        };

        recognition.onerror = (event) => {
            console.error("Speech Recognition Error:", event.error);
            if (setIsListening) setIsListening(false);
        };

        recognition.onend = () => {
            if (setIsListening) setIsListening(false);
        };

        recognitionRef.current = recognition;
    }, [onTranscript, setIsListening, selectedLanguage]);

    const toggleListening = () => {
        if (!supported) return;
        if (isListening) {
            recognitionRef.current?.stop();
        } else {
            try {
                recognitionRef.current?.start();
                if (setIsListening) setIsListening(true);
            } catch (err) {
                console.error("Mic start error:", err);
            }
        }
    };

    return (
        <button
            onClick={toggleListening}
            disabled={disabled || !supported}
            className={`p-2 rounded-full transition-all ${
                isListening 
                ? 'bg-red-500 animate-pulse text-white' 
                : 'bg-purple-600 hover:bg-purple-700 text-white'
            } disabled:opacity-50`}
        >
            {isListening ? <Loader2 className="w-4 h-4 animate-spin" /> : <Mic className="w-4 h-4" />}
        </button>
    );
};

// ========== VOICE OUTPUT COMPONENT (Updated for Desktop Fix) ==========
export const VoiceOutput = ({ text, language, autoSpeak = false }) => {
    const [isSpeaking, setIsSpeaking] = useState(false);
    const [voices, setVoices] = useState([]);
    const [supported, setSupported] = useState(true);
    const utteranceRef = useRef(null);

    useEffect(() => {
        if (!window.speechSynthesis) {
            setSupported(false);
            return;
        }

        const loadVoices = () => {
            let availableVoices = window.speechSynthesis.getVoices();
            // Desktop par agar list khali hai toh retry mechanism
            if (availableVoices.length === 0) {
                availableVoices = window.speechSynthesis.getVoices();
            }
            setVoices(availableVoices);
        };

        // Browser voices asynchronously load karta hai
        loadVoices();
        if (window.speechSynthesis.onvoiceschanged !== undefined) {
            window.speechSynthesis.onvoiceschanged = loadVoices;
        }

        return () => window.speechSynthesis.cancel();
    }, []);

    const getBestVoice = (langName) => {
        const targetCode = LANGUAGE_CODES[langName];
        if (!targetCode || voices.length === 0) return null;

        // 1. Desktop ke liye best: Natural/Google voices
        let bestVoice = voices.find(v => 
            v.lang.toLowerCase().replace('_', '-') === targetCode.toLowerCase() && 
            (v.name.includes('Google') || v.name.includes('Natural'))
        );
        
        // 2. Exact match
        if (!bestVoice) {
            bestVoice = voices.find(v => v.lang.toLowerCase().replace('_', '-') === targetCode.toLowerCase());
        }

        // 3. Fallback: Sirf language code (hi, en, bn) match karein
        if (!bestVoice) {
            const prefix = targetCode.split('-')[0];
            bestVoice = voices.find(v => v.lang.startsWith(prefix));
        }

        return bestVoice;
    };

    const speak = () => {
        if (!text || !supported) return;

        window.speechSynthesis.cancel(); // Reset any existing speech

        const utterance = new SpeechSynthesisUtterance(text);
        const voice = getBestVoice(language);
        
        if (voice) {
            utterance.voice = voice;
            utterance.lang = voice.lang; // Voice ki apni lang use karein
        } else {
            utterance.lang = LANGUAGE_CODES[language] || 'en-US';
        }

        utterance.rate = 0.95;
        utterance.onstart = () => setIsSpeaking(true);
        utterance.onend = () => setIsSpeaking(false);
        utterance.onerror = () => setIsSpeaking(false);

        utteranceRef.current = utterance;
        window.speechSynthesis.speak(utterance);
    };

    const stop = () => {
        window.speechSynthesis.cancel();
        setIsSpeaking(false);
    };

    useEffect(() => {
        if (autoSpeak && text && voices.length > 0) {
            const timer = setTimeout(() => speak(), 600);
            return () => clearTimeout(timer);
        }
    }, [text, autoSpeak, voices.length]);

    if (!text || !supported) return null;

    return (
        <button
            onClick={isSpeaking ? stop : speak}
            className={`p-2 rounded-full transition-all flex items-center gap-1 ${
                isSpeaking 
                ? 'bg-red-500/20 text-red-400' 
                : 'bg-green-500/20 text-green-400'
            }`}
        >
            {isSpeaking ? <Square className="w-3 h-3" /> : <Volume2 className="w-3 h-3" />}
            <span className="text-xs">{isSpeaking ? "Stop" : "Listen"}</span>
        </button>
    );
};
