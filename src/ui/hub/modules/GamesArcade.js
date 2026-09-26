import React, { useEffect, useMemo, useState } from "react";
import { useApp } from "../../../Context/ChatContext";
import { subscribeGameLogs } from "../../../lib/games";
import { addNotification, ensureChat } from "../../../lib/db";
import { fmtRelative } from "../../../lib/format";
import GameHub, { GAME_LIST } from "../../../Components/Games/GameHub";
import Sheet from "../../common/Sheet";
import Avatar from "../../common/Avatar";
import Empty from "../../common/Empty";

export default function GamesArcade() {
  const { uid, me, allUsers } = useApp();
  const [logs, setLogs] = useState([]);
  const [opponent, setOpponent] = useState(null);
  const [pickFor, setPickFor] = useState(null);

  useEffect(() => subscribeGameLogs(uid, setLogs), [uid]);

  const stats = useMemo(() => {
    const w = logs.filter(l => l.result === "win").length;
    const l = logs.filter(x => x.result === "loss").length;
    const d = logs.filter(x => x.result === "draw").length;
    return { w, l, d, rate: logs.length ? Math.round((w / logs.length) * 100) : 0 };
  }, [logs]);

  const leaderboard = useMemo(() => {
    const by = {};
    logs.forEach(x => {
      const o = by[x.opponentId] = by[x.opponentId] || { id: x.opponentId, name: x.opponentName, w: 0, l: 0, d: 0 };
      o[x.result === "win" ? "w" : x.result === "loss" ? "l" : "d"] += 1;
    });
    return Object.values(by).sort((a, b) => (b.w + b.l + b.d) - (a.w + a.l + a.d)).slice(0, 5);
  }, [logs]);

  const friends = (me?.friends || []);
  const people = allUsers.filter(u => u.uid !== uid && !(me?.blocklist || []).includes(u.uid))
    .sort((a, b) => (b.status === "online") - (a.status === "online") || friends.includes(b.uid) - friends.includes(a.uid));

  return (
    <div className="arcade">
      <div className="arcade-stats">
        <div className="stat-card"><strong>{logs.length}</strong><span>Games played</span></div>
        <div className="stat-card win"><strong>{stats.w}</strong><span>Wins</span></div>
        <div className="stat-card loss"><strong>{stats.l}</strong><span>Losses</span></div>
        <div className="stat-card"><strong>{stats.rate}%</strong><span>Win rate</span></div>
      </div>

      <h3 className="hub-h3">Pick a game</h3>
      <div className="arcade-grid">
        {GAME_LIST.map(g => (
          <button key={g.key} className="arcade-card" onClick={() => setPickFor(g)}>
            <span className="arcade-emoji">{g.emoji}</span>
            <strong>{g.label}</strong>
            <span>{g.desc}</span>
          </button>
        ))}
      </div>

      <div className="arcade-cols">
        <div>
          <h3 className="hub-h3">Rivals</h3>
          {leaderboard.length === 0 ? <p className="muted-text">Play a game to start a rivalry!</p> :
            leaderboard.map(r => (
              <div key={r.id} className="rival-row card">
                <strong>{r.name}</strong>
                <span className="rival-score"><b className="win">{r.w}W</b> · <b className="loss">{r.l}L</b> · {r.d}D</span>
              </div>
            ))}
        </div>
        <div>
          <h3 className="hub-h3">Recent matches</h3>
          {logs.length === 0 ? <p className="muted-text">No matches yet.</p> :
            logs.slice(0, 8).map(l => {
              const g = GAME_LIST.find(x => x.key === l.gameType);
              return (
                <div key={l.id} className={`match-row ${l.result}`}>
                  <span>{g?.emoji || "🎮"}</span>
                  <span className="match-main"><strong>{g?.label || l.gameType}</strong><span>vs {l.opponentName} · {fmtRelative(l.createdAt)}</span></span>
                  <span className="match-res">{l.result === "win" ? "🏆 Win" : l.result === "loss" ? "Loss" : "Draw"}</span>
                </div>
              );
            })}
        </div>
      </div>

      <Sheet open={!!pickFor} onClose={() => setPickFor(null)} title={`Challenge someone — ${pickFor?.label || ""}`} size="sm">
        <p className="info-meta" style={{ padding: 0, marginBottom: 8 }}>They'll get a notification and an invite banner in your chat.</p>
        {people.length === 0 && <Empty icon="🧑‍🤝‍🧑" title="No players yet" />}
        {people.slice(0, 60).map(u => (
          <div key={u.uid} className="row" onClick={() => { setOpponent({ ...u, game: pickFor.key }); setPickFor(null); }}>
            <Avatar src={u.avatar} name={u.name} size={40} online={u.status === "online"} />
            <div className="row-body"><div className="row-title">{u.name}</div><div className="row-sub">{u.status === "online" ? "online — ready to play" : "offline"}</div></div>
          </div>
        ))}
      </Sheet>

      <Sheet open={!!opponent} onClose={() => setOpponent(null)} size="lg" className="games-sheet" hideClose>
        {opponent && (
          <GameHub myUid={uid} myName={me?.name || "Me"} partnerUid={opponent.uid} partnerName={opponent.name} autoLaunch={opponent.game}
            onClose={() => setOpponent(null)}
            onInvite={(label) => ensureChat(uid, opponent.uid).then(cid => addNotification(opponent.uid, { type: "game_invite", fromUid: uid, senderName: me?.name, chatId: cid, text: `invited you to play ${label} 🎮` })).catch(() => {})} />
        )}
      </Sheet>
    </div>
  );
}
