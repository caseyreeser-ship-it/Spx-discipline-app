import React, { useEffect, useMemo, useState } from "react";
import { createRoot } from "react-dom/client";
import { CheckCircle2, Plus, RotateCcw, ShieldCheck, TimerReset, TrendingUp } from "lucide-react";
import "./styles.css";

const MAX_TRADES = 3;
const COOLDOWN_MINUTES = 20;

const checklistItems = [
  "Clear setup",
  "Trend identified",
  "Entry level defined",
  "Stop defined",
  "Target defined",
  "Not revenge trading",
];

function getTodayKey() {
  return new Date().toISOString().slice(0, 10);
}

function loadState() {
  try {
    const raw = localStorage.getItem("spx-discipline-state");
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (parsed.date !== getTodayKey()) return null;
    return parsed;
  } catch {
    return null;
  }
}

function App() {
  const saved = loadState();

  const [trades, setTrades] = useState(saved?.trades || []);
  const [checked, setChecked] = useState(saved?.checked || checklistItems.map(() => false));
  const [pnlInput, setPnlInput] = useState("");
  const [cooldownUntil, setCooldownUntil] = useState(saved?.cooldownUntil || null);
  const [now, setNow] = useState(Date.now());

  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    localStorage.setItem(
      "spx-discipline-state",
      JSON.stringify({
        date: getTodayKey(),
        trades,
        checked,
        cooldownUntil,
      })
    );
  }, [trades, checked, cooldownUntil]);

  const totalPnl = trades.reduce((sum, t) => sum + t.pnl, 0);
  const allChecked = checked.every(Boolean);
  const tradesRemaining = Math.max(0, MAX_TRADES - trades.length);
  const inCooldown = cooldownUntil && now < cooldownUntil;

  const cooldownSeconds = inCooldown
    ? Math.ceil((cooldownUntil - now) / 1000)
    : 0;

  const cooldownLabel = `${Math.floor(cooldownSeconds / 60)}:${String(
    cooldownSeconds % 60
  ).padStart(2, "0")}`;

  const disciplineScore = useMemo(() => {
    if (trades.length === 0) return 100;
    const compliant = trades.filter((t) => t.followedRules).length;
    const base = Math.round((compliant / trades.length) * 100);
    return Math.max(0, base);
  }, [trades]);

  function toggleCheck(index) {
    setChecked((prev) => prev.map((v, i) => (i === index ? !v : v)));
  }

  function logTrade() {
    if (!allChecked || inCooldown || trades.length >= MAX_TRADES) return;

    const pnl = Number(pnlInput);
    if (!Number.isFinite(pnl)) return;

    const newTrade = {
      id: Date.now(),
      pnl,
      followedRules: true,
      time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    };

    setTrades((prev) => [...prev, newTrade]);
    setChecked(checklistItems.map(() => false));
    setPnlInput("");

    if (pnl < 0) {
      setCooldownUntil(Date.now() + COOLDOWN_MINUTES * 60 * 1000);
    }
  }

  function resetDay() {
    setTrades([]);
    setChecked(checklistItems.map(() => false));
    setPnlInput("");
    setCooldownUntil(null);
    localStorage.removeItem("spx-discipline-state");
  }

  return (
    <div className="app-shell">
      <main className="container">
        <header className="hero">
          <div>
            <div className="eyebrow">SPX TRADING DISCIPLINE</div>
            <h1>Protect the process.</h1>
            <p>Trade less. Trade your setup. Stop when the rules say stop.</p>
          </div>
          <button className="ghost-button" onClick={resetDay}>
            <RotateCcw size={17} />
            Reset day
          </button>
        </header>

        <section className="card" style={{ marginBottom: "16px", padding: "14px 16px" }}>
          <strong>Today’s focus:</strong> A+ setups only.
        </section>

        <section className="stats-grid">
          <div className="card stat-card">
            <span>Trades</span>
            <strong>{trades.length} / {MAX_TRADES}</strong>
            <small>{tradesRemaining} remaining</small>
          </div>

          <div className="card stat-card">
            <span>P&amp;L</span>
            <strong className={totalPnl >= 0 ? "positive" : "negative"}>
              {totalPnl >= 0 ? "+" : ""}${totalPnl.toFixed(0)}
            </strong>
            <small>today</small>
          </div>

          <div className="card stat-card">
            <span>Discipline</span>
            <strong>{disciplineScore}</strong>
            <small>process score</small>
          </div>
        </section>

        {inCooldown && (
          <section className="cooldown card">
            <TimerReset size={22} />
            <div>
              <strong>Cooldown active</strong>
              <span>Next trade unlocks in {cooldownLabel}</span>
            </div>
          </section>
        )}

        <section className="content-grid">
          <div className="card checklist-card">
            <div className="section-title">
              <ShieldCheck size={20} />
              <div>
                <h2>Before you trade</h2>
                <p>Every box must be checked.</p>
              </div>
            </div>

            <div className="checklist">
              {checklistItems.map((item, index) => (
                <button
                  key={item}
                  className={`check-row ${checked[index] ? "checked" : ""}`}
                  onClick={() => toggleCheck(index)}
                >
                  <CheckCircle2 size={20} />
                  <span>{item}</span>
                </button>
              ))}
            </div>

            <div className="trade-entry">
              <label>
                Trade P&amp;L
                <input
                  type="number"
                  inputMode="decimal"
                  placeholder="Example: 125 or -80"
                  value={pnlInput}
                  onChange={(e) => setPnlInput(e.target.value)}
                />
              </label>

              <button
                className="primary-button"
                onClick={logTrade}
                disabled={
                  !allChecked ||
                  inCooldown ||
                  trades.length >= MAX_TRADES ||
                  pnlInput === ""
                }
              >
                <Plus size={18} />
                Log trade
              </button>
            </div>

            {trades.length >= MAX_TRADES && (
              <div className="limit-warning">
                Daily trade limit reached. No more trades today.
              </div>
            )}
          </div>

          <div className="card trades-card">
            <div className="section-title">
              <TrendingUp size={20} />
              <div>
                <h2>Today’s trades</h2>
                <p>Your running journal.</p>
              </div>
            </div>

            <div className="trade-list">
              {trades.length === 0 ? (
                <div className="empty-state">No trades logged yet.</div>
              ) : (
                [...trades].reverse().map((trade, index) => (
                  <div className="trade-row" key={trade.id}>
                    <div>
                      <strong>Trade #{trades.length - index}</strong>
                      <span>{trade.time}</span>
                    </div>
                    <strong className={trade.pnl >= 0 ? "positive" : "negative"}>
                      {trade.pnl >= 0 ? "+" : ""}${trade.pnl.toFixed(0)}
                    </strong>
                  </div>
                ))
              )}
            </div>
          </div>
        </section>

        <footer>
          Rule: a losing trade triggers a {COOLDOWN_MINUTES}-minute cooldown.
        </footer>
      </main>
    </div>
  );
}

createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);


if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker.register("/sw.js").catch(() => {});
  });
}
