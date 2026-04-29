import React, { useState } from 'react';
import './HomePage.css';
import { 
  FaLanguage, FaFileAlt, FaHeadphones, FaRobot, 
  FaUpload, FaGlobe, FaArrowRight, FaCheckCircle,
  FaPlay, FaStop, FaSpinner, FaComments, FaDownload,
  FaTimes, FaYoutube
} from 'react-icons/fa';
import { MdSummarize, MdTranslate } from 'react-icons/md';

const HomePage = () => {
  const [activeFeature, setActiveFeature] = useState(0);
  const [isListening, setIsListening] = useState(false);
  const [uploadedFile, setUploadedFile] = useState(null);
  const [selectedLang, setSelectedLang] = useState('hi');
  const [demoText, setDemoText] = useState('');
  const [showVideoBox, setShowVideoBox] = useState(false);

  const features = [
    { icon: <MdTranslate />, title: "PDF Translation", desc: "15+ Indian Languages", color: "#a855f7" },
    { icon: <MdSummarize />, title: "AI Summarization", desc: "Smart Key Points", color: "#ec4899" },
    { icon: <FaHeadphones />, title: "Text-to-Speech", desc: "Natural Voice", color: "#06b6d4" },
    { icon: <FaRobot />, title: "AI Chatbot", desc: "24/7 Assistant", color: "#f59e0b" }
  ];

  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (file && file.type === 'application/pdf') {
      setUploadedFile(file);
      setDemoText("📄 Original PDF: " + file.name + "\n\n✨ Translation: This is a demo of VishwaVani AI. Your actual PDF will be translated using Google Cloud Translate API into " + (selectedLang === 'hi' ? 'Hindi' : selectedLang === 'ta' ? 'Tamil' : selectedLang) + " language.");
    }
  };

  const handleListen = () => {
    setIsListening(true);
    const utterance = new SpeechSynthesisUtterance(demoText || "Welcome to VishwaVani AI. Your translation will be spoken here.");
    utterance.lang = selectedLang === 'hi' ? 'hi-IN' : selectedLang === 'ta' ? 'ta-IN' : 'en-IN';
    utterance.onend = () => setIsListening(false);
    window.speechSynthesis.speak(utterance);
  };

  const openVideoBox = () => {
    setShowVideoBox(true);
  };

  const closeVideoBox = () => {
    setShowVideoBox(false);
  };

  // Launch App function - redirect to your existing dashboard
  const launchApp = () => {
    window.location.href = 'https://vishwa-vani-ai.vercel.app/dashboard';
  };

  return (
    <div className="homepage">
      {/* Animated Particles Background */}
      <div className="particles-bg">
        <div className="particle"></div><div className="particle"></div><div className="particle"></div>
        <div className="particle"></div><div className="particle"></div><div className="particle"></div>
      </div>

      {/* Premium Navigation */}
      <nav className="premium-nav">
        <div className="nav-container">
          <div className="logo">
            <div className="logo-3d">🌐</div>
            <span className="logo-text">Vishwa<span className="highlight">Vani</span> AI</span>
          </div>
          <div className="nav-menu">
            <a href="#home" className="nav-link">Home</a>
            <a href="#how-it-works" className="nav-link">How it Works</a>
            <a href="#features" className="nav-link">Features</a>
          </div>
          <button className="nav-cta" onClick={launchApp}>Launch App →</button>
        </div>
      </nav>

      {/* Hero Section */}
      <section id="home" className="hero-premium">
        <div className="hero-badge">
          <span className="badge-pulse">🚀 Innovation for Sollution Challenge 2026</span>
        </div>
        <h1 className="hero-title">
          Break Language Barriers
          <span className="hero-gradient"> with VishwaVani AI</span>
        </h1>
        <p className="hero-description">
          Translate PDFs, Generate Summaries, Listen Translations, and AI Chatbot For Doubts<br/>
          — In <span className="stat-number">12+</span> Indian Languages
        </p>
       
        <div className="hero-buttons">
          <button className="btn-gradient" onClick={launchApp}>Launch App <FaArrowRight /></button>
          <button className="btn-outline-premium" onClick={openVideoBox}>Watch Video</button>
        </div>
      </section>

      {/* How It Works Section */}
      <section id="how-it-works" className="how-it-works">
        <h2 className="section-title-premium">⚡ How VishwaVani AI Works</h2>
        <div className="steps-container">
          <div className="step-card">
            <div className="step-number">01</div>
            <div className="step-icon"><FaUpload /></div>
            <h3>Upload PDF</h3>
            <p>Drag & drop any PDF document (max 10MB)</p>
            <div className="step-arrow">→</div>
          </div>
          <div className="step-card">
            <div className="step-number">02</div>
            <div className="step-icon"><FaGlobe /></div>
            <h3>Select Language</h3>
            <p>Choose from 12+ Indian languages (Hindi, Tamil, Telugu, etc.)</p>
            <div className="step-arrow">→</div>
          </div>
          <div className="step-card">
            <div className="step-number">03</div>
            <div className="step-icon"><FaRobot /></div>
            <h3>AI Processing</h3>
            <p>Google Cloud Translate + Gemini AI analyze your document</p>
            <div className="step-arrow">→</div>
          </div>
          <div className="step-card">
            <div className="step-number">04</div>
            <div className="step-icon"><FaHeadphones /></div>
            <h3>Get Results</h3>
            <p>Translation, Summary & Audio output in seconds</p>
          </div>
        </div>
      </section>

      {/* Features Grid with Hover Effects */}
      <section id="features" className="features-premium">
        <h2 className="section-title-premium">✨ Premium Features</h2>
        <div className="feature-grid-premium">
          <div className="feature-card-premium" onMouseEnter={() => setActiveFeature(0)}>
            <div className="feature-glow" style={{background: features[0].color}}></div>
            <div className="feature-icon-premium" style={{color: features[0].color}}><FaLanguage /></div>
            <h3>PDF → Translate</h3>
            <p>Convert any PDF to 12+ Indian languages including Hindi, Tamil, Telugu, Bengali, Marathi, Gujarati, and more.</p>
            <div className="feature-tech">
              <span className="tech-badge">Google Cloud Translate API</span>
              <span className="tech-badge">Preserves Formatting</span>
            </div>
          </div>

          <div className="feature-card-premium" onMouseEnter={() => setActiveFeature(1)}>
            <div className="feature-glow" style={{background: features[1].color}}></div>
            <div className="feature-icon-premium" style={{color: features[1].color}}><FaFileAlt /></div>
            <h3>PDF → AI Summary</h3>
            <p>Get bullet-point summaries, key takeaways, and chapter-wise highlights. Saves 80% reading time.</p>
            <div className="feature-tech">
              <span className="tech-badge">Gemini 2.0 AI</span>
              <span className="tech-badge">Multi-language Summary</span>
            </div>
          </div>

          <div className="feature-card-premium" onMouseEnter={() => setActiveFeature(2)}>
            <div className="feature-glow" style={{background: features[2].color}}></div>
            <div className="feature-icon-premium" style={{color: features[2].color}}><FaHeadphones /></div>
            <h3>🔊 Listen Feature</h3>
            <p>Natural neural TTS voices. Adjust speed, pause, resume. Perfect for learning pronunciation.</p>
            <div className="feature-tech">
              <span className="tech-badge">Neural TTS</span>
              <span className="tech-badge">Download Audio</span>
            </div>
          </div>

          <div className="feature-card-premium" onMouseEnter={() => setActiveFeature(3)}>
            <div className="feature-glow" style={{background: features[3].color}}></div>
            <div className="feature-icon-premium" style={{color: features[3].color}}><FaRobot /></div>
            <h3>AI Chatbot Assistant</h3>
            <p>Ask doubts about your document. Get instant answers, clarifications, and explanations.</p>
            <div className="feature-tech">
              <span className="tech-badge">Gemini API</span>
              <span className="tech-badge">Context-Aware</span>
            </div>
          </div>
        </div>
      </section>

      {/* Tech Stack Showcase */}
      <section className="tech-stack">
        <h2 className="section-title-premium">🛠️ Powered By</h2>
        <div className="tech-grid">
          <div className="tech-item">
            <div className="tech-logo">☁️</div>
            <span>Google Cloud Translate API</span>
          </div>
          <div className="tech-item">
            <div className="tech-logo">🤖</div>
            <span>Gemini 2.0 API</span>
          </div>
          <div className="tech-item">
            <div className="tech-logo">🔊</div>
            <span>Web Speech API / Neural TTS</span>
          </div>
          <div className="tech-item">
            <div className="tech-logo">⚛️</div>
            <span>React + Vite</span>
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="testimonials">
        <h2 className="section-title-premium">Vision Statement</h2>
        <div className="testimonial-grid">
          <div className="testimonial-card">
            <p>"Our goal is to break language barriers in India through accurate PDF translation, summarization, and voice-enabled AI assistance."</p>
            <div className="testimonial-author">— Sonakshi Kumari (Developer)</div>
          </div>
          <div className="testimonial-card">
            <p>"Making digital content accessible in every Indian language.
Bridging communication gaps with intelligent AI solutions."</p>
            <div className="testimonial-author">— VishwaVani AI</div>
          </div>
        </div>
      </section>

      {/* VIDEO CONTAINER BOX - Opens when Watch Video is clicked */}
      {showVideoBox && (
        <div className="video-box-overlay" onClick={closeVideoBox}>
          <div className="video-box" onClick={(e) => e.stopPropagation()}>
            <div className="video-box-header">
              <h3>
                <FaYoutube style={{ color: '#ff0000', marginRight: '10px' }} />
                VishwaVani AI - Demo Video
              </h3>
              <button className="video-box-close" onClick={closeVideoBox}>
                <FaTimes />
              </button>
            </div>
            <div className="video-box-player">
              <iframe
                width="100%"
                height="100%"
                src="https://www.youtube.com/embed/a2W00ogWQp0?autoplay=1"
                title="YouTube video player"
                frameBorder="0"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              ></iframe>
            </div>
          </div>
        </div>
      )}

      {/* Footer */}
      <footer className="premium-footer">
        <div className="footer-content">
          <div className="footer-brand">
            <h3>VishwaVani AI</h3>
            <p>Breaking Language Barriers, One PDF at a Time</p>
          </div>
         
        </div>
        <div className="footer-bottom">
          <p>Powered by Google Cloud Translate API + Gemini AI | Hackathon 2026</p>
        </div>
      </footer>
    </div>
  );
};

export default HomePage;
