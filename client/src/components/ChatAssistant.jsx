import { useState } from 'react';
import { Send } from 'lucide-react';
import { VoiceInput, VoiceOutput } from './VoiceAssistant.jsx';

export default function ChatAssistant({ documentContext, selectedLanguage }) {
    const [messages, setMessages] = useState([]);
    const [input, setInput] = useState('');
    const [loading, setLoading] = useState(false);
    const [isListening, setIsListening] = useState(false);

    const sendMessage = async (messageText) => {
        const textToSend = messageText || input;
        if (!textToSend.trim()) return;

        if (!documentContext) {
            alert("Please upload and analyze a document first!");
            return;
        }

        const userMsg = { role: 'user', content: textToSend, time: new Date() };
        setMessages(prev => [...prev, userMsg]);
        setInput('');
        setLoading(true);

        try {
            const response = await fetch('https://vishwavani-ai-0oz9.onrender.com/api/chat', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    message: textToSend,
                    context: documentContext,
                    language: selectedLanguage
                })
            });

            // ✅ Handle server error properly
            if (!response.ok) {
                throw new Error(`Server error: ${response.status}`);
            }

            const data = await response.json();

            const aiMsg = {
                role: 'ai',
                content: data.reply || "No response from AI",
                time: new Date()
            };

            setMessages(prev => [...prev, aiMsg]);

        } catch (error) {
            console.error("Chat error:", error);

            setMessages(prev => [
                ...prev,
                {
                    role: 'ai',
                    content: "⚠️ Something went wrong. Please try again.",
                    time: new Date()
                }
            ]);
        } finally {
            setLoading(false);
        }
    };

    // ✅ FIXED (no duplicate send / async issue)
    const handleVoiceTranscript = (transcript) => {
        sendMessage(transcript);
    };

    return (
        <div className="flex flex-col h-full">
            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
                {messages.length === 0 ? (
                    <div className="text-center text-gray-400 mt-10">
                        <div className="text-4xl mb-3">🎤</div>
                        <p>Ask questions about your document!</p>
                        <p className="text-sm mt-2">Click the mic and speak in Hindi or English</p>
                        <p className="text-xs text-gray-500 mt-1">Example: "What is this document about?"</p>
                    </div>
                ) : (
                    messages.map((msg, idx) => (
                        <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                            <div className={`max-w-[85%] p-3 rounded-2xl text-sm ${
                                msg.role === 'user'
                                    ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-br-none'
                                    : 'bg-white/10 text-gray-200 rounded-bl-none'
                            }`}>
                                <p className="leading-relaxed break-words">{msg.content}</p>

                                {/* ✅ Voice Output only if available */}
                                {msg.role === 'ai' && msg.content && VoiceOutput && (
                                    <div className="mt-2 flex justify-end">
                                        <VoiceOutput 
                                            text={msg.content} 
                                            language={selectedLanguage} 
                                            autoSpeak={false}
                                        />
                                    </div>
                                )}
                            </div>
                        </div>
                    ))
                )}

                {/* Loading Indicator */}
                {loading && (
                    <div className="flex justify-start">
                        <div className="bg-white/10 p-3 rounded-2xl rounded-bl-none">
                            <div className="flex items-center gap-2">
                                <div className="w-2 h-2 bg-purple-500 rounded-full animate-bounce"></div>
                                <div className="w-2 h-2 bg-purple-500 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                                <div className="w-2 h-2 bg-purple-500 rounded-full animate-bounce" style={{ animationDelay: '0.4s' }}></div>
                                <span className="text-purple-400 text-xs ml-1">AI is thinking...</span>
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {/* Input Area */}
            <div className="p-3 border-t border-white/10">
                <div className="flex gap-2">
                    
                    {/* Voice Input */}
                    {VoiceInput && (
                        <VoiceInput 
                            onTranscript={handleVoiceTranscript}
                            isListening={isListening}
                            setIsListening={setIsListening}
                            disabled={loading}
                            selectedLanguage={selectedLanguage}
                        />
                    )}

                    {/* Text Input */}
                    <input
                        type="text"
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && sendMessage()}
                        placeholder={isListening ? "Listening..." : "Type or click mic to speak..."}
                        className="flex-1 bg-black/30 rounded-lg px-4 py-2 text-sm text-white placeholder-gray-400 focus:outline-none focus:ring-1 focus:ring-purple-500"
                        disabled={loading || isListening}
                    />

                    {/* Send Button */}
                    <button
                        onClick={() => sendMessage()}
                        disabled={loading || !input.trim() || isListening}
                        className="px-4 py-2 bg-gradient-to-r from-purple-600 to-pink-600 rounded-lg text-white text-sm font-semibold disabled:opacity-50 hover:shadow-lg transition-all"
                    >
                        <Send className="w-4 h-4" />
                    </button>
                </div>

                {isListening && (
                    <p className="text-xs text-purple-400 text-center mt-2 animate-pulse">
                        🎤 Listening... Speak now
                    </p>
                )}
            </div>
        </div>
    );
}
