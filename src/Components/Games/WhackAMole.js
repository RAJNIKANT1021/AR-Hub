import React, { useState, useEffect, useRef } from "react";

export function getInitialState() {
  return { activeMole: null, scores: {}, timeLeft: 30, phase: "waiting" };
}

export default function WhackAMole({ gameState, myUid, onMove, isMyTurn }) {
  const { state, players, playerNames } = gameState;
  const [activeMole, setActiveMole] = useState(null);
  const [timeLeft, setTimeLeft] = useState(30);
  const [myScore, setMyScore] = useState(0);
  const [running, setRunning] = useState(false);
  const moleTimer = useRef(null);
  const gameTimer = useRef(null);
  const opponentId = players.find(p => p !== myUid);
  const scores = state.scores || {};
  const oppScore = scores[opponentId];
  const done = state.phase === "done" || gameState.status === "finished";

  useEffect(() => () => { clearInterval(moleTimer.current); clearInterval(gameTimer.current); }, []);

  const start = () => {
    setRunning(true);
    setMyScore(0);
    setTimeLeft(30);
    onMove({ ...state, phase: "playing" }, myUid, "playing", null);
    moleTimer.current = setInterval(() => {
      setActiveMole(Math.floor(Math.random() * 9));
      setTimeout(() => setActiveMole(null), 700);
    }, 900);
    gameTimer.current = setInterval(() => {
      setTimeLeft(t => {
        if (t <= 1) {
          clearInterval(moleTimer.current); clearInterval(gameTimer.current);
          setRunning(false); setActiveMole(null);
          setMyScore(sc => {
            const newScores = { ...scores, [myUid]: sc };
            const bothDone = newScores[opponentId] !== undefined;
            const winner = bothDone
              ? (newScores[myUid] > newScores[opponentId] ? myUid
                : newScores[opponentId] > newScores[myUid] ? opponentId : "draw") : null;
            onMove({ ...state, scores: newScores, phase: "done" }, opponentId,
              bothDone ? "finished" : "playing", winner);
            return sc;
          });
          return 0;
        }
        return t - 1;
      });
    }, 1000);
  };

  const whack = (i) => {
    if (!running || activeMole !== i) return;
    setActiveMole(null);
    setMyScore(s => s + 1);
  };

  return (
    <div className="game-whack">
      <div className="game-players-bar">
        <span className="game-player-chip mine">{playerNames[myUid]}: {running ? myScore : (scores[myUid] ?? "?")}</span>
        <span className="game-vs">{running ? `${timeLeft}s` : "🔨 Whack!"}</span>
        <span className="game-player-chip opp">{playerNames[opponentId]}: {oppScore ?? "?"}</span>
      </div>

      <div className="whack-grid">
        {Array.from({length:9}).map((_,i) => (
          <div key={i} className={`whack-hole ${activeMole === i ? "active" : ""}`} onClick={() => whack(i)}>
            {activeMole === i && <div className="whack-mole">🐹</div>}
          </div>
        ))}
      </div>

      {!running && !done && (
        <button className="game-start-btn" onClick={start}>Start (30s)</button>
      )}
      {running && <p className="game-status-text">Whack the moles! Score: {myScore}</p>}
      {!running && done && (
        <div className="game-status-text">
          {gameState.winner === myUid ? `🎉 You win! ${scores[myUid]} vs ${scores[opponentId]}` :
           gameState.winner === "draw" ? `🤝 Draw! ${scores[myUid]}` :
           `😢 You lose! ${scores[myUid]} vs ${scores[opponentId]}`}
        </div>
      )}
    </div>
  );
}
