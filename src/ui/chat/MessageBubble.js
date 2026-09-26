import React, { memo, useEffect, useRef, useState } from "react";
import { IoPlay, IoPause, IoLocationSharp, IoArrowUndo, IoStar, IoTimeOutline } from "react-icons/io5";
import { RichText, fmtTime, fmtDuration, isEmojiOnly, toMillis, colorFor } from "../../lib/format";
import { votePoll } from "../../lib/db";
import { toastError } from "../../Context/ChatContext";
import { useLongPress } from "../common/Menu";
import Avatar from "../common/Avatar";

export function Ticks({ state }) {
  if (state === "pending") return <IoTimeOutline className="ticks pending" title="Sending…" />;
  const dbl = state === "delivered" || state === "read";
  return (
    <svg className={`ticks ${state}`} viewBox="0 0 18 12" width="17" height="12" aria-label={state}>
      <path d="M1.5 6.5l3.2 3.2L11 3" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />
      {dbl && <path d="M8.4 8.4l1.3 1.3L16.2 3" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />}
    </svg>
  );
}

export function tickState(msg, chat, uid) {
  if (msg._pending) return "pending";
  const others = (chat?.members || []).filter(m => m !== uid);
  if (!others.length) return "sent";
  if (others.every(o => (msg.readBy || []).includes(o))) return "read";
  const t = toMillis(msg.createdAt);
  if (others.every(o => (msg.deliveredTo || []).includes(o) || toMillis(chat?.deliveredAt?.[o]) >= t)) return "delivered";
  return "sent";
}

/* ── Voice note player ────────────────────────────────────────── */
let currentAudio = null;
export function VoicePlayer({ voice, mine, avatar, name }) {
  const audioRef = useRef(null);
  const [playing, setPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [rate, setRate] = useState(1);
  const [cur, setCur] = useState(0);
  const bars = voice?.waveform?.length ? voice.waveform : Array(40).fill(0.3);
  const duration = voice?.duration || 0;

  useEffect(() => () => { audioRef.current?.pause(); }, []);

  const toggle = (e) => {
    e.stopPropagation();
    const a = audioRef.current;
    if (!a) return;
    if (playing) { a.pause(); return; }
    if (currentAudio && currentAudio !== a) currentAudio.pause();
    currentAudio = a;
    a.playbackRate = rate;
    a.play().catch(() => toastError(new Error("Couldn't play this voice message on this device.")));
  };
  const seek = (e) => {
    e.stopPropagation();
    const a = audioRef.current;
    if (!a || !duration) return;
    const r = e.currentTarget.getBoundingClientRect();
    const f = Math.min(1, Math.max(0, (e.clientX - r.left) / r.width));
    a.currentTime = f * (isFinite(a.duration) ? a.duration : duration);
    setProgress(f);
  };
  const cycleRate = (e) => {
    e.stopPropagation();
    const next = rate === 1 ? 1.5 : rate === 1.5 ? 2 : 1;
    setRate(next);
    if (audioRef.current) audioRef.current.playbackRate = next;
  };

  return (
    <div className="voice">
      <audio
        ref={audioRef} src={voice?.url} preload="metadata"
        onPlay={() => setPlaying(true)} onPause={() => setPlaying(false)}
        onEnded={() => { setPlaying(false); setProgress(0); setCur(0); }}
        onTimeUpdate={(e) => {
          const a = e.currentTarget;
          const d = isFinite(a.duration) && a.duration > 0 ? a.duration : duration;
          setCur(a.currentTime);
          setProgress(d ? Math.min(1, a.currentTime / d) : 0);
        }}
      />
      {!mine && <Avatar src={avatar} name={name} size={36} />}
      <button className="voice-play" onClick={toggle} aria-label={playing ? "Pause" : "Play"}>{playing ? <IoPause /> : <IoPlay />}</button>
      <div className="voice-main">
        <div className="voice-wave" onClick={seek}>
          {bars.map((b, i) => (
            <span key={i} style={{ height: `${Math.max(12, b * 100)}%` }} className={i / bars.length <= progress ? "on" : ""} />
          ))}
        </div>
        <div className="voice-meta">
          <span>{fmtDuration(playing || cur ? cur : duration)}</span>
          {(playing || rate !== 1) && <button className="voice-rate" onClick={cycleRate}>{rate}×</button>}
        </div>
      </div>
    </div>
  );
}

/* ── Location card (single OpenStreetMap tile + pin) ─────────── */
function LocationCard({ loc }) {
  const z = 15;
  const n = 2 ** z;
  const xf = ((loc.lng + 180) / 360) * n;
  const latR = (loc.lat * Math.PI) / 180;
  const yf = ((1 - Math.log(Math.tan(latR) + 1 / Math.cos(latR)) / Math.PI) / 2) * n;
  const x = Math.floor(xf), y = Math.floor(yf);
  const px = (xf - x) * 100, py = (yf - y) * 100;
  const href = `https://www.google.com/maps/search/?api=1&query=${loc.lat},${loc.lng}`;
  return (
    <a className="loc-card" href={href} target="_blank" rel="noopener noreferrer" onClick={e => e.stopPropagation()}>
      <div className="loc-map" style={{ backgroundImage: `url(https://tile.openstreetmap.org/${z}/${x}/${y}.png)`, backgroundPosition: `${50 - px}% ${50 - py}%` }}>
        <IoLocationSharp className="loc-pin" />
      </div>
      <div className="loc-foot"><strong>📍 Shared location</strong><span>{loc.lat.toFixed(4)}, {loc.lng.toFixed(4)} · Open in Maps</span></div>
    </a>
  );
}

/* ── Poll ─────────────────────────────────────────────────────── */
function Poll({ poll, cid, mid, uid, usersById }) {
  const [busy, setBusy] = useState(false);
  if (!poll?.options) return null;
  const total = poll.options.reduce((s, o) => s + (o.votes?.length || 0), 0);
  const voted = poll.options.some(o => o.votes?.includes(uid));
  const vote = async (i, e) => {
    e.stopPropagation();
    if (busy) return;
    setBusy(true);
    try { await votePoll(cid, mid, uid, i); } catch (err) { toastError(err); } finally { setBusy(false); }
  };
  return (
    <div className="poll">
      <div className="poll-q">{poll.question}</div>
      <div className="poll-hint">{poll.multiple ? "Select one or more" : "Select one"}</div>
      {poll.options.map((o, i) => {
        const n = o.votes?.length || 0;
        const pct = total ? Math.round((n / total) * 100) : 0;
        const mineVote = o.votes?.includes(uid);
        return (
          <button key={i} className={`poll-opt ${mineVote ? "mine" : ""}`} onClick={(e) => vote(i, e)}>
            <span className={`poll-check ${mineVote ? "on" : ""}`}>{mineVote ? "✓" : ""}</span>
            <span className="poll-opt-main">
              <span className="poll-opt-row">
                <span className="poll-opt-text">{o.text}</span>
                <span className="poll-voters">
                  {(o.votes || []).slice(0, 3).map(v => <Avatar key={v} src={usersById?.[v]?.avatar} name={usersById?.[v]?.name} size={16} />)}
                  {(voted || n > 0) && <span className="poll-n">{n}</span>}
                </span>
              </span>
              <span className="poll-bar"><span style={{ width: `${voted || total ? pct : 0}%` }} /></span>
            </span>
          </button>
        );
      })}
      <div className="poll-total">{total} vote{total === 1 ? "" : "s"}</div>
    </div>
  );
}

/* ── Main bubble ──────────────────────────────────────────────── */
function MessageBubble({
  msg, mine, uid, cid, chat, group, first, last, sender, usersById,
  onReply, onMenu, onReact, onOpenImage, onJump, query, mentionNames, starred, flash,
}) {
  const rowRef = useRef(null);
  const swipe = useRef(null);
  const lastTap = useRef(0);
  const lp = useLongPress((at) => onMenu(at, msg));

  if (msg.type === "system") {
    return <div className="sys-msg"><span>{msg.text}</span></div>;
  }

  const deleted = msg.deletedForEveryone;
  const emojiOnly = !deleted && msg.type === "text" && isEmojiOnly(msg.text) && !msg.replyTo;
  const reactions = Object.entries(msg.reactions || {}).filter(([, e]) => e);
  const counts = {};
  reactions.forEach(([, e]) => { counts[e] = (counts[e] || 0) + 1; });
  const myReaction = msg.reactions?.[uid];

  // Swipe right to reply (touch)
  const onTouchStart = (e) => {
    lp.onTouchStart(e);
    const t = e.touches[0];
    swipe.current = { x: t.clientX, y: t.clientY, dx: 0, locked: null };
  };
  const onTouchMove = (e) => {
    lp.onTouchMove(e);
    const s = swipe.current;
    if (!s || deleted) return;
    const t = e.touches[0];
    const dx = t.clientX - s.x, dy = t.clientY - s.y;
    if (s.locked === null && (Math.abs(dx) > 8 || Math.abs(dy) > 8)) s.locked = Math.abs(dx) > Math.abs(dy) && dx > 0 ? "x" : "y";
    if (s.locked !== "x") return;
    s.dx = Math.max(0, Math.min(80, dx));
    if (rowRef.current) {
      rowRef.current.style.transform = `translateX(${s.dx}px)`;
      rowRef.current.style.setProperty("--swipe", Math.min(1, s.dx / 60));
    }
  };
  const onTouchEnd = (e) => {
    lp.onTouchEnd(e);
    const s = swipe.current;
    if (rowRef.current) { rowRef.current.style.transform = ""; rowRef.current.style.setProperty("--swipe", 0); }
    if (s?.locked === "x" && s.dx > 56) { try { navigator.vibrate?.(12); } catch {} onReply(msg); }
    swipe.current = null;
  };

  const onClick = (e) => {
    if (lp.wasLongPress()) { e.stopPropagation(); return; }
    const now = Date.now();
    if (now - lastTap.current < 300 && !deleted) { onReact(msg, myReaction === "❤️" ? null : "❤️"); lastTap.current = 0; return; }
    lastTap.current = now;
  };

  const showName = group && !mine && first;
  const replyUser = msg.replyTo ? (msg.replyTo.senderId === uid ? "You" : msg.replyTo.senderName) : null;

  return (
    <div className={`msg-row ${mine ? "out" : "in"} ${first ? "first" : ""} ${last ? "last" : ""} ${flash ? "flash" : ""}`} id={`m-${msg.id}`}>
      {group && !mine && (
        <div className="msg-avatar-slot">{last && <Avatar src={sender?.avatar} name={sender?.name || msg.senderName} size={30} />}</div>
      )}
      <div className="msg-swipe" ref={rowRef}>
        <span className="swipe-hint"><IoArrowUndo /></span>
        <div
          className={`bubble ${mine ? "out" : "in"} ${emojiOnly ? "emoji-only" : ""} ${msg.type}${msg.viewOnce ? " snap" : ""} ${deleted ? "deleted" : ""} ${first ? "tail" : ""} ${(msg.edited && !deleted) || starred || msg.expiresAt ? "has-edit" : ""}`}
          onContextMenu={lp.onContextMenu} onTouchStart={onTouchStart} onTouchMove={onTouchMove} onTouchEnd={onTouchEnd} onTouchCancel={lp.onTouchCancel}
          onClick={onClick}
        >
          {showName && <div className="bubble-name" style={{ color: colorFor(msg.senderId) }}>{sender?.name || msg.senderName}</div>}
          {msg.forwarded && !deleted && <div className="bubble-fwd">↪ Forwarded</div>}
          {msg.replyTo && !deleted && (
            <button className="bubble-quote" onClick={(e) => { e.stopPropagation(); onJump(msg.replyTo.id); }} style={{ "--q": colorFor(msg.replyTo.senderId) }}>
              <span className="quote-name">{replyUser}</span>
              <span className="quote-text">{msg.replyTo.text || "Message"}</span>
              {msg.replyTo.image && <img src={msg.replyTo.image} alt="" className="quote-thumb" />}
            </button>
          )}

          {deleted ? (
            <span className="bubble-text deleted-text">🚫 {mine ? "You deleted this message" : "This message was deleted"}</span>
          ) : msg.type === "image" && msg.viewOnce ? (
            <button className={`snap-card ${mine ? "mine" : ""} ${!mine && msg.image && !(msg.openedBy || []).includes(uid) ? "fresh" : ""}`}
              onClick={(e) => { e.stopPropagation(); onOpenImage(msg); }}>
              <span className="snap-icon">{mine ? "👻" : msg.image && !(msg.openedBy || []).includes(uid) ? "📸" : "🫥"}</span>
              <span className="snap-label">
                {mine
                  ? ((msg.openedBy || []).length ? `Snap · opened${group ? ` by ${(msg.openedBy || []).length}` : ""}` : "Snap · sent")
                  : msg.image && !(msg.openedBy || []).includes(uid) ? "Tap to view snap" : "Snap · opened"}
              </span>
            </button>
          ) : msg.type === "image" ? (
            <>
              <button className="bubble-img" onClick={(e) => { e.stopPropagation(); onOpenImage(msg); }} style={{ aspectRatio: msg.image?.width && msg.image?.height ? `${msg.image.width}/${msg.image.height}` : undefined }}>
                <img src={msg.image?.url || msg.image} alt={msg.text || "Photo"} loading="lazy" />
              </button>
              {msg.text && <div className="bubble-text caption"><RichText text={msg.text} query={query} mentionNames={mentionNames} /></div>}
            </>
          ) : msg.type === "voice" ? (
            <VoicePlayer voice={msg.voice} mine={mine} avatar={sender?.avatar} name={sender?.name || msg.senderName} />
          ) : msg.type === "location" ? (
            <LocationCard loc={msg.location} />
          ) : msg.type === "poll" ? (
            <Poll poll={msg.poll} cid={cid} mid={msg.id} uid={uid} usersById={usersById} />
          ) : (
            <span className="bubble-text"><RichText text={msg.text} query={query} mentionNames={mentionNames} /></span>
          )}

          <span className="bubble-meta">
            {starred && <IoStar className="meta-star" />}
            {msg.expiresAt && <IoTimeOutline title="Disappearing message" />}
            {msg.edited && !deleted && <span>edited</span>}
            <span>{fmtTime(msg.createdAt)}</span>
            {mine && !deleted && <Ticks state={tickState(msg, chat, uid)} />}
          </span>
        </div>

        {counts && Object.keys(counts).length > 0 && (
          <button className={`reactions ${mine ? "out" : "in"}`} onClick={(e) => { e.stopPropagation(); onMenu({ x: e.clientX, y: e.clientY }, msg, "reactions"); }}>
            {Object.entries(counts).slice(0, 4).map(([e]) => <span key={e} className={myReaction === e ? "mine" : ""}>{e}</span>)}
            {reactions.length > 1 && <span className="react-n">{reactions.length}</span>}
          </button>
        )}
      </div>
    </div>
  );
}

export default memo(MessageBubble);
