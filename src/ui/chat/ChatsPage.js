import React from "react";
import { useParams } from "react-router-dom";
import "../../styles/chat.css";
import ChatList from "./ChatList";
import Conversation from "./Conversation";

function Welcome() {
  return (
    <div className="welcome-pane">
      <div className="welcome-art">
        <img src="/icon.svg" alt="" width="88" height="88" />
      </div>
      <h2>AR Hub for Web</h2>
      <p>Send messages, voice notes and photos, start rooms, and make voice or video calls. Everything syncs in real time across your devices.</p>
      <div className="welcome-keys">
        <span><kbd>Ctrl</kbd> <kbd>K</kbd> search everything</span>
        <span><kbd>Alt</kbd> <kbd>1-5</kbd> switch tabs</span>
      </div>
      <div className="welcome-foot">🔒 Your chats are synced securely with Firebase</div>
    </div>
  );
}

export default function ChatsPage() {
  const { cid } = useParams();
  return (
    <div className={`chats-page ${cid ? "has-chat" : ""}`}>
      <aside className="chats-list-pane"><ChatList activeId={cid} /></aside>
      <section className="chats-conv-pane">
        {cid ? <Conversation key={cid} cid={cid} /> : <Welcome />}
      </section>
    </div>
  );
}
