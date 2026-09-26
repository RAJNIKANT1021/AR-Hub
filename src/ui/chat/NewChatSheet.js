import React, { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import Fuse from "fuse.js";
import { IoSearch, IoPeopleOutline, IoKeypadOutline, IoPersonAddOutline } from "react-icons/io5";
import { useApp, toastError } from "../../Context/ChatContext";
import { ensureChat } from "../../lib/db";
import { lastSeenText } from "../../lib/format";
import Sheet from "../common/Sheet";
import Avatar from "../common/Avatar";
import Empty from "../common/Empty";

export default function NewChatSheet({ open, onClose }) {
  const navigate = useNavigate();
  const { uid, me, allUsers } = useApp();
  const [q, setQ] = useState("");
  const [busy, setBusy] = useState(null);

  const people = useMemo(() => {
    const blocked = me?.blocklist || [];
    const friends = me?.friends || [];
    const list = allUsers.filter(u => u.uid !== uid && !blocked.includes(u.uid));
    const res = q.trim()
      ? new Fuse(list, { keys: ["name", "email"], threshold: 0.38 }).search(q.trim()).map(r => r.item)
      : list.sort((a, b) => (friends.includes(b.uid) - friends.includes(a.uid)) || (b.status === "online") - (a.status === "online") || (a.name || "").localeCompare(b.name || ""));
    return res.slice(0, 80).map(u => ({ ...u, friend: friends.includes(u.uid) }));
  }, [allUsers, uid, me, q]);

  const start = async (u) => {
    setBusy(u.uid);
    try {
      const cid = await ensureChat(uid, u.uid);
      onClose();
      setQ("");
      navigate(`/chat/${cid}`);
    } catch (e) { toastError(e); } finally { setBusy(null); }
  };

  const friends = people.filter(p => p.friend);
  const others = people.filter(p => !p.friend);

  return (
    <Sheet open={open} onClose={onClose} title="New chat" size="md">
      <label className="search" style={{ marginBottom: 12 }}>
        <IoSearch />
        <input autoFocus value={q} onChange={e => setQ(e.target.value)} placeholder="Search name or email" />
      </label>
      {!q && (
        <div className="quick-actions">
          <button className="row" onClick={() => { onClose(); navigate("/rooms?new=1"); }}>
            <span className="qa-icon"><IoPeopleOutline /></span><span className="row-title">New room</span>
          </button>
          <button className="row" onClick={() => { onClose(); navigate("/rooms?join=1"); }}>
            <span className="qa-icon"><IoKeypadOutline /></span><span className="row-title">Join room with code</span>
          </button>
          <button className="row" onClick={() => { onClose(); navigate("/contacts"); }}>
            <span className="qa-icon"><IoPersonAddOutline /></span><span className="row-title">Friend requests & contacts</span>
          </button>
        </div>
      )}
      {people.length === 0 && <Empty icon="🔍" title="No people found" body={q ? `No one matches “${q}”.` : "Invite friends to join AR Hub!"} />}
      {friends.length > 0 && <div className="section-label">Friends</div>}
      {friends.map(u => <PersonRow key={u.uid} u={u} busy={busy === u.uid} onClick={() => start(u)} />)}
      {others.length > 0 && <div className="section-label">{friends.length ? "Everyone on AR Hub" : "People on AR Hub"}</div>}
      {others.map(u => <PersonRow key={u.uid} u={u} busy={busy === u.uid} onClick={() => start(u)} />)}
    </Sheet>
  );
}

export function PersonRow({ u, onClick, busy, right, sub }) {
  return (
    <div className="row" onClick={onClick} role="button" tabIndex={0} onKeyDown={e => e.key === "Enter" && onClick?.()}>
      <Avatar src={u.avatar} name={u.name} size={44} online={u.status === "online"} />
      <div className="row-body">
        <div className="row-title">{u.name}</div>
        <div className="row-sub">{sub ?? (u.status === "online" ? <span className="online-text">online</span> : (u.bio || lastSeenText(u)))}</div>
      </div>
      {busy ? <span className="spinner" style={{ width: 18, height: 18 }} /> : right}
    </div>
  );
}
