import React, { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useApp, toastError } from "../../Context/ChatContext";
import { findRoomByCode, joinRoom } from "../../lib/db";
import Avatar from "../common/Avatar";
import Empty, { Spinner } from "../common/Empty";

/** Landing page for invite links: /join/:code */
export default function JoinRoom() {
  const { code } = useParams();
  const navigate = useNavigate();
  const { uid, me } = useApp();
  const [room, setRoom] = useState(undefined);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    findRoomByCode(code).then(r => {
      if (r?.members?.includes(uid)) navigate(`/chat/${r.id}`, { replace: true });
      else setRoom(r);
    }).catch(() => setRoom(null));
  }, [code, uid, navigate]);

  const join = async () => {
    setBusy(true);
    try { await joinRoom(room.id, uid, me?.name); navigate(`/chat/${room.id}`, { replace: true }); }
    catch (e) { toastError(e); setBusy(false); }
  };

  if (room === undefined) return <div className="page-loader"><Spinner /></div>;
  if (!room) return <div className="page"><Empty icon="🔗" title="Invite link expired" body="This invite is invalid or was reset by an admin." action={<button className="btn btn-primary" onClick={() => navigate("/rooms")}>Browse rooms</button>} /></div>;

  return (
    <div className="page join-page">
      <div className="join-card card">
        <Avatar emoji={room.emoji} color={room.color} name={room.name} size={96} />
        <h1>{room.name}</h1>
        <p className="muted-text">{room.isPublic ? "Public room" : "Private room"} · {room.members?.length || 0} members</p>
        {room.description && <p className="join-desc">{room.description}</p>}
        <button className="btn btn-primary btn-lg btn-block" disabled={busy} onClick={join}>{busy ? "Joining…" : "Join room"}</button>
        <button className="btn btn-ghost btn-block" onClick={() => navigate("/chat")}>Not now</button>
      </div>
    </div>
  );
}
