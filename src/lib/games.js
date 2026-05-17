/**
 * games.js — Firestore-backed multiplayer game engine.
 *
 * Flow:
 *   1. Player A calls inviteGame → creates doc with status="pending"
 *   2. Player B sees pending invite via subscribePendingInvite
 *   3. Player B calls acceptInvite → status="playing"
 *   4. Both subscribe via subscribeGame; either calls makeMove
 *   5. When status="finished", finishGame writes logs for both
 *
 * Schema:
 *   games/{gameId}
 *     gameType: string
 *     players: [hostUid, guestUid]            host = inviter, guest = invited
 *     playerNames: { uid: name }
 *     state: {}                               game-specific JSON
 *     turn: uid                               whose turn (host by default)
 *     status: "pending" | "playing" | "finished" | "declined"
 *     winner: uid | "draw" | null
 *     scores: { uid: number }
 *     hostUid, guestUid                       flat fields for queries
 *     createdAt, updatedAt
 *
 *   gameLogs/{uid}/items/{logId}
 *     gameType, opponentId, opponentName, result, createdAt
 */

import {
  doc, collection, setDoc, updateDoc, deleteDoc, onSnapshot,
  addDoc, serverTimestamp, query, where, orderBy, limit,
} from "firebase/firestore";
import { db } from "../userauth/FireAuth";

export const gameId = (uid1, uid2, type) =>
  [...[uid1, uid2].sort(), type, Date.now()].join("__game__");

const gameRef = (gid) => doc(db, "games", gid);
const logRef  = (uid) => collection(db, "gameLogs", uid, "items");

// ── Invite a player ───────────────────────────────────────────────
// Host (inviter) is players[0] and starts first by default.
export async function inviteGame(hostUid, hostName, guestUid, guestName, gameType, initialState) {
  const gid = gameId(hostUid, guestUid, gameType);
  await setDoc(gameRef(gid), {
    gameType,
    players: [hostUid, guestUid],
    playerNames: { [hostUid]: hostName, [guestUid]: guestName },
    hostUid,
    guestUid,
    state: initialState,
    turn: hostUid,
    status: "pending",
    winner: null,
    scores: { [hostUid]: 0, [guestUid]: 0 },
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
  return gid;
}

// ── Guest accepts the invite ──────────────────────────────────────
export async function acceptInvite(gid) {
  await updateDoc(gameRef(gid), {
    status: "playing",
    updatedAt: serverTimestamp(),
  });
}

// ── Guest declines or host cancels ────────────────────────────────
export async function cancelGame(gid) {
  try { await deleteDoc(gameRef(gid)); } catch {}
}

// ── Make a move (update game state) ──────────────────────────────
export async function makeMove(gid, newState, nextTurn, status = "playing", winner = null) {
  await updateDoc(gameRef(gid), {
    state: newState,
    turn: nextTurn,
    status,
    winner,
    updatedAt: serverTimestamp(),
  });
}

// ── Finish game and log result for both players ───────────────────
export async function finishGame(gid, winnerId, players, playerNames, gameType, scores) {
  await updateDoc(gameRef(gid), {
    status: "finished",
    winner: winnerId,
    scores: scores || {},
    updatedAt: serverTimestamp(),
  }).catch(() => {});
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

// ── Subscribe to a single live game ───────────────────────────────
export function subscribeGame(gid, cb) {
  if (!gid) return () => {};
  return onSnapshot(gameRef(gid), snap => {
    cb(snap.exists() ? { id: snap.id, ...snap.data() } : null);
  });
}

// ── Subscribe to pending invites *for me* from a given partner ────
// Returns invites where guestUid == myUid AND hostUid == partnerUid AND status == "pending"
export function subscribePendingInvite(myUid, partnerUid, cb) {
  if (!myUid || !partnerUid) return () => {};
  const q = query(
    collection(db, "games"),
    where("guestUid", "==", myUid),
    where("hostUid", "==", partnerUid),
    where("status", "==", "pending"),
  );
  return onSnapshot(q, snap => {
    if (snap.empty) { cb(null); return; }
    const d = snap.docs[0];
    cb({ id: d.id, ...d.data() });
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
