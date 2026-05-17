import React, { useState, useEffect, useRef } from "react";

const SENTENCES = [
  "The quick brown fox jumps over the lazy dog",
  "Pack my box with five dozen liquor jugs",
  "How vexingly quick daft zebras jump",
  "The five boxing wizards jump quickly",
  "Sphinx of black quartz judge my vow",
  "Two driven jocks help fax my big quiz",
  "The job requires extra pluck and zeal from every young wage earner",
  "We promptly judged antique ivory buckles for the next prize",
];

export function getInitialState() {
  const text = SENTENCES[Math.floor(Math.random() * SENTENCES.length)];
  return { text, progress: {}, finishTimes: {}, wpm: {} };
}

export default function TypingDuel({ gameState, myUid, onMove, isMyTurn }) {
  const { state, players, playerNames } = gameState;
  const [typed, setTyped] = useState("");
  const [startTime, setStartTime] = useState(null);
  const [done, setDone] = useState(false);
  const inputRef = useRef(null);
  const opponentId = players.find(p => p !== myUid);
  const text = state.text || "";
  const progress = state.progress || {};
  const wpm = state.wpm || {};
  const myProgress = progress[myUid] || 0;
  const oppProgress = progress[opponentId] || 0;

  useEffect(() => { inputRef.current?.focus(); }, []);

  const handleChange = (e) => {
    if (done) return;
    const val = e.target.value;
    if (!startTime && val.length > 0) setStartTime(Date.now());
    setTyped(val);
    const correct = text.startsWith(val);
    const pct = correct ? Math.round((val.length / text.length) * 100) : myProgress;
    const newProgress = { ...progress, [myUid]: pct };
    if (val === text) {
      const elapsed = (Date.now() - startTime) / 60000;
      const words = text.split(" ").length;
      const speed = Math.round(words / elapsed);
      const newWpm = { ...wpm, [myUid]: speed };
      const finishTimes = { ...(state.finishTimes || {}), [myUid]: Date.now() };
      setDone(true);
      const bothDone = finishTimes[opponentId] !== undefined;
      const winner = bothDone
        ? (finishTimes[myUid] < finishTimes[opponentId] ? myUid : opponentId)
        : null;
      onMove({ ...state, progress: newProgress, wpm: newWpm, finishTimes },
        opponentId, bothDone ? "finished" : "playing", winner);
    } else {
      onMove({ ...state, progress: newProgress }, myUid, "playing", null);
    }
  };

  const chars = text.split("");

  return (
    <div className="game-typing">
      <div className="game-players-bar">
        <span className="game-player-chip mine">{playerNames[myUid]}: {myProgress}%</span>
        <span className="game-vs">⌨️ Type!</span>
        <span className="game-player-chip opp">{playerNames[opponentId]}: {oppProgress}%</span>
      </div>

      <div className="typing-progress-bars">
        <div className="typing-pbar-wrap">
          <div className="typing-pbar-label">You</div>
          <div className="typing-pbar"><div className="typing-pbar-fill mine" style={{width:`${myProgress}%`}} /></div>
        </div>
        <div className="typing-pbar-wrap">
          <div className="typing-pbar-label">{playerNames[opponentId]}</div>
          <div className="typing-pbar"><div className="typing-pbar-fill opp" style={{width:`${oppProgress}%`}} /></div>
        </div>
      </div>

      <div className="typing-text-display">
        {chars.map((c, i) => {
          let cls = "typing-char pending";
          if (i < typed.length) cls = typed[i] === c ? "typing-char correct" : "typing-char wrong";
          else if (i === typed.length) cls = "typing-char cursor";
          return <span key={i} className={cls}>{c === " " ? " " : c}</span>;
        })}
      </div>

      {!done && (
        <input ref={inputRef} className="typing-hidden-input"
          value={typed} onChange={handleChange}
          placeholder="Start typing here…" autoFocus />
      )}

      {gameState.status === "finished" && (
        <div className="game-status-text">
          {gameState.winner === myUid
            ? `🎉 You win! ${wpm[myUid]} WPM`
            : `😢 You lose! ${wpm[myUid] || "?"} WPM vs ${wpm[opponentId] || "?"} WPM`}
        </div>
      )}
    </div>
  );
}
