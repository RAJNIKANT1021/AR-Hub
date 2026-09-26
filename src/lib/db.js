/**
 * db.js — All Firestore operations for AR Hub.
 *
 * Schema:
 *   users/{uid}                          profile, presence, friends, prefs
 *   users/{uid}/starred/{mid}            snapshot of starred messages
 *   chats/{chatId}                       DM ("dm") or room ("group") metadata
 *   chats/{chatId}/messages/{msgId}      messages
 *   notifications/{uid}/items/{nid}      per-user notification feed
 *   statuses/{sid}                       24h status stories
 */

import {
  collection, doc, getDoc, getDocs, setDoc, updateDoc, deleteDoc,
  addDoc, query, orderBy, limit, startAfter, onSnapshot,
  serverTimestamp, arrayUnion, arrayRemove, where,
  writeBatch, increment, Timestamp, runTransaction, deleteField,
} from "firebase/firestore";
import { db } from "../userauth/FireAuth";

// Pending local writes carry an estimated timestamp instead of null, so
// freshly sent messages render (and sort) immediately.
const EST = { serverTimestamps: "estimate" };
const data = (snap) => snap.data(EST);

// ── helpers ────────────────────────────────────────────────────
export const chatId = (uid1, uid2) => [uid1, uid2].sort().join("_");

const userRef  = (uid)      => doc(db, "users", uid);
const chatRef  = (cid)      => doc(db, "chats", cid);
const msgsRef  = (cid)      => collection(db, "chats", cid, "messages");
const msgRef   = (cid, mid) => doc(db, "chats", cid, "messages", mid);
const notifRef = (uid)      => collection(db, "notifications", uid, "items");
const starRef  = (uid)      => collection(db, "users", uid, "starred");

export const isGroup = (chat) => chat?.type === "group";

export function previewOf(msg) {
  if (!msg) return "";
  switch (msg.type) {
    case "poll":     return `📊 ${msg.poll?.question || "Poll"}`;
    case "image":    return msg.text ? `📷 ${msg.text.slice(0, 70)}` : "📷 Photo";
    case "voice":    return "🎤 Voice message";
    case "location": return "📍 Location";
    case "system":   return msg.text || "";
    default: {
      // Strip *bold* _italic_ ~strike~ `code` markers for plain previews
      const t = (msg.text || "").replace(/([*_~`])([^*_~`\n]+)\1/g, "$2");
      return t.length > 80 ? t.slice(0, 80) + "…" : t;
    }
  }
}

// ── USER ───────────────────────────────────────────────────────

export async function createUser(uid, { name, email }) {
  await setDoc(userRef(uid), {
    uid, name, email,
    nameLower: name.toLowerCase(),
    avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${uid}`,
    bio: "Hey there! I'm using AR Hub.",
    status: "online",
    lastSeen: serverTimestamp(),
    friends: [],
    sentRequests: [],
    friendRequests: [],
    mutedChats: [],
    pinnedChats: [],
    archivedChats: [],
    blocklist: [],
    readReceipts: true,
    notificationsEnabled: true,
    createdAt: serverTimestamp(),
  });
}

export async function getUser(uid) {
  if (!uid) return null;
  const snap = await getDoc(userRef(uid));
  return snap.exists() ? data(snap) : null;
}

export async function updateUserField(uid, updates) {
  if (!uid) return;
  if (typeof updates.name === "string") updates = { ...updates, nameLower: updates.name.toLowerCase() };
  await updateDoc(userRef(uid), updates);
}

export async function setPresence(uid, isOnline) {
  if (!uid) return;
  await updateDoc(userRef(uid), {
    status: isOnline ? "online" : "offline",
    lastSeen: serverTimestamp(),
  }).catch(() => {});
}

export function subscribeUser(uid, cb) {
  if (!uid) return () => {};
  return onSnapshot(userRef(uid), snap => cb(snap.exists() ? data(snap) : null), () => {});
}

export function subscribeAllUsers(cb) {
  return onSnapshot(collection(db, "users"), snap => cb(snap.docs.map(data)), () => {});
}

// ── FRIEND REQUESTS ────────────────────────────────────────────

export async function sendFriendRequest(fromUid, toUid, fromName) {
  const batch = writeBatch(db);
  batch.update(userRef(fromUid), { sentRequests: arrayUnion(toUid) });
  batch.update(userRef(toUid),   { friendRequests: arrayUnion(fromUid) });
  batch.set(doc(notifRef(toUid)), notifDoc({
    type: "friend_request", fromUid, senderName: fromName,
    text: `${fromName || "Someone"} sent you a friend request`,
  }));
  await batch.commit();
}

export async function cancelFriendRequest(fromUid, toUid) {
  const batch = writeBatch(db);
  batch.update(userRef(fromUid), { sentRequests: arrayRemove(toUid) });
  batch.update(userRef(toUid),   { friendRequests: arrayRemove(fromUid) });
  await batch.commit();
}

export async function acceptFriendRequest(myUid, requesterUid, myName) {
  const batch = writeBatch(db);
  batch.update(userRef(myUid),        { friends: arrayUnion(requesterUid), friendRequests: arrayRemove(requesterUid), sentRequests: arrayRemove(requesterUid) });
  batch.update(userRef(requesterUid), { friends: arrayUnion(myUid), sentRequests: arrayRemove(myUid), friendRequests: arrayRemove(myUid) });
  batch.set(doc(notifRef(requesterUid)), notifDoc({
    type: "friend_accepted", fromUid: myUid, senderName: myName,
    text: `${myName || "Someone"} accepted your friend request 🎉`,
  }));
  await batch.commit();
  await ensureChat(myUid, requesterUid);
}

export async function declineFriendRequest(myUid, requesterUid) {
  const batch = writeBatch(db);
  batch.update(userRef(myUid),        { friendRequests: arrayRemove(requesterUid) });
  batch.update(userRef(requesterUid), { sentRequests:   arrayRemove(myUid) });
  await batch.commit();
}

export async function unfriend(myUid, otherUid) {
  const batch = writeBatch(db);
  batch.update(userRef(myUid),    { friends: arrayRemove(otherUid) });
  batch.update(userRef(otherUid), { friends: arrayRemove(myUid) });
  await batch.commit();
}

// ── CHATS ──────────────────────────────────────────────────────

export async function ensureChat(uid1, uid2) {
  const cid = chatId(uid1, uid2);
  const snap = await getDoc(chatRef(cid));
  if (!snap.exists()) {
    await setDoc(chatRef(cid), {
      id: cid, type: "dm", members: [uid1, uid2],
      createdAt: serverTimestamp(),
      lastMessage: null, lastMessageAt: null, lastMessageSenderId: null,
      deletedFor: {}, unreadCount: { [uid1]: 0, [uid2]: 0 },
    });
  } else if (snap.data().deletedFor?.[uid1]) {
    // Re-opening a chat I previously deleted: keep old history hidden, show the chat again
    await updateDoc(chatRef(cid), { [`hiddenBefore.${uid1}`]: snap.data().deletedFor[uid1], [`deletedFor.${uid1}`]: deleteField() });
  }
  return cid;
}

export function subscribeChats(uid, cb) {
  if (!uid) return () => {};
  // No orderBy: Firestore would drop docs whose lastMessageAt is null.
  const q = query(collection(db, "chats"), where("members", "array-contains", uid));
  return onSnapshot(q, snap => cb(snap.docs.map(data)), () => {});
}

export function subscribeChat(cid, cb) {
  if (!cid) return () => {};
  return onSnapshot(chatRef(cid), snap => cb(snap.exists() ? data(snap) : null), () => cb(null));
}

export async function getChat(cid) {
  const snap = await getDoc(chatRef(cid));
  return snap.exists() ? data(snap) : null;
}

const toggleList = (field) => async (uid, cid, on) => {
  await updateDoc(userRef(uid), { [field]: on ? arrayUnion(cid) : arrayRemove(cid) });
};
export const muteChat    = toggleList("mutedChats");
export const pinChat     = toggleList("pinnedChats");
export const archiveChat = toggleList("archivedChats");

export async function markChatUnread(uid, cid) {
  await updateDoc(chatRef(cid), { [`unreadCount.${uid}`]: 1 });
}

// Delete for me: hide the chat and its history until a new message arrives
export async function deleteChat(uid, cid) {
  const now = Timestamp.now();
  await updateDoc(chatRef(cid), { [`deletedFor.${uid}`]: now, [`hiddenBefore.${uid}`]: now, [`unreadCount.${uid}`]: 0 });
}

export async function clearChatHistory(uid, cid) {
  await updateDoc(chatRef(cid), { [`hiddenBefore.${uid}`]: Timestamp.now() });
}

export async function deleteChatForEveryone(cid) {
  const msgsSnap = await getDocs(msgsRef(cid));
  const docs = msgsSnap.docs;
  for (let i = 0; i < docs.length; i += 450) {
    const batch = writeBatch(db);
    docs.slice(i, i + 450).forEach(d => batch.delete(d.ref));
    await batch.commit();
  }
  await deleteDoc(chatRef(cid));
}

export async function clearUnread(uid, cid) {
  await updateDoc(chatRef(cid), { [`unreadCount.${uid}`]: 0 }).catch(() => {});
}

export async function setEphemeral(cid, seconds, byUid, byName) {
  await updateDoc(chatRef(cid), { ephemeral: seconds || null });
  const label = !seconds ? "off" : seconds <= 86400 ? "24 hours" : seconds <= 604800 ? "7 days" : "90 days";
  await addSystemMessage(cid, `${byName || "Someone"} turned disappearing messages ${seconds ? `on (${label})` : "off"}`, byUid);
}

export async function setChatWallpaper(cid, wallpaper) {
  await updateDoc(chatRef(cid), { wallpaper: wallpaper || null });
}

// ── ROOMS (group chats) ────────────────────────────────────────

const makeCode = () => Math.random().toString(36).slice(2, 8).toUpperCase();

export async function createRoom({ name, description = "", emoji = "💬", color = "#6366f1", isPublic = false, members = [], createdBy, creatorName }) {
  const ref = doc(collection(db, "chats"));
  const all = Array.from(new Set([createdBy, ...members]));
  await setDoc(ref, {
    id: ref.id, type: "group",
    name: name.trim(), description: description.trim(),
    emoji, color, isPublic,
    inviteCode: makeCode(),
    members: all,
    admins: [createdBy],
    createdBy,
    createdAt: serverTimestamp(),
    lastMessage: null, lastMessageAt: null, lastMessageSenderId: null,
    deletedFor: {},
    unreadCount: Object.fromEntries(all.map(u => [u, 0])),
  });
  await addSystemMessage(ref.id, `${creatorName || "Someone"} created the room “${name.trim()}”`, createdBy);
  const batch = writeBatch(db);
  members.filter(u => u !== createdBy).forEach(u => {
    batch.set(doc(notifRef(u)), notifDoc({
      type: "room_added", fromUid: createdBy, senderName: creatorName, chatId: ref.id,
      text: `${creatorName || "Someone"} added you to “${name.trim()}”`,
    }));
  });
  await batch.commit();
  return ref.id;
}

export async function updateRoom(cid, updates) {
  const clean = { ...updates };
  if (typeof clean.name === "string") clean.name = clean.name.trim();
  await updateDoc(chatRef(cid), clean);
}

export async function addRoomMembers(cid, uids, byUid, byName, names = {}) {
  if (!uids.length) return;
  const room = await getChat(cid);
  const batch = writeBatch(db);
  const upd = { members: arrayUnion(...uids) };
  uids.forEach(u => { upd[`unreadCount.${u}`] = 0; });
  batch.update(chatRef(cid), upd);
  uids.forEach(u => batch.set(doc(notifRef(u)), notifDoc({
    type: "room_added", fromUid: byUid, senderName: byName, chatId: cid,
    text: `${byName || "Someone"} added you to “${room?.name || "a room"}”`,
  })));
  await batch.commit();
  await addSystemMessage(cid, `${byName} added ${uids.map(u => names[u] || "someone").join(", ")}`, byUid);
}

export async function removeRoomMember(cid, uid, byUid, byName, targetName) {
  await updateDoc(chatRef(cid), { members: arrayRemove(uid), admins: arrayRemove(uid) });
  await addSystemMessage(cid, `${byName} removed ${targetName || "a member"}`, byUid);
}

export async function setRoomAdmin(cid, uid, on) {
  await updateDoc(chatRef(cid), { admins: on ? arrayUnion(uid) : arrayRemove(uid) });
}

export async function joinRoom(cid, uid, name) {
  await updateDoc(chatRef(cid), { members: arrayUnion(uid), [`unreadCount.${uid}`]: 0 });
  await addSystemMessage(cid, `${name || "Someone"} joined`, uid);
}

export async function leaveRoom(cid, uid, name) {
  const room = await getChat(cid);
  if (!room) return;
  const remaining = (room.members || []).filter(m => m !== uid);
  if (remaining.length === 0) { await deleteChatForEveryone(cid); return; }
  const upd = { members: arrayRemove(uid), admins: arrayRemove(uid) };
  // Hand admin to the longest-standing member if the last admin leaves
  const admins = (room.admins || []).filter(a => a !== uid);
  if (admins.length === 0) upd.admins = [remaining[0]];
  await updateDoc(chatRef(cid), upd);
  await addSystemMessage(cid, `${name || "Someone"} left`, uid);
}

export async function findRoomByCode(code) {
  const snap = await getDocs(query(collection(db, "chats"), where("inviteCode", "==", code.trim().toUpperCase()), limit(1)));
  return snap.empty ? null : data(snap.docs[0]);
}

export async function resetInviteCode(cid) {
  const code = makeCode();
  await updateDoc(chatRef(cid), { inviteCode: code });
  return code;
}

export function subscribePublicRooms(cb) {
  const q = query(collection(db, "chats"), where("isPublic", "==", true), limit(60));
  return onSnapshot(q, snap => cb(snap.docs.map(data)), () => cb([]));
}

// ── MESSAGES ───────────────────────────────────────────────────

export const PAGE_SIZE = 40;

/** Live window over the newest `count` messages (grow count to page back). */
export function subscribeMessages(cid, count, cb) {
  if (!cid) return () => {};
  const q = query(msgsRef(cid), orderBy("createdAt", "desc"), limit(count));
  return onSnapshot(q, { includeMetadataChanges: true }, snap => {
    const msgs = snap.docs.map(d => ({ ...data(d), _pending: d.metadata.hasPendingWrites })).reverse();
    cb(msgs, snap.docs.length >= count);
  }, () => cb([], false));
}

async function addSystemMessage(cid, text, byUid) {
  const ref = doc(msgsRef(cid));
  const batch = writeBatch(db);
  batch.set(ref, {
    id: ref.id, type: "system", text, senderId: byUid || "system",
    readBy: [], reactions: {}, deletedFor: [], createdAt: serverTimestamp(),
  });
  batch.update(chatRef(cid), { lastMessage: text, lastMessageAt: serverTimestamp(), lastMessageSenderId: byUid || "system", lastMessageType: "system" });
  await batch.commit().catch(() => {});
}

/**
 * Send any kind of message. `chat` (the chat doc) and `me` (sender profile) are
 * passed from context so we avoid extra reads on the hot path.
 */
export async function sendMessage(cid, {
  chat, me, text = "", type = "text", poll = null, replyTo = null,
  image = null, voice = null, location = null, mentions = [], forwarded = false,
}) {
  const senderId = me.uid;
  if (type === "text" && !text.trim()) return null;
  const chatDoc = chat || await getChat(cid);
  if (!chatDoc) return null;
  const members = chatDoc.members || [];
  if (!members.includes(senderId)) return null;
  const others = members.filter(m => m !== senderId);

  // DM block guard (either direction)
  if (!isGroup(chatDoc) && others[0]) {
    if ((me.blocklist || []).includes(others[0])) return null;
    const other = await getUser(others[0]).catch(() => null);
    if ((other?.blocklist || []).includes(senderId)) {
      throw new Error("You can't message this person.");
    }
  }

  const ref = doc(msgsRef(cid));
  const msg = {
    id: ref.id, type, text: text || "",
    senderId, senderName: me.name || "Someone",
    poll, replyTo, image, voice, location,
    mentions: mentions || [],
    forwarded: !!forwarded,
    reactions: {}, readBy: [senderId], deliveredTo: [senderId], deletedFor: [],
    edited: false,
    createdAt: serverTimestamp(),
  };
  if (chatDoc.ephemeral) msg.expiresAt = Timestamp.fromMillis(Date.now() + chatDoc.ephemeral * 1000);

  const preview = previewOf(msg);
  const batch = writeBatch(db);
  batch.set(ref, msg);
  const chatUpd = {
    lastMessage: preview,
    lastMessageAt: serverTimestamp(),
    lastMessageSenderId: senderId,
    lastMessageSenderName: me.name || "",
    lastMessageType: type,
  };
  others.forEach(u => {
    chatUpd[`unreadCount.${u}`] = increment(1);
    // A new message resurfaces a chat the other person deleted
    if (chatDoc.deletedFor?.[u]) chatUpd[`deletedFor.${u}`] = deleteField();
  });
  if (chatDoc.deletedFor?.[senderId]) chatUpd[`deletedFor.${senderId}`] = deleteField();
  batch.update(chatRef(cid), chatUpd);

  const title = isGroup(chatDoc) ? chatDoc.name : null;
  others.slice(0, 200).forEach(u => {
    const mentioned = mentions.includes(u);
    batch.set(doc(notifRef(u)), notifDoc({
      type: mentioned ? "mention" : "message",
      fromUid: senderId,
      senderName: me.name,
      chatId: cid,
      roomName: title,
      text: mentioned ? `mentioned you: ${preview}` : preview,
    }));
  });
  await batch.commit();
  return ref.id;
}

export async function editMessage(cid, mid, newText) {
  await updateDoc(msgRef(cid, mid), { text: newText, edited: true, editedAt: serverTimestamp() });
}

export async function addReaction(cid, mid, uid, emoji) {
  await updateDoc(msgRef(cid, mid), { [`reactions.${uid}`]: emoji || deleteField() });
}

export async function deleteMessage(cid, mid, uid) {
  await updateDoc(msgRef(cid, mid), { deletedFor: arrayUnion(uid) });
}

export async function deleteMessageForEveryone(cid, mid) {
  await updateDoc(msgRef(cid, mid), {
    deletedForEveryone: true, text: "", poll: null, image: null, voice: null, location: null, reactions: {},
  });
}

export async function forwardMessage(targetCid, msg, { chat, me }) {
  return sendMessage(targetCid, {
    chat, me,
    type: msg.type === "poll" ? "text" : msg.type,
    text: msg.type === "poll" ? `📊 ${msg.poll?.question}` : (msg.text || ""),
    image: msg.image || null, voice: msg.voice || null, location: msg.location || null,
    forwarded: true,
  });
}

/** Mark a set of messages read (and delivered) in one batch. */
export async function markMessagesRead(cid, mids, uid) {
  if (!mids.length) return;
  const batch = writeBatch(db);
  mids.slice(0, 450).forEach(mid => batch.update(msgRef(cid, mid), { readBy: arrayUnion(uid), deliveredTo: arrayUnion(uid) }));
  await batch.commit().catch(() => {});
}

export async function votePoll(cid, mid, uid, optionIndex) {
  const ref = msgRef(cid, mid);
  await runTransaction(db, async (tx) => {
    const snap = await tx.get(ref);
    if (!snap.exists()) return;
    const poll = snap.data().poll || {};
    const already = (poll.options?.[optionIndex]?.votes || []).includes(uid);
    const options = (poll.options || []).map((opt, i) => {
      let votes = opt.votes || [];
      if (i === optionIndex) votes = already ? votes.filter(v => v !== uid) : [...votes, uid];
      else if (!poll.multiple) votes = votes.filter(v => v !== uid);
      return { ...opt, votes };
    });
    tx.update(ref, { poll: { ...poll, options } });
  });
}

export async function pinMessage(cid, msg) {
  await updateDoc(chatRef(cid), {
    pinnedMessage: msg ? { id: msg.id, text: previewOf(msg), senderName: msg.senderName || "" } : null,
  });
}

// ── STARRED ────────────────────────────────────────────────────

export async function starMessage(uid, cid, msg, on, chatTitle) {
  const ref = doc(starRef(uid), msg.id);
  if (!on) { await deleteDoc(ref); return; }
  await setDoc(ref, {
    id: msg.id, chatId: cid, chatTitle: chatTitle || "",
    type: msg.type, text: previewOf(msg), senderName: msg.senderName || "",
    image: msg.type === "image" ? msg.image : null,
    createdAt: msg.createdAt || serverTimestamp(),
    starredAt: serverTimestamp(),
  });
}

export function subscribeStarred(uid, cb) {
  if (!uid) return () => {};
  return onSnapshot(query(starRef(uid), orderBy("starredAt", "desc"), limit(200)), snap => cb(snap.docs.map(data)), () => {});
}

// ── NOTIFICATIONS ──────────────────────────────────────────────

function notifDoc({ type, fromUid, senderName, text, chatId: cid, roomName }) {
  return {
    type, fromUid: fromUid || null,
    senderName: senderName || null,
    text: text || "",
    chatId: cid || null,
    roomName: roomName || null,
    read: false,
    createdAt: serverTimestamp(),
  };
}

export async function addNotification(toUid, n) {
  await addDoc(notifRef(toUid), notifDoc(n));
}

export function subscribeNotifications(uid, cb, count = 50) {
  if (!uid) return () => {};
  const q = query(notifRef(uid), orderBy("createdAt", "desc"), limit(count));
  return onSnapshot(q, snap => cb(snap.docs.map(d => ({ id: d.id, ...data(d) }))), () => {});
}

export async function loadMoreNotifications(uid, afterId) {
  if (!uid || !afterId) return { notifs: [] };
  const afterSnap = await getDoc(doc(db, "notifications", uid, "items", afterId));
  if (!afterSnap.exists()) return { notifs: [] };
  const q = query(notifRef(uid), orderBy("createdAt", "desc"), startAfter(afterSnap), limit(30));
  const snap = await getDocs(q);
  return { notifs: snap.docs.map(d => ({ id: d.id, ...data(d) })) };
}

export async function markNotificationRead(uid, nid) {
  await updateDoc(doc(db, "notifications", uid, "items", nid), { read: true }).catch(() => {});
}

export async function markAllNotificationsRead(uid) {
  const snap = await getDocs(query(notifRef(uid), where("read", "==", false)));
  const batch = writeBatch(db);
  snap.docs.slice(0, 450).forEach(d => batch.update(d.ref, { read: true }));
  await batch.commit();
}

/** Mark all unread message/mention notifications of a chat read (on opening it). */
export async function markChatNotificationsRead(uid, cid, notifications) {
  const ids = notifications.filter(n => !n.read && n.chatId === cid).map(n => n.id);
  if (!ids.length) return;
  const batch = writeBatch(db);
  ids.forEach(id => batch.update(doc(db, "notifications", uid, "items", id), { read: true }));
  await batch.commit().catch(() => {});
}

export async function clearNotifications(uid) {
  const snap = await getDocs(query(notifRef(uid), limit(450)));
  const batch = writeBatch(db);
  snap.docs.forEach(d => batch.delete(d.ref));
  await batch.commit();
}

export async function deleteNotification(uid, nid) {
  await deleteDoc(doc(db, "notifications", uid, "items", nid)).catch(() => {});
}

// ── TYPING INDICATOR ───────────────────────────────────────────

export async function setTyping(cid, uid, isTyping) {
  await updateDoc(chatRef(cid), {
    [`typing.${uid}`]: isTyping ? Timestamp.now() : deleteField(),
  }).catch(() => {});
}

// ── BLOCK / UNBLOCK ────────────────────────────────────────────

export async function blockUser(myUid, targetUid) {
  const batch = writeBatch(db);
  batch.update(userRef(myUid), {
    blocklist: arrayUnion(targetUid), friends: arrayRemove(targetUid),
    sentRequests: arrayRemove(targetUid), friendRequests: arrayRemove(targetUid),
  });
  batch.update(userRef(targetUid), {
    friends: arrayRemove(myUid), sentRequests: arrayRemove(myUid), friendRequests: arrayRemove(myUid),
  });
  await batch.commit();
}

export async function unblockUser(myUid, targetUid) {
  await updateDoc(userRef(myUid), { blocklist: arrayRemove(targetUid) });
}

export async function reportUser(myUid, targetUid, reason) {
  await addDoc(collection(db, "reports"), { by: myUid, target: targetUid, reason: reason || "", createdAt: serverTimestamp() });
}

// ── STATUS (24h stories) ───────────────────────────────────────

const DAY = 24 * 3600 * 1000;

export async function postStatus(me, { kind = "text", text = "", bg = "#6366f1", image = null, font = 0 }) {
  await addDoc(collection(db, "statuses"), {
    uid: me.uid, name: me.name || "", avatar: me.avatar || null,
    kind, text, bg, image, font,
    viewers: [],
    createdAt: serverTimestamp(),
    expiresAt: Timestamp.fromMillis(Date.now() + DAY),
  });
}

export function subscribeStatuses(cb) {
  const q = query(collection(db, "statuses"), where("createdAt", ">", Timestamp.fromMillis(Date.now() - DAY)));
  return onSnapshot(q, snap => cb(snap.docs.map(d => ({ id: d.id, ...data(d) }))), () => cb([]));
}

export async function viewStatus(sid, uid) {
  await updateDoc(doc(db, "statuses", sid), { viewers: arrayUnion(uid) }).catch(() => {});
}

export async function deleteStatus(sid) {
  await deleteDoc(doc(db, "statuses", sid));
}

// ── SEARCH ─────────────────────────────────────────────────────

export async function searchUsersByName(namePrefix) {
  const snap = await getDocs(collection(db, "users"));
  const q = namePrefix.toLowerCase();
  return snap.docs.map(data).filter(u => u.name?.toLowerCase().includes(q));
}
