import React from "react";

export const TTT_INITIAL = { board: Array(9).fill(null), xIsNext: true };

export function getInitialState() { return TTT_INITIAL; }

function calcWinner(board) {
  const lines = [[0,1,2],[3,4,5],[6,7,8],[0,3,6],[1,4,7],[2,5,8],[0,4,8],[2,4,6]];
  for (const [a,b,c] of lines) {
    if (board[a] && board[a] === board[b] && board[a] === board[c]) return { winner: board[a], line: [a,b,c] };
  }
  return null;
}

export default function TicTacToe({ gameState, myUid, onMove, isMyTurn }) {
  const { state, players, playerNames } = gameState;
  const board = state.board || Array(9).fill(null);
  const xIsNext = state.xIsNext !== false;

  const myIndex = players.indexOf(myUid);
  const mySymbol = myIndex === 0 ? "X" : "O";
  const result = calcWinner(board);
  const isDraw = !result && board.every(Boolean);

  const handleClick = (i) => {
    if (!isMyTurn || board[i] || result || isDraw) return;
    const newBoard = [...board];
    newBoard[i] = mySymbol;
    const newResult = calcWinner(newBoard);
    const newDraw = !newResult && newBoard.every(Boolean);
    const nextTurn = players.find(p => p !== myUid);
    const status = (newResult || newDraw) ? "finished" : "playing";
    const winner = newResult ? myUid : newDraw ? "draw" : null;
    onMove({ board: newBoard, xIsNext: !xIsNext }, nextTurn, status, winner);
  };

  const opponentId = players.find(p => p !== myUid);
  const myName = playerNames[myUid] || "You";
  const oppName = playerNames[opponentId] || "Opponent";

  return (
    <div className="game-ttt">
      <div className="game-players-bar">
        <span className="game-player-chip mine">{myName} ({mySymbol})</span>
        <span className="game-vs">vs</span>
        <span className="game-player-chip opp">{oppName} ({mySymbol === "X" ? "O" : "X"})</span>
      </div>
      <div className="game-ttt-grid">
        {board.map((cell, i) => (
          <button
            key={i}
            className={`ttt-cell ${cell ? "filled" : ""} ${result?.line?.includes(i) ? "win-cell" : ""} ${isMyTurn && !cell && !result && !isDraw ? "clickable" : ""}`}
            onClick={() => handleClick(i)}
          >
            <span className={`ttt-symbol ${cell === "X" ? "x-sym" : "o-sym"}`}>{cell}</span>
          </button>
        ))}
      </div>
      <div className="game-status-text">
        {result ? `${result.winner === mySymbol ? "🎉 You win!" : "😢 You lose"}` :
         isDraw ? "🤝 Draw!" :
         isMyTurn ? "Your turn" : `${oppName}'s turn`}
      </div>
    </div>
  );
}
