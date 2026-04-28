import { useState, useEffect, useRef } from 'react';
import { Mic, MicOff, Volume2, Square, Loader2 } from 'lucide-react';

// Language Map with specific Regional BCP-47 codes for better clarity
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
    'Bhojpuri': 'hi-IN'
};

// ========== VOICE INPUT COMPONENT (Speak to Type) ==========
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
        recognition.lang = LANGUAGE_CODES[selectedLanguage] || 'hi-IN';

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
            if (event.error === 'not-allowed') {
                alert('Please allow microphone access to use voice input.');
            }
            if (setIsListening) setIsListening(false);
        };

        recognition.onend = () => {
            if (setIsListening) setIsListening(false);
        };

        recognitionRef.current = recognition;
    }, [onTranscript, setIsListening, selectedLanguage]);

    const toggleListening = () => {
        if (!supported) {
            alert('Speech recognition not supported in this browser. Please use Chrome or Edge.');
            return;
        }
        
        if (!recognitionRef.current) return;

        if (isListening) {
            recognitionRef.current.stop();
        } else {
            try {
                recognitionRef.current.start();
                if (setIsListening) setIsListening(true);
            } catch (err) {
                console.error("Failed to start recognition:", err);
            }
        }
    };

    if (!supported) {
        return (
            <button
                disabled
                className="p-2 rounded-full bg-gray-600 cursor-not-allowed opacity-50"
                title="Voice not supported"
            >
                <Mic className="w-4 h-4" />
            </button>
        );
    }

    return (
        <button
            onClick={toggleListening}
            disabled={disabled}
            className={`p-2 rounded-full transition-all ${
                isListening 
                ? 'bg-red-500 animate-pulse text-white' 
                : 'bg-purple-600 hover:bg-purple-700 text-white'
            } disabled:opacity-50 disabled:cursor-not-allowed`}
            title={isListening ? "Listening... Click to stop" : `Speak in ${selectedLanguage}`}
        >
            {isListening ? <Loader2 className="w-4 h-4 animate-spin" /> : <Mic className="w-4 h-4" />}
        </button>
    );
};

// ========== VOICE OUTPUT COMPONENT (Text to Speech) ==========
export const VoiceOutput = ({ text, language, autoSpeak = false }) => {
    const [isSpeaking, setIsSpeaking] = useState(false);
    const [voices, setVoices] = useState([]);
    const [supported, setSupported] = useState(true);
    const utteranceRef = useRef(null);

    // Initialize and Load Voices
    useEffect(() => {
        if (!window.speechSynthesis) {
            setSupported(false);
            return;
        }

        const loadVoices = () => {
            const availableVoices = window.speechSynthesis.getVoices();
            setVoices(availableVoices);
        };

        loadVoices();
        
        if (window.speechSynthesis.onvoiceschanged !== undefined) {
            window.speechSynthesis.onvoiceschanged = loadVoices;
        }

        return () => {
            window.speechSynthesis.cancel();
        };
    }, []);

    const getBestVoice = (langName) => {
        const targetCode = LANGUAGE_CODES[langName];
        
        if (!targetCode || voices.length === 0) return null;
        
        // 1. Try for Google/ Premium voices
        let bestVoice = voices.find(v => v.lang === targetCode && (v.name.includes('Google') || v.name.includes('Premium')));
        if (bestVoice) return bestVoice;

        // 2. Try for exact language match
        bestVoice = voices.find(v => v.lang === targetCode);
        if (bestVoice) return bestVoice;

        // 3. Fallback to any voice with same language prefix
        const prefix = targetCode.split('-')[0];
        bestVoice = voices.find(v => v.lang.startsWith(prefix));
        
        // 4. Final fallback to first available voice
        return bestVoice || voices[0];
    };

    const speak = () => {
        if (!text || !supported) return;

        // Stop any ongoing speech
        window.speechSynthesis.cancel();

        const utterance = new SpeechSynthesisUtterance(text);
        const voice = getBestVoice(language);
        
        if (voice) {
            utterance.voice = voice;
        }
        
        utterance.lang = LANGUAGE_CODES[language] || 'en-US';
        utterance.rate = 0.9;
        utterance.pitch = 1.0;
        utterance.volume = 1.0;

        utterance.onstart = () => setIsSpeaking(true);
        utterance.onend = () => setIsSpeaking(false);
        utterance.onerror = (e) => {
            console.error('Speech error:', e);
            setIsSpeaking(false);
        };

        utteranceRef.current = utterance;
        window.speechSynthesis.speak(utterance);
    };

    const stop = () => {
        window.speechSynthesis.cancel();
        setIsSpeaking(false);
    };

    // Auto-speak logic
    useEffect(() => {
        if (autoSpeak && text && voices.length > 0) {
            const timer = setTimeout(() => speak(), 500);
            return () => clearTimeout(timer);
        }
    }, [text, autoSpeak, voices.length]);

    if (!text || !supported) return null;

    return (
        <button
            onClick={isSpeaking ? stop : speak}
            className={`p-2 rounded-full transition-all flex items-center gap-1 ${
                isSpeaking 
                ? 'bg-red-500/20 text-red-400 hover:bg-red-500/30' 
                : 'bg-green-500/20 text-green-400 hover:bg-green-500/30'
            }`}
            title={isSpeaking ? "Stop speaking" : `Listen in ${language}`}
        >
            {isSpeaking ? <Square className="w-3 h-3" /> : <Volume2 className="w-3 h-3" />}
            <span className="text-xs hidden sm:inline">{isSpeaking ? "Stop" : "Listen"}</span>
        </button>
    );
};
