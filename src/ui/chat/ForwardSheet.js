import React, { useEffect, useMemo, useState } from "react";
import { IoSearch, IoSend, IoCheckmark } from "react-icons/io5";
import { useApp, toastError, toastOk } from "../../Context/ChatContext";
import { forwardMessage, previewOf } from "../../lib/db";
import { toMillis } from "../../lib/format";
import Sheet from "../common/Sheet";
import { ChatAvatar } from "../common/Avatar";

/** Forward a message to one or more chats. */
export default function ForwardSheet({ msg, onClose }) {
  const { me, visibleChats, chatTitle, chatPartner } = useApp();
  const [sel, setSel] = useState([]);
  const [q, setQ] = useState("");
  const [busy, setBusy] = useState(false);
  useEffect(() => { if (msg) { setSel([]); setQ(""); } }, [msg]);

  const list = useMemo(() => visibleChats
    .filter(c => c.members?.includes(me?.uid))
    .filter(c => !q || chatTitle(c).toLowerCase().includes(q.toLowerCase()))
    .sort((a, b) => toMillis(b.lastMessageAt) - toMillis(a.lastMessageAt)), [visibleChats, q, chatTitle, me]);

  if (!msg) return null;
  const toggle = (id) => setSel(s => (s.includes(id) ? s.filter(x => x !== id) : s.length >= 10 ? s : [...s, id]));

  const send = async () => {
    setBusy(true);
    try {
      await Promise.all(sel.map(id => forwardMessage(id, msg, { chat: visibleChats.find(c => c.id === id), me })));
      toastOk(`Forwarded to ${sel.length} chat${sel.length === 1 ? "" : "s"}`);
      onClose();
    } catch (e) { toastError(e); } finally { setBusy(false); }
  };

  return (
    <Sheet open onClose={onClose} title="Forward to…" size="md"
      footer={<>
        <span className="fwd-preview">{previewOf(msg)}</span>
        <button className="send-btn" disabled={!sel.length || busy} onClick={send} aria-label="Forward"><IoSend /></button>
      </>}>
      <label className="search" style={{ marginBottom: 8 }}><IoSearch /><input value={q} onChange={e => setQ(e.target.value)} placeholder="Search chats" /></label>
      {list.map(c => (
        <div key={c.id} className="row" onClick={() => toggle(c.id)}>
          <ChatAvatar chat={c} partner={chatPartner(c)} size={42} />
          <div className="row-body"><div className="row-title">{chatTitle(c)}</div></div>
          <span className={`check ${sel.includes(c.id) ? "on" : ""}`}>{sel.includes(c.id) && <IoCheckmark />}</span>
        </div>
      ))}
    </Sheet>
  );
}
