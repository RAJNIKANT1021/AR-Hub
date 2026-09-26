import React, { useState } from "react";

export function getInitialState() {
  // Host picks a secret number 1-100; stored only after host sets it
  return { hostSecret: null, hostGuesses: [], guestGuesses: [], phase: "host-pick" };
}

export default function GuessNumber({ gameState, myUid, onMove, isMyTurn }) {
  const { state, players, playerNames } = gameState;
  const [input, setInput] = useState("");
  const hostId = players[0];
  const guestId = players[1];
  const isHost = myUid === hostId;
  const phase = state.phase || "host-pick";

  const opponentId = players.find(p => p !== myUid);

  const handleSet = () => {
    const n = parseInt(input);
    if (isNaN(n) || n < 1 || n > 100) return;
    setInput("");
    onMove({ ...state, hostSecret: n, phase: "guest-guess" }, guestId, "playing", null);
  };

  const handleGuess = () => {
    const n = parseInt(input);
    if (isNaN(n) || n < 1 || n > 100) return;
    setInput("");
    const secret = state.hostSecret;
    const prevGuesses = state.guestGuesses || [];
    const hint = n === secret ? "🎯 Correct!" : n < secret ? "📈 Too low!" : "📉 Too high!";
    const newGuesses = [...prevGuesses, { n, hint }];
    const won = n === secret;
    onMove(
      { ...state, guestGuesses: newGuesses, phase: won ? "done" : "guest-guess" },
      hostId,
      won ? "finished" : "playing",
      won ? guestId : null,
    );
  };

  const guesses = state.guestGuesses || [];

  return (
    <div className="game-guess">
      <div className="game-players-bar">
        <span className="game-player-chip mine">{playerNames[hostId]} (Host)</span>
        <span className="game-vs">vs</span>
        <span className="game-player-chip opp">{playerNames[guestId]} (Guesser)</span>
      </div>

      {phase === "host-pick" && isHost && (
        <div className="guess-input-section">
          <p className="guess-hint-text">Pick a secret number (1–100). Your opponent will try to guess it!</p>
          <div className="guess-input-row">
            <input className="guess-input" type="number" min={1} max={100} placeholder="1-100"
              value={input} onChange={e => setInput(e.target.value)}
              onKeyDown={e => e.key === "Enter" && handleSet()} />
            <button className="guess-btn" onClick={handleSet}>Set Secret</button>
          </div>
        </div>
      )}

      {phase === "host-pick" && !isHost && (
        <div className="guess-waiting">
          <div className="guess-spinner" />
          <p>{playerNames[hostId]} is picking a secret number…</p>
        </div>
      )}

      {phase === "guest-guess" && !isHost && (
        <div className="guess-input-section">
          <p className="guess-hint-text">Guess the number between 1–100!</p>
          <div className="guess-input-row">
            <input className="guess-input" type="number" min={1} max={100} placeholder="Your guess"
              value={input} onChange={e => setInput(e.target.value)}
              onKeyDown={e => e.key === "Enter" && handleGuess()} />
            <button className="guess-btn" onClick={handleGuess}>Guess!</button>
          </div>
          <div className="guess-history">
            {guesses.slice().reverse().map((g, i) => (
              <div key={i} className="guess-item">
                <span className="guess-num">{g.n}</span>
                <span className="guess-result">{g.hint}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {phase === "guest-guess" && isHost && (
        <div className="guess-watching">
          <p>{playerNames[guestId]} is guessing… ({guesses.length} guess{guesses.length !== 1 ? "es" : ""} so far)</p>
          <div className="guess-history">
            {guesses.slice().reverse().map((g, i) => (
              <div key={i} className="guess-item">
                <span className="guess-num">{g.n}</span>
                <span className="guess-result">{g.hint}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {gameState.status === "finished" && (
        <div className="game-status-text">
          {gameState.winner === myUid ? "🎉 You win!" : "😢 You lose!"}
          {isHost && <span> — Your number was {state.hostSecret}</span>}
        </div>
      )}
    </div>
  );
}
