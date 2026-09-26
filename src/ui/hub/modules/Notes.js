import React, { useEffect, useMemo, useRef, useState } from "react";
import { IoAdd, IoSearch, IoPin, IoPinOutline, IoTrashOutline, IoShareSocialOutline } from "react-icons/io5";
import { useApp, toastError, toastOk } from "../../../Context/ChatContext";
import { subscribeCol, addNote, updateNote, deleteNote } from "../../../lib/personal";
import { sendMessage } from "../../../lib/db";
import { fmtRelative } from "../../../lib/format";
import Sheet from "../../common/Sheet";
import Empty from "../../common/Empty";
import { ChatPicker } from "../Whiteboard";

const COLORS = { default: "var(--bg-elev)", yellow: "#fef3c7", green: "#dcfce7", blue: "#dbeafe", pink: "#fce7f3", purple: "#ede9fe" };

export default function Notes() {
  const { uid } = useApp();
  const [notes, setNotes] = useState(null);
  const [q, setQ] = useState("");
  const [editing, setEditing] = useState(null);
  const [share, setShare] = useState(null);

  useEffect(() => subscribeCol(uid, "notes", setNotes), [uid]);

  const list = useMemo(() => (notes || [])
    .filter(n => !q || (n.title + " " + n.body).toLowerCase().includes(q.toLowerCase()))
    .sort((a, b) => (b.pinned - a.pinned)), [notes, q]);

  const create = async () => {
    try { const ref = await addNote(uid, {}); setEditing({ id: ref.id, title: "", body: "", color: "default", pinned: false }); }
    catch (e) { toastError(e); }
  };

  return (
    <div className="notes">
      <div className="module-bar">
        <label className="search" style={{ flex: 1 }}><IoSearch /><input value={q} onChange={e => setQ(e.target.value)} placeholder="Search notes" /></label>
        <button className="btn btn-primary" onClick={create}><IoAdd /> New note</button>
      </div>
      {notes === null && <div className="page-loader" style={{ height: 160 }}><span className="spinner" style={{ width: 24, height: 24 }} /></div>}
      {notes && list.length === 0 && <Empty icon="📝" title={q ? "No matching notes" : "No notes yet"} body="Capture ideas, lists and links. Notes sync across all your devices." action={!q && <button className="btn btn-primary" onClick={create}>Write a note</button>} />}
      <div className="notes-grid">
        {list.map(n => (
          <button key={n.id} className={`note-card ${n.color !== "default" ? "tinted" : ""}`} style={{ background: COLORS[n.color] || COLORS.default }} onClick={() => setEditing(n)}>
            {n.pinned && <IoPin className="note-pin" />}
            {n.title && <strong>{n.title}</strong>}
            <p>{n.body || <em className="muted-text">Empty note</em>}</p>
            <span className="note-time">{fmtRelative(n.updatedAt)}</span>
          </button>
        ))}
      </div>
      {editing && <NoteEditor note={editing} uid={uid} onClose={() => setEditing(null)} onShare={(n) => setShare(n)} />}
      <ChatPicker open={!!share} onClose={() => setShare(null)} title="Share note to…" onPick={async (chat, me) => {
        const n = share; setShare(null);
        try { await sendMessage(chat.id, { chat, me, text: `📝 ${n.title ? `*${n.title}*\n` : ""}${n.body}` }); toastOk("Note shared"); } catch (e) { toastError(e); }
      }} />
    </div>
  );
}

function NoteEditor({ note, uid, onClose, onShare }) {
  const [title, setTitle] = useState(note.title || "");
  const [body, setBody] = useState(note.body || "");
  const [color, setColor] = useState(note.color || "default");
  const [pinned, setPinned] = useState(!!note.pinned);
  const first = useRef(true);

  // autosave (debounced)
  useEffect(() => {
    if (first.current) { first.current = false; return; }
    const t = setTimeout(() => updateNote(uid, note.id, { title, body, color, pinned }).catch(toastError), 500);
    return () => clearTimeout(t);
  }, [title, body, color, pinned, uid, note.id]);

  const close = () => {
    if (!title.trim() && !body.trim()) deleteNote(uid, note.id).catch(() => {});
    else updateNote(uid, note.id, { title, body, color, pinned }).catch(() => {});
    onClose();
  };

  return (
    <Sheet open onClose={close} size="md" title={
      <div className="note-toolbar">
        {Object.keys(COLORS).map(c => <button key={c} className={`color-dot ${color === c ? "on" : ""}`} style={{ background: COLORS[c] }} onClick={() => setColor(c)} aria-label={c} />)}
      </div>
    } footer={<>
      <button className="icon-btn" title={pinned ? "Unpin" : "Pin"} onClick={() => setPinned(p => !p)}>{pinned ? <IoPin /> : <IoPinOutline />}</button>
      <button className="icon-btn" title="Share to chat" onClick={() => onShare({ title, body })} disabled={!body.trim() && !title.trim()}><IoShareSocialOutline /></button>
      <button className="icon-btn" title="Delete" onClick={() => { deleteNote(uid, note.id).catch(toastError); onClose(); }}><IoTrashOutline /></button>
      <span style={{ flex: 1 }} />
      <button className="btn btn-primary" onClick={close}>Done</button>
    </>}>
      <input className="note-title" value={title} onChange={e => setTitle(e.target.value)} placeholder="Title" maxLength={120} />
      <textarea className="note-body" autoFocus value={body} onChange={e => setBody(e.target.value)} placeholder="Start typing…" />
    </Sheet>
  );
}
