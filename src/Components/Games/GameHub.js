/**
 * GameHub — game lobby + session manager for in-call games.
 *
 * Flow:
 *   - Host clicks a game → inviteGame (status="pending") → screen=waiting
 *   - Guest sees PendingInviteCard → accept → status="playing" → both play
 *   - Either can fullscreen the panel via the ⤢ button
 *   - When status="finished", finishGame writes logs for both players
 */
import React, { useState, useEffect, useCallback, useRef } from "react";
import {
  inviteGame, acceptInvite, cancelGame, makeMove, finishGame,
  subscribeGame, subscribeGameLogs, subscribePendingInvite,
} from "../../lib/games";
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
  { key: "tictactoe",   label: "Tic Tac Toe",        emoji: "⭕",  init: tttInit,   Component: TicTacToe,        desc: "Classic 3×3 strategy" },
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

const gameMeta = (key) => GAME_LIST.find(g => g.key === key);
const resultIcon = (r) => r === "win" ? "🏆" : r === "loss" ? "💀" : "🤝";

// ── Logs panel (game history) ───────────────────────────────────
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
          const g = gameMeta(l.gameType);
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
  const [screen, setScreen]         = useState("lobby"); // lobby | waiting | playing | logs
  const [gid, setGid]               = useState(null);
  const [gameDoc, setGameDoc]       = useState(null);
  const [pendingInvite, setPendingInvite] = useState(null);
  const [fullscreen, setFullscreen] = useState(false);
  const finishedRef = useRef(false);

  // ── Subscribe to pending invites from partner ────────────────
  useEffect(() => {
    if (!myUid || !partnerUid) return;
    return subscribePendingInvite(myUid, partnerUid, setPendingInvite);
  }, [myUid, partnerUid]);

  // ── Subscribe to the active game doc ─────────────────────────
  useEffect(() => {
    if (!gid) { setGameDoc(null); return; }
    return subscribeGame(gid, (d) => {
      setGameDoc(d);
      if (!d) {
        // Doc was deleted (cancelled by partner) — return to lobby
        setScreen("lobby");
        setGid(null);
        return;
      }
      if (d.status === "playing") setScreen("playing");
    });
  }, [gid]);

  // ── Host: invite a game ──────────────────────────────────────
  const launchGame = useCallback(async (gameKey) => {
    const g = gameMeta(gameKey);
    if (!g || !partnerUid) return;
    finishedRef.current = false;
    const initialState = g.init();
    const newGid = await inviteGame(myUid, myName, partnerUid, partnerName, gameKey, initialState);
    setGid(newGid);
    setScreen("waiting");
  }, [myUid, myName, partnerUid, partnerName]);

  // ── Guest: accept invite ─────────────────────────────────────
  const acceptIncoming = useCallback(async () => {
    if (!pendingInvite) return;
    finishedRef.current = false;
    setGid(pendingInvite.id);
    await acceptInvite(pendingInvite.id);
    setScreen("playing");
    setPendingInvite(null);
  }, [pendingInvite]);

  // ── Guest: decline invite ────────────────────────────────────
  const declineIncoming = useCallback(async () => {
    if (!pendingInvite) return;
    await cancelGame(pendingInvite.id);
    setPendingInvite(null);
  }, [pendingInvite]);

  // ── Host: cancel waiting invite ──────────────────────────────
  const cancelWaiting = useCallback(async () => {
    if (gid) await cancelGame(gid);
    setGid(null);
    setScreen("lobby");
  }, [gid]);

  // ── Either side: make a move ─────────────────────────────────
  const handleMove = useCallback(async (newState, nextTurn, status, winner) => {
    if (!gid || !gameDoc) return;
    await makeMove(gid, newState, nextTurn, status, winner);
    if (status === "finished" && !finishedRef.current) {
      finishedRef.current = true;
      const players = gameDoc.players || [myUid, partnerUid];
      const playerNames = gameDoc.playerNames || { [myUid]: myName, [partnerUid]: partnerName };
      const scores = newState.scores || gameDoc.scores || {};
      await finishGame(gid, winner, players, playerNames, gameDoc.gameType, scores);
    }
  }, [gid, gameDoc, myUid, myName, partnerUid, partnerName]);

  // ── Rematch ──────────────────────────────────────────────────
  const rematch = useCallback(() => {
    if (!gameDoc) return;
    const key = gameDoc.gameType;
    setGid(null);
    setGameDoc(null);
    finishedRef.current = false;
    launchGame(key);
  }, [gameDoc, launchGame]);

  // ── Back to lobby ────────────────────────────────────────────
  const backToLobby = () => { setScreen("lobby"); setGid(null); setGameDoc(null); };

  // ── Wrap with fullscreen container ───────────────────────────
  const rootClass = `gh-root${fullscreen ? " fullscreen" : ""}`;

  // ── Pending invite from partner takes priority ───────────────
  if (pendingInvite && screen === "lobby") {
    const g = gameMeta(pendingInvite.gameType);
    return (
      <div className={rootClass}>
        <div className="gh-invite-card">
          <span className="gh-invite-emoji">{g?.emoji || "🎮"}</span>
          <div className="gh-invite-title">{partnerName} invites you to play</div>
          <div className="gh-invite-game">{g?.label || pendingInvite.gameType}</div>
          <div className="gh-invite-actions">
            <button className="gh-invite-decline" onClick={declineIncoming}>Decline</button>
            <button className="gh-invite-accept" onClick={acceptIncoming}>Accept ▶</button>
          </div>
        </div>
      </div>
    );
  }

  // ── Lobby ────────────────────────────────────────────────────
  if (screen === "lobby") {
    return (
      <div className={rootClass}>
        <div className="gh-header">
          <span className="gh-title">🎮 Games</span>
          <div className="gh-header-actions">
            <button className="gh-icon-btn" onClick={() => setFullscreen(v => !v)} title="Toggle fullscreen">{fullscreen ? "⤡" : "⤢"}</button>
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

  // ── Logs ─────────────────────────────────────────────────────
  if (screen === "logs") {
    return (
      <div className={rootClass}>
        <LogsPanel uid={myUid} onClose={() => setScreen("lobby")} />
      </div>
    );
  }

  // ── Waiting for guest to accept ──────────────────────────────
  if (screen === "waiting") {
    const g = gameDoc ? gameMeta(gameDoc.gameType) : null;
    return (
      <div className={rootClass}>
        <div className="gh-header">
          <button className="gh-icon-btn" onClick={cancelWaiting}>← Cancel</button>
          <span className="gh-title">{g?.emoji} {g?.label || "Game"}</span>
          <button className="gh-close-btn" onClick={onClose}>✕</button>
        </div>
        <div className="gh-waiting">
          <div className="gh-spinner" />
          <div className="gh-waiting-text">Waiting for {partnerName} to accept…</div>
          <button className="gh-cancel-btn" onClick={cancelWaiting}>Cancel invite</button>
        </div>
      </div>
    );
  }

  // ── Playing ──────────────────────────────────────────────────
  if (screen === "playing" && gid) {
    const g = gameDoc ? gameMeta(gameDoc.gameType) : null;
    const GameComp = g?.Component;
    const isFinished = gameDoc?.status === "finished";
    const isMyTurn = gameDoc?.turn === myUid;
    const winner = gameDoc?.winner;

    return (
      <div className={`${rootClass} playing`}>
        <div className="gh-header">
          <button className="gh-icon-btn" onClick={backToLobby}>← Games</button>
          <span className="gh-title">{g?.emoji} {g?.label}</span>
          <div className="gh-header-actions">
            <button className="gh-icon-btn" onClick={() => setFullscreen(v => !v)} title="Toggle fullscreen">{fullscreen ? "⤡" : "⤢"}</button>
            <button className="gh-close-btn" onClick={onClose}>✕</button>
          </div>
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
