// AdminDashboard.jsx
// Teacher/Admin Panel — Topic analytics, user stats, broadcast
// Protected route: only teacher/admin JWT can access

import { useState, useEffect } from "react";

// ─── Mock API (replace with real fetch calls) ─────────────────────
async function fetchAnalytics(token) {
  // Replace with: fetch('/api/admin/analytics', { headers: { Authorization: `Bearer ${token}` } })
  return {
    totalStudents: 1842,
    totalQuestions: 12409,
    activeToday: 318,
    avgResponseTime: "1.4s",
    topTopics: [
      { topic: "गणित (Fractions)", count: 2340, trend: "up" },
      { topic: "विज्ञान (Photosynthesis)", count: 1890, trend: "up" },
      { topic: "हिंदी व्याकरण", count: 1540, trend: "steady" },
      { topic: "इतिहास (Maurya Empire)", count: 1120, trend: "down" },
      { topic: "भूगोल (Bihar Rivers)", count: 980, trend: "up" },
      { topic: "English Grammar", count: 760, trend: "steady" },
    ],
    recentErrors: [
      { time: "2 min ago", type: "API Timeout", msg: "OpenAI 504 - student retried" },
      { time: "1 hr ago", type: "WhatsApp Bot", msg: "Voice note too long (>60s)" },
    ],
    languageBreakdown: { hindi: 68, bhojpuri: 22, english: 10 },
  };
}

// ─── Stat Card Component ──────────────────────────────────────────
function StatCard({ label, value, icon, accent }) {
  return (
    <div className="stat-card" style={{ borderTop: `3px solid ${accent}` }}>
      <div className="stat-icon">{icon}</div>
      <div className="stat-value">{value}</div>
      <div className="stat-label">{label}</div>
    </div>
  );
}

// ─── Topic Bar ────────────────────────────────────────────────────
function TopicBar({ topic, count, max, trend }) {
  const pct = Math.round((count / max) * 100);
  const trendIcon = trend === "up" ? "↑" : trend === "down" ? "↓" : "→";
  const trendColor = trend === "up" ? "#3B6D11" : trend === "down" ? "#A32D2D" : "#5F5E5A";

  return (
    <div className="topic-row">
      <div className="topic-name">{topic}</div>
      <div className="topic-bar-wrap">
        <div className="topic-bar-fill" style={{ width: `${pct}%` }} />
      </div>
      <div className="topic-count">{count.toLocaleString()}</div>
      <div className="topic-trend" style={{ color: trendColor }}>{trendIcon}</div>
    </div>
  );
}

// ─── Main Dashboard ───────────────────────────────────────────────
export default function AdminDashboard({ token, user }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [broadcastMsg, setBroadcastMsg] = useState("");
  const [broadcastStatus, setBroadcastStatus] = useState("");
  const [activeTab, setActiveTab] = useState("overview");

  useEffect(() => {
    fetchAnalytics(token).then((d) => {
      setData(d);
      setLoading(false);
    });
  }, [token]);

  const sendBroadcast = async () => {
    if (!broadcastMsg.trim()) return;
    setBroadcastStatus("Sending...");
    try {
      // await fetch('/api/whatsapp/broadcast', { method: 'POST', ... })
      await new Promise((r) => setTimeout(r, 1200)); // Simulate
      setBroadcastStatus("✅ Broadcast sent to all registered students!");
      setBroadcastMsg("");
    } catch {
      setBroadcastStatus("❌ Failed to send");
    }
  };

  if (loading) {
    return (
      <div className="dashboard-loading">
        <div className="spinner" />
        <p>Loading analytics...</p>
      </div>
    );
  }

  const maxCount = Math.max(...data.topTopics.map((t) => t.count));

  return (
    <div className="dashboard-root">
      {/* Header */}
      <div className="dash-header">
        <div>
          <h1 className="dash-title">Vishwa-Vani Admin</h1>
          <p className="dash-sub">Namaste, {user?.name || "Teacher"} 👋</p>
        </div>
        <div className="user-badge">{user?.role?.toUpperCase()}</div>
      </div>

      {/* Tabs */}
      <div className="tabs">
        {["overview", "topics", "errors", "broadcast"].map((tab) => (
          <button
            key={tab}
            className={`tab-btn ${activeTab === tab ? "active" : ""}`}
            onClick={() => setActiveTab(tab)}
          >
            {tab.charAt(0).toUpperCase() + tab.slice(1)}
          </button>
        ))}
      </div>

      {/* Overview Tab */}
      {activeTab === "overview" && (
        <>
          <div className="stats-grid">
            <StatCard label="Total Students" value={data.totalStudents.toLocaleString()} icon="👨‍🎓" accent="#4B3F72" />
            <StatCard label="Total Questions" value={data.totalQuestions.toLocaleString()} icon="💬" accent="#1D9E75" />
            <StatCard label="Active Today" value={data.activeToday} icon="⚡" accent="#BA7517" />
            <StatCard label="Avg Response" value={data.avgResponseTime} icon="⏱" accent="#D85A30" />
          </div>

          {/* Language Breakdown */}
          <div className="section-card">
            <h2 className="section-title">Language Breakdown</h2>
            <div className="lang-bars">
              {Object.entries(data.languageBreakdown).map(([lang, pct]) => (
                <div key={lang} className="lang-row">
                  <span className="lang-name">{lang.charAt(0).toUpperCase() + lang.slice(1)}</span>
                  <div className="lang-bar-wrap">
                    <div
                      className="lang-bar-fill"
                      style={{
                        width: `${pct}%`,
                        background: lang === "hindi" ? "#4B3F72" : lang === "bhojpuri" ? "#1D9E75" : "#BA7517",
                      }}
                    />
                  </div>
                  <span className="lang-pct">{pct}%</span>
                </div>
              ))}
            </div>
          </div>
        </>
      )}

      {/* Topics Tab */}
      {activeTab === "topics" && (
        <div className="section-card">
          <h2 className="section-title">Top Topics (Last 30 Days)</h2>
          <div className="topics-list">
            {data.topTopics.map((t) => (
              <TopicBar key={t.topic} {...t} max={maxCount} />
            ))}
          </div>
        </div>
      )}

      {/* Errors Tab */}
      {activeTab === "errors" && (
        <div className="section-card">
          <h2 className="section-title">Recent Errors (Sentry)</h2>
          {data.recentErrors.length === 0 ? (
            <p className="no-errors">✅ No recent errors!</p>
          ) : (
            data.recentErrors.map((err, i) => (
              <div key={i} className="error-row">
                <div className="error-badge">{err.type}</div>
                <div className="error-detail">
                  <span className="error-msg">{err.msg}</span>
                  <span className="error-time">{err.time}</span>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* Broadcast Tab */}
      {activeTab === "broadcast" && (
        <div className="section-card">
          <h2 className="section-title">WhatsApp Broadcast</h2>
          <p className="section-desc">Sabhi registered students ko ek saath message bhejo</p>
          <textarea
            className="broadcast-input"
            placeholder="Aaj ki padhai ka topic: Photosynthesis 🌱 App par login karke quiz do!"
            value={broadcastMsg}
            onChange={(e) => setBroadcastMsg(e.target.value)}
            rows={4}
          />
          <button className="broadcast-btn" onClick={sendBroadcast} disabled={!broadcastMsg.trim()}>
            📢 Broadcast Send Karo
          </button>
          {broadcastStatus && <p className="broadcast-status">{broadcastStatus}</p>}
        </div>
      )}

      <style>{`
        .dashboard-root {
          max-width: 900px;
          margin: 0 auto;
          padding: 24px 20px;
          font-family: var(--font-sans, sans-serif);
          color: var(--color-text-primary, #1a1a18);
        }
        .dash-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          margin-bottom: 24px;
        }
        .dash-title { font-size: 22px; font-weight: 500; margin: 0; }
        .dash-sub { font-size: 14px; color: var(--color-text-secondary, #5F5E5A); margin: 4px 0 0; }
        .user-badge {
          background: #4B3F72;
          color: #fff;
          font-size: 11px;
          font-weight: 600;
          padding: 4px 12px;
          border-radius: 20px;
          letter-spacing: 0.05em;
        }
        .tabs {
          display: flex;
          gap: 4px;
          margin-bottom: 20px;
          border-bottom: 0.5px solid var(--color-border-tertiary, #d3d1c7);
          padding-bottom: 0;
        }
        .tab-btn {
          padding: 8px 16px;
          border: none;
          background: none;
          cursor: pointer;
          font-size: 14px;
          color: var(--color-text-secondary, #5F5E5A);
          border-bottom: 2px solid transparent;
          margin-bottom: -0.5px;
          transition: color 0.15s, border-color 0.15s;
        }
        .tab-btn.active {
          color: #4B3F72;
          border-bottom-color: #4B3F72;
          font-weight: 500;
        }
        .stats-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
          gap: 12px;
          margin-bottom: 20px;
        }
        .stat-card {
          background: var(--color-background-secondary, #f5f4f0);
          border-radius: 10px;
          padding: 16px;
          position: relative;
        }
        .stat-icon { font-size: 24px; margin-bottom: 8px; }
        .stat-value { font-size: 28px; font-weight: 500; line-height: 1; }
        .stat-label { font-size: 12px; color: var(--color-text-secondary, #5F5E5A); margin-top: 6px; }
        .section-card {
          background: var(--color-background-primary, #fff);
          border: 0.5px solid var(--color-border-tertiary, #d3d1c7);
          border-radius: 12px;
          padding: 20px;
          margin-bottom: 16px;
        }
        .section-title { font-size: 16px; font-weight: 500; margin: 0 0 16px; }
        .section-desc { font-size: 14px; color: var(--color-text-secondary); margin: -8px 0 16px; }
        .lang-bars, .topics-list { display: flex; flex-direction: column; gap: 12px; }
        .lang-row, .topic-row {
          display: flex;
          align-items: center;
          gap: 12px;
          font-size: 13px;
        }
        .lang-name, .topic-name { min-width: 90px; }
        .topic-name { min-width: 220px; }
        .lang-bar-wrap, .topic-bar-wrap {
          flex: 1;
          height: 8px;
          background: var(--color-background-secondary, #f5f4f0);
          border-radius: 4px;
          overflow: hidden;
        }
        .lang-bar-fill, .topic-bar-fill {
          height: 100%;
          background: #4B3F72;
          border-radius: 4px;
          transition: width 0.4s ease;
        }
        .topic-bar-fill { background: #1D9E75; }
        .lang-pct, .topic-count { min-width: 44px; text-align: right; font-weight: 500; font-size: 13px; }
        .topic-trend { min-width: 18px; font-weight: 500; }
        .error-row {
          display: flex;
          align-items: flex-start;
          gap: 12px;
          padding: 10px 0;
          border-bottom: 0.5px solid var(--color-border-tertiary, #d3d1c7);
        }
        .error-badge {
          background: #FCEBEB;
          color: #A32D2D;
          font-size: 11px;
          padding: 3px 8px;
          border-radius: 6px;
          white-space: nowrap;
          font-weight: 500;
        }
        .error-detail { display: flex; flex-direction: column; gap: 2px; }
        .error-msg { font-size: 14px; }
        .error-time { font-size: 12px; color: var(--color-text-secondary); }
        .no-errors { color: #3B6D11; font-size: 14px; }
        .broadcast-input {
          width: 100%;
          border: 0.5px solid var(--color-border-secondary, #b4b2a9);
          border-radius: 10px;
          padding: 12px;
          font-size: 14px;
          font-family: inherit;
          resize: vertical;
          color: var(--color-text-primary);
          background: var(--color-background-primary);
          box-sizing: border-box;
        }
        .broadcast-btn {
          margin-top: 12px;
          background: #4B3F72;
          color: #fff;
          border: none;
          border-radius: 8px;
          padding: 10px 20px;
          font-size: 14px;
          cursor: pointer;
          transition: opacity 0.2s;
        }
        .broadcast-btn:hover:not(:disabled) { opacity: 0.85; }
        .broadcast-btn:disabled { opacity: 0.4; cursor: not-allowed; }
        .broadcast-status { margin-top: 10px; font-size: 14px; }
        .dashboard-loading {
          display: flex;
          flex-direction: column;
          align-items: center;
          padding: 60px;
          gap: 16px;
          color: var(--color-text-secondary);
        }
        .spinner {
          width: 32px;
          height: 32px;
          border: 2px solid var(--color-border-secondary);
          border-top-color: #4B3F72;
          border-radius: 50%;
          animation: spin 0.8s linear infinite;
        }
        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
}
