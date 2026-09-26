import React, { useEffect, useRef, useState } from "react";
import { IoPlay, IoPause, IoRefresh, IoPlaySkipForward } from "react-icons/io5";
import { sounds, showSystemNotification, vibrate } from "../../../lib/notify";
import { toastOk } from "../../../Context/ChatContext";

const MODES = { focus: { label: "Focus", min: 25, color: "#ef4444" }, short: { label: "Short break", min: 5, color: "#10b981" }, long: { label: "Long break", min: 15, color: "#0ea5e9" } };
const todayKey = () => `arhub_focus_${new Date().toDateString()}`;
const read = (k, d) => { try { return JSON.parse(localStorage.getItem(k)) ?? d; } catch { return d; } };

// Persist the running timer so it survives navigation / reloads
const STATE_KEY = "arhub_focus_state";

export default function Focus() {
  const saved = read(STATE_KEY, null);
  const [mode, setMode] = useState(saved?.mode || "focus");
  const [lengths, setLengths] = useState(() => read("arhub_focus_lengths", { focus: 25, short: 5, long: 15 }));
  const [endAt, setEndAt] = useState(saved?.endAt || null);
  const [remaining, setRemaining] = useState(saved?.remaining ?? lengths[saved?.mode || "focus"] * 60);
  const [stats, setStats] = useState(() => read(todayKey(), { sessions: 0, minutes: 0 }));
  const [task, setTask] = useState(() => localStorage.getItem("arhub_focus_task") || "");
  const tick = useRef(null);

  const total = lengths[mode] * 60;
  const running = !!endAt;

  useEffect(() => { localStorage.setItem(STATE_KEY, JSON.stringify({ mode, endAt, remaining })); }, [mode, endAt, remaining]);
  useEffect(() => { localStorage.setItem("arhub_focus_lengths", JSON.stringify(lengths)); }, [lengths]);
  useEffect(() => { localStorage.setItem("arhub_focus_task", task); }, [task]);

  useEffect(() => {
    if (!endAt) return;
    const loop = () => {
      const left = Math.max(0, Math.round((endAt - Date.now()) / 1000));
      setRemaining(left);
      if (left <= 0) finish();
    };
    loop();
    tick.current = setInterval(loop, 250);
    return () => clearInterval(tick.current);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [endAt]);

  const finish = () => {
    clearInterval(tick.current);
    setEndAt(null);
    sounds.notify(); vibrate([200, 100, 200]);
    if (mode === "focus") {
      const next = { sessions: stats.sessions + 1, minutes: stats.minutes + lengths.focus };
      setStats(next); localStorage.setItem(todayKey(), JSON.stringify(next));
      toastOk("Focus session complete 🎉", "Time for a break.");
      showSystemNotification("Focus session complete", { body: "Great work! Time for a break.", tag: "focus", url: "/hub/focus" });
      switchMode((next.sessions % 4 === 0) ? "long" : "short");
    } else {
      toastOk("Break over", "Ready to focus again?");
      showSystemNotification("Break over", { body: "Ready for another focus session?", tag: "focus", url: "/hub/focus" });
      switchMode("focus");
    }
  };

  const switchMode = (m) => { setEndAt(null); setMode(m); setRemaining(lengths[m] * 60); };
  const start = () => setEndAt(Date.now() + remaining * 1000);
  const pause = () => { setEndAt(null); };
  const reset = () => { setEndAt(null); setRemaining(total); };

  const pct = 1 - remaining / total;
  const R = 120, C = 2 * Math.PI * R;
  const mm = String(Math.floor(remaining / 60)).padStart(2, "0"), ss = String(remaining % 60).padStart(2, "0");
  const color = MODES[mode].color;

  return (
    <div className="focus">
      <div className="seg full">
        {Object.entries(MODES).map(([k, v]) => <button key={k} className={mode === k ? "on" : ""} onClick={() => switchMode(k)}>{v.label}</button>)}
      </div>
      <div className="focus-dial">
        <svg viewBox="0 0 280 280">
          <circle cx="140" cy="140" r={R} fill="none" stroke="var(--bg-active)" strokeWidth="12" />
          <circle cx="140" cy="140" r={R} fill="none" stroke={color} strokeWidth="12" strokeLinecap="round"
            strokeDasharray={C} strokeDashoffset={C * (1 - pct)} transform="rotate(-90 140 140)" style={{ transition: "stroke-dashoffset .3s linear" }} />
        </svg>
        <div className="focus-time">
          <span>{mm}:{ss}</span>
          <small>{running ? (mode === "focus" ? "Stay focused" : "Relax") : remaining === total ? "Ready" : "Paused"}</small>
        </div>
      </div>
      <input className="input focus-task" value={task} onChange={e => setTask(e.target.value)} placeholder="What are you working on?" />
      <div className="focus-controls">
        <button className="icon-btn" onClick={reset} title="Reset"><IoRefresh /></button>
        <button className="focus-main" style={{ background: color }} onClick={running ? pause : start}>{running ? <IoPause /> : <IoPlay />}</button>
        <button className="icon-btn" onClick={finish} title="Skip"><IoPlaySkipForward /></button>
      </div>
      <div className="focus-stats">
        <div className="stat-card"><strong>{stats.sessions}</strong><span>sessions today</span></div>
        <div className="stat-card"><strong>{stats.minutes}</strong><span>focus minutes</span></div>
      </div>
      <details className="focus-settings card">
        <summary>Timer lengths</summary>
        {Object.entries(MODES).map(([k, v]) => (
          <label key={k} className="setting-row">
            <span className="setting-text"><strong>{v.label}</strong></span>
            <input className="input" style={{ width: 90 }} type="number" min={1} max={120} value={lengths[k]}
              onChange={e => { const n = Math.min(120, Math.max(1, +e.target.value || 1)); setLengths(l => ({ ...l, [k]: n })); if (k === mode && !running) setRemaining(n * 60); }} />
          </label>
        ))}
      </details>
    </div>
  );
}
