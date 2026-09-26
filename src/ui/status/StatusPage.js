import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { useNavigate, useSearchParams } from "react-router-dom";
import { IoAdd, IoCameraOutline, IoClose, IoSend, IoTrashOutline, IoEyeOutline, IoText, IoColorPaletteOutline, IoPencil } from "react-icons/io5";
import { useApp, toastError, toastOk } from "../../Context/ChatContext";
import { postStatus, subscribeStatuses, viewStatus, deleteStatus, ensureChat, sendMessage, getChat } from "../../lib/db";
import { compressImage } from "../../lib/media";
import { fmtRelative, toMillis } from "../../lib/format";
import Avatar from "../common/Avatar";
import Sheet from "../common/Sheet";
import Empty from "../common/Empty";

const BGS = ["#7c5cff", "#0ea5e9", "#10b981", "#f59e0b", "#ef4444", "#ec4899", "#111827", "linear-gradient(135deg,#7c5cff,#00c2a8)", "linear-gradient(135deg,#f97316,#ec4899)"];
const FONTS = ["'Inter', sans-serif", "Georgia, serif", "'Courier New', monospace", "'Brush Script MT', cursive"];
const DURATION = 5500;

export default function StatusPage() {
  const [params, setParams] = useSearchParams();
  const { uid, me, visibleChats, usersById } = useApp();
  const [all, setAll] = useState(null);
  const [viewing, setViewing] = useState(null); // { owner, index }
  const composeOpen = params.get("new") === "1";
  const [photo, setPhoto] = useState(null);
  const fileRef = useRef(null);

  useEffect(() => subscribeStatuses(setAll), []);

  // People whose status I can see: me, friends and anyone I have a DM with
  const circle = useMemo(() => {
    const s = new Set([uid, ...(me?.friends || [])]);
    visibleChats.forEach(c => { if (c.type !== "group") c.members?.forEach(m => s.add(m)); });
    (me?.blocklist || []).forEach(b => s.delete(b));
    return s;
  }, [uid, me, visibleChats]);

  const groups = useMemo(() => {
    const now = Date.now();
    const by = {};
    (all || []).filter(s => circle.has(s.uid) && toMillis(s.expiresAt) > now).forEach(s => { (by[s.uid] = by[s.uid] || []).push(s); });
    Object.values(by).forEach(list => list.sort((a, b) => toMillis(a.createdAt) - toMillis(b.createdAt)));
    return by;
  }, [all, circle]);

  const mine = groups[uid] || [];
  const others = Object.entries(groups).filter(([k]) => k !== uid).map(([owner, list]) => ({
    owner, list, seen: list.every(s => (s.viewers || []).includes(uid)), last: toMillis(list[list.length - 1].createdAt),
  }));
  const recent = others.filter(o => !o.seen).sort((a, b) => b.last - a.last);
  const viewed = others.filter(o => o.seen).sort((a, b) => b.last - a.last);
  const order = [...recent, ...viewed];

  const openOwner = (owner) => {
    const list = groups[owner] || [];
    const firstUnseen = list.findIndex(s => !(s.viewers || []).includes(uid));
    setViewing({ owner, index: owner === uid || firstUnseen < 0 ? 0 : firstUnseen });
  };

  const onPickPhoto = async (f) => {
    if (!f) return;
    try { setPhoto(await compressImage(f, 1080)); } catch (e) { toastError(e); }
  };

  return (
    <div className="page">
      <header className="page-header">
        <h1 className="page-title">Status</h1>
        <button className="icon-btn" title="Photo status" onClick={() => fileRef.current?.click()}><IoCameraOutline /></button>
        <button className="icon-btn" title="Text status" onClick={() => setParams({ new: "1" })}><IoPencil /></button>
      </header>
      <input ref={fileRef} type="file" accept="image/*" hidden onChange={e => { onPickPhoto(e.target.files?.[0]); e.target.value = ""; }} />
      <div className="page-body">
        <div className="page-inner">
          <div className="row status-me" onClick={() => (mine.length ? openOwner(uid) : setParams({ new: "1" }))}>
            <span className="status-me-avatar">
              <Avatar src={me?.avatar} name={me?.name} size={54} ring={mine.length ? "seen" : null} />
              {!mine.length && <span className="status-add"><IoAdd /></span>}
            </span>
            <div className="row-body">
              <div className="row-title">My status</div>
              <div className="row-sub">{mine.length ? `${mine.length} update${mine.length > 1 ? "s" : ""} · ${fmtRelative(mine[mine.length - 1].createdAt)}` : "Tap to add a status update"}</div>
            </div>
            {mine.length > 0 && <span className="row-meta"><IoEyeOutline /> {new Set(mine.flatMap(s => s.viewers || [])).size}</span>}
          </div>

          {all === null && <div className="page-loader" style={{ height: 120 }}><span className="spinner" style={{ width: 24, height: 24 }} /></div>}
          {all !== null && order.length === 0 && (
            <Empty icon="⭕" title="No status updates" body="Status updates from your friends and chats appear here for 24 hours. Share what you're up to!"
              action={<button className="btn btn-primary" onClick={() => setParams({ new: "1" })}>Post a status</button>} />
          )}
          {recent.length > 0 && <div className="section-label">Recent updates</div>}
          {recent.map(o => <StatusRow key={o.owner} o={o} user={usersById[o.owner]} onClick={() => openOwner(o.owner)} />)}
          {viewed.length > 0 && <div className="section-label">Viewed updates</div>}
          {viewed.map(o => <StatusRow key={o.owner} o={o} user={usersById[o.owner]} onClick={() => openOwner(o.owner)} />)}
        </div>
      </div>
      <button className="fab" aria-label="New status" onClick={() => setParams({ new: "1" })}><IoPencil /></button>

      <TextStatusSheet open={composeOpen} onClose={() => setParams({}, { replace: true })} />
      <PhotoStatusSheet photo={photo} onClose={() => setPhoto(null)} />
      {viewing && (
        <StoryViewer
          groups={groups} order={[...(mine.length ? [{ owner: uid }] : []), ...order].map(o => o.owner)}
          start={viewing} onClose={() => setViewing(null)}
        />
      )}
    </div>
  );
}

function StatusRow({ o, user, onClick }) {
  const last = o.list[o.list.length - 1];
  return (
    <div className="row" onClick={onClick}>
      <StatusThumb list={o.list} user={user} seen={o.seen} />
      <div className="row-body">
        <div className="row-title">{user?.name || last.name}</div>
        <div className="row-sub">{fmtRelative(last.createdAt)}</div>
      </div>
    </div>
  );
}

function StatusThumb({ list, user, seen }) {
  const n = list.length;
  const r = 29, c = 2 * Math.PI * r;
  const gap = n > 1 ? 4 : 0;
  const seg = c / n - gap;
  return (
    <span className="status-thumb">
      <svg viewBox="0 0 64 64" width="60" height="60">
        {list.map((s, i) => (
          <circle key={s.id} cx="32" cy="32" r={r} fill="none" strokeWidth="2.5" strokeLinecap="round"
            stroke={seen ? "var(--border-strong)" : "var(--accent)"} strokeDasharray={`${seg} ${c - seg}`}
            strokeDashoffset={-(i * (c / n)) + c / 4} />
        ))}
      </svg>
      <Avatar src={user?.avatar} name={user?.name} size={50} />
    </span>
  );
}

function TextStatusSheet({ open, onClose }) {
  const { me } = useApp();
  const [text, setText] = useState("");
  const [bg, setBg] = useState(0);
  const [font, setFont] = useState(0);
  const [busy, setBusy] = useState(false);
  useEffect(() => { if (open) { setText(""); setBg(Math.floor(Math.random() * BGS.length)); setFont(0); } }, [open]);
  if (!open) return null;
  const post = async () => {
    setBusy(true);
    try { await postStatus(me, { kind: "text", text: text.trim(), bg: BGS[bg], font }); toastOk("Status posted"); onClose(); }
    catch (e) { toastError(e); } finally { setBusy(false); }
  };
  return createPortal(
    <div className="status-compose" style={{ background: BGS[bg] }}>
      <div className="status-compose-top">
        <button className="icon-btn" onClick={onClose} aria-label="Close"><IoClose /></button>
        <div style={{ flex: 1 }} />
        <button className="icon-btn" onClick={() => setFont(f => (f + 1) % FONTS.length)} aria-label="Font"><IoText /></button>
        <button className="icon-btn" onClick={() => setBg(b => (b + 1) % BGS.length)} aria-label="Colour"><IoColorPaletteOutline /></button>
      </div>
      <textarea autoFocus value={text} maxLength={700} onChange={e => setText(e.target.value)} placeholder="Type a status" style={{ fontFamily: FONTS[font], fontSize: text.length > 120 ? "1.4rem" : text.length > 50 ? "1.9rem" : "2.4rem" }} />
      <div className="status-compose-foot">
        <span>{text.length}/700 · Visible for 24 hours</span>
        <button className="send-btn" disabled={!text.trim() || busy} onClick={post} aria-label="Post"><IoSend /></button>
      </div>
    </div>,
    document.body
  );
}

function PhotoStatusSheet({ photo, onClose }) {
  const { me } = useApp();
  const [caption, setCaption] = useState("");
  const [busy, setBusy] = useState(false);
  useEffect(() => { if (photo) setCaption(""); }, [photo]);
  const post = async () => {
    setBusy(true);
    try { await postStatus(me, { kind: "image", image: photo.url, text: caption.trim() }); toastOk("Status posted"); onClose(); }
    catch (e) { toastError(e); } finally { setBusy(false); }
  };
  return (
    <Sheet open={!!photo} onClose={onClose} title="Photo status" size="md"
      footer={<><input className="input" style={{ flex: 1 }} value={caption} onChange={e => setCaption(e.target.value)} placeholder="Add a caption…" onKeyDown={e => e.key === "Enter" && post()} /><button className="send-btn" disabled={busy} onClick={post} aria-label="Post"><IoSend /></button></>}>
      {photo && <img className="img-preview" src={photo.url} alt="" />}
    </Sheet>
  );
}

/* ── Full-screen story viewer ─────────────────────────────────── */
function StoryViewer({ groups, order, start, onClose }) {
  const navigate = useNavigate();
  const { uid, me, usersById } = useApp();
  const [owner, setOwner] = useState(start.owner);
  const [index, setIndex] = useState(start.index);
  const [progress, setProgress] = useState(0);
  const [paused, setPaused] = useState(false);
  const [reply, setReply] = useState("");
  const [viewersOpen, setViewersOpen] = useState(false);
  const raf = useRef(null);
  const startedAt = useRef(0);
  const elapsed = useRef(0);
  const pressAt = useRef(0);

  const list = groups[owner] || [];
  const story = list[index];
  const user = usersById[owner];
  const isMine = owner === uid;

  const next = useCallback(() => {
    if (index < list.length - 1) { setIndex(i => i + 1); return; }
    const pos = order.indexOf(owner);
    const nextOwner = order[pos + 1];
    if (nextOwner && groups[nextOwner]?.length) { setOwner(nextOwner); setIndex(0); }
    else onClose();
  }, [index, list.length, order, owner, groups, onClose]);

  const prev = useCallback(() => {
    if (index > 0) { setIndex(i => i - 1); return; }
    const pos = order.indexOf(owner);
    const prevOwner = order[pos - 1];
    if (prevOwner && groups[prevOwner]?.length) { setOwner(prevOwner); setIndex(groups[prevOwner].length - 1); }
    else { elapsed.current = 0; setProgress(0); }
  }, [index, order, owner, groups]);

  // mark viewed
  useEffect(() => {
    if (story && !isMine && !(story.viewers || []).includes(uid)) viewStatus(story.id, uid);
  }, [story, isMine, uid]);

  // timer
  useEffect(() => { elapsed.current = 0; setProgress(0); }, [owner, index]);
  useEffect(() => {
    if (!story) { onClose(); return; }
    const hold = paused || viewersOpen || !!reply;
    if (hold) return;
    startedAt.current = performance.now() - elapsed.current;
    const loop = (t) => {
      elapsed.current = t - startedAt.current;
      const p = Math.min(1, elapsed.current / DURATION);
      setProgress(p);
      if (p >= 1) { next(); return; }
      raf.current = requestAnimationFrame(loop);
    };
    raf.current = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf.current);
  }, [story, paused, viewersOpen, reply, next, onClose]);

  useEffect(() => {
    const h = (e) => {
      if (e.target.tagName === "INPUT") return;
      if (e.key === "ArrowRight") next();
      if (e.key === "ArrowLeft") prev();
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", h);
    return () => window.removeEventListener("keydown", h);
  }, [next, prev, onClose]);

  if (!story) return null;

  const sendReply = async () => {
    const text = reply.trim();
    if (!text) return;
    try {
      const cid = await ensureChat(uid, owner);
      const chat = await getChat(cid);
      await sendMessage(cid, { chat, me, text, replyTo: { id: story.id, text: `⭕ Status: ${story.kind === "image" ? "📷 Photo" : story.text}`.slice(0, 90), senderId: owner, senderName: user?.name || story.name, type: "status" } });
      setReply("");
      toastOk("Reply sent");
    } catch (e) { toastError(e); }
  };

  const tapZone = (e) => {
    if (Date.now() - pressAt.current > 280) return; // long-press = pause, not skip
    const r = e.currentTarget.getBoundingClientRect();
    if (e.clientX - r.left < r.width * 0.3) prev(); else next();
  };

  return createPortal(
    <div className="story" onContextMenu={e => e.preventDefault()}>
      <div className="story-frame">
        <div className="story-bars">
          {list.map((s, i) => (
            <span key={s.id}><i style={{ width: `${i < index ? 100 : i === index ? progress * 100 : 0}%` }} /></span>
          ))}
        </div>
        <div className="story-top">
          <Avatar src={user?.avatar || story.avatar} name={user?.name || story.name} size={38} />
          <div className="story-who"><strong>{isMine ? "My status" : user?.name || story.name}</strong><span>{fmtRelative(story.createdAt)}</span></div>
          {isMine && <button className="icon-btn" onClick={async () => { try { await deleteStatus(story.id); toastOk("Status deleted"); if (list.length <= 1) onClose(); else setIndex(i => Math.max(0, i - 1)); } catch (e) { toastError(e); } }} aria-label="Delete"><IoTrashOutline /></button>}
          <button className="icon-btn" onClick={onClose} aria-label="Close"><IoClose /></button>
        </div>
        <div className="story-content" style={story.kind === "text" ? { background: story.bg } : undefined}
          onClick={tapZone}
          onPointerDown={() => { pressAt.current = Date.now(); setPaused(true); }} onPointerUp={() => setPaused(false)} onPointerLeave={() => setPaused(false)}>
          {story.kind === "image"
            ? <><img src={story.image} alt="" draggable={false} />{story.text && <div className="story-caption">{story.text}</div>}</>
            : <div className="story-text" style={{ fontFamily: FONTS[story.font || 0], fontSize: story.text.length > 120 ? "1.35rem" : story.text.length > 50 ? "1.8rem" : "2.3rem" }}>{story.text}</div>}
        </div>
        <div className="story-bottom">
          {isMine ? (
            <button className="story-views" onClick={() => setViewersOpen(true)}><IoEyeOutline /> {(story.viewers || []).length} view{(story.viewers || []).length === 1 ? "" : "s"}</button>
          ) : (
            <div className="story-reply">
              <input value={reply} onChange={e => setReply(e.target.value)} onKeyDown={e => e.key === "Enter" && sendReply()} placeholder={`Reply to ${user?.name?.split(" ")[0] || "status"}…`} />
              {reply.trim()
                ? <button className="send-btn" onClick={sendReply} aria-label="Send reply"><IoSend /></button>
                : ["❤️", "😂", "🔥"].map(e => <button key={e} className="story-quick" onClick={() => { setReply(e); }}>{e}</button>)}
            </div>
          )}
        </div>
      </div>
      <Sheet open={viewersOpen} onClose={() => setViewersOpen(false)} title={`Viewed by ${(story.viewers || []).length}`} size="sm">
        {(story.viewers || []).length === 0 && <p className="info-meta" style={{ padding: "1rem 0" }}>No views yet.</p>}
        {(story.viewers || []).map(v => (
          <div key={v} className="row" onClick={async () => { const cid = await ensureChat(uid, v); onClose(); navigate(`/chat/${cid}`); }}>
            <Avatar src={usersById[v]?.avatar} name={usersById[v]?.name} size={40} />
            <div className="row-body"><div className="row-title">{usersById[v]?.name || "Someone"}</div></div>
          </div>
        ))}
      </Sheet>
    </div>,
    document.body
  );
}
