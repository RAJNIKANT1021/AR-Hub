import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { IoCallOutline, IoVideocamOutline, IoArrowUp, IoArrowDown, IoAdd, IoSearch, IoChatbubbleOutline } from "react-icons/io5";
import { useApp } from "../../Context/ChatContext";
import { useCallManager } from "../../Components/Call/CallManager";
import { subscribeCallLogs } from "../../lib/webrtc";
import { ensureChat } from "../../lib/db";
import { fmtListTime, fmtTime, toDate } from "../../lib/format";
import Avatar from "../common/Avatar";
import Sheet from "../common/Sheet";
import Empty, { SkeletonList } from "../common/Empty";
import { PersonRow } from "../chat/NewChatSheet";

const describe = (log) => {
  if (log.status === "missed") return "Missed";
  if (log.status === "declined") return "Declined";
  if (log.status === "no_answer" || (log.direction === "outgoing" && !log.duration)) return "No answer";
  const m = Math.floor((log.duration || 0) / 60), s = (log.duration || 0) % 60;
  return m ? `${m} min ${s}s` : `${s}s`;
};

export default function CallsPage() {
  const navigate = useNavigate();
  const { uid, usersById, allUsers, me } = useApp();
  const { initiateCall } = useCallManager() || {};
  const [logs, setLogs] = useState(null);
  const [filter, setFilter] = useState("all");
  const [newOpen, setNewOpen] = useState(false);
  const [q, setQ] = useState("");

  useEffect(() => subscribeCallLogs(uid, setLogs), [uid]);

  // Collapse consecutive calls with the same person+type+outcome (like WhatsApp)
  const grouped = useMemo(() => {
    const out = [];
    (logs || []).filter(l => filter === "all" || l.status === "missed").forEach(l => {
      const prev = out[out.length - 1];
      const d = toDate(l.createdAt)?.toDateString();
      if (prev && prev.partnerId === l.partnerId && prev.callType === l.callType && (prev.status === "missed") === (l.status === "missed") && prev._day === d) {
        prev._count += 1;
      } else out.push({ ...l, _count: 1, _day: d });
    });
    return out;
  }, [logs, filter]);

  const call = (partnerId, type) => {
    const u = usersById[partnerId];
    if (!u) return;
    initiateCall?.({ uid: u.uid, name: u.name, avatar: u.avatar }, type);
  };

  const people = allUsers.filter(u => u.uid !== uid && !(me?.blocklist || []).includes(u.uid))
    .filter(u => !q || (u.name || "").toLowerCase().includes(q.toLowerCase()))
    .sort((a, b) => ((me?.friends || []).includes(b.uid) - (me?.friends || []).includes(a.uid)) || (a.name || "").localeCompare(b.name || ""));

  return (
    <div className="page">
      <header className="page-header">
        <h1 className="page-title">Calls</h1>
        <div className="chips">
          <button className={`chip ${filter === "all" ? "active" : ""}`} onClick={() => setFilter("all")}>All</button>
          <button className={`chip ${filter === "missed" ? "active" : ""}`} onClick={() => setFilter("missed")}>Missed</button>
        </div>
      </header>
      <div className="page-body">
        <div className="page-inner">
          <button className="row call-new" onClick={() => setNewOpen(true)}>
            <span className="qa-icon"><IoCallOutline /></span>
            <span className="row-body"><span className="row-title">Start a call</span><span className="row-sub">HD voice & video · screen share · in-call games</span></span>
          </button>
          <div className="section-label">Recent</div>
          {logs === null && <SkeletonList rows={5} />}
          {logs && grouped.length === 0 && <Empty icon="📞" title={filter === "missed" ? "No missed calls" : "No calls yet"} body="Your voice and video call history will appear here." />}
          {grouped.map(l => {
            const u = usersById[l.partnerId];
            const missed = l.status === "missed";
            const name = u?.name || l.partnerName || "Unknown";
            return (
              <div key={l.id} className="row" onClick={async () => { if (!l.partnerId) return; const cid = await ensureChat(uid, l.partnerId); navigate(`/chat/${cid}`); }}>
                <Avatar src={u?.avatar || l.partnerAvatar} name={name} size={46} />
                <div className="row-body">
                  <div className={`row-title ${missed ? "missed" : ""}`}>{name}{l._count > 1 ? ` (${l._count})` : ""}</div>
                  <div className="row-sub call-sub">
                    {l.direction === "outgoing" ? <IoArrowUp className="dir out" /> : <IoArrowDown className={`dir in ${missed || l.status === "declined" ? "missed" : ""}`} />}
                    {fmtListTime(l.createdAt)}{fmtListTime(l.createdAt).includes(":") ? "" : `, ${fmtTime(l.createdAt)}`} · {describe(l)}
                  </div>
                </div>
                <button className="icon-btn" title={`${l.callType === "audio" ? "Voice" : "Video"} call`} onClick={(e) => { e.stopPropagation(); call(l.partnerId, l.callType || "video"); }}>
                  {l.callType === "audio" ? <IoCallOutline /> : <IoVideocamOutline />}
                </button>
              </div>
            );
          })}
        </div>
      </div>
      <button className="fab" aria-label="New call" onClick={() => setNewOpen(true)}><IoAdd /></button>

      <Sheet open={newOpen} onClose={() => setNewOpen(false)} title="New call" size="md">
        <label className="search" style={{ marginBottom: 8 }}><IoSearch /><input autoFocus value={q} onChange={e => setQ(e.target.value)} placeholder="Search people" /></label>
        {people.length === 0 && <Empty icon="🔍" title="No one found" />}
        {people.slice(0, 80).map(u => (
          <PersonRow key={u.uid} u={u} right={
            <span style={{ display: "flex" }}>
              <button className="icon-btn" title="Message" onClick={async (e) => { e.stopPropagation(); const cid = await ensureChat(uid, u.uid); setNewOpen(false); navigate(`/chat/${cid}`); }}><IoChatbubbleOutline /></button>
              <button className="icon-btn" title="Voice call" onClick={(e) => { e.stopPropagation(); setNewOpen(false); call(u.uid, "audio"); }}><IoCallOutline /></button>
              <button className="icon-btn" title="Video call" onClick={(e) => { e.stopPropagation(); setNewOpen(false); call(u.uid, "video"); }}><IoVideocamOutline /></button>
            </span>
          } />
        ))}
      </Sheet>
    </div>
  );
}
