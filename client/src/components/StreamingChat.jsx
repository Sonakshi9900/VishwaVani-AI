// StreamingChat.jsx — Skeleton Loading + SSE Streaming UI
// Drop-in replacement for existing chat component
// Backend endpoint: POST /api/chat/stream (returns SSE)

import { useState, useRef, useEffect } from "react";

// ─── Skeleton Loader ───────────────────────────────────────────────
function SkeletonMessage() {
  return (
    <div className="skeleton-msg">
      <div className="skeleton-avatar" />
      <div className="skeleton-lines">
        <div className="skeleton-line" style={{ width: "88%" }} />
        <div className="skeleton-line" style={{ width: "72%" }} />
        <div className="skeleton-line" style={{ width: "55%" }} />
      </div>
      <style>{`
        .skeleton-msg {
          display: flex;
          gap: 12px;
          padding: 16px;
          animation: pulse 1.4s ease-in-out infinite;
        }
        .skeleton-avatar {
          width: 36px;
          height: 36px;
          border-radius: 50%;
          background: var(--skeleton-color, #e0ddd5);
          flex-shrink: 0;
        }
        .skeleton-lines {
          flex: 1;
          display: flex;
          flex-direction: column;
          gap: 10px;
          padding-top: 6px;
        }
        .skeleton-line {
          height: 14px;
          border-radius: 6px;
          background: var(--skeleton-color, #e0ddd5);
        }
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.45; }
        }
        @media (prefers-color-scheme: dark) {
          .skeleton-avatar, .skeleton-line {
            --skeleton-color: #3a3a38;
          }
        }
      `}</style>
    </div>
  );
}

// ─── Streaming Message Bubble ──────────────────────────────────────
function StreamingBubble({ text, isStreaming }) {
  return (
    <div className="bubble ai-bubble">
      <div className="bubble-avatar">VV</div>
      <div className="bubble-content">
        <p className="bubble-text">
          {text}
          {isStreaming && <span className="cursor-blink">▋</span>}
        </p>
      </div>
      <style>{`
        .bubble {
          display: flex;
          gap: 12px;
          padding: 12px 16px;
        }
        .bubble-avatar {
          width: 36px;
          height: 36px;
          border-radius: 50%;
          background: #4B3F72;
          color: #fff;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 11px;
          font-weight: 600;
          flex-shrink: 0;
        }
        .bubble-content {
          flex: 1;
          background: var(--color-background-secondary, #f5f4f0);
          border-radius: 0 12px 12px 12px;
          padding: 10px 14px;
        }
        .bubble-text {
          margin: 0;
          font-size: 15px;
          line-height: 1.65;
          white-space: pre-wrap;
        }
        .cursor-blink {
          animation: blink 0.8s step-end infinite;
          color: #4B3F72;
        }
        @keyframes blink {
          0%, 100% { opacity: 1; }
          50% { opacity: 0; }
        }
      `}</style>
    </div>
  );
}

// ─── Main Chat Component ───────────────────────────────────────────
export default function StreamingChat() {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [streamingText, setStreamingText] = useState("");
  const [isStreaming, setIsStreaming] = useState(false);
  const bottomRef = useRef(null);
  const abortRef = useRef(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, streamingText]);

  const sendMessage = async () => {
    const text = input.trim();
    if (!text || isLoading) return;

    const userMsg = { role: "user", content: text };
    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setIsLoading(true);
    setStreamingText("");

    try {
      // Abort previous stream if any
      abortRef.current?.abort();
      const controller = new AbortController();
      abortRef.current = controller;

      // SSE request to backend
      const res = await fetch("/api/chat/stream", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: text, history: messages }),
        signal: controller.signal,
      });

      if (!res.ok) throw new Error("API error " + res.status);

      setIsLoading(false);
      setIsStreaming(true);

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let fullText = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value, { stream: true });
        // SSE format: "data: <text>\n\n"
        const lines = chunk.split("\n");
        for (const line of lines) {
          if (line.startsWith("data: ")) {
            const data = line.slice(6);
            if (data === "[DONE]") break;
            fullText += data;
            setStreamingText(fullText);
          }
        }
      }

      // Commit final streamed message
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: fullText },
      ]);
      setStreamingText("");
      setIsStreaming(false);
    } catch (err) {
      if (err.name !== "AbortError") {
        setIsLoading(false);
        setIsStreaming(false);
        setMessages((prev) => [
          ...prev,
          {
            role: "assistant",
            content: "❌ Kuch gadbad ho gayi. Dobara try karein.",
          },
        ]);
      }
    }
  };

  const handleKey = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  return (
    <div className="chat-root">
      {/* Message history */}
      <div className="chat-messages">
        {messages.map((msg, i) => (
          <div
            key={i}
            className={`msg-row ${msg.role === "user" ? "user-row" : ""}`}
          >
            {msg.role === "assistant" ? (
              <StreamingBubble text={msg.content} isStreaming={false} />
            ) : (
              <div className="user-bubble">{msg.content}</div>
            )}
          </div>
        ))}

        {/* Skeleton while waiting for first token */}
        {isLoading && <SkeletonMessage />}

        {/* Streaming in progress */}
        {isStreaming && streamingText && (
          <StreamingBubble text={streamingText} isStreaming={true} />
        )}

        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div className="chat-input-bar">
        <textarea
          className="chat-input"
          rows={1}
          placeholder="Apna sawal yahan likhein... (Bhojpuri / Hindi / English)"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKey}
          disabled={isLoading || isStreaming}
        />
        <button
          className="send-btn"
          onClick={sendMessage}
          disabled={isLoading || isStreaming || !input.trim()}
          aria-label="Send message"
        >
          ↑
        </button>
      </div>

      <style>{`
        .chat-root {
          display: flex;
          flex-direction: column;
          height: 100vh;
          max-width: 780px;
          margin: 0 auto;
          font-family: var(--font-sans, sans-serif);
        }
        .chat-messages {
          flex: 1;
          overflow-y: auto;
          padding: 16px 0;
        }
        .msg-row { display: flex; }
        .user-row { justify-content: flex-end; padding: 8px 16px; }
        .user-bubble {
          background: #4B3F72;
          color: #fff;
          border-radius: 16px 16px 4px 16px;
          padding: 10px 16px;
          max-width: 72%;
          font-size: 15px;
          line-height: 1.6;
        }
        .chat-input-bar {
          display: flex;
          gap: 8px;
          padding: 12px 16px 20px;
          border-top: 0.5px solid var(--color-border-tertiary, #d3d1c7);
          align-items: flex-end;
        }
        .chat-input {
          flex: 1;
          resize: none;
          border: 0.5px solid var(--color-border-secondary, #b4b2a9);
          border-radius: 12px;
          padding: 10px 14px;
          font-size: 15px;
          font-family: inherit;
          background: var(--color-background-primary, #fff);
          color: var(--color-text-primary, #1a1a18);
          outline: none;
          line-height: 1.5;
        }
        .chat-input:focus {
          border-color: #4B3F72;
        }
        .send-btn {
          width: 40px;
          height: 40px;
          border-radius: 50%;
          background: #4B3F72;
          color: #fff;
          border: none;
          font-size: 18px;
          cursor: pointer;
          flex-shrink: 0;
          transition: opacity 0.2s, transform 0.1s;
        }
        .send-btn:hover:not(:disabled) { opacity: 0.85; }
        .send-btn:active:not(:disabled) { transform: scale(0.95); }
        .send-btn:disabled { opacity: 0.4; cursor: not-allowed; }
      `}</style>
    </div>
  );
}
