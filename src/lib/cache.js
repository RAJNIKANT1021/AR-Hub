/**
 * cache.js — Thin localStorage/sessionStorage helpers.
 *
 * localStorage  → survives page close; used for chats list, me, allUsers
 * sessionStorage → cleared on tab close; used for per-chat messages
 *
 * All values are JSON-serialized. Errors are silently swallowed so a
 * full/corrupt storage never breaks the app.
 */

const PREFIX = "arhub_";

function lsGet(key) {
  try { return JSON.parse(localStorage.getItem(PREFIX + key)); } catch { return null; }
}
function lsSet(key, value) {
  try { localStorage.setItem(PREFIX + key, JSON.stringify(value)); } catch {}
}

function ssGet(key) {
  try { return JSON.parse(sessionStorage.getItem(PREFIX + key)); } catch { return null; }
}
function ssSet(key, value) {
  try { sessionStorage.setItem(PREFIX + key, JSON.stringify(value)); } catch {}
}

// ── Me (user profile) ──────────────────────────────────────────
export function cacheMe(uid, data)   { lsSet(`me_${uid}`, data); }
export function getCachedMe(uid)     { return lsGet(`me_${uid}`); }

// ── Chats list ─────────────────────────────────────────────────
export function cacheChats(uid, data)  { lsSet(`chats_${uid}`, data); }
export function getCachedChats(uid)    { return lsGet(`chats_${uid}`) || []; }

// ── All users ──────────────────────────────────────────────────
export function cacheAllUsers(data)  { lsSet("allUsers", data); }
export function getCachedAllUsers()  { return lsGet("allUsers") || []; }

// ── Per-chat messages (sessionStorage — clears on tab close) ───
export function cacheMsgs(cid, msgs) { ssSet(`msgs_${cid}`, msgs); }
export function getCachedMsgs(cid)   { return ssGet(`msgs_${cid}`) || null; }

// ── Stable JSON compare: returns true if the new value differs ─
// Converts Firestore Timestamps (which serialize to {seconds,nanoseconds})
// and skips re-renders when only metadata changed.
export function hasChanged(prev, next) {
  try {
    return JSON.stringify(prev) !== JSON.stringify(next);
  } catch {
    return true;
  }
}
