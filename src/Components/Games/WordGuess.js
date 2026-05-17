import React, { useState } from "react";

const WORDS = ["APPLE","BRAIN","CLOUD","DANCE","EARTH","FLAME","GRACE","HAPPY","INPUT","JOKER","KNIGHT","LEMON","MAGIC","NIGHT","OCEAN","PIANO","QUEST","RIVER","STONE","TIGER","ULTRA","VOICE","WITCH","XENON","YACHT","ZEBRA","BRAVE","CRISP","DRIFT","EAGER","FANCY","GLOOM","HURRY","IVORY","JAZZY","KNACK","LUNAR","MOUNT","NORTH","OFFER","PLUM","QUIRK","RUSTY","SWIFT","THRILL","UNZIP","VIVID","WINDY","XENON","YIELD"];

export function getInitialState() {
  const word = WORDS[Math.floor(Math.random() * WORDS.length)];
  return { word, guesses: [], phase: "playing", maxGuesses: 6 };
}

function tileColor(letter, pos, word) {
  if (word[pos] === letter) return "correct";
  if (word.includes(letter)) return "present";
  return "absent";
}

export default function WordGuess({ gameState, myUid, onMove, isMyTurn }) {
  const { state, players, playerNames } = gameState;
  const [input, setInput] = useState("");
  const opponentId = players.find(p => p !== myUid);
  const word = state.word || "";
  const guesses = state.guesses || [];
  const maxGuesses = state.maxGuesses || 6;

  const submit = () => {
    const g = input.toUpperCase().trim();
    if (g.length !== word.length) return;
    const newGuesses = [...guesses, g];
    setInput("");
    const won = g === word;
    const lost = newGuesses.length >= maxGuesses && !won;
    const status = (won || lost) ? "finished" : "playing";
    const winner = won ? myUid : lost ? opponentId : null;
    onMove({ ...state, guesses: newGuesses }, opponentId, status, winner);
  };

  const usedLetters = {};
  guesses.forEach(g => {
    g.split("").forEach((l, i) => {
      const color = tileColor(l, i, word);
      if (!usedLetters[l] || color === "correct") usedLetters[l] = color;
      else if (usedLetters[l] === "absent" && color === "present") usedLetters[l] = color;
    });
  });

  return (
    <div className="game-word">
      <div className="game-players-bar">
        <span className="game-player-chip mine">{playerNames[myUid]}</span>
        <span className="game-vs">Wordle ({word.length} letters)</span>
        <span className="game-player-chip opp">{playerNames[opponentId]}</span>
      </div>

      <div className="word-grid">
        {Array.from({length: maxGuesses}).map((_, row) => (
          <div key={row} className="word-row">
            {Array.from({length: word.length}).map((_, col) => {
              const g = guesses[row];
              const letter = g ? g[col] : "";
              const color = g ? tileColor(letter, col, word) : "";
              return (
                <div key={col} className={`word-tile ${color}`}>
                  {letter}
                </div>
              );
            })}
          </div>
        ))}
      </div>

      <div className="word-keyboard">
        {["QWERTYUIOP","ASDFGHJKL","ZXCVBNM"].map((row, ri) => (
          <div key={ri} className="kb-row">
            {row.split("").map(l => (
              <button key={l} className={`kb-key ${usedLetters[l] || ""}`}
                onClick={() => setInput(v => v.length < word.length ? v + l : v)}>
                {l}
              </button>
            ))}
            {ri === 2 && <>
              <button className="kb-key wide" onClick={() => setInput(v => v.slice(0,-1))}>⌫</button>
              <button className="kb-key wide green" onClick={submit}>↵</button>
            </>}
          </div>
        ))}
      </div>

      <div className="word-current-input">
        {Array.from({length: word.length}).map((_, i) => (
          <div key={i} className={`word-tile current ${input[i] ? "filled" : ""}`}>
            {input[i] || ""}
          </div>
        ))}
      </div>

      {gameState.status === "finished" && (
        <div className="game-status-text">
          {gameState.winner === myUid ? "🎉 You got it!" :
           gameState.winner === "draw" ? "🤝 Draw!" : `😢 The word was: ${word}`}
        </div>
      )}
    </div>
  );
}
