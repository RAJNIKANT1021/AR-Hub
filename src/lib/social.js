/**
 * social.js — Explore: feed posts, forum threads, anonymous confessions, code arena.
 *
 *   posts/{pid}                    { uid, name, avatar, text, image, tags[], likes[], commentCount, createdAt }
 *   posts/{pid}/comments/{id}      { uid, name, avatar, text, createdAt }
 *   threads/{tid}                  { community, title, body, uid, name, up[], down[], score, commentCount, createdAt }
 *   threads/{tid}/comments/{id}    { uid, name, avatar, text, createdAt }
 *   confessions/{id}               { text, mood, reactions{uid: emoji}, commentCount, createdAt }   ← no author field
 *   confessionOwners/{id}          { uid }  readable only by the author (lets them delete it)
 *   confessions/{id}/comments/{c}  { text, createdAt, alias }                                       ← anonymous replies
 *   codeSolves/{uid}               { name, avatar, count, solved{pid: {at, ms}} }
 */
import {
  collection, doc, addDoc, updateDoc, deleteDoc, getDoc, onSnapshot, query, orderBy, limit, where,
  serverTimestamp, arrayUnion, arrayRemove, increment, writeBatch, runTransaction, deleteField,
} from "firebase/firestore";
import { db } from "../userauth/FireAuth";

const EST = { serverTimestamps: "estimate" };
const withId = (d) => ({ id: d.id, ...d.data(EST) });
const tagsOf = (text) => Array.from(new Set((text.match(/#[\p{L}\p{N}_]{2,30}/gu) || []).map(t => t.slice(1).toLowerCase()))).slice(0, 10);

// ── Feed posts ─────────────────────────────────────────────────
export function subscribePosts(cb, { tag, uid, count = 60 } = {}) {
  let q = query(collection(db, "posts"), orderBy("createdAt", "desc"), limit(count));
  if (tag) q = query(collection(db, "posts"), where("tags", "array-contains", tag), limit(count));
  if (uid) q = query(collection(db, "posts"), where("uid", "==", uid), limit(count));
  return onSnapshot(q, s => {
    const list = s.docs.map(withId);
    if (tag || uid) list.sort((a, b) => (b.createdAt?.toMillis?.() || 0) - (a.createdAt?.toMillis?.() || 0));
    cb(list);
  }, () => cb([]));
}

export const createPost = (me, { text, image }) => addDoc(collection(db, "posts"), {
  uid: me.uid, name: me.name || "", avatar: me.avatar || null,
  text: text.trim(), image: image || null, tags: tagsOf(text),
  likes: [], commentCount: 0, createdAt: serverTimestamp(),
});

export const toggleLike = (pid, uid, liked) => updateDoc(doc(db, "posts", pid), { likes: liked ? arrayRemove(uid) : arrayUnion(uid) });
export const deletePost = (pid) => deleteDoc(doc(db, "posts", pid));

// ── Generic comments (posts, threads, confessions) ─────────────
export function subscribeComments(parent, id, cb) {
  const q = query(collection(db, parent, id, "comments"), orderBy("createdAt", "asc"), limit(200));
  return onSnapshot(q, s => cb(s.docs.map(withId)), () => cb([]));
}

export async function addComment(parent, id, data) {
  const batch = writeBatch(db);
  batch.set(doc(collection(db, parent, id, "comments")), { ...data, createdAt: serverTimestamp() });
  batch.update(doc(db, parent, id), { commentCount: increment(1) });
  await batch.commit();
}

export async function deleteComment(parent, id, cid) {
  const batch = writeBatch(db);
  batch.delete(doc(db, parent, id, "comments", cid));
  batch.update(doc(db, parent, id), { commentCount: increment(-1) });
  await batch.commit();
}

// ── Forums ─────────────────────────────────────────────────────
export const COMMUNITIES = [
  { key: "general", name: "General", emoji: "💬", desc: "Anything and everything" },
  { key: "dev", name: "Developers", emoji: "💻", desc: "Code, careers and tech talk" },
  { key: "gaming", name: "Gaming", emoji: "🎮", desc: "Games, clips and squads" },
  { key: "memes", name: "Memes", emoji: "😂", desc: "Only the finest" },
  { key: "music", name: "Music", emoji: "🎵", desc: "Share what you're listening to" },
  { key: "movies", name: "Movies & TV", emoji: "🎬", desc: "Reviews and recommendations" },
  { key: "sports", name: "Sports", emoji: "⚽", desc: "Scores, takes and banter" },
  { key: "askhub", name: "AskHub", emoji: "❓", desc: "Ask the community anything" },
];

export function subscribeThreads(cb, { community, count = 80 } = {}) {
  const q = community
    ? query(collection(db, "threads"), where("community", "==", community), limit(count))
    : query(collection(db, "threads"), orderBy("createdAt", "desc"), limit(count));
  return onSnapshot(q, s => cb(s.docs.map(withId)), () => cb([]));
}

export const subscribeThread = (tid, cb) => onSnapshot(doc(db, "threads", tid), s => cb(s.exists() ? withId(s) : null), () => cb(null));

export const createThread = (me, { community, title, body }) => addDoc(collection(db, "threads"), {
  community, title: title.trim(), body: body.trim(),
  uid: me.uid, name: me.name || "", avatar: me.avatar || null,
  up: [me.uid], down: [], score: 1, commentCount: 0, createdAt: serverTimestamp(),
});

export async function voteThread(tid, uid, dir) {
  const ref = doc(db, "threads", tid);
  await runTransaction(db, async (tx) => {
    const s = await tx.get(ref);
    if (!s.exists()) return;
    let up = (s.data().up || []).filter(u => u !== uid);
    let down = (s.data().down || []).filter(u => u !== uid);
    const wasUp = (s.data().up || []).includes(uid), wasDown = (s.data().down || []).includes(uid);
    if (dir === 1 && !wasUp) up = [...up, uid];
    if (dir === -1 && !wasDown) down = [...down, uid];
    tx.update(ref, { up, down, score: up.length - down.length });
  });
}

export const deleteThread = (tid) => deleteDoc(doc(db, "threads", tid));

// ── Anonymous confessions ──────────────────────────────────────
export const MOODS = [
  { key: "confess", label: "Confession", emoji: "🤫" },
  { key: "vent", label: "Vent", emoji: "😤" },
  { key: "crush", label: "Crush", emoji: "💘" },
  { key: "hottake", label: "Hot take", emoji: "🌶️" },
  { key: "win", label: "Small win", emoji: "🏆" },
  { key: "advice", label: "Need advice", emoji: "🆘" },
];

export function subscribeConfessions(cb, count = 80) {
  const q = query(collection(db, "confessions"), orderBy("createdAt", "desc"), limit(count));
  return onSnapshot(q, s => cb(s.docs.map(withId)), () => cb([]));
}

export async function createConfession(uid, { text, mood }) {
  const ref = doc(collection(db, "confessions"));
  const batch = writeBatch(db);
  batch.set(ref, { text: text.trim(), mood, reactions: {}, commentCount: 0, createdAt: serverTimestamp() });
  batch.set(doc(db, "confessionOwners", ref.id), { uid });
  await batch.commit();
}

export async function isMyConfession(id, uid) {
  const s = await getDoc(doc(db, "confessionOwners", id)).catch(() => null);
  return !!s?.exists() && s.data().uid === uid;
}

export async function deleteConfession(id) {
  const batch = writeBatch(db);
  batch.delete(doc(db, "confessions", id));
  batch.delete(doc(db, "confessionOwners", id));
  await batch.commit();
}

export const reactConfession = (id, uid, emoji) =>
  updateDoc(doc(db, "confessions", id), { [`reactions.${uid}`]: emoji || deleteField() });

// A random per-device secret (never uploaded) seeds anonymous aliases, so an
// alias can't be linked back to a public user id.
function anonSecret() {
  try {
    let v = localStorage.getItem("arhub_anon_secret");
    if (!v) { v = Math.random().toString(36).slice(2) + Date.now().toString(36); localStorage.setItem("arhub_anon_secret", v); }
    return v;
  } catch { return "session"; }
}

/** Stable per-thread pseudonym so anonymous replies are distinguishable but not identifiable. */
export function aliasFor(threadId) {
  const animals = ["Otter", "Panda", "Falcon", "Koala", "Tiger", "Fox", "Owl", "Dolphin", "Wolf", "Lynx", "Raven", "Gecko"];
  const colors = ["Crimson", "Azure", "Jade", "Amber", "Violet", "Silver", "Coral", "Indigo", "Golden", "Mint"];
  let h = 0;
  const s = anonSecret() + ":" + threadId;
  for (let i = 0; i < s.length; i++) h = (h * 33 + s.charCodeAt(i)) >>> 0;
  return `${colors[h % colors.length]} ${animals[(h >> 4) % animals.length]}`;
}

const MY_ANON = "arhub_my_anon_comments";
export const isMyAnonComment = (cid) => { try { return (JSON.parse(localStorage.getItem(MY_ANON)) || []).includes(cid); } catch { return false; } };

/** Anonymous reply: no uid on the comment; ownership kept in a private doc. */
export async function addAnonComment(confessionId, uid, text) {
  const ref = doc(collection(db, "confessions", confessionId, "comments"));
  const batch = writeBatch(db);
  batch.set(ref, { text, alias: aliasFor(confessionId), createdAt: serverTimestamp() });
  batch.set(doc(db, "confessionOwners", `c_${ref.id}`), { uid });
  batch.update(doc(db, "confessions", confessionId), { commentCount: increment(1) });
  await batch.commit();
  try { const l = JSON.parse(localStorage.getItem(MY_ANON)) || []; localStorage.setItem(MY_ANON, JSON.stringify([...l, ref.id].slice(-500))); } catch {}
}

export async function deleteAnonComment(confessionId, cid) {
  const batch = writeBatch(db);
  batch.delete(doc(db, "confessions", confessionId, "comments", cid));
  batch.delete(doc(db, "confessionOwners", `c_${cid}`));
  batch.update(doc(db, "confessions", confessionId), { commentCount: increment(-1) });
  await batch.commit();
}

// ── Code arena ─────────────────────────────────────────────────
export function subscribeLeaderboard(cb) {
  const q = query(collection(db, "codeSolves"), orderBy("count", "desc"), limit(20));
  return onSnapshot(q, s => cb(s.docs.map(withId)), () => cb([]));
}

export const subscribeMySolves = (uid, cb) => onSnapshot(doc(db, "codeSolves", uid), s => cb(s.exists() ? s.data() : { solved: {} }), () => cb({ solved: {} }));

export async function recordSolve(me, pid, ms) {
  const ref = doc(db, "codeSolves", me.uid);
  await runTransaction(db, async (tx) => {
    const s = await tx.get(ref);
    const solved = s.exists() ? (s.data().solved || {}) : {};
    const prev = solved[pid];
    const best = prev ? Math.min(prev.ms, ms) : ms;
    solved[pid] = { at: Date.now(), ms: best };
    tx.set(ref, { name: me.name || "", avatar: me.avatar || null, solved, count: Object.keys(solved).length }, { merge: true });
  });
}
