import React, { useState } from "react";
import { initials, colorFor } from "../../lib/format";

/** Round avatar with image fallback to coloured initials, optional online dot and status ring. */
export default function Avatar({ src, name, size = 44, online = false, ring = null, emoji = null, color = null, onClick, className = "" }) {
  const [broken, setBroken] = useState(false);
  const style = { width: size, height: size, fontSize: Math.round(size * (emoji ? 0.5 : 0.38)) };
  const bg = color || colorFor(name);
  return (
    <span className={`avatar ${ring ? `avatar-ring ${ring}` : ""} ${onClick ? "clickable" : ""} ${className}`} style={style} onClick={onClick}>
      {emoji ? (
        <span className="avatar-fallback" style={{ background: bg }}>{emoji}</span>
      ) : src && !broken ? (
        <img src={src} alt="" loading="lazy" onError={() => setBroken(true)} draggable={false} />
      ) : (
        <span className="avatar-fallback" style={{ background: bg }}>{initials(name)}</span>
      )}
      {online && <span className="avatar-online" style={{ width: Math.max(10, size * 0.26), height: Math.max(10, size * 0.26) }} />}
    </span>
  );
}

export function ChatAvatar({ chat, partner, size = 48, showOnline = true }) {
  if (chat?.type === "group") return <Avatar emoji={chat.emoji || "💬"} color={chat.color} name={chat.name} size={size} />;
  return <Avatar src={partner?.avatar} name={partner?.name} size={size} online={showOnline && partner?.status === "online"} />;
}
