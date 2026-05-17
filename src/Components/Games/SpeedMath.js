import React, { useState, useEffect, useRef } from "react";

function makeQ() {
  const ops = ["+", "-", "×"];
  const op = ops[Math.floor(Math.random() * ops.length)];
  let a, b, answer;
  if (op === "+") { a = Math.floor(Math.random()*50)+1; b = Math.floor(Math.random()*50)+1; answer = a+b; }
  else if (op === "-") { a = Math.floor(Math.random()*50)+20; b = Math.floor(Math.random()*20)+1; answer = a-b; }
  else { a = Math.floor(Math.random()*12)+1; b = Math.floor(Math.random()*12)+1; answer = a*b; }
  return { a, b, op, answer };
}

export function getInitialState() {
  return { questions: Array.from({length:10}, makeQ), answers: {}, phase: "playing", timeLeft: 60 };
}

export default function SpeedMath({ gameState, myUid, onMove, isMyTurn }) {
  const { state, players, playerNames } = gameState;
  const [input, setInput] = useState("");
  const [qIdx, setQIdx] = useState(0);
  const [myScore, setMyScore] = useState(0);
  const [done, setDone] = useState(false);
  const [timeLeft, setTimeLeft] = useState(60);
  const timerRef = useRef(null);
  const opponentId = players.find(p => p !== myUid);
  const answers = state.answers || {};
  const questions = state.questions || [];
  // eslint-disable-next-line no-unused-vars
  const myAnswers = answers[myUid] || 0;
  const oppAnswers = answers[opponentId] || 0;

  useEffect(() => {
    if (done || gameState.status === "finished") return;
    timerRef.current = setInterval(() => setTimeLeft(t => {
      if (t <= 1) { handleDone(myScore); clearInterval(timerRef.current); return 0; }
      return t - 1;
    }), 1000);
    return () => clearInterval(timerRef.current);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [done, gameState.status]);

  const handleDone = (score) => {
    if (done) return;
    setDone(true);
    clearInterval(timerRef.current);
    const newAnswers = { ...answers, [myUid]: score };
    const bothDone = newAnswers[opponentId] !== undefined;
    const winner = bothDone
      ? (newAnswers[myUid] > newAnswers[opponentId] ? myUid
        : newAnswers[opponentId] > newAnswers[myUid] ? opponentId : "draw")
      : null;
    onMove({ ...state, answers: newAnswers }, opponentId,
      bothDone ? "finished" : "playing", winner);
  };

  const submit = () => {
    if (done || qIdx >= questions.length) return;
    const q = questions[qIdx];
    const val = parseInt(input);
    const correct = val === q.answer;
    const newScore = correct ? myScore + 1 : myScore;
    setMyScore(newScore);
    setInput("");
    if (qIdx + 1 >= questions.length) { handleDone(newScore); }
    else setQIdx(qIdx + 1);
  };

  const q = questions[qIdx];

  return (
    <div className="game-speedmath">
      <div className="game-players-bar">
        <span className="game-player-chip mine">{playerNames[myUid]}: {myScore}/10</span>
        <span className="game-vs">{timeLeft}s</span>
        <span className="game-player-chip opp">
          {playerNames[opponentId]}: {oppAnswers !== undefined && done ? `${oppAnswers}/10` : "?"}
        </span>
      </div>

      {!done && gameState.status !== "finished" && q && (
        <div className="math-question-area">
          <div className="math-progress">{qIdx+1} / {questions.length}</div>
          <div className="math-question">{q.a} {q.op} {q.b} = ?</div>
          <div className="math-input-row">
            <input className="math-input" type="number" value={input}
              autoFocus
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => e.key === "Enter" && submit()} />
            <button className="math-submit-btn" onClick={submit}>✓</button>
          </div>
        </div>
      )}

      {done && gameState.status !== "finished" && (
        <div className="math-waiting">
          <div className="guess-spinner" />
          <p>You got {myScore}/10! Waiting for {playerNames[opponentId]}…</p>
        </div>
      )}

      {gameState.status === "finished" && (
        <div className="game-status-text">
          {gameState.winner === myUid ? `🎉 You win! ${answers[myUid]} vs ${answers[opponentId]}` :
           gameState.winner === "draw" ? `🤝 Draw! Both got ${answers[myUid]}` :
           `😢 You lose! ${answers[myUid]} vs ${answers[opponentId]}`}
        </div>
      )}
    </div>
  );
}
