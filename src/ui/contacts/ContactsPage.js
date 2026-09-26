import React, { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import Fuse from "fuse.js";
import { IoArrowBack, IoSearch, IoChatbubbleOutline, IoPersonAddOutline, IoCheckmark, IoClose, IoShareSocialOutline } from "react-icons/io5";
import { useApp, toastError, toastOk } from "../../Context/ChatContext";
import { ensureChat, sendFriendRequest, cancelFriendRequest, acceptFriendRequest, declineFriendRequest } from "../../lib/db";
import Empty from "../common/Empty";
import { PersonRow } from "../chat/NewChatSheet";

export default function ContactsPage() {
  const navigate = useNavigate();
  const [params, setParams] = useSearchParams();
  const { uid, me, allUsers, usersById } = useApp();
  const incoming = me?.friendRequests || [];
  const [tab, setTabRaw] = useState(incoming.length ? "requests" : "friends");
  const picked = useRef(false);
  const setTab = (t) => { picked.current = true; setTabRaw(t); };
  // Requests that arrive after the page opened surface automatically
  useEffect(() => { if (!picked.current && incoming.length) setTabRaw("requests"); }, [incoming.length]);
  const [q, setQ] = useState("");
  const [busy, setBusy] = useState({});

  const openChat = async (otherUid) => {
    try { const cid = await ensureChat(uid, otherUid); navigate(`/chat/${cid}`); } catch (e) { toastError(e); }
  };

  // Deep link from the command palette: /contacts?start=<uid>
  useEffect(() => {
    const start = params.get("start");
    if (start) { setParams({}, { replace: true }); openChat(start); }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [params]);

  const act = async (id, fn, msg) => {
    setBusy(b => ({ ...b, [id]: true }));
    try { await fn(); if (msg) toastOk(msg); } catch (e) { toastError(e); } finally { setBusy(b => ({ ...b, [id]: false })); }
  };

  const friends = (me?.friends || []).map(f => usersById[f]).filter(Boolean).sort((a, b) => (b.status === "online") - (a.status === "online") || (a.name || "").localeCompare(b.name || ""));
  const sent = (me?.sentRequests || []).map(f => usersById[f]).filter(Boolean);
  const requests = incoming.map(f => usersById[f]).filter(Boolean);

  const everyone = useMemo(() => {
    const list = allUsers.filter(u => u.uid !== uid && !(me?.blocklist || []).includes(u.uid));
    return q.trim() ? new Fuse(list, { keys: ["name", "email"], threshold: 0.38 }).search(q.trim()).map(r => r.item) : list;
  }, [allUsers, uid, me, q]);

  const filterList = (list) => (q.trim() && tab !== "find" ? list.filter(u => (u.name || "").toLowerCase().includes(q.toLowerCase())) : list);

  const invite = async () => {
    const url = window.location.origin;
    const text = `Chat with me on AR Hub — messages, rooms, calls & games. ${url}`;
    try { if (navigator.share) { await navigator.share({ title: "AR Hub", text, url }); return; } } catch { return; }
    navigator.clipboard?.writeText(text).then(() => toastOk("Invite copied to clipboard"));
  };

  return (
    <div className="page">
      <header className="page-header">
        <button className="icon-btn" onClick={() => navigate(-1)} aria-label="Back"><IoArrowBack /></button>
        <h1 className="page-title sm">Contacts</h1>
        <button className="btn btn-soft btn-sm" onClick={invite}><IoShareSocialOutline /> Invite</button>
      </header>
      <div className="page-body">
        <div className="page-inner">
          <div className="seg full">
            <button className={tab === "friends" ? "on" : ""} onClick={() => setTab("friends")}>Friends <span>{friends.length}</span></button>
            <button className={tab === "requests" ? "on" : ""} onClick={() => setTab("requests")}>Requests {requests.length > 0 && <span className="badge">{requests.length}</span>}</button>
            <button className={tab === "find" ? "on" : ""} onClick={() => setTab("find")}>Find people</button>
          </div>
          <label className="search" style={{ margin: "12px 0" }}><IoSearch /><input value={q} onChange={e => setQ(e.target.value)} placeholder={tab === "find" ? "Search everyone by name or email" : "Search"} /></label>

          {tab === "friends" && (
            friends.length === 0
              ? <Empty icon="🧑‍🤝‍🧑" title="No friends yet" body="Find people and send friend requests to build your circle." action={<button className="btn btn-primary" onClick={() => setTab("find")}>Find people</button>} />
              : filterList(friends).map(u => (
                <PersonRow key={u.uid} u={u} onClick={() => openChat(u.uid)} right={<button className="icon-btn" onClick={(e) => { e.stopPropagation(); openChat(u.uid); }} aria-label="Message"><IoChatbubbleOutline /></button>} />
              ))
          )}

          {tab === "requests" && (
            <>
              {requests.length === 0 && sent.length === 0 && <Empty icon="📭" title="No pending requests" />}
              {requests.length > 0 && <div className="section-label">Received</div>}
              {filterList(requests).map(u => (
                <PersonRow key={u.uid} u={u} busy={busy[u.uid]} sub="wants to be friends" right={
                  <span style={{ display: "flex", gap: 6 }}>
                    <button className="btn btn-primary btn-sm" onClick={(e) => { e.stopPropagation(); act(u.uid, () => acceptFriendRequest(uid, u.uid, me?.name), `You and ${u.name} are now friends`); }}><IoCheckmark /> Accept</button>
                    <button className="icon-btn" onClick={(e) => { e.stopPropagation(); act(u.uid, () => declineFriendRequest(uid, u.uid)); }} aria-label="Decline"><IoClose /></button>
                  </span>
                } />
              ))}
              {sent.length > 0 && <div className="section-label">Sent</div>}
              {filterList(sent).map(u => (
                <PersonRow key={u.uid} u={u} busy={busy[u.uid]} sub="Request pending" right={
                  <button className="btn btn-ghost btn-sm" onClick={(e) => { e.stopPropagation(); act(u.uid, () => cancelFriendRequest(uid, u.uid)); }}>Cancel</button>
                } />
              ))}
            </>
          )}

          {tab === "find" && (
            everyone.length === 0 ? <Empty icon="🔍" title="No one found" /> :
            everyone.slice(0, 100).map(u => {
              const isFriend = (me?.friends || []).includes(u.uid);
              const isSent = (me?.sentRequests || []).includes(u.uid);
              const isIncoming = incoming.includes(u.uid);
              return (
                <PersonRow key={u.uid} u={u} busy={busy[u.uid]} onClick={() => openChat(u.uid)} right={
                  isFriend ? <span className="pill ok">Friends</span>
                    : isIncoming ? <button className="btn btn-primary btn-sm" onClick={(e) => { e.stopPropagation(); act(u.uid, () => acceptFriendRequest(uid, u.uid, me?.name), "Friend added"); }}>Accept</button>
                    : isSent ? <button className="btn btn-ghost btn-sm" onClick={(e) => { e.stopPropagation(); act(u.uid, () => cancelFriendRequest(uid, u.uid)); }}>Requested</button>
                    : <button className="btn btn-soft btn-sm" onClick={(e) => { e.stopPropagation(); act(u.uid, () => sendFriendRequest(uid, u.uid, me?.name), "Request sent"); }}><IoPersonAddOutline /> Add</button>
                } />
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
