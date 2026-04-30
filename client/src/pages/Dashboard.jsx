import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Upload, FileText, Languages, Download, Sparkles, Network, FileType, ChevronRight, CheckCircle2, X } from "lucide-react";
import { extractTextFromPdf } from "../lib/pdf.js";
import ChatAssistant from '../components/ChatAssistant.jsx';
import { TranslateSkeleton, SummarizeSkeleton, FullPageLoader } from "../components/LoaderComponents.jsx";
import { exportProfessionalPDF } from "../utils/pdfExport.js";
import { VoiceOutput } from '../components/VoiceAssistant.jsx';

const INDIAN_LANGUAGES = ["Hindi", "Bengali", "Telugu", "Marathi", "Tamil", "Urdu", "Kannada", "English", "Bhojpuri", "Gujarati", "Malayalam", "Punjabi"];
const BACKEND_URL = "https://vishwavani-ai1.onrender.com";

export default function Dashboard() {
    const [file, setFile] = useState(null);
    const [extractedText, setExtractedText] = useState("");
    const [selectedLanguage, setSelectedLanguage] = useState("Hindi");
    const [translationResult, setTranslationResult] = useState("");
    const [summaryResult, setSummaryResult] = useState("");
    const [loadingStep, setLoadingStep] = useState(null);
    const [showChat, setShowChat] = useState(false);
    const [activeTab, setActiveTab] = useState("extracted");

    const handleFileUpload = async (e) => {
        const uploadedFile = e.target.files?.[0];
        if (!uploadedFile) return;
        setFile(uploadedFile);
        setLoadingStep("extract");
        try {
            const text = await extractTextFromPdf(uploadedFile);
            setExtractedText(text);
            setTranslationResult("");
            setSummaryResult("");
            setShowChat(false);
            setActiveTab("extracted");
        } catch (error) {
            alert("Failed to extract text: " + error.message);
        } finally { setLoadingStep(null); }
    };

    const handleTranslate = async () => {
        if (!extractedText) return;
        setLoadingStep("translate");

        try {
            const response = await fetch(`${BACKEND_URL}/api/translate`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ text: extractedText, targetLanguage: selectedLanguage }),
            });

            const text = await response.text();

            let data;
            try {
                data = JSON.parse(text);
            } catch (e) {
                console.error("RAW RESPONSE:", text);
                throw new Error("Server returned invalid JSON");
            }

            if (!response.ok) {
                throw new Error(data.details || data.error || "Translation failed");
            }

            setTranslationResult(data.translation);
            setActiveTab("translation");

        } catch (error) {
            console.error("TRANSLATE ERROR:", error);
            alert(error.message);
        } finally {
            setLoadingStep(null);
        }
    };

    const handleSummarize = async () => {
        const textToProcess = translationResult || extractedText;
        if (!textToProcess) return;
        setLoadingStep("summary");

        try {
            const response = await fetch(`${BACKEND_URL}/api/summarize`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ text: textToProcess, language: selectedLanguage }),
            });

            const text = await response.text();

            let data;
            try {
                data = JSON.parse(text);
            } catch (e) {
                console.error("RAW RESPONSE:", text);
                throw new Error("Invalid JSON from server");
            }

            if (!response.ok) {
                throw new Error(data.details || data.error || "Summarization failed");
            }

            setSummaryResult(data.summary);
            setActiveTab("summary");

        } catch (error) {
            console.error("SUMMARY ERROR:", error);
            alert(error.message);
        } finally {
            setLoadingStep(null);
        }
    };

    const handleDownload = async () => {
        let content = activeTab === "extracted" ? extractedText : activeTab === "translation" ? translationResult : summaryResult;
        let title = activeTab === "extracted" ? "Extraction Report" : activeTab === "translation" ? `${selectedLanguage} Translation` : "AI Summary";
        if (content) await exportProfessionalPDF(title, content, selectedLanguage, activeTab);
    };

    const getCurrentContent = () => {
        if(activeTab === "extracted") return extractedText;
        if(activeTab === "translation") return translationResult;
        return summaryResult;
    };

    return (
        <>
            <AnimatePresence>
                {loadingStep === "translate" && <FullPageLoader message="AI is translating your document..." />}
                {loadingStep === "summary" && <FullPageLoader message="AI is generating smart summary..." />}
            </AnimatePresence>

            <div className="blob-bg">
                <div className="blob bg-primary/20 w-[600px] h-[600px] rounded-full top-[-10%] left-[-10%] animate-blob"></div>
                <div className="blob bg-secondary/20 w-[700px] h-[700px] rounded-full bottom-[-20%] right-[-10%] animate-blob" style={{ animationDelay: '2s' }}></div>
            </div>

            <div className="relative z-10 min-h-screen flex flex-col items-center py-10 px-6 max-w-7xl mx-auto font-sans">
                <motion.header initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="w-full flex items-center justify-between glass-card p-6 mb-12">
                    <div className="flex items-center gap-4">
                        <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-secondary via-primary to-accent p-[2px]">
                            <div className="w-full h-full bg-surface/90 rounded-[14px] flex items-center justify-center">
                                <Network className="w-7 h-7 text-secondary" />
                            </div>
                        </div>
                        <div>
                            <h1 className="text-4xl font-extrabold tracking-tight">Vishwa<span className="text-gradient">Vani</span></h1>
                            <p className="text-sm font-medium text-gray-400 mt-1 uppercase tracking-widest flex items-center gap-2">
                                <Sparkles className="w-4 h-4 text-accent" /> AI Document Intelligence
                            </p>
                        </div>
                    </div>
                </motion.header>

                <div className="w-full grid grid-cols-1 lg:grid-cols-12 gap-10">
                    {/* LEFT PANEL */}
                    <div className="lg:col-span-5 space-y-8">
                        <section className={`glass-card p-8 ${file ? 'border-primary/50 bg-primary/5' : 'border-white/10'}`}>
                            <div className="flex items-center justify-between mb-6">
                                <h3 className="text-2xl font-bold flex items-center gap-3">
                                    <span className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${file ? 'bg-primary' : 'bg-white/10'}`}>1</span> Ingest PDF
                                </h3>
                                {file && <CheckCircle2 className="w-6 h-6 text-primary" />}
                            </div>
                            <label className="border-2 border-dashed border-white/20 hover:border-secondary/50 bg-black/30 rounded-2xl p-10 flex flex-col items-center justify-center cursor-pointer transition-all">
                                <Upload className="w-14 h-14 text-gray-500 mb-4" />
                                <p className="font-semibold text-lg text-gray-300">Click to browse</p>
                                <p className="text-gray-500 mt-2">{file ? file.name : "PDF up to 20MB"}</p>
                                <input type="file" accept="application/pdf" className="hidden" onChange={handleFileUpload} />
                            </label>
                        </section>

                        {extractedText && (
                            <section className={`glass-card p-8 ${translationResult ? 'border-secondary/50 bg-secondary/5' : 'border-white/10'}`}>
                                <div className="flex justify-between items-center mb-6">
                                    <h3 className="text-2xl font-bold flex items-center gap-3">
                                        <span className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${translationResult ? 'bg-secondary text-black' : 'bg-white/10'}`}>2</span> Translate
                                    </h3>
                                    <select value={selectedLanguage} onChange={(e) => setSelectedLanguage(e.target.value)} className="bg-surface border border-white/20 rounded-xl px-4 py-2 text-white">
                                        {INDIAN_LANGUAGES.map(lang => <option key={lang} value={lang}>{lang}</option>)}
                                    </select>
                                </div>
                                <button onClick={handleTranslate} className="btn-super w-full bg-gradient-to-r from-blue-600 to-secondary py-4">
                                    <Languages className="w-6 h-6" /> Translate to {selectedLanguage}
                                </button>
                            </section>
                        )}

                        {(translationResult || extractedText) && (
                            <section className={`glass-card p-8 ${summaryResult ? 'border-accent/50 bg-accent/5' : 'border-white/10'}`}>
                                <h3 className="text-2xl font-bold flex items-center gap-3 mb-6">
                                    <span className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${summaryResult ? 'bg-accent' : 'bg-white/10'}`}>3</span> AI Insights
                                </h3>
                                <button onClick={handleSummarize} className="btn-super w-full bg-gradient-to-r from-accent to-purple-600 py-4">
                                    <Sparkles className="w-6 h-6" /> Extract Core Summary
                                </button>
                            </section>
                        )}
                    </div>

                    {/* RIGHT PANEL */}
                    <div className="lg:col-span-7 flex flex-col gap-6">
                        {!extractedText ? (
                            <div className="glass-card flex-1 min-h-[600px] flex flex-col items-center justify-center text-center p-12 border-dashed border-2 border-white/5">
                                <FileType className="w-12 h-12 text-gray-500 mb-6" />
                                <h2 className="text-2xl font-bold text-gray-300">Workspace Empty</h2>
                            </div>
                        ) : (
                            <div className="space-y-6 flex-1 flex flex-col">
                                <div className="glass-card flex flex-col overflow-hidden h-[450px]">
                                    <div className="flex border-b border-white/10 bg-black/20">
                                        {['extracted', 'translation', 'summary'].map((tab) => (
                                            <button 
                                                key={tab}
                                                onClick={() => (tab === 'extracted' || (tab === 'translation' && translationResult) || (tab === 'summary' && summaryResult)) && setActiveTab(tab)}
                                                className={`flex-1 px-4 py-3 capitalize font-medium ${activeTab === tab ? "border-b-2 border-primary text-primary" : "text-gray-400"}`}
                                            >
                                                {tab}
                                            </button>
                                        ))}
                                    </div>
                                    <div className="flex-1 overflow-y-auto p-6">
                                        <div className="flex justify-between items-start gap-3">
                                            <div className="flex-1">
                                                <AnimatePresence mode="wait">
                                                    {loadingStep === "translate" && activeTab === "translation" ? <TranslateSkeleton /> :
                                                     loadingStep === "summary" && activeTab === "summary" ? <SummarizeSkeleton /> :
                                                     <div className="whitespace-pre-wrap text-gray-300">{getCurrentContent()}</div>}
                                                </AnimatePresence>
                                            </div>
                                            {/* 🔊 LISTEN BUTTON - Voice Output */}
                                            {getCurrentContent() && loadingStep === null && (
                                                <VoiceOutput 
                                                    text={getCurrentContent()} 
                                                    language={activeTab === "translation" ? selectedLanguage : "English"}
                                                    autoSpeak={false}
                                                />
                                            )}
                                        </div>
                                    </div>
                                    {getCurrentContent() && (
                                        <div className="p-4 border-t border-white/10 flex justify-end">
                                            <button onClick={handleDownload} className="px-5 py-2 bg-gradient-to-r from-purple-600 to-pink-600 rounded-xl flex items-center gap-2"><Download className="w-4 h-4" /> Download PDF</button>
                                        </div>
                                    )}
                                </div>

                                {/* CHAT SECTION with Voice Input */}
                                {!showChat ? (
                                    <button onClick={() => setShowChat(true)} className="glass-card w-full p-4 flex items-center justify-between hover:border-purple-500 transition-all group">
                                        <div className="flex items-center gap-3">
                                            <div className="w-12 h-12 rounded-full bg-gradient-to-r from-purple-500 to-pink-500 flex items-center justify-center text-2xl">🤖</div>
                                            <div className="text-left">
                                                <h3 className="font-bold text-white text-lg">AI Chat Assistant</h3>
                                                <p className="text-sm text-gray-400">🎤 Voice enabled</p>
                                            </div>
                                        </div>
                                        <span className="text-2xl text-gray-400 group-hover:text-white">💬</span>
                                    </button>
                                ) : (
                                    <div className="glass-card h-[320px] overflow-hidden">
                                        <div className="flex items-center justify-between p-3 bg-black/20 border-b border-white/10">
                                            <div className="flex items-center gap-2">
                                                <div className="w-8 h-8 rounded-full bg-gradient-to-r from-purple-500 to-pink-500 flex items-center justify-center text-lg">🤖</div>
                                                <h3 className="font-bold text-white">AI Chat Assistant</h3>
                                                <span className="text-xs text-purple-400">🎤 Voice enabled</span>
                                            </div>
                                            <button onClick={() => setShowChat(false)} className="p-1 rounded-lg hover:bg-white/10"><X className="w-5 h-5 text-gray-400" /></button>
                                        </div>
                                        <div className="h-[calc(320px-53px)]">
                                            <ChatAssistant documentContext={translationResult || extractedText} selectedLanguage={selectedLanguage} />
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </>
    );
}
