import React, { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState, Suspense, lazy } from "react";
import { useNavigate } from "react-router-dom";
import {
  IoArrowBack, IoCallOutline, IoVideocamOutline, IoSearch, IoEllipsisVertical, IoChevronDown, IoChevronUp,
  IoClose, IoPin, IoGameControllerOutline, IoArrowUndoOutline, IoCopyOutline, IoArrowRedoOutline, IoStarOutline,
  IoStar, IoPinOutline, IoCreateOutline, IoInformationCircleOutline, IoTrashOutline, IoDownloadOutline,
  IoVolumeMuteOutline, IoVolumeHighOutline, IoTimerOutline, IoDocumentTextOutline, IoBanOutline, IoExitOutline,
  IoArrowDown, IoLockClosed,
} from "react-icons/io5";
import { useApp, toastError, toastOk, pushToast } from "../../Context/ChatContext";
import { useTheme } from "../../Context/ThemeContext";
import { useCallManager } from "../../Components/Call/CallManager";
import {
  subscribeChat, subscribeMessages, PAGE_SIZE, sendMessage, editMessage, addReaction, deleteMessage,
  deleteMessageForEveryone, markMessagesRead, clearUnread, markChatNotificationsRead, setTyping, pinMessage,
  starMessage, subscribeStarred, muteChat, unblockUser, joinRoom, isGroup, previewOf, addNotification, openSnap,
} from "../../lib/db";
import { subscribePendingInvite } from "../../lib/games";
import { fmtDayLabel, toDate, toMillis, lastSeenText, fmtTime } from "../../lib/format";
import { sounds } from "../../lib/notify";
import { downloadDataUrl } from "../../lib/media";
import { ChatAvatar } from "../common/Avatar";
import Avatar from "../common/Avatar";
import Menu from "../common/Menu";
import Sheet from "../common/Sheet";
import Empty, { Spinner } from "../common/Empty";
import MessageBubble from "./MessageBubble";
import Composer from "./Composer";
import ChatInfo from "./ChatInfo";
import ForwardSheet from "./ForwardSheet";
import { activeTypers } from "./ChatList";

const GameHub = lazy(() => import("../../Components/Games/GameHub"));
const Whiteboard = lazy(() => import("../hub/Whiteboard"));

const QUICK_REACTIONS = ["❤️", "👍", "😂", "😮", "😢", "🙏"];
const safe = (p) => p.catch(toastError);
const replyPayload = (m) => ({ id: m.id, text: previewOf(m), senderId: m.senderId, senderName: m.senderName || "", type: m.type });

export default function Conversation({ cid }) {
  const navigate = useNavigate();
  const { uid, me, usersById, chats, chatTitle, setActiveChatId, notifications } = useApp();
  const { wallpaper: localWallpaper } = useTheme();
  const { initiateCall } = useCallManager() || {};

  const [chat, setChat] = useState(() => chats.find(c => c.id === cid) || null);
  const [chatLoaded, setChatLoaded] = useState(() => chats.some(c => c.id === cid));
  const [msgs, setMsgs] = useState([]);
  const [count, setCount] = useState(PAGE_SIZE);
  const [hasMore, setHasMore] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const [replyTo, setReplyTo] = useState(null);
  const [editing, setEditing] = useState(null);
  const [menu, setMenu] = useState(null);
  const [infoOpen, setInfoOpen] = useState(false);
  const [searchOn, setSearchOn] = useState(false);
  const [query, setQuery] = useState("");
  const [hitIdx, setHitIdx] = useState(0);
  const [flashId, setFlashId] = useState(null);
  const [forwardMsg, setForwardMsg] = useState(null);
  const [infoMsg, setInfoMsg] = useState(null);
  const [deleteMsg, setDeleteMsg] = useState(null);
  const [viewer, setViewer] = useState(null);
  const [gamesOpen, setGamesOpen] = useState(false);
  const [boardOpen, setBoardOpen] = useState(false);
  const [gameInvite, setGameInvite] = useState(null);
  const [starred, setStarred] = useState(new Set());
  const [atBottom, setAtBottom] = useState(true);
  const [newBelow, setNewBelow] = useState(0);
  const [visible, setVisible] = useState(document.visibilityState === "visible");
  const [, tick] = useState(0);

  const listRef = useRef(null);
  const firstScrollDone = useRef(false);
  const unreadAnchor = useRef(undefined);
  const restoreScroll = useRef(null);
  const lastMsgId = useRef(null);
  const requestedRead = useRef(new Set());
  const pendingJump = useRef(null);
  const typingState = useRef({ on: false, timer: null, last: 0 });

  const group = isGroup(chat);
  const partnerId = !group ? chat?.members?.find(m => m !== uid) : null;
  const partner = partnerId ? usersById[partnerId] : null;
  const title = chat ? chatTitle(chat) : "";
  const isMember = !!chat?.members?.includes(uid);
  const iBlocked = !!partnerId && (me?.blocklist || []).includes(partnerId);
  const blockedMe = !!partner && (partner.blocklist || []).includes(uid);
  const muted = (me?.mutedChats || []).includes(cid);
  const members = useMemo(() => (chat?.members || []).map(m => usersById[m] || { uid: m, name: "Unknown" }), [chat, usersById]);
  const mentionNames = useMemo(() => members.map(m => m.name || ""), [members]);

  // ── Subscriptions ────────────────────────────────────────────
  useEffect(() => subscribeChat(cid, (c) => { setChat(c); setChatLoaded(true); }), [cid]);
  useEffect(() => subscribeMessages(cid, count, (m, more) => { setMsgs(m); setHasMore(more); setLoaded(true); }), [cid, count]);
  useEffect(() => subscribeStarred(uid, (list) => setStarred(new Set(list.filter(s => s.chatId === cid).map(s => s.id)))), [uid, cid]);
  useEffect(() => {
    if (!partnerId) return;
    return subscribePendingInvite(uid, partnerId, setGameInvite);
  }, [uid, partnerId]);

  useEffect(() => {
    setActiveChatId?.(cid);
    return () => setActiveChatId?.(null);
  }, [cid, setActiveChatId]);

  useEffect(() => {
    const h = () => setVisible(document.visibilityState === "visible");
    document.addEventListener("visibilitychange", h);
    window.addEventListener("focus", h);
    return () => { document.removeEventListener("visibilitychange", h); window.removeEventListener("focus", h); };
  }, []);

  // typing indicator expiry
  const typers = activeTypers(chat, uid);
  useEffect(() => {
    if (!typers.length) return;
    const t = setInterval(() => tick(x => x + 1), 2500);
    return () => clearInterval(t);
  }, [typers.length]);

  // Stop typing when leaving
  useEffect(() => () => {
    clearTimeout(typingState.current.timer);
    if (typingState.current.on) setTyping(cid, uid, false);
  }, [cid, uid]);

  const onTyping = useCallback((on) => {
    const s = typingState.current;
    clearTimeout(s.timer);
    if (!on) { if (s.on) { s.on = false; setTyping(cid, uid, false); } return; }
    const now = Date.now();
    if (!s.on || now - s.last > 4000) { s.on = true; s.last = now; setTyping(cid, uid, true); }
    s.timer = setTimeout(() => { s.on = false; setTyping(cid, uid, false); }, 5000);
  }, [cid, uid]);

  // ── Visible messages ─────────────────────────────────────────
  const hiddenBefore = toMillis(chat?.hiddenBefore?.[uid]);
  const view = useMemo(() => {
    const now = Date.now();
    const blocked = me?.blocklist || [];
    return msgs.filter(m =>
      !(m.deletedFor || []).includes(uid) &&
      !(hiddenBefore && toMillis(m.createdAt) <= hiddenBefore) &&
      !(m.expiresAt && toMillis(m.expiresAt) < now) &&
      !(group && blocked.includes(m.senderId))
    );
  }, [msgs, uid, hiddenBefore, me, group]);

  // ── Read receipts / unread clearing ──────────────────────────
  useEffect(() => {
    if (!loaded || !visible || !isMember) return;
    const toRead = view.filter(m => m.senderId !== uid && m.type !== "system" && !m._pending && !(m.readBy || []).includes(uid) && !requestedRead.current.has(m.id));
    if (toRead.length && me?.readReceipts !== false) {
      toRead.forEach(m => requestedRead.current.add(m.id));
      markMessagesRead(cid, toRead.map(m => m.id), uid);
    }
    if (chat?.unreadCount?.[uid] > 0) clearUnread(uid, cid);
    markChatNotificationsRead(uid, cid, notifications);
  }, [view, loaded, visible, isMember, uid, cid, chat, me, notifications]);

  // ── Scroll management ────────────────────────────────────────
  const scrollToBottom = useCallback((smooth = true) => {
    const el = listRef.current;
    if (!el) return;
    el.scrollTo({ top: el.scrollHeight, behavior: smooth ? "smooth" : "auto" });
    setNewBelow(0);
  }, []);

  useLayoutEffect(() => {
    const el = listRef.current;
    if (!el || !loaded) return;
    if (restoreScroll.current) {
      const { height, top } = restoreScroll.current;
      el.scrollTop = el.scrollHeight - height + top;
      restoreScroll.current = null;
    }
    const last = view[view.length - 1];
    if (!firstScrollDone.current) {
      firstScrollDone.current = true;
      lastMsgId.current = last?.id || null;
      const unread = chats.find(c => c.id === cid)?.unreadCount?.[uid] || 0;
      const others = view.filter(m => m.senderId !== uid);
      unreadAnchor.current = unread > 0 && others.length ? others[Math.max(0, others.length - unread)]?.id : null;
      const anchorEl = unreadAnchor.current && document.getElementById("unread-divider");
      if (anchorEl) anchorEl.scrollIntoView({ block: "start" });
      else el.scrollTop = el.scrollHeight;
      return;
    }
    if (last && last.id !== lastMsgId.current) {
      const nearBottom = el.scrollHeight - el.scrollTop - el.clientHeight < 160;
      lastMsgId.current = last.id;
      if (last.senderId === uid || nearBottom) el.scrollTo({ top: el.scrollHeight, behavior: "smooth" });
      else { setNewBelow(n => n + 1); if (!muted) sounds.receive(); }
    }
    if (pendingJump.current && document.getElementById(`m-${pendingJump.current}`)) {
      const id = pendingJump.current;
      pendingJump.current = null;
      jumpTo(id);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [view, loaded]);

  const onScroll = () => {
    const el = listRef.current;
    if (!el) return;
    const dist = el.scrollHeight - el.scrollTop - el.clientHeight;
    setAtBottom(dist < 200);
    if (dist < 60 && newBelow) setNewBelow(0);
    if (el.scrollTop < 120 && hasMore && !restoreScroll.current && loaded) {
      restoreScroll.current = { height: el.scrollHeight, top: el.scrollTop };
      setCount(c => c + PAGE_SIZE);
    }
  };

  const jumpTo = useCallback((id) => {
    const node = document.getElementById(`m-${id}`);
    if (!node) {
      if (count < 600) { pendingJump.current = id; setCount(600); }
      else pushToast({ title: "Message not found", body: "It may have been deleted." });
      return;
    }
    node.scrollIntoView({ behavior: "smooth", block: "center" });
    setFlashId(id);
    setTimeout(() => setFlashId(f => (f === id ? null : f)), 1600);
  }, [count]);

  // ── Search ───────────────────────────────────────────────────
  const hits = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return [];
    return view.filter(m => !m.deletedForEveryone && (m.text || "").toLowerCase().includes(q)).map(m => m.id);
  }, [query, view]);
  useEffect(() => { if (searchOn && count < 600) setCount(600); }, [searchOn, count]);
  useEffect(() => { setHitIdx(hits.length ? hits.length - 1 : 0); }, [hits.length, query]);
  const currentHit = hits[hitIdx];
  // Only jump when the selected hit changes (not when jumpTo's identity changes)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { if (currentHit) jumpTo(currentHit); }, [currentHit]);

  // ── Actions ──────────────────────────────────────────────────
  const base = useMemo(() => ({ chat, me }), [chat, me]);

  const sendText = useCallback((text, mentions) => {
    const reply = replyTo;
    setReplyTo(null);
    safe(sendMessage(cid, { ...base, text, replyTo: reply ? replyPayload(reply) : null, mentions }));
    setTimeout(() => scrollToBottom(true), 30);
  }, [cid, base, replyTo, scrollToBottom]);

  const sendOther = useCallback((payload) => {
    const reply = replyTo;
    setReplyTo(null);
    safe(sendMessage(cid, { ...base, ...payload, replyTo: reply ? replyPayload(reply) : null }));
    setTimeout(() => scrollToBottom(true), 30);
  }, [cid, base, replyTo, scrollToBottom]);

  const react = useCallback((m, emoji) => {
    if (m._pending) return;
    sounds.tap();
    const current = m.reactions?.[uid];
    safe(addReaction(cid, m.id, uid, current === emoji ? null : emoji));
  }, [cid, uid]);

  const onReply = useCallback((m) => { if (!m.deletedForEveryone && m.type !== "system") { setEditing(null); setReplyTo(m); } }, []);

  const openMenu = useCallback((at, m, mode) => {
    if (m.type === "system") return;
    if (mode === "reactions") {
      const entries = Object.entries(m.reactions || {}).filter(([, e]) => e);
      setMenu({
        at, header: <div className="menu-head">{entries.length} reaction{entries.length === 1 ? "" : "s"}</div>,
        items: entries.map(([u, e]) => ({
          label: `${u === uid ? "You (tap to remove)" : usersById[u]?.name || "Someone"}`,
          icon: <span style={{ fontSize: "1.1rem" }}>{e}</span>,
          onClick: () => u === uid && react(m, e),
        })),
      });
      return;
    }
    const mine = m.senderId === uid;
    const isStarred = starred.has(m.id);
    const pinned = chat?.pinnedMessage?.id === m.id;
    const canEdit = mine && m.type === "text" && !m.deletedForEveryone && Date.now() - toMillis(m.createdAt) < 15 * 60000;
    const deleted = m.deletedForEveryone;
    setMenu({
      at,
      header: !deleted && !m._pending ? (
        <div className="menu-reacts">
          {QUICK_REACTIONS.map(e => (
            <button key={e} className={m.reactions?.[uid] === e ? "on" : ""} onClick={() => { setMenu(null); react(m, e); }}>{e}</button>
          ))}
        </div>
      ) : null,
      items: [
        { label: "Reply", icon: <IoArrowUndoOutline />, onClick: () => onReply(m), hidden: deleted },
        { label: "Copy", icon: <IoCopyOutline />, hidden: deleted || !m.text, onClick: () => navigator.clipboard?.writeText(m.text).then(() => toastOk("Copied")).catch(() => {}) },
        { label: "Forward", icon: <IoArrowRedoOutline />, hidden: deleted || m._pending || m.viewOnce, onClick: () => setForwardMsg(m) },
        { label: isStarred ? "Unstar" : "Star", icon: isStarred ? <IoStar /> : <IoStarOutline />, hidden: deleted || m._pending || m.viewOnce, onClick: () => safe(starMessage(uid, cid, m, !isStarred, title)) },
        { label: pinned ? "Unpin" : "Pin", icon: <IoPinOutline />, hidden: deleted || m._pending || (group && !(chat?.admins || []).includes(uid)), onClick: () => safe(pinMessage(cid, pinned ? null : m)) },
        { label: "Edit", icon: <IoCreateOutline />, hidden: !canEdit, onClick: () => { setReplyTo(null); setEditing(m); } },
        { label: "Save", icon: <IoDownloadOutline />, hidden: deleted || m.viewOnce || !(m.type === "image" || m.type === "voice"), onClick: () => downloadDataUrl(m.type === "image" ? (m.image?.url || m.image) : m.voice?.url, `arhub-${m.id}.${m.type === "image" ? "jpg" : "webm"}`) },
        { label: "Info", icon: <IoInformationCircleOutline />, hidden: !mine || deleted || m._pending, onClick: () => setInfoMsg(m) },
        { divider: true },
        { label: "Delete", icon: <IoTrashOutline />, danger: true, hidden: m._pending, onClick: () => setDeleteMsg(m) },
      ],
    });
  }, [uid, usersById, starred, chat, group, cid, title, react, onReply]);

  const openImage = useCallback((m) => {
    if (m.viewOnce) {
      if (m.senderId === uid || !m.image || (m.openedBy || []).includes(uid)) return;
      setViewer({ ...m, _snap: true });
      return;
    }
    setViewer(m);
  }, [uid]);

  const exportChat = () => {
    const lines = view.map(m => `[${toDate(m.createdAt)?.toLocaleString() || ""}] ${m.type === "system" ? "" : (m.senderName || "") + ": "}${m.deletedForEveryone ? "<deleted>" : previewOf(m)}`);
    const blob = new Blob([`AR Hub chat export — ${title}\n\n${lines.join("\n")}\n`], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    downloadDataUrl(url, `AR Hub - ${title}.txt`);
    setTimeout(() => URL.revokeObjectURL(url), 2000);
  };

  const headerMenu = (at) => setMenu({
    at, items: [
      { label: group ? "Room info" : "Contact info", icon: <IoInformationCircleOutline />, onClick: () => setInfoOpen(true) },
      { label: "Search", icon: <IoSearch />, onClick: () => setSearchOn(true) },
      { label: muted ? "Unmute notifications" : "Mute notifications", icon: muted ? <IoVolumeHighOutline /> : <IoVolumeMuteOutline />, onClick: () => safe(muteChat(uid, cid, !muted)) },
      { label: "Disappearing messages", icon: <IoTimerOutline />, onClick: () => setInfoOpen("ephemeral") },
      { label: "Play a game", icon: <IoGameControllerOutline />, hidden: group, onClick: () => setGamesOpen(true) },
      { label: "Export chat", icon: <IoDocumentTextOutline />, onClick: exportChat },
      { divider: true },
      { label: group ? "Exit room" : iBlocked ? "Unblock" : "Block", icon: group ? <IoExitOutline /> : <IoBanOutline />, danger: true, onClick: () => setInfoOpen(true) },
    ],
  });

  // ── Render ───────────────────────────────────────────────────
  if (chatLoaded && !chat) {
    return (
      <div className="conv">
        <ConvHeaderBasic onBack={() => navigate("/chat")} title="Chat unavailable" />
        <Empty icon="🫥" title="This chat doesn't exist" body="It may have been deleted, or you were removed." action={<button className="btn btn-primary" onClick={() => navigate("/chat")}>Back to chats</button>} />
      </div>
    );
  }
  if (!chat) {
    return <div className="conv"><ConvHeaderBasic onBack={() => navigate("/chat")} title="" /><div className="page-loader"><Spinner /></div></div>;
  }

  let subtitle;
  if (typers.length) {
    subtitle = <span className="typing">{group ? `${typers.map(t => usersById[t]?.name?.split(" ")[0] || "Someone").slice(0, 2).join(", ")} ${typers.length > 1 ? "are" : "is"} typing` : "typing"}<span className="typing-dots"><i /><i /><i /></span></span>;
  } else if (group) {
    const online = members.filter(m => m.uid !== uid && m.status === "online").length;
    subtitle = `${members.length} member${members.length === 1 ? "" : "s"}${online ? ` · ${online} online` : ""}`;
  } else if (partner && !blockedMe) {
    subtitle = partner.status === "online" ? <span className="online-text">online</span> : lastSeenText(partner);
  } else subtitle = "";

  const wp = chat.wallpaper || localWallpaper || "doodle";
  let blockedText = null;
  if (!isMember) blockedText = group ? (
    chat.isPublic
      ? <button className="btn btn-primary" onClick={() => safe(joinRoom(cid, uid, me?.name))}>Join “{chat.name}”</button>
      : "You're not a member of this room."
  ) : "You can't send messages in this chat.";
  else if (iBlocked) blockedText = <span>You blocked {partner?.name}. <button className="link-btn" onClick={() => safe(unblockUser(uid, partnerId))}>Unblock</button></span>;
  else if (blockedMe) blockedText = "You can't reply to this conversation.";

  const lastIncoming = [...view].reverse().find(m => m.senderId !== uid && m.type !== "system");
  const lastIncomingIsLast = view[view.length - 1]?.id === lastIncoming?.id;

  // group rows
  const rows = [];
  let lastDay = null;
  view.forEach((m, i) => {
    const d = toDate(m.createdAt) || new Date();
    const day = d.toDateString();
    if (day !== lastDay) { rows.push({ sep: fmtDayLabel(d), key: "d" + day }); lastDay = day; }
    if (unreadAnchor.current && m.id === unreadAnchor.current) rows.push({ unread: true, key: "unread" });
    const prev = view[i - 1], next = view[i + 1];
    const gap = (a, b) => Math.abs(toMillis(a.createdAt) - toMillis(b.createdAt)) > 5 * 60000;
    const first = !prev || prev.senderId !== m.senderId || prev.type === "system" || gap(prev, m) || toDate(prev.createdAt)?.toDateString() !== day;
    const last = !next || next.senderId !== m.senderId || next.type === "system" || gap(m, next) || toDate(next.createdAt)?.toDateString() !== day;
    rows.push({ m, first, last, key: m.id });
  });

  return (
    <div className={`conv-wrap ${infoOpen ? "info-open" : ""}`}>
      <div className="conv">
        {searchOn ? (
          <header className="conv-head search-mode">
            <button className="icon-btn" onClick={() => { setSearchOn(false); setQuery(""); }} aria-label="Close search"><IoArrowBack /></button>
            <input className="conv-search" autoFocus value={query} onChange={e => setQuery(e.target.value)} placeholder="Search messages…"
              onKeyDown={e => { if (e.key === "Enter") setHitIdx(i => (e.shiftKey ? Math.min(hits.length - 1, i + 1) : Math.max(0, i - 1))); if (e.key === "Escape") { setSearchOn(false); setQuery(""); } }} />
            <span className="search-count">{query ? (hits.length ? `${hits.length - hitIdx}/${hits.length}` : "0") : ""}</span>
            <button className="icon-btn" disabled={!hits.length} onClick={() => setHitIdx(i => Math.max(0, i - 1))} aria-label="Previous"><IoChevronUp /></button>
            <button className="icon-btn" disabled={!hits.length} onClick={() => setHitIdx(i => Math.min(hits.length - 1, i + 1))} aria-label="Next"><IoChevronDown /></button>
          </header>
        ) : (
          <header className="conv-head">
            <button className="icon-btn back-btn" onClick={() => navigate("/chat")} aria-label="Back"><IoArrowBack /></button>
            <button className="conv-id" onClick={() => setInfoOpen(true)}>
              <ChatAvatar chat={chat} partner={blockedMe ? { name: partner?.name } : partner} size={42} />
              <span className="conv-id-text">
                <span className="conv-title">{title}{muted && <IoVolumeMuteOutline className="title-flag" />}</span>
                <span className="conv-sub">{subtitle}</span>
              </span>
            </button>
            <div className="conv-actions">
              {!group && isMember && !iBlocked && !blockedMe && (
                <>
                  <button className="icon-btn" title="Video call" onClick={() => initiateCall?.({ uid: partnerId, name: partner?.name, avatar: partner?.avatar }, "video")}><IoVideocamOutline /></button>
                  <button className="icon-btn" title="Voice call" onClick={() => initiateCall?.({ uid: partnerId, name: partner?.name, avatar: partner?.avatar }, "audio")}><IoCallOutline /></button>
                  <button className="icon-btn hide-xs" title="Play a game" onClick={() => setGamesOpen(true)}><IoGameControllerOutline /></button>
                </>
              )}
              <button className="icon-btn hide-xs" title="Search" onClick={() => setSearchOn(true)}><IoSearch /></button>
              <button className="icon-btn" title="Menu" onClick={(e) => { const r = e.currentTarget.getBoundingClientRect(); headerMenu({ x: r.right - 230, y: r.bottom + 4 }); }}><IoEllipsisVertical /></button>
            </div>
          </header>
        )}

        {chat.pinnedMessage && (
          <button className="pinned-bar" onClick={() => jumpTo(chat.pinnedMessage.id)}>
            <IoPin className="pinned-icon" />
            <span className="pinned-body"><strong>Pinned{chat.pinnedMessage.senderName ? ` · ${chat.pinnedMessage.senderName}` : ""}</strong><span>{chat.pinnedMessage.text}</span></span>
            {(!group || (chat.admins || []).includes(uid)) && (
              <span className="icon-btn sm" role="button" aria-label="Unpin" onClick={(e) => { e.stopPropagation(); safe(pinMessage(cid, null)); }}><IoClose /></span>
            )}
          </button>
        )}

        {gameInvite && !gamesOpen && (
          <div className="game-invite-bar">
            <span>🎮 <strong>{partner?.name}</strong> invited you to a game</span>
            <button className="btn btn-primary btn-sm" onClick={() => setGamesOpen(true)}>View</button>
          </div>
        )}

        <div className={`conv-body wp-${wp}`}>
          <div className="msg-list" ref={listRef} onScroll={onScroll}>
            {hasMore && <div className="load-older"><Spinner size={18} /></div>}
            {!hasMore && loaded && (
              <div className="e2e-note"><IoLockClosed /> {group ? `Room created${chat.createdAt ? ` ${fmtDayLabel(toDate(chat.createdAt)).toLowerCase()}` : ""}. Messages sync in real time to all members.` : "Messages are synced securely in real time. Only people in this chat can read them."}</div>
            )}
            {chat.ephemeral && <div className="sys-msg"><span>⏱️ Disappearing messages are on. New messages vanish after {chat.ephemeral <= 86400 ? "24 hours" : chat.ephemeral <= 604800 ? "7 days" : "90 days"}.</span></div>}
            {!loaded && <div className="page-loader"><Spinner /></div>}
            {loaded && view.length === 0 && (
              <div className="conv-empty">
                <ChatAvatar chat={chat} partner={partner} size={72} />
                <strong>{title}</strong>
                <span>{group ? chat.description || "Say hi to the room 👋" : "Say hi and start the conversation 👋"}</span>
                {isMember && !iBlocked && !blockedMe && <button className="btn btn-soft" onClick={() => sendText(group ? "Hey everyone! 👋" : "Hey! 👋", [])}>👋 Send a wave</button>}
              </div>
            )}
            {rows.map(r => r.sep ? (
              <div key={r.key} className="day-sep"><span>{r.sep}</span></div>
            ) : r.unread ? (
              <div key={r.key} id="unread-divider" className="unread-sep"><span>Unread messages</span></div>
            ) : (
              <MessageBubble
                key={r.key} msg={r.m} mine={r.m.senderId === uid} uid={uid} cid={cid} chat={chat} group={group}
                first={r.first} last={r.last} sender={usersById[r.m.senderId]} usersById={usersById}
                onReply={onReply} onMenu={openMenu} onReact={react} onOpenImage={openImage} onJump={jumpTo}
                query={searchOn ? query.trim() : ""} mentionNames={mentionNames} starred={starred.has(r.m.id)} flash={flashId === r.m.id}
              />
            ))}
            <div style={{ height: 6 }} />
          </div>

          {!atBottom && (
            <button className="to-bottom" onClick={() => scrollToBottom(true)} aria-label="Scroll to latest">
              <IoArrowDown />{newBelow > 0 && <span className="badge">{newBelow}</span>}
            </button>
          )}
        </div>

        <Composer
          key={cid}
          cid={cid} chat={chat} me={me} group={group} members={members} usersById={usersById}
          blocked={blockedText}
          lastIncoming={lastIncomingIsLast ? lastIncoming : null}
          replyTo={replyTo} onCancelReply={() => setReplyTo(null)}
          editing={editing} onCancelEdit={() => setEditing(null)}
          onEdit={(m, text) => safe(editMessage(cid, m.id, text))}
          onTyping={onTyping}
          onSendText={sendText}
          onSendImage={(img, caption, viewOnce) => sendOther({ type: "image", image: img, text: caption, viewOnce })}
          onSendVoice={(v) => sendOther({ type: "voice", voice: { url: v.url, duration: v.duration, mime: v.mime, waveform: v.waveform } })}
          onSendLocation={(loc) => sendOther({ type: "location", location: loc })}
          onSendPoll={(poll) => sendOther({ type: "poll", poll })}
          onOpenWhiteboard={() => setBoardOpen(true)}
        />
      </div>

      {infoOpen && (
        <ChatInfo
          chat={chat} partner={partner} members={members} focus={infoOpen === "ephemeral" ? "ephemeral" : null}
          onClose={() => setInfoOpen(false)} onJump={(id) => { setInfoOpen(false); setTimeout(() => jumpTo(id), 50); }}
          onOpenImage={openImage} media={view.filter(m => m.type === "image" && !m.viewOnce && !m.deletedForEveryone)}
          onSearch={() => { setInfoOpen(false); setSearchOn(true); }}
        />
      )}

      {menu && <Menu at={menu.at} items={menu.items} header={menu.header} onClose={() => setMenu(null)} />}
      <ForwardSheet msg={forwardMsg} onClose={() => setForwardMsg(null)} />
      <MessageInfoSheet msg={infoMsg} chat={chat} uid={uid} usersById={usersById} onClose={() => setInfoMsg(null)} />
      <DeleteSheet msg={deleteMsg} uid={uid} onClose={() => setDeleteMsg(null)}
        onForMe={(m) => safe(deleteMessage(cid, m.id, uid))}
        onForAll={(m) => { safe(deleteMessageForEveryone(cid, m.id)); if (chat.pinnedMessage?.id === m.id) safe(pinMessage(cid, null)); }} />
      {viewer && <ImageViewer msg={viewer} sender={usersById[viewer.senderId]} snap={viewer._snap}
        onClose={() => { if (viewer._snap) safe(openSnap(cid, viewer, uid, chat.members)); setViewer(null); }} />}

      <Sheet open={gamesOpen} onClose={() => setGamesOpen(false)} size="lg" className="games-sheet" hideClose>
        {gamesOpen && partner && (
          <Suspense fallback={<div className="page-loader" style={{ height: 300 }}><Spinner /></div>}>
          <GameHub myUid={uid} myName={me?.name || "Me"} partnerUid={partnerId} partnerName={partner.name} onClose={() => setGamesOpen(false)}
            onInvite={(label) => addNotification(partnerId, { type: "game_invite", fromUid: uid, senderName: me?.name, chatId: cid, text: `invited you to play ${label} 🎮` }).catch(() => {})} />
          </Suspense>
        )}
      </Sheet>

      <Sheet open={boardOpen} onClose={() => setBoardOpen(false)} title="Sketch" size="lg">
        {boardOpen && <Suspense fallback={<div className="page-loader" style={{ height: 300 }}><Spinner /></div>}><Whiteboard compact onSend={(img) => { setBoardOpen(false); sendOther({ type: "image", image: img, text: "" }); }} /></Suspense>}
      </Sheet>
    </div>
  );
}

function ConvHeaderBasic({ onBack, title }) {
  return (
    <header className="conv-head">
      <button className="icon-btn back-btn" onClick={onBack} aria-label="Back"><IoArrowBack /></button>
      <span className="conv-title" style={{ paddingLeft: 8 }}>{title}</span>
    </header>
  );
}

function MessageInfoSheet({ msg, chat, uid, usersById, onClose }) {
  if (!msg) return <Sheet open={false} />;
  const others = (chat?.members || []).filter(m => m !== uid);
  const read = others.filter(o => (msg.readBy || []).includes(o));
  const delivered = others.filter(o => !read.includes(o) && ((msg.deliveredTo || []).includes(o) || toMillis(chat?.deliveredAt?.[o]) >= toMillis(msg.createdAt)));
  const pending = others.filter(o => !read.includes(o) && !delivered.includes(o));
  const Section = ({ label, list, color }) => (
    <>
      <div className="section-label" style={{ color }}>{label} · {list.length}</div>
      {list.length === 0 && <div className="muted-text" style={{ padding: "0 1rem .5rem", fontSize: ".85rem" }}>—</div>}
      {list.map(u => (
        <div key={u} className="row" style={{ cursor: "default" }}>
          <Avatar src={usersById[u]?.avatar} name={usersById[u]?.name} size={36} />
          <div className="row-body"><div className="row-title">{usersById[u]?.name || "Unknown"}</div></div>
        </div>
      ))}
    </>
  );
  return (
    <Sheet open onClose={onClose} title="Message info" size="sm">
      <div className="info-preview">{previewOf(msg)}<span>{fmtTime(msg.createdAt)}</span></div>
      <Section label="Read by" list={read} color="var(--blue-tick)" />
      <Section label="Delivered to" list={delivered} />
      {pending.length > 0 && <Section label="Sent" list={pending} color="var(--text-3)" />}
    </Sheet>
  );
}

function DeleteSheet({ msg, uid, onClose, onForMe, onForAll }) {
  if (!msg) return null;
  const mine = msg.senderId === uid && !msg.deletedForEveryone;
  return (
    <Sheet open onClose={onClose} title="Delete message?" size="sm" hideClose>
      <div className="delete-actions">
        {mine && <button className="btn btn-danger btn-block" onClick={() => { onForAll(msg); onClose(); }}>Delete for everyone</button>}
        <button className="btn btn-outline btn-block" onClick={() => { onForMe(msg); onClose(); }}>Delete for me</button>
        <button className="btn btn-ghost btn-block" onClick={onClose}>Cancel</button>
      </div>
    </Sheet>
  );
}

const SNAP_SECONDS = 10;

export function ImageViewer({ msg, sender, onClose, snap = false }) {
  const [left, setLeft] = useState(SNAP_SECONDS);
  const closeRef = useRef(onClose);
  closeRef.current = onClose;
  useEffect(() => {
    const h = (e) => e.key === "Escape" && closeRef.current();
    window.addEventListener("keydown", h);
    return () => window.removeEventListener("keydown", h);
  }, []);
  // Snaps self-destruct after a short countdown
  useEffect(() => {
    if (!snap) return;
    const t0 = Date.now();
    const t = setInterval(() => {
      const l = SNAP_SECONDS - (Date.now() - t0) / 1000;
      if (l <= 0) { clearInterval(t); closeRef.current(); } else setLeft(l);
    }, 100);
    return () => clearInterval(t);
  }, [snap]);
  const url = msg.image?.url || msg.image;
  return (
    <div className={`viewer ${snap ? "snap" : ""}`} onClick={onClose} onContextMenu={snap ? (e) => e.preventDefault() : undefined}>
      {snap && <div className="snap-bar"><span style={{ width: `${(left / SNAP_SECONDS) * 100}%` }} /></div>}
      <div className="viewer-top" onClick={e => e.stopPropagation()}>
        <Avatar src={sender?.avatar} name={sender?.name || msg.senderName} size={38} />
        <div className="viewer-who"><strong>{sender?.name || msg.senderName}</strong><span>{toDate(msg.createdAt)?.toLocaleString()}</span></div>
        {!snap && <button className="icon-btn" onClick={() => downloadDataUrl(url, `arhub-${msg.id}.jpg`)} aria-label="Download"><IoDownloadOutline /></button>}
        <button className="icon-btn" onClick={onClose} aria-label="Close"><IoClose /></button>
      </div>
      <img src={url} alt={msg.text || "Photo"} onClick={e => e.stopPropagation()} />
      {msg.text && <div className="viewer-caption" onClick={e => e.stopPropagation()}>{msg.text}</div>}
    </div>
  );
}
