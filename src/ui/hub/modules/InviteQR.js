import React, { useEffect, useState } from "react";
import QRCode from "qrcode";
import { IoCopyOutline, IoShareSocialOutline, IoDownloadOutline } from "react-icons/io5";
import { useApp, toastOk } from "../../../Context/ChatContext";
import { isGroup } from "../../../lib/db";
import { inviteLink } from "../../chat/ChatInfo";
import { downloadDataUrl } from "../../../lib/media";
import Avatar from "../../common/Avatar";

/** QR codes for inviting friends to AR Hub or into one of your rooms. */
export default function InviteQR() {
  const { me, visibleChats, uid } = useApp();
  const rooms = visibleChats.filter(c => isGroup(c) && c.members?.includes(uid) && c.inviteCode);
  const [target, setTarget] = useState("app");
  const [qr, setQr] = useState("");

  const room = rooms.find(r => r.id === target);
  const url = room ? inviteLink(room.inviteCode) : `${window.location.origin}/?ref=${encodeURIComponent(me?.name || "")}`;
  const label = room ? `Join “${room.name}” on AR Hub` : `Chat with ${me?.name || "me"} on AR Hub`;

  useEffect(() => {
    QRCode.toDataURL(url, { width: 560, margin: 1, errorCorrectionLevel: "M", color: { dark: "#111827", light: "#ffffff" } })
      .then(setQr).catch(() => setQr(""));
  }, [url]);

  const share = async () => {
    try { if (navigator.share) { await navigator.share({ title: "AR Hub", text: label, url }); return; } } catch { return; }
    await navigator.clipboard?.writeText(url);
    toastOk("Link copied");
  };

  return (
    <div className="qr-page">
      <div className="chips wrap" style={{ justifyContent: "center", marginBottom: 16 }}>
        <button className={`chip ${target === "app" ? "active" : ""}`} onClick={() => setTarget("app")}>👋 Invite to AR Hub</button>
        {rooms.map(r => <button key={r.id} className={`chip ${target === r.id ? "active" : ""}`} onClick={() => setTarget(r.id)}>{r.emoji} {r.name}</button>)}
      </div>
      <div className="qr-card card">
        <div className="qr-head">
          {room ? <Avatar emoji={room.emoji} color={room.color} name={room.name} size={48} /> : <Avatar src={me?.avatar} name={me?.name} size={48} />}
          <div><strong>{room ? room.name : me?.name}</strong><span>{label}</span></div>
        </div>
        <div className="qr-img">{qr ? <img src={qr} alt={`QR code for ${url}`} /> : <span className="spinner" style={{ width: 28, height: 28 }} />}</div>
        <div className="qr-url">{url}</div>
        <div className="qr-actions">
          <button className="btn btn-ghost" onClick={() => navigator.clipboard?.writeText(url).then(() => toastOk("Link copied"))}><IoCopyOutline /> Copy</button>
          <button className="btn btn-ghost" disabled={!qr} onClick={() => downloadDataUrl(qr, `arhub-invite${room ? "-" + room.inviteCode : ""}.png`)}><IoDownloadOutline /> Save</button>
          <button className="btn btn-primary" onClick={share}><IoShareSocialOutline /> Share</button>
        </div>
      </div>
      <p className="muted-text" style={{ textAlign: "center", marginTop: 12, fontSize: ".85rem" }}>Scan with any phone camera to open the invite.</p>
    </div>
  );
}
