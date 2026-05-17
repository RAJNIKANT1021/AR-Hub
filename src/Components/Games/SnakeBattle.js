import React, { useState, useEffect, useRef, useCallback } from "react";

const GRID = 15;
const TICK = 150;

function initSnake(startX) {
  return [{ x: startX, y: 7 }, { x: startX, y: 8 }];
}

function randFood(s1, s2) {
  let x, y;
  // eslint-disable-next-line no-loop-func
  do { x = Math.floor(Math.random()*GRID); y = Math.floor(Math.random()*GRID); }
  while (s1.some(s=>s.x===x&&s.y===y) || s2.some(s=>s.x===x&&s.y===y));
  return { x, y };
}

export function getInitialState() {
  const s1 = initSnake(3), s2 = initSnake(11);
  return { s1, s2, food: randFood(s1,s2), dir1:{x:0,y:-1}, dir2:{x:0,y:1}, scores:{}, alive:{0:true,1:true} };
}

export default function SnakeBattle({ gameState, myUid, onMove, isMyTurn }) {
  const { state, players, playerNames } = gameState;
  const myIndex = players.indexOf(myUid);
  const opponentId = players.find(p => p !== myUid);
  const dirRef = useRef(myIndex === 0 ? {x:0,y:-1} : {x:0,y:1});
  const stateRef = useRef(state);
  const timerRef = useRef(null);
  const [localState, setLocalState] = useState(state);
  const isHost = myIndex === 0;

  useEffect(() => { stateRef.current = state; setLocalState(state); }, [state]);

  const moveKey = useCallback((e) => {
    const map = { ArrowUp:{x:0,y:-1}, ArrowDown:{x:0,y:1}, ArrowLeft:{x:-1,y:0}, ArrowRight:{x:1,y:0},
      w:{x:0,y:-1}, s:{x:0,y:1}, a:{x:-1,y:0}, d:{x:1,y:0} };
    const d = map[e.key];
    if (d) { e.preventDefault(); dirRef.current = d; }
  }, []);

  useEffect(() => {
    window.addEventListener("keydown", moveKey);
    return () => window.removeEventListener("keydown", moveKey);
  }, [moveKey]);

  useEffect(() => {
    if (!isHost || gameState.status === "finished") return;
    timerRef.current = setInterval(() => {
      const st = stateRef.current;
      const move = (snake, dir) => {
        const head = { x: (snake[0].x + dir.x + GRID) % GRID, y: (snake[0].y + dir.y + GRID) % GRID };
        return [head, ...snake.slice(0, -1)];
      };
      let ns1 = move(st.s1, myIndex === 0 ? dirRef.current : st.dir2);
      let ns2 = move(st.s2, myIndex === 1 ? dirRef.current : st.dir1);
      const scores = { ...st.scores };
      let food = st.food;
      if (ns1[0].x === food.x && ns1[0].y === food.y) { ns1 = [...ns1, ns1[ns1.length-1]]; scores[players[0]] = (scores[players[0]]||0)+1; food = randFood(ns1,ns2); }
      if (ns2[0].x === food.x && ns2[0].y === food.y) { ns2 = [...ns2, ns2[ns2.length-1]]; scores[players[1]] = (scores[players[1]]||0)+1; food = randFood(ns1,ns2); }
      const dead1 = ns2.some(s=>s.x===ns1[0].x&&s.y===ns1[0].y);
      const dead2 = ns1.some(s=>s.x===ns2[0].x&&s.y===ns2[0].y);
      const finished = dead1 || dead2 || (scores[players[0]]||0) >= 10 || (scores[players[1]]||0) >= 10;
      const winner = finished ? ((scores[players[0]]||0) > (scores[players[1]]||0) ? players[0] : (scores[players[1]]||0) > (scores[players[0]]||0) ? players[1] : "draw") : null;
      onMove({ s1:ns1, s2:ns2, food, dir1:myIndex===0?dirRef.current:st.dir1, dir2:myIndex===1?dirRef.current:st.dir2, scores, alive:{0:!dead1,1:!dead2} },
        players[0], finished?"finished":"playing", winner);
    }, TICK);
    return () => clearInterval(timerRef.current);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isHost, gameState.status]);

  const s1 = localState.s1 || [];
  const s2 = localState.s2 || [];
  const food = localState.food || {x:7,y:7};
  const scores = localState.scores || {};

  const grid = Array.from({length:GRID}, (_,y) => Array.from({length:GRID}, (_,x) => {
    if (s1.some(s=>s.x===x&&s.y===y)) return "s1";
    if (s2.some(s=>s.x===x&&s.y===y)) return "s2";
    if (food.x===x && food.y===y) return "food";
    return "";
  }));

  return (
    <div className="game-snake">
      <div className="game-players-bar">
        <span className="game-player-chip" style={{background:"#22c55e"}}>{playerNames[players[0]]}: {scores[players[0]]||0}</span>
        <span className="game-vs">🐍 First to 10</span>
        <span className="game-player-chip" style={{background:"#6366f1"}}>{playerNames[players[1]]}: {scores[players[1]]||0}</span>
      </div>
      <div className="snake-grid">
        {grid.map((row, y) => row.map((cell, x) => (
          <div key={`${x}-${y}`} className={`snake-cell ${cell}`} />
        )))}
      </div>
      <div className="snake-controls-hint">Arrow keys / WASD to move</div>
      {gameState.status === "finished" && (
        <div className="game-status-text">
          {gameState.winner === myUid ? "🎉 You win!" : gameState.winner === "draw" ? "🤝 Draw!" : "😢 You lose!"}
        </div>
      )}
    </div>
  );
}
