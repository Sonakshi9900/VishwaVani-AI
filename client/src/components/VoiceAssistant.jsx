import { useState, useEffect, useRef } from 'react';
import { Mic, MicOff, Volume2, Square, Loader2 } from 'lucide-react';

// Language Map - Bhojpuri added
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
    'Bhojpuri': 'hi-IN' // Standard browsers engine Bhojpuri ko Hindi base par behtar samajhte hain
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
        
        // Bhojpuri ke liye hi-IN fallback behtar results deta hai browser recognition mein
        recognition.lang = LANGUAGE_CODES[selectedLanguage] || 'hi-IN';

        recognition.onresult = (event) => {
            let finalTranscript = '';
            for (let i = event.resultIndex; i < event.results.length; i++) {
                if (event.results[i].isFinal) {
                    finalTranscript += event.results[i][0].transcript;
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

// ========== VOICE OUTPUT COMPONENT ==========
export const VoiceOutput = ({ text, language, autoSpeak = false }) => {
    const [isSpeaking, setIsSpeaking] = useState(false);
    const [voices, setVoices] = useState([]);
    const [supported, setSupported] = useState(true);

    useEffect(() => {
        if (!window.speechSynthesis) {
            setSupported(false);
            return;
        }

        const loadVoices = () => {
            const availableVoices = window.speechSynthesis.getVoices();
            if (availableVoices.length > 0) {
                setVoices(availableVoices);
            }
        };

        loadVoices();
        // Chrome fix: voices asynchronously load hoti hain
        if (window.speechSynthesis.onvoiceschanged !== undefined) {
            window.speechSynthesis.onvoiceschanged = loadVoices;
        }

        return () => window.speechSynthesis.cancel();
    }, []);

    const getBestVoice = (langName) => {
        const targetCode = LANGUAGE_CODES[langName];
        if (!targetCode || voices.length === 0) return null;

        // Chrome/Edge/Safari specific logic
        return voices.find(v => 
            v.lang.replace('_', '-') === targetCode && 
            (v.name.includes('Google') || v.name.includes('Natural'))
        ) || voices.find(v => v.lang.startsWith(targetCode.split('-')[0])) 
          || voices[0];
    };

    const speak = () => {
        if (!text || !supported) return;

        // Crucial fix: cancel and resume for Chrome bug
        window.speechSynthesis.cancel();
        window.speechSynthesis.resume();

        const utterance = new SpeechSynthesisUtterance(text);
        const voice = getBestVoice(language);
        
        if (voice) {
            utterance.voice = voice;
            utterance.lang = voice.lang;
        }

        utterance.rate = 0.9;
        utterance.onstart = () => setIsSpeaking(true);
        utterance.onend = () => setIsSpeaking(false);
        utterance.onerror = (e) => {
            console.error("SpeechSynthesis Error:", e);
            setIsSpeaking(false);
        };

        window.speechSynthesis.speak(utterance);
    };

    const stop = () => {
        window.speechSynthesis.cancel();
        setIsSpeaking(false);
    };

    // Auto-speak handling
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
                ? 'bg-red-500/20 text-red-400' 
                : 'bg-green-500/20 text-green-400 hover:bg-green-500/30'
            }`}
        >
            {isSpeaking ? <Square className="w-3 h-3" /> : <Volume2 className="w-3 h-3" />}
            <span className="text-xs">{isSpeaking ? "Stop" : "Listen"}</span>
        </button>
    );
};
