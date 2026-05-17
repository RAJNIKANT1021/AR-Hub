import React, { useState } from "react";

export function getInitialState() {
  return { round: 1, choices: {}, scores: {}, roundResult: null, maxRounds: 5 };
}

const CHOICES = ["✊", "✋", "✌️"];
const LABELS  = ["Rock", "Paper", "Scissors"];

function getWinner(a, b) {
  if (a === b) return "draw";
  if ((a === 0 && b === 2) || (a === 1 && b === 0) || (a === 2 && b === 1)) return "a";
  return "b";
}

export default function RockPaperScissors({ gameState, myUid, onMove, isMyTurn }) {
  const { state, players, playerNames } = gameState;
  const [picked, setPicked] = useState(null);
  const opponentId = players.find(p => p !== myUid);
  const choices = state.choices || {};
  const scores = state.scores || { [players[0]]: 0, [players[1]]: 0 };
  const round = state.round || 1;
  const maxRounds = state.maxRounds || 5;
  const myChoice = choices[myUid];
  const oppChoice = choices[opponentId];
  const bothChose = myChoice !== undefined && oppChoice !== undefined;

  const choose = (idx) => {
    if (myChoice !== undefined) return;
    const newChoices = { ...choices, [myUid]: idx };
    const oppIdx = newChoices[opponentId];
    const bothDone = oppIdx !== undefined;

    if (bothDone) {
      const res = getWinner(newChoices[players[0]], newChoices[players[1]]);
      const newScores = { ...scores };
      let roundWinner = null;
      if (res === "a") { newScores[players[0]] = (newScores[players[0]] || 0) + 1; roundWinner = players[0]; }
      else if (res === "b") { newScores[players[1]] = (newScores[players[1]] || 0) + 1; roundWinner = players[1]; }
      const newRound = round + 1;
      const gameOver = newRound > maxRounds;
      const gameWinner = gameOver
        ? (newScores[players[0]] > newScores[players[1]] ? players[0]
          : newScores[players[1]] > newScores[players[0]] ? players[1] : "draw")
        : null;
      onMove(
        { round: newRound, choices: {}, scores: newScores, roundResult: { choices: newChoices, roundWinner }, maxRounds },
        players[0], gameOver ? "finished" : "playing", gameWinner,
      );
    } else {
      onMove({ ...state, choices: newChoices }, opponentId, "playing", null);
    }
    setPicked(idx);
  };

  const rr = state.roundResult;

  return (
    <div className="game-rps">
      <div className="game-players-bar">
        <span className="game-player-chip mine">{playerNames[myUid]}: {scores[myUid] || 0}</span>
        <span className="game-vs">Round {Math.min(round, maxRounds)}/{maxRounds}</span>
        <span className="game-player-chip opp">{playerNames[opponentId]}: {scores[opponentId] || 0}</span>
      </div>

      {rr && (
        <div className="rps-round-result">
          <div className="rps-choices-row">
            <div className="rps-choice-show">
              <span className="rps-emoji">{CHOICES[rr.choices[myUid]]}</span>
              <span className="rps-label">{LABELS[rr.choices[myUid]]}</span>
            </div>
            <span className="rps-vs-text">vs</span>
            <div className="rps-choice-show">
              <span className="rps-emoji">{CHOICES[rr.choices[opponentId]]}</span>
              <span className="rps-label">{LABELS[rr.choices[opponentId]]}</span>
            </div>
          </div>
          <div className="rps-round-winner">
            {rr.roundWinner === myUid ? "✅ You won this round!" :
             rr.roundWinner === opponentId ? "❌ They won this round" : "🤝 Draw round"}
          </div>
        </div>
      )}

      {gameState.status !== "finished" && (
        <div className="rps-pick-section">
          <p className="rps-pick-label">
            {myChoice !== undefined ? "Waiting for opponent…" : "Pick your move!"}
          </p>
          <div className="rps-buttons">
            {CHOICES.map((c, i) => (
              <button key={i}
                className={`rps-btn ${myChoice === i ? "selected" : ""}`}
                onClick={() => choose(i)}
                disabled={myChoice !== undefined}
              >
                <span className="rps-btn-emoji">{c}</span>
                <span className="rps-btn-label">{LABELS[i]}</span>
              </button>
            ))}
          </div>
          {myChoice !== undefined && oppChoice === undefined && (
            <div className="rps-waiting-dot">Opponent is choosing…</div>
          )}
        </div>
      )}

      {gameState.status === "finished" && (
        <div className="game-status-text">
          {gameState.winner === myUid ? "🎉 You win the match!" :
           gameState.winner === "draw" ? "🤝 Match draw!" : "😢 You lose the match"}
        </div>
      )}
    </div>
  );
}
