/**
 * db.js — All Firestore operations for AR-Hub chat.
 *
 * Schema:
 *   users/{uid}                         user profile + presence
 *   chats/{chatId}                      conversation metadata
 *   chats/{chatId}/messages/{msgId}     individual messages (subcollection)
 *   notifications/{uid}/items/{nid}     per-user notification feed
 */

import {
  collection, doc, getDoc, getDocs, setDoc, updateDoc,
  addDoc, query, orderBy, limit, startAfter, onSnapshot,
  serverTimestamp, arrayUnion, arrayRemove, where,
  writeBatch, increment, Timestamp,
} from "firebase/firestore";
import { db } from "../userauth/FireAuth";

// ── helpers ────────────────────────────────────────────────────
export const chatId = (uid1, uid2) =>
  [uid1, uid2].sort().join("_");

const userRef  = (uid)             => doc(db, "users", uid);
const chatRef  = (cid)             => doc(db, "chats", cid);
const msgsRef  = (cid)             => collection(db, "chats", cid, "messages");
const msgRef   = (cid, mid)        => doc(db, "chats", cid, "messages", mid);
const notifRef = (uid)             => collection(db, "notifications", uid, "items");

// ── USER ───────────────────────────────────────────────────────

export async function createUser(uid, { name, email }) {
  await setDoc(userRef(uid), {
    uid, name, email,
    avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${uid}`,
    bio: "Hey, I'm on AR Hub!",
    status: "online",
    lastSeen: serverTimestamp(),
    friends: [],
    sentRequests: [],
    friendRequests: [],
    mutedChats: [],
    blocklist: [],
    notificationsEnabled: true,
    createdAt: serverTimestamp(),
  });
}

export async function getUser(uid) {
  if (!uid) return null;
  const snap = await getDoc(userRef(uid));
  return snap.exists() ? snap.data() : null;
}

export async function updateUserField(uid, updates) {
  if (!uid) return;
  await updateDoc(userRef(uid), updates);
}

export async function setPresence(uid, isOnline) {
  if (!uid) return;
  await updateDoc(userRef(uid), {
    status: isOnline ? "online" : "offline",
    lastSeen: serverTimestamp(),
  });
}

export function subscribeUser(uid, cb) {
  if (!uid) return () => {};
  return onSnapshot(userRef(uid), snap => cb(snap.exists() ? snap.data() : null));
}

export function subscribeAllUsers(cb) {
  return onSnapshot(collection(db, "users"), snap => {
    const list = snap.docs.map(d => d.data());
    cb(list);
  });
}

// ── FRIEND REQUESTS ────────────────────────────────────────────

export async function sendFriendRequest(fromUid, toUid) {
  const fromUser = await getUser(fromUid);
  const senderName = fromUser?.name || "Someone";
  const batch = writeBatch(db);
  batch.update(userRef(fromUid), { sentRequests: arrayUnion(toUid) });
  batch.update(userRef(toUid),   { friendRequests: arrayUnion(fromUid) });
  await batch.commit();
  await addNotification(toUid, {
    type: "friend_request",
    fromUid,
    senderName,
    text: `${senderName} sent you a friend request`,
  });
}

export async function cancelFriendRequest(fromUid, toUid) {
  const batch = writeBatch(db);
  batch.update(userRef(fromUid), { sentRequests: arrayRemove(toUid) });
  batch.update(userRef(toUid),   { friendRequests: arrayRemove(fromUid) });
  await batch.commit();
}

export async function acceptFriendRequest(myUid, requesterUid) {
  const cid = chatId(myUid, requesterUid);
  const batch = writeBatch(db);
  batch.update(userRef(myUid),        { friends: arrayUnion(requesterUid), friendRequests: arrayRemove(requesterUid) });
  batch.update(userRef(requesterUid), { friends: arrayUnion(myUid),        sentRequests:   arrayRemove(myUid) });
  // Create chat doc if absent
  batch.set(chatRef(cid), {
    id: cid, members: [myUid, requesterUid],
    createdAt: serverTimestamp(),
    lastMessage: null, lastMessageAt: null, lastMessageSenderId: null,
    deletedFor: {}, unreadCount: {},
  }, { merge: true });
  await batch.commit();
  const acceptor = await getUser(myUid);
  const acceptorName = acceptor?.name || "Someone";
  await addNotification(requesterUid, {
    type: "friend_accepted",
    fromUid: myUid,
    senderName: acceptorName,
    text: `${acceptorName} accepted your friend request 🎉`,
  });
}

export async function declineFriendRequest(myUid, requesterUid) {
  const batch = writeBatch(db);
  batch.update(userRef(myUid),        { friendRequests: arrayRemove(requesterUid) });
  batch.update(userRef(requesterUid), { sentRequests:   arrayRemove(myUid) });
  await batch.commit();
}

export async function unfriend(myUid, otherUid) {
  const batch = writeBatch(db);
  batch.update(userRef(myUid),   { friends: arrayRemove(otherUid) });
  batch.update(userRef(otherUid),{ friends: arrayRemove(myUid) });
  await batch.commit();
}

// ── CHATS ──────────────────────────────────────────────────────

export async function ensureChat(uid1, uid2) {
  const cid = chatId(uid1, uid2);
  const snap = await getDoc(chatRef(cid));
  if (!snap.exists()) {
    await setDoc(chatRef(cid), {
      id: cid, members: [uid1, uid2],
      createdAt: serverTimestamp(),
      lastMessage: null, lastMessageAt: null, lastMessageSenderId: null,
      deletedFor: {}, unreadCount: { [uid1]: 0, [uid2]: 0 },
    });
  }
  return cid;
}

export function subscribeChats(uid, cb) {
  if (!uid) return () => {};
  // Only filter by membership — skip orderBy so chats with null lastMessageAt
  // are not silently excluded (Firestore drops null-field docs from ordered queries).
  // Client-side sort handles ordering.
  const q = query(
    collection(db, "chats"),
    where("members", "array-contains", uid),
  );
  return onSnapshot(q, snap => {
    const chats = snap.docs.map(d => d.data());
    cb(chats);
  });
}

export async function muteChat(uid, cid, mute) {
  await updateDoc(userRef(uid), {
    mutedChats: mute ? arrayUnion(cid) : arrayRemove(cid),
  });
}

export async function pinChat(uid, cid, pin) {
  await updateDoc(userRef(uid), {
    pinnedChats: pin ? arrayUnion(cid) : arrayRemove(cid),
  });
}

export async function deleteChat(uid, cid) {
  // Soft-delete for this user (hides chat but preserves for other member)
  const updates = {};
  updates[`deletedFor.${uid}`] = Timestamp.now();
  await updateDoc(chatRef(cid), updates);
}

export async function deleteChatForEveryone(cid) {
  // Hard delete: remove all messages then the chat doc itself
  const msgsSnap = await getDocs(msgsRef(cid));
  const batch = writeBatch(db);
  msgsSnap.docs.forEach(d => batch.delete(d.ref));
  batch.delete(chatRef(cid));
  await batch.commit();
}

export async function clearUnread(uid, cid) {
  const updates = {};
  updates[`unreadCount.${uid}`] = 0;
  await updateDoc(chatRef(cid), updates);
}

// ── MESSAGES (paginated subcollection) ────────────────────────

const PAGE_SIZE = 30;

export async function getMessages(cid, pageAfter = null) {
  let q = query(msgsRef(cid), orderBy("createdAt", "desc"), limit(PAGE_SIZE));
  if (pageAfter) q = query(msgsRef(cid), orderBy("createdAt", "desc"), startAfter(pageAfter), limit(PAGE_SIZE));
  const snap = await getDocs(q);
  const msgs  = snap.docs.map(d => d.data()).reverse();
  const lastDoc = snap.docs[snap.docs.length - 1] || null;
  return { msgs, lastDoc, hasMore: snap.docs.length === PAGE_SIZE };
}

export function subscribeNewMessages(cid, afterTimestamp, cb) {
  if (!cid) return () => {};
  const q = query(
    msgsRef(cid),
    orderBy("createdAt", "asc"),
    where("createdAt", ">", afterTimestamp || Timestamp.fromMillis(0)),
  );
  return onSnapshot(q, snap => {
    const msgs = snap.docs.map(d => d.data());
    cb(msgs);
  });
}

// Real-time subscription for messages in a chat (handles edits/reactions/poll updates live)
export function subscribeMessages(cid, cb) {
  if (!cid) return () => {};
  const q = query(msgsRef(cid), orderBy("createdAt", "asc"));
  return onSnapshot(q, { includeMetadataChanges: false }, snap => {
    const msgs = snap.docs.map(d => d.data());
    cb(msgs);
  });
}

export async function editMessage(cid, mid, newText) {
  await updateDoc(msgRef(cid, mid), {
    text: newText,
    edited: true,
    editedAt: serverTimestamp(),
  });
}

export async function sendMessage(cid, { text, senderId, senderName, type = "text", poll = null, replyTo = null }) {
  if (!text?.trim() && type === "text") return null;

  // Block guard: check if either party has blocked the other
  const chatSnap0 = await getDoc(chatRef(cid));
  if (chatSnap0.exists()) {
    const members = chatSnap0.data().members || [];
    const otherUid0 = members.find(m => m !== senderId);
    if (otherUid0) {
      const [senderDoc, otherDoc] = await Promise.all([getDoc(userRef(senderId)), getDoc(userRef(otherUid0))]);
      const senderBlocklist = senderDoc.data()?.blocklist || [];
      const otherBlocklist  = otherDoc.data()?.blocklist  || [];
      if (senderBlocklist.includes(otherUid0) || otherBlocklist.includes(senderId)) return null;
    }
  }

  const ref = doc(msgsRef(cid));
  const preview = type === "poll" ? "📊 Poll" : (text.length > 60 ? text.slice(0, 60) + "…" : text);
  const msg = {
    id: ref.id,
    text: text || "",
    senderId,
    senderName: senderName || null,
    type,
    poll: poll || null,
    replyTo: replyTo || null,
    reactions: {},
    readBy: [senderId],
    deletedFor: [],
    edited: false,
    createdAt: serverTimestamp(),
  };
  await setDoc(ref, msg);

  // Get chat members to notify the other user and increment their unread
  const chatSnap = await getDoc(chatRef(cid));
  const members = chatSnap.exists() ? (chatSnap.data().members || []) : [];
  const otherUid = members.find(m => m !== senderId);

  const batch = writeBatch(db);

  // Update chat metadata
  const chatUpdates = {
    lastMessage: preview,
    lastMessageAt: serverTimestamp(),
    lastMessageSenderId: senderId,
  };
  if (otherUid) {
    chatUpdates[`unreadCount.${otherUid}`] = increment(1);
  }
  batch.update(chatRef(cid), chatUpdates);
  await batch.commit();

  // Send notification to other user (skip if they blocked the sender)
  if (otherUid) {
    const receiverSnap = await getDoc(userRef(otherUid));
    const receiverBlocklist = receiverSnap.data()?.blocklist || [];
    if (!receiverBlocklist.includes(senderId)) {
      await addDoc(collection(db, "notifications", otherUid, "items"), {
        type: "message",
        fromUid: senderId,
        senderName: senderName || "Someone",
        text: preview,
        chatId: cid,
        read: false,
        createdAt: serverTimestamp(),
      });
    }
  }

  return ref.id;
}

export async function addReaction(cid, mid, uid, emoji) {
  const updates = {};
  updates[`reactions.${uid}`] = emoji || null;
  await updateDoc(msgRef(cid, mid), updates);
}

export async function removeReaction(cid, mid, uid) {
  const updates = {};
  updates[`reactions.${uid}`] = null;
  await updateDoc(msgRef(cid, mid), updates);
}

export async function deleteMessage(cid, mid, uid) {
  await updateDoc(msgRef(cid, mid), { deletedFor: arrayUnion(uid) });
}

export async function deleteMessageForEveryone(cid, mid) {
  await updateDoc(msgRef(cid, mid), {
    deletedForEveryone: true,
    text: '',
    poll: null,
    reactions: {},
  });
}

export async function forwardMessage(cid, { text, senderId, senderName, originalSenderName }) {
  const id = await sendMessage(cid, { text, senderId, senderName, type: 'text', replyTo: null });
  if (id) {
    await updateDoc(msgRef(cid, id), {
      forwarded: true,
      originalSender: originalSenderName || null,
    });
  }
  return id;
}

export async function markRead(cid, mid, uid) {
  await updateDoc(msgRef(cid, mid), { readBy: arrayUnion(uid) });
}

export async function votePoll(cid, mid, uid, optionIndex) {
  const ref = msgRef(cid, mid);
  const snap = await getDoc(ref);
  if (!snap.exists()) return;
  const data = snap.data();
  const prevPoll = data.poll || {};
  const options = (prevPoll.options || []).map((opt, i) => {
    const votes = (opt.votes || []).filter(v => v !== uid); // remove from all
    if (i === optionIndex && !(opt.votes || []).includes(uid)) {
      return { ...opt, votes: [...votes, uid] }; // add to selected (toggle off if already voted)
    }
    return { ...opt, votes };
  });
  // Write the full poll object to avoid dot-notation issues with nested arrays
  await updateDoc(ref, { poll: { ...prevPoll, options } });
}

export async function incrementUnread(cid, uid) {
  const updates = {};
  updates[`unreadCount.${uid}`] = increment(1);
  await updateDoc(chatRef(cid), updates);
}

// ── NOTIFICATIONS ──────────────────────────────────────────────

export async function addNotification(toUid, { type, fromUid, senderName, text, chatId: cid }) {
  await addDoc(notifRef(toUid), {
    type, fromUid,
    senderName: senderName || null,
    text,
    chatId: cid || null,
    read: false,
    createdAt: serverTimestamp(),
  });
}

export function subscribeNotifications(uid, cb) {
  if (!uid) return () => {};
  const q = query(notifRef(uid), orderBy("createdAt", "desc"), limit(20));
  return onSnapshot(q, snap => {
    cb(snap.docs.map(d => ({ id: d.id, ...d.data() })));
  });
}

export async function loadMoreNotifications(uid, afterDoc) {
  if (!uid || !afterDoc) return { notifs: [], lastDoc: null };
  const q = query(notifRef(uid), orderBy("createdAt", "desc"), startAfter(afterDoc), limit(20));
  const snap = await getDocs(q);
  return {
    notifs: snap.docs.map(d => ({ id: d.id, ...d.data() })),
    lastDoc: snap.docs[snap.docs.length - 1] || null,
  };
}

export async function markNotificationRead(uid, nid) {
  await updateDoc(doc(db, "notifications", uid, "items", nid), { read: true });
}

export async function markAllNotificationsRead(uid) {
  const snap = await getDocs(query(notifRef(uid), where("read", "==", false)));
  const batch = writeBatch(db);
  snap.docs.forEach(d => batch.update(d.ref, { read: true }));
  await batch.commit();
}

// ── TYPING INDICATOR ───────────────────────────────────────────

export async function setTyping(cid, uid, isTyping) {
  const updates = {};
  updates[`typing.${uid}`] = isTyping ? true : null;
  await updateDoc(chatRef(cid), updates).catch(() => {});
}

export function subscribeTyping(cid, uid, cb) {
  if (!cid) return () => {};
  return onSnapshot(chatRef(cid), snap => {
    const data = snap.data() || {};
    const typing = data.typing || {};
    // Return other users who are typing
    const others = Object.entries(typing)
      .filter(([k, v]) => k !== uid && v === true)
      .map(([k]) => k);
    cb(others);
  });
}

// ── BLOCK / UNBLOCK ────────────────────────────────────────────

export async function blockUser(myUid, targetUid) {
  const cid = chatId(myUid, targetUid);

  // 1. Add to blocklist + unfriend both sides atomically
  const batch = writeBatch(db);
  batch.update(userRef(myUid),    { blocklist: arrayUnion(targetUid),  friends: arrayRemove(targetUid), sentRequests: arrayRemove(targetUid), friendRequests: arrayRemove(targetUid) });
  batch.update(userRef(targetUid),{ friends: arrayRemove(myUid), sentRequests: arrayRemove(myUid), friendRequests: arrayRemove(myUid) });
  await batch.commit();

  // 2. Hard-delete the shared chat (messages + chat doc)
  try {
    const msgsSnap = await getDocs(collection(db, "chats", cid, "messages"));
    const delBatch = writeBatch(db);
    msgsSnap.docs.forEach(d => delBatch.delete(d.ref));
    delBatch.delete(doc(db, "chats", cid));
    await delBatch.commit();
  } catch {}
}

export async function unblockUser(myUid, targetUid) {
  await updateDoc(userRef(myUid), { blocklist: arrayRemove(targetUid) });
}

// ── SEARCH ─────────────────────────────────────────────────────

export async function searchUsersByName(namePrefix) {
  // Firestore doesn't support full-text; we fetch all and filter client-side
  // For production use Algolia / Typesense — this is fine for small user bases
  const snap = await getDocs(collection(db, "users"));
  const q = namePrefix.toLowerCase();
  return snap.docs
    .map(d => d.data())
    .filter(u => u.name?.toLowerCase().includes(q));
}
