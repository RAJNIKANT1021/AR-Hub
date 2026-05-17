import React from "react";

const ROWS = 6, COLS = 7;
export function getInitialState() {
  return { board: Array(ROWS).fill(null).map(() => Array(COLS).fill(null)) };
}

function checkWin(board, r, c, sym) {
  const dirs = [[0,1],[1,0],[1,1],[1,-1]];
  for (const [dr,dc] of dirs) {
    let count = 1;
    for (let d = 1; d < 4; d++) {
      const nr = r+dr*d, nc = c+dc*d;
      if (nr<0||nr>=ROWS||nc<0||nc>=COLS||board[nr][nc]!==sym) break;
      count++;
    }
    for (let d = 1; d < 4; d++) {
      const nr = r-dr*d, nc = c-dc*d;
      if (nr<0||nr>=ROWS||nc<0||nc>=COLS||board[nr][nc]!==sym) break;
      count++;
    }
    if (count >= 4) return true;
  }
  return false;
}

export default function Connect4({ gameState, myUid, onMove, isMyTurn }) {
  const { state, players, playerNames } = gameState;
  const board = state.board || getInitialState().board;
  const myIndex = players.indexOf(myUid);
  const myColor = myIndex === 0 ? "red" : "yellow";
  const opponentId = players.find(p => p !== myUid);

  const dropPiece = (col) => {
    if (!isMyTurn) return;
    const newBoard = board.map(r => [...r]);
    let row = -1;
    for (let r = ROWS-1; r >= 0; r--) {
      if (!newBoard[r][col]) { row = r; break; }
    }
    if (row === -1) return;
    newBoard[row][col] = myColor;
    const won = checkWin(newBoard, row, col, myColor);
    const full = newBoard[0].every(c => c !== null);
    const status = (won || full) ? "finished" : "playing";
    const winner = won ? myUid : full ? "draw" : null;
    onMove({ board: newBoard }, players.find(p => p !== myUid), status, winner);
  };

  const full = board[0].every(c => c !== null);

  return (
    <div className="game-c4">
      <div className="game-players-bar">
        <span className="game-player-chip" style={{ background: myColor === "red" ? "#ef4444" : "#eab308" }}>
          {playerNames[myUid]} ({myColor})
        </span>
        <span className="game-vs">vs</span>
        <span className="game-player-chip" style={{ background: myColor === "red" ? "#eab308" : "#ef4444" }}>
          {playerNames[opponentId]} ({myColor === "red" ? "yellow" : "red"})
        </span>
      </div>

      <div className="c4-board">
        {Array.from({length: COLS}).map((_, col) => (
          <div key={col} className="c4-col" onClick={() => dropPiece(col)}>
            {Array.from({length: ROWS}).map((_, row) => (
              <div key={row} className={`c4-cell ${board[row][col] || ""}`} />
            ))}
          </div>
        ))}
      </div>
      <div className="game-status-text">
        {gameState.status === "finished"
          ? gameState.winner === myUid ? "🎉 You win!" : gameState.winner === "draw" ? "🤝 Draw!" : "😢 You lose"
          : isMyTurn ? "Your turn — click a column" : `${playerNames[opponentId]}'s turn`}
      </div>
    </div>
  );
}
