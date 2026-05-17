import React, { useState, useEffect } from "react";

const EMOJIS = ["🐶","🐱","🐭","🐹","🐰","🦊","🐻","🐼","🐨","🐯","🦁","🐸"];

export function getInitialState() {
  const pairs = [...EMOJIS, ...EMOJIS];
  const shuffled = pairs.sort(() => Math.random() - 0.5);
  return {
    cards: shuffled.map((e, i) => ({ id: i, emoji: e, flipped: false, matched: false })),
    scores: {},
    lastFlip: null,
  };
}

export default function MemoryFlip({ gameState, myUid, onMove, isMyTurn }) {
  const { state, players, playerNames } = gameState;
  const [selected, setSelected] = useState([]);
  const [locked, setLocked] = useState(false);
  const opponentId = players.find(p => p !== myUid); // eslint-disable-line no-unused-vars
  const cards = state.cards || [];
  const scores = state.scores || { [players[0]]: 0, [players[1]]: 0 };

  const flip = (idx) => {
    if (!isMyTurn || locked || cards[idx].flipped || cards[idx].matched) return;
    if (selected.includes(idx)) return;
    const newSelected = [...selected, idx];
    const newCards = cards.map((c, i) => i === idx ? { ...c, flipped: true } : c);

    if (newSelected.length === 2) {
      setLocked(true);
      const [a, b] = newSelected;
      const match = newCards[a].emoji === newCards[b].emoji;
      setTimeout(() => {
        const finalCards = newCards.map((c, i) =>
          match && (i === a || i === b) ? { ...c, matched: true } :
          (!match && (i === a || i === b)) ? { ...c, flipped: false } : c
        );
        const newScores = { ...scores };
        if (match) newScores[myUid] = (newScores[myUid] || 0) + 1;
        const allMatched = finalCards.every(c => c.matched);
        const nextTurn = match ? myUid : opponentId;
        const winner = allMatched
          ? (newScores[players[0]] > newScores[players[1]] ? players[0]
            : newScores[players[1]] > newScores[players[0]] ? players[1] : "draw")
          : null;
        onMove({ cards: finalCards, scores: newScores }, nextTurn,
          allMatched ? "finished" : "playing", winner);
        setSelected([]);
        setLocked(false);
      }, 900);
    } else {
      setSelected(newSelected);
      onMove({ ...state, cards: newCards }, myUid, "playing", null);
    }
  };

  return (
    <div className="game-memory">
      <div className="game-players-bar">
        <span className="game-player-chip mine">{playerNames[myUid]}: {scores[myUid] || 0}</span>
        <span className="game-vs">Memory</span>
        <span className="game-player-chip opp">{playerNames[opponentId]}: {scores[opponentId] || 0}</span>
      </div>
      <div className="memory-grid">
        {cards.map((card, i) => (
          <div key={card.id}
            className={`memory-card ${card.flipped || card.matched ? "revealed" : ""} ${card.matched ? "matched" : ""} ${isMyTurn && !locked && !card.flipped && !card.matched ? "clickable" : ""}`}
            onClick={() => flip(i)}
          >
            <div className="memory-card-inner">
              <div className="memory-card-back">?</div>
              <div className="memory-card-front">{card.emoji}</div>
            </div>
          </div>
        ))}
      </div>
      <div className="game-status-text">
        {gameState.status === "finished"
          ? (gameState.winner === myUid ? "🎉 You win!" : gameState.winner === "draw" ? "🤝 Draw!" : "😢 You lose!")
          : isMyTurn ? "Your turn — flip two cards!" : `${playerNames[opponentId]}'s turn`}
      </div>
    </div>
  );
}
