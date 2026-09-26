import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { IoArrowBack, IoStar } from "react-icons/io5";
import { useApp, toastError } from "../../Context/ChatContext";
import { subscribeStarred, starMessage } from "../../lib/db";
import { fmtListTime } from "../../lib/format";
import Empty, { SkeletonList } from "../common/Empty";

export default function StarredPage() {
  const navigate = useNavigate();
  const { uid } = useApp();
  const [items, setItems] = useState(null);
  useEffect(() => subscribeStarred(uid, setItems), [uid]);

  return (
    <div className="page">
      <header className="page-header">
        <button className="icon-btn" onClick={() => navigate(-1)} aria-label="Back"><IoArrowBack /></button>
        <h1 className="page-title sm">Starred messages</h1>
      </header>
      <div className="page-body">
        <div className="page-inner">
          {items === null && <SkeletonList rows={4} />}
          {items?.length === 0 && <Empty icon="⭐" title="No starred messages" body="Long-press (or right-click) any message and tap Star to save it here." />}
          {items?.map(s => (
            <div key={s.id} className="card starred-card" onClick={() => navigate(`/chat/${s.chatId}`)}>
              <div className="starred-top">
                <strong>{s.senderName}</strong>
                <span className="muted-text">in {s.chatTitle || "chat"} · {fmtListTime(s.createdAt)}</span>
                <button className="icon-btn sm" title="Unstar" onClick={(e) => { e.stopPropagation(); starMessage(uid, s.chatId, s, false).catch(toastError); }}><IoStar style={{ color: "#f59e0b" }} /></button>
              </div>
              {s.image && <img className="starred-img" src={s.image?.url || s.image} alt="" />}
              <div className="starred-text">{s.text}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
