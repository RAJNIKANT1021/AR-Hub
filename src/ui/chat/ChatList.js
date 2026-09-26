import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  IoSearch, IoEllipsisVertical, IoCreateOutline, IoArchiveOutline, IoPinOutline, IoPin,
  IoVolumeMuteOutline, IoVolumeHighOutline, IoMailUnreadOutline, IoTrashOutline, IoPeopleOutline,
  IoStarOutline, IoSettingsOutline, IoCheckmarkDone, IoNotificationsOutline, IoClose, IoArrowBack,
  IoPersonAddOutline, IoMailOpenOutline,
} from "react-icons/io5";
import { useApp, toastError } from "../../Context/ChatContext";
import { pinChat, muteChat, archiveChat, markChatUnread, clearUnread, deleteChat, leaveRoom, isGroup } from "../../lib/db";
import { fmtListTime, toMillis } from "../../lib/format";
import { notificationPermission, requestNotificationPermission } from "../../lib/notify";
import { ChatAvatar } from "../common/Avatar";
import Menu, { useLongPress } from "../common/Menu";
import { Confirm } from "../common/Sheet";
import Empty, { SkeletonList } from "../common/Empty";
import NewChatSheet from "./NewChatSheet";
import { Ticks } from "./MessageBubble";
import { getDraft, useDraftVersion } from "./drafts";

const FILTERS = [
  { key: "all", label: "All" },
  { key: "unread", label: "Unread" },
  { key: "fav", label: "Pinned" },
  { key: "rooms", label: "Rooms" },
  { key: "dms", label: "Direct" },
];

export function activeTypers(chat, uid) {
  const now = Date.now();
  return Object.entries(chat?.typing || {})
    .filter(([k, v]) => k !== uid && v && now - toMillis(v) < 7000)
    .map(([k]) => k);
}

export default function ChatList({ activeId }) {
  const navigate = useNavigate();
  const { me, uid, visibleChats, chatsLoaded, chatTitle, chatPartner, usersById, unreadNotifs } = useApp();
  const [q, setQ] = useState("");
  const [filter, setFilter] = useState("all");
  const [showArchived, setShowArchived] = useState(false);
  const [newOpen, setNewOpen] = useState(false);
  const [menu, setMenu] = useState(null);
  const [confirm, setConfirm] = useState(null);
  const [perm, setPerm] = useState(notificationPermission());
  const [bannerHidden, setBannerHidden] = useState(() => localStorage.getItem("arhub_notif_banner") === "hidden");
  const [, tick] = useState(0);
  useDraftVersion();

  // re-render periodically so "typing…" expires
  useEffect(() => {
    const anyTyping = visibleChats.some(c => activeTypers(c, uid).length);
    if (!anyTyping) return;
    const t = setInterval(() => tick(x => x + 1), 3000);
    return () => clearInterval(t);
  }, [visibleChats, uid]);

  const { pinned, muted, archived, blocklist } = useMemo(() => ({
    pinned: me?.pinnedChats || [],
    muted: me?.mutedChats || [],
    archived: me?.archivedChats || [],
    blocklist: me?.blocklist || [],
  }), [me]);

  const rows = useMemo(() => {
    const s = q.trim().toLowerCase();
    return visibleChats
      .map(c => {
        const partner = chatPartner(c);
        return {
          chat: c, partner,
          title: chatTitle(c),
          unread: c.unreadCount?.[uid] || 0,
          pinned: pinned.includes(c.id),
          muted: muted.includes(c.id),
          archived: archived.includes(c.id),
          blocked: partner && blocklist.includes(partner.uid),
          ts: toMillis(c.lastMessageAt) || toMillis(c.createdAt),
        };
      })
      .filter(r => {
        if (s && !r.title.toLowerCase().includes(s) && !(r.chat.lastMessage || "").toLowerCase().includes(s)) return false;
        if (showArchived) return r.archived;
        if (r.archived && !s) return false;
        if (filter === "unread") return r.unread > 0;
        if (filter === "fav") return r.pinned;
        if (filter === "rooms") return isGroup(r.chat);
        if (filter === "dms") return !isGroup(r.chat);
        return true;
      })
      .sort((a, b) => (b.pinned - a.pinned) || (b.ts - a.ts));
  }, [visibleChats, q, filter, showArchived, pinned, muted, archived, blocklist, chatTitle, chatPartner, uid]);

  const archivedCount = visibleChats.filter(c => archived.includes(c.id)).length;
  const archivedUnread = visibleChats.filter(c => archived.includes(c.id) && c.unreadCount?.[uid] > 0).length;

  const open = (r) => navigate(`/chat/${r.chat.id}`);

  const rowMenu = (r) => [
    { label: r.pinned ? "Unpin chat" : "Pin chat", icon: <IoPinOutline />, onClick: () => pinChat(uid, r.chat.id, !r.pinned).catch(toastError) },
    { label: r.muted ? "Unmute notifications" : "Mute notifications", icon: r.muted ? <IoVolumeHighOutline /> : <IoVolumeMuteOutline />, onClick: () => muteChat(uid, r.chat.id, !r.muted).catch(toastError) },
    { label: r.unread ? "Mark as read" : "Mark as unread", icon: r.unread ? <IoMailOpenOutline /> : <IoMailUnreadOutline />, onClick: () => (r.unread ? clearUnread(uid, r.chat.id) : markChatUnread(uid, r.chat.id)).catch(toastError) },
    { label: r.archived ? "Unarchive" : "Archive", icon: <IoArchiveOutline />, onClick: () => archiveChat(uid, r.chat.id, !r.archived).catch(toastError) },
    { divider: true },
    isGroup(r.chat)
      ? { label: "Exit room", icon: <IoTrashOutline />, danger: true, onClick: () => setConfirm({ kind: "leave", r }) }
      : { label: "Delete chat", icon: <IoTrashOutline />, danger: true, onClick: () => setConfirm({ kind: "delete", r }) },
  ];

  const showBanner = perm === "default" && !bannerHidden;

  return (
    <div className="chatlist">
      <header className="chatlist-head">
        {showArchived ? (
          <>
            <button className="icon-btn" onClick={() => setShowArchived(false)} aria-label="Back"><IoArrowBack /></button>
            <h1 className="chatlist-title">Archived</h1>
          </>
        ) : (
          <>
            <h1 className="chatlist-title">Chats</h1>
            <button className="icon-btn mobile-only" title="Notifications" onClick={() => navigate("/notifications")}>
              <IoNotificationsOutline />{unreadNotifs > 0 && <span className="dot-badge">{unreadNotifs > 9 ? "9+" : unreadNotifs}</span>}
            </button>
            <button className="icon-btn" title="New chat" onClick={() => setNewOpen(true)}><IoCreateOutline /></button>
            <button className="icon-btn" title="Menu" onClick={(e) => { const r = e.currentTarget.getBoundingClientRect(); setMenu({ at: { x: r.right - 220, y: r.bottom + 4 }, items: [
              { label: "New room", icon: <IoPeopleOutline />, onClick: () => navigate("/rooms?new=1") },
              { label: "Contacts & requests", icon: <IoPersonAddOutline />, onClick: () => navigate("/contacts") },
              { label: "Starred messages", icon: <IoStarOutline />, onClick: () => navigate("/starred") },
              { label: "Mark all as read", icon: <IoCheckmarkDone />, onClick: () => visibleChats.forEach(c => c.unreadCount?.[uid] && clearUnread(uid, c.id)) },
              { label: "Settings", icon: <IoSettingsOutline />, onClick: () => navigate("/settings") },
            ] }); }}><IoEllipsisVertical /></button>
          </>
        )}
      </header>

      <div className="chatlist-tools">
        <label className="search">
          <IoSearch />
          <input value={q} onChange={e => setQ(e.target.value)} placeholder="Search chats or messages" aria-label="Search chats" />
          {q && <button className="icon-btn sm" onClick={() => setQ("")} aria-label="Clear"><IoClose /></button>}
        </label>
        {!showArchived && (
          <div className="chips">
            {FILTERS.map(f => (
              <button key={f.key} className={`chip ${filter === f.key ? "active" : ""}`} onClick={() => setFilter(f.key)}>{f.label}</button>
            ))}
          </div>
        )}
      </div>

      <div className="chatlist-scroll">
        {showBanner && !showArchived && (
          <div className="notif-banner">
            <div className="notif-banner-icon"><IoNotificationsOutline /></div>
            <div className="notif-banner-text">
              <strong>Turn on notifications</strong>
              <span>Get notified of new messages even when AR Hub is in the background.</span>
            </div>
            <button className="btn btn-primary btn-sm" onClick={async () => setPerm(await requestNotificationPermission())}>Enable</button>
            <button className="icon-btn sm" aria-label="Dismiss" onClick={() => { localStorage.setItem("arhub_notif_banner", "hidden"); setBannerHidden(true); }}><IoClose /></button>
          </div>
        )}

        {!showArchived && archivedCount > 0 && filter === "all" && !q && (
          <button className="row archived-row" onClick={() => setShowArchived(true)}>
            <span className="archived-icon"><IoArchiveOutline /></span>
            <span className="row-body"><span className="row-title">Archived</span></span>
            <span className="row-meta">{archivedUnread > 0 ? <span className="badge">{archivedUnread}</span> : archivedCount}</span>
          </button>
        )}

        {!chatsLoaded && rows.length === 0 && <SkeletonList />}

        {chatsLoaded && rows.length === 0 && (
          q ? <Empty icon="🔍" title="No results" body={`Nothing matches “${q}”.`} />
            : showArchived ? <Empty icon="🗄️" title="No archived chats" />
            : filter !== "all" ? <Empty icon="🫧" title="Nothing here" body="Try another filter." action={<button className="btn btn-soft btn-sm" onClick={() => setFilter("all")}>Show all</button>} />
            : <Empty icon="👋" title="Start your first conversation" body="Message a friend, create a room, or discover public rooms."
                action={<div style={{ display: "flex", gap: 8 }}><button className="btn btn-primary" onClick={() => setNewOpen(true)}>New chat</button><button className="btn btn-ghost" onClick={() => navigate("/rooms")}>Explore rooms</button></div>} />
        )}

        {rows.map(r => (
          <ChatRow key={r.chat.id} r={r} uid={uid} usersById={usersById} active={r.chat.id === activeId}
            onOpen={() => open(r)} onMenu={(at) => setMenu({ at, items: rowMenu(r) })} />
        ))}
        <div style={{ height: 90 }} />
      </div>

      <button className="fab mobile-only" aria-label="New chat" onClick={() => setNewOpen(true)}><IoCreateOutline /></button>

      {menu && <Menu at={menu.at} items={menu.items} onClose={() => setMenu(null)} />}
      <NewChatSheet open={newOpen} onClose={() => setNewOpen(false)} />
      <Confirm
        open={!!confirm}
        onClose={() => setConfirm(null)}
        danger
        title={confirm?.kind === "leave" ? `Exit “${confirm?.r.title}”?` : `Delete chat with ${confirm?.r.title}?`}
        body={confirm?.kind === "leave" ? "You'll stop receiving messages from this room. You can rejoin with an invite." : "Messages will be removed from this device's view. The other person keeps their copy."}
        confirmLabel={confirm?.kind === "leave" ? "Exit room" : "Delete chat"}
        onConfirm={async () => {
          const r = confirm.r;
          try {
            if (confirm.kind === "leave") await leaveRoom(r.chat.id, uid, me?.name);
            else await deleteChat(uid, r.chat.id);
            if (activeId === r.chat.id) navigate("/chat");
          } catch (e) { toastError(e); }
        }}
      />
    </div>
  );
}

function ChatRow({ r, uid, usersById, active, onOpen, onMenu }) {
  const { wasLongPress, ...lp } = useLongPress(onMenu);
  const { chat, partner } = r;
  const typers = activeTypers(chat, uid);
  const draft = !active ? getDraft(chat.id) : "";
  const mine = chat.lastMessageSenderId === uid;
  const group = isGroup(chat);

  let sub;
  if (typers.length) {
    sub = <span className="typing">{group ? `${usersById[typers[0]]?.name?.split(" ")[0] || "Someone"} is typing…` : "typing…"}</span>;
  } else if (draft) {
    sub = <><span className="draft-label">Draft:</span> {draft}</>;
  } else if (!chat.lastMessage) {
    sub = <em className="muted-text">{group ? "Room created — say hi 👋" : "Tap to start chatting"}</em>;
  } else {
    const others = (chat.members || []).filter(m => m !== uid);
    const read = others.length > 0 && others.every(o => !(chat.unreadCount?.[o] > 0));
    const delivered = others.every(o => toMillis(chat.deliveredAt?.[o]) >= toMillis(chat.lastMessageAt));
    const senderName = group && !mine && chat.lastMessageType !== "system"
      ? (usersById[chat.lastMessageSenderId]?.name?.split(" ")[0] || chat.lastMessageSenderName?.split(" ")[0])
      : null;
    sub = (
      <>
        {mine && chat.lastMessageType !== "system" && <Ticks state={read ? "read" : delivered ? "delivered" : "sent"} />}
        {senderName && <span className="sender-prefix">{senderName}:</span>}
        <span className="ellipsis">{chat.lastMessage}</span>
      </>
    );
  }

  return (
    <div className={`row chat-row ${active ? "active" : ""} ${r.unread ? "unread" : ""}`} onClick={() => !wasLongPress() && onOpen()} {...lp}
      role="button" tabIndex={0} onKeyDown={(e) => e.key === "Enter" && onOpen()}>
      <ChatAvatar chat={chat} partner={partner} size={50} />
      <div className="row-body">
        <div className="row-top">
          <span className="row-title">{r.title}</span>
          <span className={`row-meta ${r.unread && !r.muted ? "accent" : ""}`}>{fmtListTime(chat.lastMessageAt || chat.createdAt)}</span>
        </div>
        <div className="row-bottom">
          <span className="row-sub">{sub}</span>
          {r.muted && <IoVolumeMuteOutline className="row-flag" />}
          {r.pinned && <IoPin className="row-flag" />}
          {r.unread > 0 && <span className={`badge ${r.muted ? "muted" : ""}`}>{r.unread > 99 ? "99+" : r.unread}</span>}
        </div>
      </div>
      <button className="row-more" aria-label="Chat options" onClick={(e) => { e.stopPropagation(); const b = e.currentTarget.getBoundingClientRect(); onMenu({ x: b.left - 180, y: b.bottom }); }}>
        <IoEllipsisVertical />
      </button>
    </div>
  );
}
