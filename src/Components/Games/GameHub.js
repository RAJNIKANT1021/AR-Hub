/**
 * GameHub — game selection lobby + session manager for in-call games.
 *
 * Usage: <GameHub myUid={uid} myName={name} partner={partnerUid} partnerName={partnerName} onClose={fn} />
 */
import React, { useState, useEffect, useCallback } from "react";
import { createGame, makeMove, finishGame, subscribeGame, subscribeGameLogs, gameId } from "../../lib/games";
import TicTacToe, { getInitialState as tttInit }          from "./TicTacToe";
import Connect4,   { getInitialState as c4Init }           from "./Connect4";
import GuessNumber,{ getInitialState as gnInit }           from "./GuessNumber";
import RockPaperScissors, { getInitialState as rpsInit }   from "./RockPaperScissors";
import MemoryFlip, { getInitialState as memInit }          from "./MemoryFlip";
import SpeedMath,  { getInitialState as mathInit }         from "./SpeedMath";
import WordGuess,  { getInitialState as wordInit }         from "./WordGuess";
import ReflexTimer,{ getInitialState as reflexInit }       from "./ReflexTimer";
import TypingDuel, { getInitialState as typeInit }         from "./TypingDuel";
import SnakeBattle,{ getInitialState as snakeInit }        from "./SnakeBattle";
import WhackAMole, { getInitialState as whackInit }        from "./WhackAMole";
import "./games.css";

const GAME_LIST = [
  { key: "tictactoe",   label: "Tic Tac Toe",       emoji: "⭕",  init: tttInit,   Component: TicTacToe,        desc: "Classic 3×3 strategy" },
  { key: "connect4",    label: "Connect 4",          emoji: "🔴",  init: c4Init,    Component: Connect4,         desc: "Drop discs, connect 4" },
  { key: "rps",         label: "Rock Paper Scissors",emoji: "✊",  init: rpsInit,   Component: RockPaperScissors, desc: "5-round battle" },
  { key: "memory",      label: "Memory Flip",        emoji: "🃏",  init: memInit,   Component: MemoryFlip,       desc: "Match emoji pairs" },
  { key: "guessnum",    label: "Guess The Number",   emoji: "🔢",  init: gnInit,    Component: GuessNumber,      desc: "1-100 number guessing" },
  { key: "speedmath",   label: "Speed Math Duel",    emoji: "➗",  init: mathInit,  Component: SpeedMath,        desc: "10 math questions race" },
  { key: "wordguess",   label: "Word Guess",         emoji: "📝",  init: wordInit,  Component: WordGuess,        desc: "Wordle-style word game" },
  { key: "reflex",      label: "Reflex Timer",       emoji: "⚡",  init: reflexInit,Component: ReflexTimer,      desc: "Fastest tap wins" },
  { key: "typing",      label: "Typing Speed Duel",  emoji: "⌨️",  init: typeInit,  Component: TypingDuel,       desc: "Race to type a sentence" },
  { key: "snake",       label: "Snake Battle",       emoji: "🐍",  init: snakeInit, Component: SnakeBattle,      desc: "First to 10 apples" },
  { key: "whack",       label: "Whack A Mole",       emoji: "🔨",  init: whackInit, Component: WhackAMole,       desc: "30-second mole sprint" },
];

function resultIcon(r) {
  if (r === "win") return "🏆";
  if (r === "loss") return "💀";
  return "🤝";
}

function LogsPanel({ uid, onClose }) {
  const [logs, setLogs] = useState([]);
  useEffect(() => subscribeGameLogs(uid, setLogs), [uid]);
  const wins   = logs.filter(l => l.result === "win").length;
  const losses = logs.filter(l => l.result === "loss").length;
  const draws  = logs.filter(l => l.result === "draw").length;
  return (
    <div className="gh-logs-panel">
      <div className="gh-logs-header">
        <span>Game History</span>
        <button className="gh-close-btn" onClick={onClose}>✕</button>
      </div>
      <div className="gh-stats-row">
        <div className="gh-stat win">🏆 {wins}</div>
        <div className="gh-stat loss">💀 {losses}</div>
        <div className="gh-stat draw">🤝 {draws}</div>
      </div>
      <div className="gh-log-list">
        {logs.length === 0 && <div className="gh-log-empty">No games played yet</div>}
        {logs.map(l => {
          const g = GAME_LIST.find(g => g.key === l.gameType);
          return (
            <div key={l.id} className={`gh-log-item ${l.result}`}>
              <span className="gh-log-emoji">{g?.emoji || "🎮"}</span>
              <div className="gh-log-info">
                <span className="gh-log-game">{g?.label || l.gameType}</span>
                <span className="gh-log-opp">vs {l.opponentName}</span>
              </div>
              <span className="gh-log-result">{resultIcon(l.result)}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default function GameHub({ myUid, myName, partnerUid, partnerName, onClose }) {
  const [screen, setScreen] = useState("lobby"); // lobby | playing | logs
  const [activeGame, setActiveGame] = useState(null); // { key, gid }
  const [gameDoc, setGameDoc]       = useState(null);
  const [finishing, setFinishing]   = useState(false);

  // Subscribe to active game
  useEffect(() => {
    if (!activeGame) return;
    return subscribeGame(activeGame.gid, doc => setGameDoc(doc));
  }, [activeGame]);

  const launchGame = useCallback(async (gameKey) => {
    const g = GAME_LIST.find(x => x.key === gameKey);
    if (!g) return;
    const initialState = g.init();
    const gid = await createGame(myUid, myName, partnerUid, partnerName, gameKey, initialState);
    setActiveGame({ key: gameKey, gid });
    setGameDoc(null);
    setScreen("playing");
  }, [myUid, myName, partnerUid, partnerName]);

  const handleMove = useCallback(async (newState, nextTurn, status, winner) => {
    if (!activeGame) return;
    await makeMove(activeGame.gid, newState, nextTurn, status, winner);
    if (status === "finished" && !finishing) {
      setFinishing(true);
      const g = GAME_LIST.find(x => x.key === activeGame.key);
      const players = [myUid, partnerUid];
      const playerNames = { [myUid]: myName, [partnerUid]: partnerName };
      const scores = newState.scores || {};
      await finishGame(activeGame.gid, winner, players, playerNames, activeGame.key, scores);
      setFinishing(false);
    }
  }, [activeGame, finishing, myUid, myName, partnerUid, partnerName]);

  const rematch = useCallback(() => {
    if (!activeGame) return;
    launchGame(activeGame.key);
  }, [activeGame, launchGame]);

  const backToLobby = () => { setScreen("lobby"); setActiveGame(null); setGameDoc(null); };

  // ── Lobby ───────────────────────────────────────────────────
  if (screen === "lobby") {
    return (
      <div className="gh-root">
        <div className="gh-header">
          <span className="gh-title">🎮 Games</span>
          <div className="gh-header-actions">
            <button className="gh-icon-btn" onClick={() => setScreen("logs")} title="History">📊</button>
            <button className="gh-close-btn" onClick={onClose}>✕</button>
          </div>
        </div>
        <div className="gh-game-grid">
          {GAME_LIST.map(g => (
            <button key={g.key} className="gh-game-card" onClick={() => launchGame(g.key)}>
              <span className="gh-game-emoji">{g.emoji}</span>
              <span className="gh-game-label">{g.label}</span>
              <span className="gh-game-desc">{g.desc}</span>
            </button>
          ))}
        </div>
      </div>
    );
  }

  // ── Logs ────────────────────────────────────────────────────
  if (screen === "logs") {
    return (
      <div className="gh-root">
        <LogsPanel uid={myUid} onClose={() => setScreen("lobby")} />
      </div>
    );
  }

  // ── Playing ─────────────────────────────────────────────────
  if (screen === "playing" && activeGame) {
    const g = GAME_LIST.find(x => x.key === activeGame.key);
    const GameComp = g?.Component;
    const isFinished = gameDoc?.status === "finished";
    const isMyTurn = gameDoc?.turn === myUid;
    const winner = gameDoc?.winner;

    return (
      <div className="gh-root playing">
        <div className="gh-header">
          <button className="gh-icon-btn" onClick={backToLobby}>← Games</button>
          <span className="gh-title">{g?.emoji} {g?.label}</span>
          <button className="gh-close-btn" onClick={onClose}>✕</button>
        </div>

        <div className="gh-game-area">
          {!gameDoc && (
            <div className="gh-loading">
              <div className="gh-spinner" />
              <span>Loading game…</span>
            </div>
          )}

          {gameDoc && GameComp && (
            <GameComp
              gameState={gameDoc}
              myUid={myUid}
              onMove={handleMove}
              isMyTurn={isMyTurn}
            />
          )}
        </div>

        {isFinished && (
          <div className="gh-result-bar">
            <span className="gh-result-text">
              {winner === myUid ? "🎉 You Win!" : winner === "draw" ? "🤝 Draw!" : "😢 You Lose!"}
            </span>
            <button className="gh-rematch-btn" onClick={rematch}>🔄 Rematch</button>
            <button className="gh-lobby-btn" onClick={backToLobby}>🎮 Lobby</button>
          </div>
        )}
      </div>
    );
  }

  return null;
}
