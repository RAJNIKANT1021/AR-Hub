import React, { useState, useEffect, useRef } from "react";

export function getInitialState() {
  return { results: {}, phase: "waiting", startMs: null };
}

export default function ReflexTimer({ gameState, myUid, onMove, isMyTurn }) {
  const { state, players, playerNames } = gameState;
  const [phase, setPhase] = useState("idle"); // idle | ready | go | done
  const [myTime, setMyTime] = useState(null);
  const [earlyClick, setEarlyClick] = useState(false);
  const timeoutRef = useRef(null);
  const startRef = useRef(null);
  const opponentId = players.find(p => p !== myUid);
  const results = state.results || {};
  const myResult = results[myUid];
  const oppResult = results[opponentId];

  useEffect(() => {
    return () => clearTimeout(timeoutRef.current);
  }, []);

  const startRound = () => {
    setPhase("ready");
    setEarlyClick(false);
    setMyTime(null);
    const delay = 2000 + Math.random() * 3000;
    timeoutRef.current = setTimeout(() => {
      startRef.current = Date.now();
      setPhase("go");
    }, delay);
  };

  const handleClick = () => {
    if (phase === "ready") {
      clearTimeout(timeoutRef.current);
      setEarlyClick(true);
      setPhase("idle");
    } else if (phase === "go") {
      const elapsed = Date.now() - startRef.current;
      setMyTime(elapsed);
      setPhase("done");
      const newResults = { ...results, [myUid]: elapsed };
      const bothDone = newResults[opponentId] !== undefined;
      const winner = bothDone
        ? (newResults[myUid] < newResults[opponentId] ? myUid
          : newResults[opponentId] < newResults[myUid] ? opponentId : "draw")
        : null;
      onMove({ ...state, results: newResults }, opponentId,
        bothDone ? "finished" : "playing", winner);
    }
  };

  return (
    <div className="game-reflex">
      <div className="game-players-bar">
        <span className="game-player-chip mine">
          {playerNames[myUid]}: {myResult ? `${myResult}ms` : "?"}
        </span>
        <span className="game-vs">⚡ Reflex</span>
        <span className="game-player-chip opp">
          {playerNames[opponentId]}: {oppResult ? `${oppResult}ms` : "?"}
        </span>
      </div>

      <div className={`reflex-area ${phase}`} onClick={handleClick}>
        {phase === "idle" && !myResult && (
          <div className="reflex-content">
            <div className="reflex-icon">⚡</div>
            <p>Tap the button to start!</p>
            <button className="reflex-start-btn" onClick={startRound}>Start Round</button>
          </div>
        )}
        {phase === "ready" && (
          <div className="reflex-content red-bg">
            <div className="reflex-icon">🔴</div>
            <p>Wait for green…</p>
            <p style={{fontSize:".75rem",opacity:.7}}>Don't tap yet!</p>
          </div>
        )}
        {phase === "go" && (
          <div className="reflex-content green-bg" onClick={handleClick}>
            <div className="reflex-icon">🟢</div>
            <p style={{fontWeight:700,fontSize:"1.3rem"}}>TAP NOW!</p>
          </div>
        )}
        {phase === "done" && (
          <div className="reflex-content">
            <div className="reflex-icon">✅</div>
            <p>Your time: <strong>{myTime}ms</strong></p>
            {!oppResult && <p style={{opacity:.7}}>Waiting for {playerNames[opponentId]}…</p>}
          </div>
        )}
        {earlyClick && phase === "idle" && (
          <div className="reflex-early">Too early! Try again</div>
        )}
      </div>

      {gameState.status === "finished" && (
        <div className="game-status-text">
          {gameState.winner === myUid ? `🎉 You win! ${results[myUid]}ms vs ${results[opponentId]}ms` :
           gameState.winner === "draw" ? "🤝 Exact tie!" :
           `😢 You lose! ${results[myUid]}ms vs ${results[opponentId]}ms`}
        </div>
      )}
    </div>
  );
}
