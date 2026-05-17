/**
 * games.js — Firestore-backed multiplayer game engine.
 *
 * Schema:
 *   games/{gameId}
 *     gameType: string
 *     players: [uid1, uid2]
 *     playerNames: { uid: name }
 *     state: {}          ← game-specific JSON, updated by moves
 *     turn: uid          ← whose turn
 *     status: "waiting" | "playing" | "finished"
 *     winner: uid | "draw" | null
 *     scores: { uid: number }
 *     createdAt, updatedAt
 *
 *   gameLogs/{uid}/items/{logId}
 *     gameType, opponentId, opponentName, result, createdAt
 */

import {
  doc, collection, setDoc, updateDoc, onSnapshot,
  addDoc, serverTimestamp, query, orderBy, limit,
} from "firebase/firestore";
import { db } from "../userauth/FireAuth";

export const gameId = (uid1, uid2, type) =>
  [...[uid1, uid2].sort(), type].join("__game__");

const gameRef = (gid) => doc(db, "games", gid);
const logRef  = (uid) => collection(db, "gameLogs", uid, "items");

// ── Create or reset a game session ───────────────────────────────
export async function createGame(uid1, name1, uid2, name2, gameType, initialState) {
  const gid = gameId(uid1, uid2, gameType);
  await setDoc(gameRef(gid), {
    gameType,
    players: [uid1, uid2],
    playerNames: { [uid1]: name1, [uid2]: name2 },
    state: initialState,
    turn: uid1,
    status: "playing",
    winner: null,
    scores: { [uid1]: 0, [uid2]: 0 },
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
  return gid;
}

// ── Make a move (update game state) ──────────────────────────────
export async function makeMove(gid, newState, nextTurn, status = "playing", winner = null) {
  const updates = {
    state: newState,
    turn: nextTurn,
    status,
    winner,
    updatedAt: serverTimestamp(),
  };
  await updateDoc(gameRef(gid), updates);
}

// ── Finish game and log result for both players ───────────────────
export async function finishGame(gid, winnerId, players, playerNames, gameType, scores) {
  await updateDoc(gameRef(gid), {
    status: "finished",
    winner: winnerId,
    scores,
    updatedAt: serverTimestamp(),
  });
  // Write log for each player
  for (const uid of players) {
    const opponentId = players.find(p => p !== uid);
    const result = winnerId === "draw" ? "draw" : winnerId === uid ? "win" : "loss";
    await addDoc(logRef(uid), {
      gameType,
      opponentId,
      opponentName: playerNames[opponentId] || "Unknown",
      result,
      createdAt: serverTimestamp(),
    }).catch(() => {});
  }
}

// ── Subscribe to a live game ──────────────────────────────────────
export function subscribeGame(gid, cb) {
  return onSnapshot(gameRef(gid), snap => {
    cb(snap.exists() ? { id: snap.id, ...snap.data() } : null);
  });
}

// ── Subscribe to game logs for a user ────────────────────────────
export function subscribeGameLogs(uid, cb) {
  if (!uid) return () => {};
  return onSnapshot(
    query(logRef(uid), orderBy("createdAt", "desc"), limit(50)),
    snap => cb(snap.docs.map(d => ({ id: d.id, ...d.data() }))),
  );
}
