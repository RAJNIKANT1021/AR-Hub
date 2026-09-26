import React, { useMemo, useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  IoClose, IoCallOutline, IoVideocamOutline, IoSearch, IoStarOutline, IoTimerOutline, IoColorPaletteOutline,
  IoBanOutline, IoFlagOutline, IoTrashOutline, IoExitOutline, IoPersonAddOutline, IoLinkOutline, IoCopyOutline,
  IoShareSocialOutline, IoRefresh, IoCreateOutline, IoCheckmark, IoGlobeOutline, IoLockClosedOutline, IoEllipsisVertical,
  IoChatbubbleOutline, IoShieldCheckmarkOutline, IoPersonRemoveOutline, IoVolumeMuteOutline, IoPersonAdd, IoArrowBack,
} from "react-icons/io5";
import { useApp, toastError, toastOk } from "../../Context/ChatContext";
import { useCallManager } from "../../Components/Call/CallManager";
import { WALLPAPERS } from "../../Context/ThemeContext";
import {
  muteChat, setEphemeral, setChatWallpaper, blockUser, unblockUser, reportUser, clearChatHistory, deleteChat,
  updateRoom, addRoomMembers, removeRoomMember, setRoomAdmin, leaveRoom, deleteChatForEveryone, resetInviteCode,
  ensureChat, sendFriendRequest, unfriend, isGroup,
} from "../../lib/db";
import { lastSeenText, fmtDayLabel, toDate } from "../../lib/format";
import Avatar, { ChatAvatar } from "../common/Avatar";
import Sheet, { Confirm } from "../common/Sheet";
import Menu from "../common/Menu";
import { PersonRow } from "./NewChatSheet";

export const ROOM_EMOJIS = ["💬", "🚀", "🎮", "🎵", "📚", "💼", "⚽", "🍕", "🎨", "💻", "🌍", "🔥", "🎬", "🧠", "❤️", "🐶", "✈️", "📸"];
export const ROOM_COLORS = ["#6366f1", "#0ea5e9", "#10b981", "#f59e0b", "#ef4444", "#ec4899", "#8b5cf6", "#14b8a6", "#f97316", "#64748b"];
const EPHEMERAL = [
  { v: 0, label: "Off" },
  { v: 86400, label: "24 hours" },
  { v: 604800, label: "7 days" },
  { v: 7776000, label: "90 days" },
];
const safe = (p) => p.catch(toastError);

export const inviteLink = (code) => `${window.location.origin}/join/${code}`;

export async function shareInvite(chat) {
  const url = inviteLink(chat.inviteCode);
  const text = `Join “${chat.name}” on AR Hub`;
  try {
    if (navigator.share) { await navigator.share({ title: text, text, url }); return; }
  } catch { return; }
  await navigator.clipboard?.writeText(url).then(() => toastOk("Invite link copied")).catch(() => {});
}

export default function ChatInfo({ chat, partner, members, focus, onClose, onJump, onOpenImage, media, onSearch }) {
  const navigate = useNavigate();
  const { uid, me } = useApp();
  const { initiateCall } = useCallManager() || {};
  const [confirm, setConfirm] = useState(null);
  const [addOpen, setAddOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [memberMenu, setMemberMenu] = useState(null);
  const [reportOpen, setReportOpen] = useState(false);

  const group = isGroup(chat);
  const cid = chat.id;
  const isAdmin = group && (chat.admins || []).includes(uid);
  const muted = (me?.mutedChats || []).includes(cid);
  const iBlocked = partner && (me?.blocklist || []).includes(partner.uid);
  const isFriend = partner && (me?.friends || []).includes(partner.uid);
  const requested = partner && (me?.sentRequests || []).includes(partner.uid);
  const canEphemeral = !group || isAdmin;

  useEffect(() => {
    if (focus === "ephemeral") setTimeout(() => document.getElementById("info-ephemeral")?.scrollIntoView({ behavior: "smooth", block: "center" }), 120);
  }, [focus]);

  const sortedMembers = useMemo(() => [...members].sort((a, b) =>
    (b.uid === uid) - (a.uid === uid) ||
    ((chat.admins || []).includes(b.uid) - (chat.admins || []).includes(a.uid)) ||
    (a.name || "").localeCompare(b.name || "")), [members, chat.admins, uid]);

  const openMemberMenu = (e, m) => {
    if (m.uid === uid) return;
    const r = e.currentTarget.getBoundingClientRect();
    const mAdmin = (chat.admins || []).includes(m.uid);
    setMemberMenu({
      at: { x: Math.min(r.right - 220, window.innerWidth - 230), y: r.top + r.height / 2 },
      items: [
        { label: `Message ${m.name?.split(" ")[0] || ""}`, icon: <IoChatbubbleOutline />, onClick: async () => { const id = await ensureChat(uid, m.uid); navigate(`/chat/${id}`); } },
        { label: mAdmin ? "Dismiss as admin" : "Make room admin", icon: <IoShieldCheckmarkOutline />, hidden: !isAdmin, onClick: () => safe(setRoomAdmin(cid, m.uid, !mAdmin)) },
        { label: "Remove from room", icon: <IoPersonRemoveOutline />, danger: true, hidden: !isAdmin, onClick: () => setConfirm({ kind: "remove", m }) },
      ],
    });
  };

  return (
    <aside className="info-panel">
      <header className="info-head">
        <button className="icon-btn" onClick={onClose} aria-label="Close"><span className="mobile-only-inline"><IoArrowBack /></span><span className="desktop-only-inline"><IoClose /></span></button>
        <span className="info-head-title">{group ? "Room info" : "Contact info"}</span>
        {group && isAdmin && <button className="icon-btn" onClick={() => setEditOpen(true)} aria-label="Edit room"><IoCreateOutline /></button>}
      </header>

      <div className="info-scroll">
        <section className="info-hero">
          <ChatAvatar chat={chat} partner={partner} size={112} showOnline={false} />
          <h2>{group ? chat.name : partner?.name}</h2>
          <p className="info-sub">
            {group
              ? <>{chat.isPublic ? <><IoGlobeOutline /> Public room</> : <><IoLockClosedOutline /> Private room</>} · {members.length} member{members.length === 1 ? "" : "s"}</>
              : partner?.email || ""}
          </p>
          {!group && partner && <p className={`info-presence ${partner.status === "online" ? "on" : ""}`}>{lastSeenText(partner)}</p>}
          <div className="info-actions">
            {!group && partner && !iBlocked && (
              <>
                <button onClick={() => initiateCall?.({ uid: partner.uid, name: partner.name, avatar: partner.avatar }, "audio")}><IoCallOutline /><span>Audio</span></button>
                <button onClick={() => initiateCall?.({ uid: partner.uid, name: partner.name, avatar: partner.avatar }, "video")}><IoVideocamOutline /><span>Video</span></button>
              </>
            )}
            {group && <button onClick={() => shareInvite(chat)}><IoShareSocialOutline /><span>Invite</span></button>}
            {group && isAdmin && <button onClick={() => setAddOpen(true)}><IoPersonAddOutline /><span>Add</span></button>}
            <button onClick={onSearch}><IoSearch /><span>Search</span></button>
          </div>
        </section>

        {(group ? chat.description : partner?.bio) && (
          <section className="info-card">
            <div className="info-label">{group ? "Description" : "About"}</div>
            <p className="info-text">{group ? chat.description : partner.bio}</p>
            {group && chat.createdAt && <p className="info-meta">Created {fmtDayLabel(toDate(chat.createdAt)).toLowerCase()}</p>}
          </section>
        )}

        {!group && partner && (
          <section className="info-card">
            {isFriend
              ? <button className="info-row" onClick={() => setConfirm({ kind: "unfriend" })}><IoPersonRemoveOutline /><span>Remove from friends</span></button>
              : requested
                ? <div className="info-row" style={{ cursor: "default" }}><IoCheckmark /><span>Friend request sent</span></div>
                : <button className="info-row accent" onClick={() => safe(sendFriendRequest(uid, partner.uid, me?.name).then(() => toastOk("Friend request sent")))}><IoPersonAdd /><span>Add friend</span></button>}
          </section>
        )}

        {group && (
          <section className="info-card">
            <div className="info-label">Invite</div>
            <div className="invite-box">
              <IoLinkOutline />
              <span className="invite-url">{inviteLink(chat.inviteCode)}</span>
              <button className="icon-btn sm" onClick={() => navigator.clipboard?.writeText(inviteLink(chat.inviteCode)).then(() => toastOk("Link copied"))} aria-label="Copy link"><IoCopyOutline /></button>
            </div>
            <div className="invite-code">Code <strong>{chat.inviteCode}</strong>
              {isAdmin && <button className="link-btn" onClick={() => safe(resetInviteCode(cid).then(() => toastOk("Invite link reset")))}><IoRefresh /> Reset</button>}
            </div>
          </section>
        )}

        <section className="info-card">
          <div className="info-label">Media <span className="info-count">{media.length}</span></div>
          {media.length === 0 ? <p className="info-meta">No photos shared yet.</p> : (
            <div className="media-grid">
              {media.slice(-9).reverse().map(m => (
                <button key={m.id} onClick={() => onOpenImage(m)}><img src={m.image?.url || m.image} alt="" loading="lazy" /></button>
              ))}
            </div>
          )}
          <button className="info-row" onClick={() => navigate("/starred")}><IoStarOutline /><span>Starred messages</span></button>
        </section>

        <section className="info-card">
          <label className="info-row">
            <IoVolumeMuteOutline /><span>Mute notifications</span>
            <span className="switch"><input type="checkbox" checked={muted} onChange={() => safe(muteChat(uid, cid, !muted))} /><span /></span>
          </label>
          <div className="info-row col" id="info-ephemeral">
            <div className="row-line"><IoTimerOutline /><span>Disappearing messages</span></div>
            <div className="chips">
              {EPHEMERAL.map(o => (
                <button key={o.v} className={`chip ${(chat.ephemeral || 0) === o.v ? "active" : ""}`} disabled={!canEphemeral}
                  onClick={() => safe(setEphemeral(cid, o.v, uid, me?.name))}>{o.label}</button>
              ))}
            </div>
            {!canEphemeral && <span className="info-meta">Only admins can change this.</span>}
          </div>
          <div className="info-row col">
            <div className="row-line"><IoColorPaletteOutline /><span>Chat wallpaper</span></div>
            <div className="wp-picker">
              <button className={`wp-swatch ${!chat.wallpaper ? "on" : ""}`} onClick={() => safe(setChatWallpaper(cid, null))}><span>Default</span></button>
              {WALLPAPERS.map(w => (
                <button key={w.key} className={`wp-swatch wp-${w.key} ${chat.wallpaper === w.key ? "on" : ""}`} onClick={() => safe(setChatWallpaper(cid, w.key))} title={w.label}><span>{w.label}</span></button>
              ))}
            </div>
          </div>
        </section>

        {group && (
          <section className="info-card">
            <div className="info-label">{members.length} members</div>
            {isAdmin && <button className="info-row accent" onClick={() => setAddOpen(true)}><IoPersonAddOutline /><span>Add members</span></button>}
            <button className="info-row accent" onClick={() => shareInvite(chat)}><IoLinkOutline /><span>Invite via link</span></button>
            {sortedMembers.map(m => (
              <div key={m.uid} className="row member-row" onClick={(e) => openMemberMenu(e, m)}>
                <Avatar src={m.avatar} name={m.name} size={40} online={m.status === "online"} />
                <div className="row-body">
                  <div className="row-top"><span className="row-title">{m.uid === uid ? "You" : m.name}</span>{(chat.admins || []).includes(m.uid) && <span className="admin-tag">Admin</span>}</div>
                  <div className="row-sub">{m.bio || lastSeenText(m)}</div>
                </div>
                {m.uid !== uid && <IoEllipsisVertical className="row-flag" />}
              </div>
            ))}
          </section>
        )}

        <section className="info-card danger-zone">
          {group ? (
            <>
              <button className="info-row danger" onClick={() => setConfirm({ kind: "clear" })}><IoTrashOutline /><span>Clear chat</span></button>
              <button className="info-row danger" onClick={() => setConfirm({ kind: "leave" })}><IoExitOutline /><span>Exit room</span></button>
              {isAdmin && <button className="info-row danger" onClick={() => setConfirm({ kind: "destroy" })}><IoTrashOutline /><span>Delete room for everyone</span></button>}
            </>
          ) : (
            <>
              <button className="info-row danger" onClick={() => setConfirm({ kind: iBlocked ? "unblock" : "block" })}><IoBanOutline /><span>{iBlocked ? "Unblock" : "Block"} {partner?.name}</span></button>
              <button className="info-row danger" onClick={() => setReportOpen(true)}><IoFlagOutline /><span>Report {partner?.name}</span></button>
              <button className="info-row danger" onClick={() => setConfirm({ kind: "clear" })}><IoTrashOutline /><span>Clear chat</span></button>
              <button className="info-row danger" onClick={() => setConfirm({ kind: "delete" })}><IoTrashOutline /><span>Delete chat</span></button>
            </>
          )}
        </section>
        <div style={{ height: 40 }} />
      </div>

      {memberMenu && <Menu at={memberMenu.at} items={memberMenu.items} onClose={() => setMemberMenu(null)} />}
      {group && <AddMembersSheet open={addOpen} onClose={() => setAddOpen(false)} chat={chat} />}
      {group && <EditRoomSheet open={editOpen} onClose={() => setEditOpen(false)} chat={chat} />}
      <ReportSheet open={reportOpen} onClose={() => setReportOpen(false)} partner={partner} />

      <Confirm
        open={!!confirm}
        onClose={() => setConfirm(null)}
        danger={confirm?.kind !== "unblock"}
        title={{
          block: `Block ${partner?.name}?`, unblock: `Unblock ${partner?.name}?`, clear: "Clear this chat?",
          delete: "Delete this chat?", leave: `Exit “${chat.name}”?`, destroy: `Delete “${chat.name}” for everyone?`,
          remove: `Remove ${confirm?.m?.name}?`, unfriend: `Remove ${partner?.name} from friends?`,
        }[confirm?.kind]}
        body={{
          block: "Blocked contacts can't message or call you. They won't be notified.",
          clear: "Messages will be cleared for you only.",
          delete: "The chat will be removed from your list. The other person keeps their copy.",
          leave: "You'll stop receiving messages from this room.",
          destroy: "All messages will be permanently deleted for all members. This can't be undone.",
        }[confirm?.kind]}
        confirmLabel={{ block: "Block", unblock: "Unblock", clear: "Clear", delete: "Delete", leave: "Exit", destroy: "Delete room", remove: "Remove", unfriend: "Remove" }[confirm?.kind]}
        onConfirm={async () => {
          const k = confirm.kind;
          try {
            if (k === "block") { await blockUser(uid, partner.uid); toastOk(`${partner.name} blocked`); }
            if (k === "unblock") await unblockUser(uid, partner.uid);
            if (k === "unfriend") await unfriend(uid, partner.uid);
            if (k === "clear") { await clearChatHistory(uid, cid); toastOk("Chat cleared"); }
            if (k === "delete") { await deleteChat(uid, cid); navigate("/chat"); }
            if (k === "leave") { await leaveRoom(cid, uid, me?.name); navigate("/chat"); }
            if (k === "destroy") { navigate("/chat"); await deleteChatForEveryone(cid); }
            if (k === "remove") await removeRoomMember(cid, confirm.m.uid, uid, me?.name, confirm.m.name);
          } catch (e) { toastError(e); }
        }}
      />
    </aside>
  );
}

export function MemberPicker({ selected, onToggle, exclude = [] }) {
  const { uid, me, allUsers } = useApp();
  const [q, setQ] = useState("");
  const friends = me?.friends || [];
  const list = allUsers
    .filter(u => u.uid !== uid && !exclude.includes(u.uid) && !(me?.blocklist || []).includes(u.uid))
    .filter(u => !q || (u.name || "").toLowerCase().includes(q.toLowerCase()))
    .sort((a, b) => (friends.includes(b.uid) - friends.includes(a.uid)) || (a.name || "").localeCompare(b.name || ""));
  return (
    <>
      {selected.length > 0 && (
        <div className="picked">
          {selected.map(id => {
            const u = allUsers.find(x => x.uid === id);
            return <button key={id} className="picked-chip" onClick={() => onToggle(id)}><Avatar src={u?.avatar} name={u?.name} size={22} />{u?.name?.split(" ")[0]}<IoClose /></button>;
          })}
        </div>
      )}
      <label className="search" style={{ margin: "8px 0" }}><IoSearch /><input value={q} onChange={e => setQ(e.target.value)} placeholder="Search people" /></label>
      <div className="picker-list">
        {list.length === 0 && <p className="info-meta" style={{ padding: "1rem" }}>No people to add.</p>}
        {list.slice(0, 100).map(u => (
          <PersonRow key={u.uid} u={u} onClick={() => onToggle(u.uid)} sub={friends.includes(u.uid) ? "Friend" : undefined}
            right={<span className={`check ${selected.includes(u.uid) ? "on" : ""}`}>{selected.includes(u.uid) && <IoCheckmark />}</span>} />
        ))}
      </div>
    </>
  );
}

function AddMembersSheet({ open, onClose, chat }) {
  const { uid, me, usersById } = useApp();
  const [sel, setSel] = useState([]);
  const [busy, setBusy] = useState(false);
  useEffect(() => { if (open) setSel([]); }, [open]);
  const toggle = (id) => setSel(s => (s.includes(id) ? s.filter(x => x !== id) : [...s, id]));
  const add = async () => {
    setBusy(true);
    try {
      const names = Object.fromEntries(sel.map(id => [id, usersById[id]?.name]));
      await addRoomMembers(chat.id, sel, uid, me?.name, names);
      toastOk(`Added ${sel.length} member${sel.length === 1 ? "" : "s"}`);
      onClose();
    } catch (e) { toastError(e); } finally { setBusy(false); }
  };
  return (
    <Sheet open={open} onClose={onClose} title="Add members" size="md"
      footer={<><button className="btn btn-ghost" onClick={onClose}>Cancel</button><button className="btn btn-primary" disabled={!sel.length || busy} onClick={add}>{busy ? "Adding…" : `Add${sel.length ? ` (${sel.length})` : ""}`}</button></>}>
      <MemberPicker selected={sel} onToggle={toggle} exclude={chat.members || []} />
    </Sheet>
  );
}

function EditRoomSheet({ open, onClose, chat }) {
  const [name, setName] = useState(chat.name || "");
  const [desc, setDesc] = useState(chat.description || "");
  const [emoji, setEmoji] = useState(chat.emoji || "💬");
  const [color, setColor] = useState(chat.color || ROOM_COLORS[0]);
  const [isPublic, setIsPublic] = useState(!!chat.isPublic);
  useEffect(() => {
    if (open) { setName(chat.name || ""); setDesc(chat.description || ""); setEmoji(chat.emoji || "💬"); setColor(chat.color || ROOM_COLORS[0]); setIsPublic(!!chat.isPublic); }
  }, [open, chat]);
  const save = async () => {
    try { await updateRoom(chat.id, { name, description: desc, emoji, color, isPublic }); toastOk("Room updated"); onClose(); }
    catch (e) { toastError(e); }
  };
  return (
    <Sheet open={open} onClose={onClose} title="Edit room" size="md"
      footer={<><button className="btn btn-ghost" onClick={onClose}>Cancel</button><button className="btn btn-primary" disabled={!name.trim()} onClick={save}>Save</button></>}>
      <RoomFields {...{ name, setName, desc, setDesc, emoji, setEmoji, color, setColor, isPublic, setIsPublic }} />
    </Sheet>
  );
}

export function RoomFields({ name, setName, desc, setDesc, emoji, setEmoji, color, setColor, isPublic, setIsPublic }) {
  return (
    <>
      <div className="room-preview">
        <Avatar emoji={emoji} color={color} name={name} size={76} />
        <div className="emoji-grid">
          {ROOM_EMOJIS.map(e => <button key={e} className={emoji === e ? "on" : ""} onClick={() => setEmoji(e)}>{e}</button>)}
        </div>
      </div>
      <div className="color-row">
        {ROOM_COLORS.map(c => <button key={c} className={`color-dot ${color === c ? "on" : ""}`} style={{ background: c }} onClick={() => setColor(c)} aria-label={`Colour ${c}`} />)}
      </div>
      <div className="field">
        <span className="field-label">Room name</span>
        <input className="input" value={name} maxLength={60} onChange={e => setName(e.target.value)} placeholder="e.g. Weekend Hikers" autoFocus />
      </div>
      <div className="field">
        <span className="field-label">Description</span>
        <textarea className="textarea" value={desc} maxLength={300} onChange={e => setDesc(e.target.value)} placeholder="What's this room about?" />
      </div>
      <label className="setting-row" style={{ padding: ".25rem 0" }}>
        <span className="setting-text"><strong>{isPublic ? "🌍 Public room" : "🔒 Private room"}</strong><span>{isPublic ? "Anyone can find and join it from Discover." : "Only people with the invite link or code can join."}</span></span>
        <span className="switch"><input type="checkbox" checked={isPublic} onChange={e => setIsPublic(e.target.checked)} /><span /></span>
      </label>
    </>
  );
}

function ReportSheet({ open, onClose, partner }) {
  const { uid } = useApp();
  const [reason, setReason] = useState("Spam");
  const [andBlock, setAndBlock] = useState(true);
  const submit = async () => {
    try {
      await reportUser(uid, partner.uid, reason);
      if (andBlock) await blockUser(uid, partner.uid);
      toastOk("Report sent", "Thanks for helping keep AR Hub safe.");
      onClose();
    } catch (e) { toastError(e); }
  };
  return (
    <Sheet open={open} onClose={onClose} title={`Report ${partner?.name || ""}`} size="sm"
      footer={<><button className="btn btn-ghost" onClick={onClose}>Cancel</button><button className="btn btn-danger" onClick={submit}>Report</button></>}>
      <div className="chips wrap">
        {["Spam", "Harassment", "Fake account", "Inappropriate content", "Other"].map(r => (
          <button key={r} className={`chip ${reason === r ? "active" : ""}`} onClick={() => setReason(r)}>{r}</button>
        ))}
      </div>
      <label className="setting-row" style={{ padding: "1rem 0 0" }}>
        <span className="setting-text"><strong>Also block this person</strong></span>
        <span className="switch"><input type="checkbox" checked={andBlock} onChange={e => setAndBlock(e.target.checked)} /><span /></span>
      </label>
    </Sheet>
  );
}
