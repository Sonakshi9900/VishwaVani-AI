// PhygitalLab.jsx
// Web Serial API — Browser se Arduino/sensor kit connect karo
// Phygital (Physical + Digital) learning experience
// Works in Chrome 89+ only (Web Serial API support)

import { useState, useRef, useCallback, useEffect } from "react";

// ─── useWebSerial Hook ─────────────────────────────────────────────
export function useWebSerial({ baudRate = 9600, onData } = {}) {
  const [connected, setConnected] = useState(false);
  const [supported, setSupported] = useState(true);
  const [error, setError] = useState(null);
  const portRef = useRef(null);
  const readerRef = useRef(null);

  useEffect(() => {
    if (!("serial" in navigator)) {
      setSupported(false);
    }
  }, []);

  const connect = useCallback(async () => {
    if (!("serial" in navigator)) {
      setError("Web Serial API support nahi hai. Chrome 89+ use karo.");
      return;
    }
    try {
      setError(null);
      const port = await navigator.serial.requestPort();
      await port.open({ baudRate });
      portRef.current = port;
      setConnected(true);

      // Read loop
      const reader = port.readable.getReader();
      readerRef.current = reader;
      const decoder = new TextDecoder();
      let buffer = "";

      (async () => {
        try {
          while (true) {
            const { value, done } = await reader.read();
            if (done) break;
            buffer += decoder.decode(value, { stream: true });
            // Process complete lines
            const lines = buffer.split("\n");
            buffer = lines.pop(); // keep incomplete line
            for (const line of lines) {
              const trimmed = line.trim();
              if (trimmed) onData?.(trimmed);
            }
          }
        } catch (err) {
          if (err.name !== "AbortError") {
            setError("Serial read error: " + err.message);
          }
        }
      })();
    } catch (err) {
      if (err.name !== "NotFoundError") {
        setError("Connection failed: " + err.message);
      }
    }
  }, [baudRate, onData]);

  const disconnect = useCallback(async () => {
    try {
      readerRef.current?.cancel();
      await readerRef.current?.releaseLock?.();
      await portRef.current?.close();
    } catch {}
    portRef.current = null;
    readerRef.current = null;
    setConnected(false);
  }, []);

  const send = useCallback(async (text) => {
    if (!portRef.current?.writable) return;
    const writer = portRef.current.writable.getWriter();
    const encoder = new TextEncoder();
    await writer.write(encoder.encode(text + "\n"));
    writer.releaseLock();
  }, []);

  return { connected, supported, error, connect, disconnect, send };
}

// ─── Sensor Display ────────────────────────────────────────────────
function SensorCard({ label, value, unit, color }) {
  return (
    <div className="sensor-card" style={{ borderTop: `3px solid ${color}` }}>
      <div className="sensor-label">{label}</div>
      <div className="sensor-value" style={{ color }}>
        {value ?? "—"}
        <span className="sensor-unit">{unit}</span>
      </div>
    </div>
  );
}

// ─── Main Phygital Lab Component ───────────────────────────────────
// Expected Arduino Serial format (one JSON per line):
// {"temp":28.4,"humidity":65,"light":512,"button":0}
export default function PhygitalLab() {
  const [sensorData, setSensorData] = useState(null);
  const [rawLog, setRawLog] = useState([]);
  const [aiExplanation, setAiExplanation] = useState("");
  const [loadingAI, setLoadingAI] = useState(false);

  const handleSerialData = useCallback((line) => {
    // Try JSON parse first
    try {
      const parsed = JSON.parse(line);
      setSensorData(parsed);
      setRawLog((prev) => [line, ...prev].slice(0, 50));
    } catch {
      // Raw text data
      setRawLog((prev) => [line, ...prev].slice(0, 50));
    }
  }, []);

  const { connected, supported, error, connect, disconnect } = useWebSerial({
    baudRate: 9600,
    onData: handleSerialData,
  });

  // Ask AI to explain current sensor readings
  const explainWithAI = async () => {
    if (!sensorData) return;
    setLoadingAI(true);
    setAiExplanation("");

    try {
      const res = await fetch("/api/chat/stream", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: `Sensor readings: Temperature=${sensorData.temp}°C, Humidity=${sensorData.humidity}%, Light=${sensorData.light}. 
          Bacchon ko simple Hindi mein samjhao ki yeh readings kya matlab rakhti hain aur science mein yeh concept kahan aata hai.`,
          history: [],
          language: "hindi",
        }),
      });

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let fullText = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        const chunk = decoder.decode(value, { stream: true });
        const lines = chunk.split("\n");
        for (const line of lines) {
          if (line.startsWith("data: ")) {
            const data = line.slice(6);
            if (data === "[DONE]") break;
            fullText += data.replace(/\\n/g, "\n");
            setAiExplanation(fullText);
          }
        }
      }
    } catch {
      setAiExplanation("AI explanation fetch karne mein problem aayi.");
    }
    setLoadingAI(false);
  };

  if (!supported) {
    return (
      <div className="lab-unsupported">
        <div className="lab-icon">⚠️</div>
        <h2>Web Serial API Support Nahi Hai</h2>
        <p>Yeh feature sirf <strong>Google Chrome 89+</strong> mein kaam karta hai.</p>
        <p>Chrome download karo aur dobara try karo.</p>
      </div>
    );
  }

  return (
    <div className="lab-root">
      <div className="lab-header">
        <div className="lab-title">🔬 Phygital Lab</div>
        <div className="lab-sub">Browser se Arduino sensor connect karo</div>
      </div>

      {/* Connection Controls */}
      <div className="connect-bar">
        <div className={`conn-status ${connected ? "connected" : "disconnected"}`}>
          <div className="conn-dot" />
          {connected ? "Arduino Connected" : "Arduino Disconnected"}
        </div>
        <button
          className={`conn-btn ${connected ? "danger" : "primary"}`}
          onClick={connected ? disconnect : connect}
        >
          {connected ? "Disconnect" : "Connect Arduino"}
        </button>
      </div>

      {error && <div className="lab-error">{error}</div>}

      {/* Sensor Cards */}
      {sensorData ? (
        <>
          <div className="sensors-grid">
            {sensorData.temp !== undefined && (
              <SensorCard label="Temperature" value={sensorData.temp} unit="°C" color="#D85A30" />
            )}
            {sensorData.humidity !== undefined && (
              <SensorCard label="Humidity" value={sensorData.humidity} unit="%" color="#185FA5" />
            )}
            {sensorData.light !== undefined && (
              <SensorCard label="Light Level" value={sensorData.light} unit="lux" color="#BA7517" />
            )}
            {sensorData.button !== undefined && (
              <SensorCard
                label="Button"
                value={sensorData.button ? "Pressed" : "Released"}
                unit=""
                color={sensorData.button ? "#3B6D11" : "#888780"}
              />
            )}
          </div>

          {/* AI Explain Button */}
          <button className="ai-explain-btn" onClick={explainWithAI} disabled={loadingAI}>
            {loadingAI ? "⏳ AI samjha raha hai..." : "🤖 AI se samjhein — Yeh readings kya hain?"}
          </button>

          {aiExplanation && (
            <div className="ai-box">
              <div className="ai-box-label">Vishwa-Vani AI ka Jawab</div>
              <p className="ai-box-text">{aiExplanation}</p>
            </div>
          )}
        </>
      ) : connected ? (
        <div className="waiting-data">
          <div className="spinner-small" />
          <span>Arduino se data aane ka wait kar rahe hain...</span>
        </div>
      ) : (
        <div className="lab-placeholder">
          <p>Arduino connect karo aur sensor readings yahan dikhenge.</p>
          <p className="lab-hint">
            Arduino ko USB se laptop se jodo → "Connect Arduino" button dabaao → Chrome port select karne dega
          </p>
          <pre className="code-sample">{`// Arduino sketch (copy karke upload karo):
#include <DHT.h>
DHT dht(2, DHT11);

void setup() {
  Serial.begin(9600);
  dht.begin();
}

void loop() {
  float t = dht.readTemperature();
  float h = dht.readHumidity();
  int l = analogRead(A0);
  
  Serial.print("{\\"temp\\":");
  Serial.print(t);
  Serial.print(",\\"humidity\\":");
  Serial.print(h);
  Serial.print(",\\"light\\":");
  Serial.print(l);
  Serial.println("}");
  delay(1000);
}`}</pre>
        </div>
      )}

      {/* Raw Log */}
      {rawLog.length > 0 && (
        <details className="raw-log">
          <summary>Raw Serial Log ({rawLog.length} lines)</summary>
          <pre>{rawLog.join("\n")}</pre>
        </details>
      )}

      <style>{`
        .lab-root {
          max-width: 720px;
          margin: 0 auto;
          padding: 24px 20px;
          font-family: var(--font-sans, sans-serif);
        }
        .lab-header { margin-bottom: 20px; }
        .lab-title { font-size: 20px; font-weight: 500; }
        .lab-sub { font-size: 14px; color: var(--color-text-secondary); margin-top: 4px; }
        .connect-bar {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 12px 16px;
          background: var(--color-background-secondary);
          border-radius: 10px;
          margin-bottom: 16px;
        }
        .conn-status { display: flex; align-items: center; gap: 8px; font-size: 14px; font-weight: 500; }
        .conn-dot {
          width: 8px;
          height: 8px;
          border-radius: 50%;
          background: #888;
        }
        .connected .conn-dot { background: #3B6D11; }
        .disconnected .conn-dot { background: #A32D2D; }
        .conn-btn {
          padding: 8px 16px;
          border-radius: 8px;
          border: none;
          font-size: 14px;
          cursor: pointer;
          font-weight: 500;
          transition: opacity 0.2s;
        }
        .conn-btn.primary { background: #4B3F72; color: #fff; }
        .conn-btn.danger { background: #A32D2D; color: #fff; }
        .conn-btn:hover { opacity: 0.85; }
        .lab-error {
          background: #FCEBEB;
          color: #A32D2D;
          border-radius: 8px;
          padding: 10px 14px;
          font-size: 14px;
          margin-bottom: 16px;
        }
        .sensors-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
          gap: 12px;
          margin-bottom: 16px;
        }
        .sensor-card {
          background: var(--color-background-primary);
          border: 0.5px solid var(--color-border-tertiary);
          border-radius: 10px;
          padding: 16px;
        }
        .sensor-label { font-size: 12px; color: var(--color-text-secondary); margin-bottom: 8px; }
        .sensor-value { font-size: 26px; font-weight: 500; }
        .sensor-unit { font-size: 14px; margin-left: 4px; opacity: 0.7; }
        .ai-explain-btn {
          width: 100%;
          padding: 12px;
          background: #4B3F72;
          color: #fff;
          border: none;
          border-radius: 10px;
          font-size: 14px;
          cursor: pointer;
          margin-bottom: 16px;
          transition: opacity 0.2s;
        }
        .ai-explain-btn:disabled { opacity: 0.5; cursor: not-allowed; }
        .ai-box {
          background: var(--color-background-secondary);
          border-radius: 10px;
          padding: 16px;
          margin-bottom: 16px;
        }
        .ai-box-label { font-size: 12px; color: #4B3F72; font-weight: 500; margin-bottom: 8px; }
        .ai-box-text { font-size: 15px; line-height: 1.65; margin: 0; white-space: pre-wrap; }
        .waiting-data {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 20px;
          color: var(--color-text-secondary);
          font-size: 14px;
        }
        .spinner-small {
          width: 20px;
          height: 20px;
          border: 2px solid var(--color-border-secondary);
          border-top-color: #4B3F72;
          border-radius: 50%;
          animation: spin 0.8s linear infinite;
          flex-shrink: 0;
        }
        @keyframes spin { to { transform: rotate(360deg); } }
        .lab-placeholder { padding: 16px 0; color: var(--color-text-secondary); font-size: 14px; }
        .lab-hint { font-size: 13px; margin-top: 8px; }
        .code-sample {
          background: var(--color-background-secondary);
          border-radius: 8px;
          padding: 14px;
          font-size: 12px;
          overflow-x: auto;
          margin-top: 16px;
          line-height: 1.5;
        }
        .raw-log {
          border: 0.5px solid var(--color-border-tertiary);
          border-radius: 8px;
          margin-top: 16px;
        }
        .raw-log summary {
          padding: 10px 14px;
          cursor: pointer;
          font-size: 13px;
          color: var(--color-text-secondary);
        }
        .raw-log pre {
          padding: 12px 14px;
          font-size: 11px;
          max-height: 200px;
          overflow-y: auto;
          margin: 0;
          border-top: 0.5px solid var(--color-border-tertiary);
        }
        .lab-unsupported {
          text-align: center;
          padding: 60px 20px;
          color: var(--color-text-secondary);
        }
        .lab-icon { font-size: 40px; margin-bottom: 16px; }
      `}</style>
    </div>
  );
}
