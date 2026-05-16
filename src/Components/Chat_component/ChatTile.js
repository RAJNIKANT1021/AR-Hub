import React from 'react';
import './chattile1.css';

function ChatTile({ name, avatar, lastMessage, time, unread, online, isGroup }) {
  const initials = name ? name.slice(0, 2).toUpperCase() : '?';

  return (
    <div className="chat-tile">
      <div className="tile-avatar-wrap">
        {avatar ? (
          <img className="tile-avatar" src={avatar} alt={name} />
        ) : (
          <div className="tile-avatar tile-avatar-placeholder">{initials}</div>
        )}
        {online && <span className="tile-online-dot" />}
      </div>

      <div className="tile-info">
        <div className="tile-row">
          <span className="tile-name">{name}</span>
          {time && <span className="tile-time">{time}</span>}
        </div>
        <div className="tile-row">
          <span className="tile-last-msg">{lastMessage || (isGroup ? 'Group chat' : 'Say hello!')}</span>
          {unread > 0 && <span className="tile-badge">{unread > 99 ? '99+' : unread}</span>}
        </div>
      </div>
    </div>
  );
}

export default ChatTile;
