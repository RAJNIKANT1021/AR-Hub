import React, { useEffect, useMemo, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { IoAdd, IoKeypadOutline, IoSearch, IoGlobeOutline, IoPeople, IoArrowForward } from "react-icons/io5";
import { useApp, toastError, toastOk } from "../../Context/ChatContext";
import { createRoom, subscribePublicRooms, joinRoom, findRoomByCode, isGroup } from "../../lib/db";
import { fmtListTime, toMillis } from "../../lib/format";
import Avatar from "../common/Avatar";
import Sheet from "../common/Sheet";
import Empty, { SkeletonList } from "../common/Empty";
import { RoomFields, MemberPicker, ROOM_COLORS } from "../chat/ChatInfo";

export default function RoomsPage() {
  const navigate = useNavigate();
  const [params, setParams] = useSearchParams();
  const { uid, me, visibleChats } = useApp();
  const [tab, setTab] = useState("mine");
  const [publicRooms, setPublicRooms] = useState(null);
  const [q, setQ] = useState("");
  const createOpen = params.get("new") === "1";
  const joinOpen = params.get("join") === "1";
  const closeParam = () => setParams({}, { replace: true });

  useEffect(() => subscribePublicRooms(setPublicRooms), []);

  const myRooms = useMemo(() => visibleChats.filter(c => isGroup(c) && c.members?.includes(uid))
    .filter(c => !q || c.name?.toLowerCase().includes(q.toLowerCase()))
    .sort((a, b) => toMillis(b.lastMessageAt || b.createdAt) - toMillis(a.lastMessageAt || a.createdAt)), [visibleChats, uid, q]);

  const discover = useMemo(() => (publicRooms || [])
    .filter(r => !q || r.name?.toLowerCase().includes(q.toLowerCase()) || r.description?.toLowerCase().includes(q.toLowerCase()))
    .sort((a, b) => (b.members?.length || 0) - (a.members?.length || 0)), [publicRooms, q]);

  const join = async (r) => {
    try {
      if (!r.members?.includes(uid)) { await joinRoom(r.id, uid, me?.name); toastOk(`Joined ${r.name}`); }
      navigate(`/chat/${r.id}`);
    } catch (e) { toastError(e); }
  };

  return (
    <div className="page">
      <header className="page-header">
        <h1 className="page-title">Rooms</h1>
        <button className="btn btn-ghost btn-sm" onClick={() => setParams({ join: "1" })}><IoKeypadOutline /> Join</button>
        <button className="btn btn-primary btn-sm" onClick={() => setParams({ new: "1" })}><IoAdd /> New room</button>
      </header>
      <div className="page-body">
        <div className="page-inner wide">
          <div className="rooms-hero">
            <div>
              <h2>Group chats, reimagined</h2>
              <p>Create public communities or private rooms, invite with a link or code, run polls, pin announcements and @mention members.</p>
            </div>
            <div className="rooms-hero-emojis" aria-hidden>🚀🎮🎵📚💼</div>
          </div>

          <div className="rooms-toolbar">
            <div className="seg">
              <button className={tab === "mine" ? "on" : ""} onClick={() => setTab("mine")}>My rooms <span>{myRooms.length}</span></button>
              <button className={tab === "discover" ? "on" : ""} onClick={() => setTab("discover")}><IoGlobeOutline /> Discover</button>
            </div>
            <label className="search"><IoSearch /><input value={q} onChange={e => setQ(e.target.value)} placeholder={tab === "mine" ? "Search my rooms" : "Search public rooms"} /></label>
          </div>

          {tab === "mine" && (
            myRooms.length === 0
              ? <Empty icon="👥" title="No rooms yet" body="Create a room for your friends, team or community — or discover public rooms."
                  action={<div style={{ display: "flex", gap: 8 }}><button className="btn btn-primary" onClick={() => setParams({ new: "1" })}>Create room</button><button className="btn btn-ghost" onClick={() => setTab("discover")}>Discover</button></div>} />
              : <div className="room-grid">{myRooms.map(r => <RoomCard key={r.id} r={r} uid={uid} onOpen={() => navigate(`/chat/${r.id}`)} />)}</div>
          )}

          {tab === "discover" && (
            publicRooms === null ? <SkeletonList rows={4} />
              : discover.length === 0
                ? <Empty icon="🌍" title="No public rooms yet" body="Be the first! Create a room and set it to public." action={<button className="btn btn-primary" onClick={() => setParams({ new: "1" })}>Create public room</button>} />
                : <div className="room-grid">{discover.map(r => <RoomCard key={r.id} r={r} uid={uid} onOpen={() => join(r)} discover />)}</div>
          )}
        </div>
      </div>

      <CreateRoomSheet open={createOpen} onClose={closeParam} onCreated={(id) => navigate(`/chat/${id}`, { replace: true })} />
      <JoinCodeSheet open={joinOpen} onClose={closeParam} />
    </div>
  );
}

function RoomCard({ r, uid, onOpen, discover }) {
  const member = r.members?.includes(uid);
  const unread = r.unreadCount?.[uid] || 0;
  return (
    <button className="room-card card" onClick={onOpen}>
      <div className="room-card-top">
        <Avatar emoji={r.emoji || "💬"} color={r.color} name={r.name} size={52} />
        <div className="room-card-id">
          <strong>{r.name}</strong>
          <span><IoPeople /> {r.members?.length || 0} member{r.members?.length === 1 ? "" : "s"}{r.isPublic ? " · Public" : " · Private"}</span>
        </div>
        {unread > 0 && !discover && <span className="badge">{unread}</span>}
      </div>
      <p className="room-card-desc">{r.description || (r.lastMessage ? r.lastMessage : "No description")}</p>
      <div className="room-card-foot">
        <span className="muted-text">{r.lastMessageAt ? `Active ${fmtListTime(r.lastMessageAt)}` : "New room"}</span>
        <span className={`btn btn-sm ${discover && !member ? "btn-primary" : "btn-soft"}`}>{discover && !member ? "Join" : "Open"} <IoArrowForward /></span>
      </div>
    </button>
  );
}

function CreateRoomSheet({ open, onClose, onCreated }) {
  const { uid, me } = useApp();
  const [step, setStep] = useState(1);
  const [name, setName] = useState("");
  const [desc, setDesc] = useState("");
  const [emoji, setEmoji] = useState("🚀");
  const [color, setColor] = useState(ROOM_COLORS[0]);
  const [isPublic, setIsPublic] = useState(false);
  const [sel, setSel] = useState([]);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (open) { setStep(1); setName(""); setDesc(""); setEmoji("🚀"); setColor(ROOM_COLORS[Math.floor(Math.random() * ROOM_COLORS.length)]); setIsPublic(false); setSel([]); }
  }, [open]);

  const create = async () => {
    setBusy(true);
    try {
      const id = await createRoom({ name, description: desc, emoji, color, isPublic, members: sel, createdBy: uid, creatorName: me?.name });
      toastOk("Room created", `Share the invite link to bring people in.`);
      onClose();
      onCreated(id);
    } catch (e) { toastError(e); } finally { setBusy(false); }
  };

  return (
    <Sheet open={open} onClose={onClose} title={step === 1 ? "New room" : "Add members"} size="md"
      footer={step === 1
        ? <><button className="btn btn-ghost" onClick={onClose}>Cancel</button><button className="btn btn-primary" disabled={!name.trim()} onClick={() => setStep(2)}>Next</button></>
        : <><button className="btn btn-ghost" onClick={() => setStep(1)}>Back</button><button className="btn btn-primary" disabled={busy} onClick={create}>{busy ? "Creating…" : sel.length ? `Create with ${sel.length}` : "Create room"}</button></>}>
      {step === 1
        ? <RoomFields {...{ name, setName, desc, setDesc, emoji, setEmoji, color, setColor, isPublic, setIsPublic }} />
        : <>
            <p className="info-meta" style={{ padding: 0, marginBottom: 6 }}>Optional — you can also invite people later with a link.</p>
            <MemberPicker selected={sel} onToggle={(id) => setSel(s => (s.includes(id) ? s.filter(x => x !== id) : [...s, id]))} />
          </>}
    </Sheet>
  );
}

function JoinCodeSheet({ open, onClose }) {
  const navigate = useNavigate();
  const { uid, me } = useApp();
  const [code, setCode] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  useEffect(() => { if (open) { setCode(""); setErr(""); } }, [open]);

  const go = async () => {
    const c = code.trim().split("/").pop();
    if (!c) return;
    setBusy(true); setErr("");
    try {
      const room = await findRoomByCode(c);
      if (!room) { setErr("No room found with that code."); return; }
      if (!room.members?.includes(uid)) await joinRoom(room.id, uid, me?.name);
      onClose();
      navigate(`/chat/${room.id}`);
    } catch (e) { setErr(e.message); } finally { setBusy(false); }
  };

  return (
    <Sheet open={open} onClose={onClose} title="Join a room" size="sm"
      footer={<><button className="btn btn-ghost" onClick={onClose}>Cancel</button><button className="btn btn-primary" disabled={!code.trim() || busy} onClick={go}>{busy ? "Joining…" : "Join"}</button></>}>
      <div className="field">
        <span className="field-label">Invite code or link</span>
        <input className="input code-input" autoFocus value={code} onChange={e => setCode(e.target.value)} onKeyDown={e => e.key === "Enter" && go()} placeholder="e.g. K3F9QZ" />
      </div>
      {err && <p className="form-error">{err}</p>}
    </Sheet>
  );
}
