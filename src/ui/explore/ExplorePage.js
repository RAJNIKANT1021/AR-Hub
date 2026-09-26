import React, { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import {
  IoHeart, IoHeartOutline, IoChatbubbleOutline, IoShareSocialOutline, IoImageOutline, IoClose, IoEllipsisHorizontal,
  IoTrashOutline, IoFlagOutline, IoArrowUp, IoArrowDown, IoAdd, IoArrowBack, IoSend, IoCodeSlash, IoFlame, IoTimeOutline,
  IoTrophyOutline, IoLinkOutline,
} from "react-icons/io5";
import "../../styles/explore.css";
import { useApp, toastError, toastOk } from "../../Context/ChatContext";
import {
  subscribePosts, createPost, toggleLike, deletePost, subscribeComments, addComment, deleteComment,
  COMMUNITIES, subscribeThreads, subscribeThread, createThread, voteThread, deleteThread,
  MOODS, subscribeConfessions, createConfession, isMyConfession, deleteConfession, reactConfession, aliasFor,
  addAnonComment, deleteAnonComment, isMyAnonComment,
} from "../../lib/social";
import { subscribeStatuses, sendMessage, reportUser } from "../../lib/db";
import { compressImage } from "../../lib/media";
import { fmtRelative, toMillis, RichText } from "../../lib/format";
import { sounds } from "../../lib/notify";
import Avatar from "../common/Avatar";
import Sheet from "../common/Sheet";
import Menu from "../common/Menu";
import Empty, { SkeletonList, Spinner } from "../common/Empty";
import { ChatPicker } from "../hub/Whiteboard";

const TABS = [
  { key: "feed", label: "Feed" },
  { key: "forums", label: "Forums" },
  { key: "confessions", label: "Confessions" },
];

export default function ExplorePage() {
  const { tab = "feed", id } = useParams();
  const navigate = useNavigate();
  if (tab === "forums" && id) return <ThreadView tid={id} />;
  return (
    <div className="page explore">
      <header className="page-header">
        <h1 className="page-title">Explore</h1>
        <button className="btn btn-soft btn-sm" onClick={() => navigate("/hub/code")}><IoCodeSlash /> Code Arena</button>
      </header>
      <div className="explore-tabs">
        {TABS.map(t => (
          <button key={t.key} className={tab === t.key ? "on" : ""} onClick={() => navigate(`/explore/${t.key}`)}>{t.label}</button>
        ))}
      </div>
      <div className="page-body">
        <div className="page-inner explore-inner">
          {tab === "feed" && <Feed />}
          {tab === "forums" && <Forums />}
          {tab === "confessions" && <Confessions />}
        </div>
      </div>
    </div>
  );
}

/* ═══════════════════════════ Feed (X / Instagram) ═══════════════════════════ */

function StoriesBar() {
  const navigate = useNavigate();
  const { uid, me, usersById, visibleChats } = useApp();
  const [all, setAll] = useState([]);
  useEffect(() => subscribeStatuses(setAll), []);
  const owners = useMemo(() => {
    const circle = new Set([...(me?.friends || [])]);
    visibleChats.forEach(c => { if (c.type !== "group") c.members?.forEach(m => circle.add(m)); });
    const now = Date.now();
    const by = {};
    all.filter(s => s.uid !== uid && circle.has(s.uid) && toMillis(s.expiresAt) > now).forEach(s => { (by[s.uid] = by[s.uid] || []).push(s); });
    return Object.entries(by).map(([o, list]) => ({ o, seen: list.every(s => (s.viewers || []).includes(uid)) })).sort((a, b) => a.seen - b.seen);
  }, [all, uid, me, visibleChats]);
  return (
    <div className="stories-bar">
      <button className="story-chip" onClick={() => navigate("/status?new=1")}>
        <span className="story-add-wrap"><Avatar src={me?.avatar} name={me?.name} size={58} /><span className="status-add"><IoAdd /></span></span>
        <span>Your story</span>
      </button>
      {owners.map(({ o, seen }) => (
        <button key={o} className="story-chip" onClick={() => navigate("/status")}>
          <Avatar src={usersById[o]?.avatar} name={usersById[o]?.name} size={58} ring={seen ? "seen" : "new"} />
          <span>{usersById[o]?.name?.split(" ")[0] || "Friend"}</span>
        </button>
      ))}
    </div>
  );
}

function Feed() {
  const { uid, me } = useApp();
  const [params, setParams] = useSearchParams();
  const tag = params.get("tag");
  const [posts, setPosts] = useState(null);
  const [comments, setComments] = useState(null);
  const [share, setShare] = useState(null);

  useEffect(() => { setPosts(null); return subscribePosts(setPosts, { tag }); }, [tag]);

  const trending = useMemo(() => {
    const c = {};
    (posts || []).forEach(p => (p.tags || []).forEach(t => { c[t] = (c[t] || 0) + 1 + (p.likes?.length || 0) * 0.5; }));
    return Object.entries(c).sort((a, b) => b[1] - a[1]).slice(0, 8).map(([t]) => t);
  }, [posts]);

  return (
    <div className="feed">
      {!tag && <StoriesBar />}
      <PostComposer me={me} />
      {tag ? (
        <div className="tag-banner"><strong>#{tag}</strong><button className="icon-btn sm" onClick={() => setParams({})} aria-label="Clear tag"><IoClose /></button></div>
      ) : trending.length > 0 && (
        <div className="chips trending"><span className="trend-label"><IoFlame /> Trending</span>{trending.map(t => <button key={t} className="chip" onClick={() => setParams({ tag: t })}>#{t}</button>)}</div>
      )}
      {posts === null && <SkeletonList rows={3} />}
      {posts?.length === 0 && <Empty icon="✨" title={tag ? `No posts with #${tag}` : "Nothing here yet"} body="Share a thought, a photo or a #hashtag — be the first!" />}
      {posts?.map(p => <PostCard key={p.id} p={p} uid={uid} onComments={() => setComments(p)} onShare={() => setShare(p)} onTag={(t) => setParams({ tag: t })} />)}
      <CommentsSheet parent="posts" item={comments} onClose={() => setComments(null)} />
      <ChatPicker open={!!share} onClose={() => setShare(null)} title="Share post to…" onPick={async (chat, meNow) => {
        const p = share; setShare(null);
        try {
          await sendMessage(chat.id, p.image
            ? { chat, me: meNow, type: "image", image: p.image, text: `${p.name}: ${p.text}`.slice(0, 300) }
            : { chat, me: meNow, text: `📣 *${p.name}*: ${p.text}` });
          toastOk("Shared");
        } catch (e) { toastError(e); }
      }} />
    </div>
  );
}

function PostComposer({ me }) {
  const [text, setText] = useState("");
  const [image, setImage] = useState(null);
  const [busy, setBusy] = useState(false);
  const fileRef = useRef(null);
  const post = async () => {
    if (!text.trim() && !image) return;
    setBusy(true);
    try { await createPost(me, { text, image }); setText(""); setImage(null); sounds.send(); }
    catch (e) { toastError(e); } finally { setBusy(false); }
  };
  return (
    <div className="card composer-card">
      <Avatar src={me?.avatar} name={me?.name} size={42} />
      <div className="composer-card-main">
        <textarea value={text} maxLength={500} onChange={e => setText(e.target.value)} placeholder="What's happening? Use #hashtags to join trends" rows={text ? 3 : 2}
          onKeyDown={e => { if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) post(); }} />
        {image && (
          <div className="composer-img"><img src={image.url} alt="" /><button className="icon-btn sm" onClick={() => setImage(null)} aria-label="Remove photo"><IoClose /></button></div>
        )}
        <div className="composer-card-foot">
          <button className="icon-btn" onClick={() => fileRef.current?.click()} title="Add photo"><IoImageOutline /></button>
          <span className="char-count">{text.length ? `${text.length}/500` : ""}</span>
          <button className="btn btn-primary btn-sm" disabled={busy || (!text.trim() && !image)} onClick={post}>{busy ? "Posting…" : "Post"}</button>
        </div>
        <input ref={fileRef} type="file" accept="image/*" hidden onChange={async e => {
          const f = e.target.files?.[0]; e.target.value = "";
          if (f) try { setImage(await compressImage(f, 1080)); } catch (err) { toastError(err); }
        }} />
      </div>
    </div>
  );
}

function PostCard({ p, uid, onComments, onShare, onTag }) {
  const { usersById } = useApp();
  const [menu, setMenu] = useState(null);
  const [burst, setBurst] = useState(false);
  const lastTap = useRef(0);
  const liked = (p.likes || []).includes(uid);
  const author = usersById[p.uid];
  const like = () => { sounds.tap(); toggleLike(p.id, uid, liked).catch(toastError); };
  const onImgTap = () => {
    const now = Date.now();
    if (now - lastTap.current < 300) {
      if (!liked) like();
      setBurst(true); setTimeout(() => setBurst(false), 700);
    }
    lastTap.current = now;
  };
  return (
    <article className="card post">
      <header className="post-head">
        <Avatar src={author?.avatar || p.avatar} name={author?.name || p.name} size={42} />
        <div className="post-who"><strong>{author?.name || p.name}</strong><span>{fmtRelative(p.createdAt)}</span></div>
        <button className="icon-btn sm" aria-label="Post options" onClick={(e) => { const r = e.currentTarget.getBoundingClientRect(); setMenu({ x: r.right - 200, y: r.bottom }); }}><IoEllipsisHorizontal /></button>
      </header>
      {p.text && (
        <div className="post-text">
          {p.text.split(/(#[\p{L}\p{N}_]{2,30})/u).map((part, i) =>
            part.startsWith("#") ? <button key={i} className="hashtag" onClick={() => onTag(part.slice(1).toLowerCase())}>{part}</button> : <RichText key={i} text={part} />)}
        </div>
      )}
      {p.image && (
        <div className="post-img" onClick={onImgTap}>
          <img src={p.image.url || p.image} alt="" loading="lazy" style={{ aspectRatio: p.image.width ? `${p.image.width}/${p.image.height}` : undefined }} />
          {burst && <IoHeart className="heart-burst" />}
        </div>
      )}
      <footer className="post-actions">
        <button className={`act ${liked ? "liked" : ""}`} onClick={like} aria-label="Like">{liked ? <IoHeart /> : <IoHeartOutline />}<span>{p.likes?.length || ""}</span></button>
        <button className="act" onClick={onComments} aria-label="Comments"><IoChatbubbleOutline /><span>{p.commentCount || ""}</span></button>
        <button className="act" onClick={onShare} aria-label="Share"><IoShareSocialOutline /></button>
      </footer>
      {menu && <Menu at={menu} onClose={() => setMenu(null)} items={[
        { label: "Copy text", icon: <IoLinkOutline />, onClick: () => navigator.clipboard?.writeText(p.text).then(() => toastOk("Copied")) },
        { label: "Delete post", icon: <IoTrashOutline />, danger: true, hidden: p.uid !== uid, onClick: () => deletePost(p.id).then(() => toastOk("Post deleted")).catch(toastError) },
        { label: "Report", icon: <IoFlagOutline />, hidden: p.uid === uid, onClick: () => reportUser(uid, p.uid, `post:${p.id}`).then(() => toastOk("Reported", "Thanks — we'll take a look.")).catch(toastError) },
      ]} />}
    </article>
  );
}

/* ═══════════════════════════ Comments (shared) ═══════════════════════════ */

function CommentsSheet({ parent, item, onClose, anonymous = false }) {
  const { uid, me, usersById } = useApp();
  const [list, setList] = useState(null);
  const [text, setText] = useState("");
  const endRef = useRef(null);
  useEffect(() => {
    if (!item) return;
    setList(null); setText("");
    return subscribeComments(parent, item.id, setList);
  }, [parent, item]);
  useEffect(() => { endRef.current?.scrollIntoView({ behavior: "smooth" }); }, [list?.length]);
  if (!item) return null;
  const send = async () => {
    const t = text.trim();
    if (!t) return;
    setText("");
    try {
      if (anonymous) await addAnonComment(item.id, uid, t);
      else await addComment(parent, item.id, { text: t, uid, name: me?.name || "", avatar: me?.avatar || null });
    } catch (e) { toastError(e); }
  };
  return (
    <Sheet open onClose={onClose} title={`Comments${list ? ` · ${list.length}` : ""}`} size="md"
      footer={<>
        <input className="input" style={{ flex: 1 }} value={text} onChange={e => setText(e.target.value)} maxLength={400}
          placeholder={anonymous ? `Reply anonymously as ${aliasFor(item.id)}` : "Add a comment…"} onKeyDown={e => e.key === "Enter" && send()} />
        <button className="send-btn" onClick={send} disabled={!text.trim()} aria-label="Send comment"><IoSend /></button>
      </>}>
      {list === null && <div className="page-loader" style={{ height: 120 }}><Spinner /></div>}
      {list?.length === 0 && <Empty icon="💭" title="No comments yet" body="Start the conversation." />}
      {list?.map(c => {
        const u = !anonymous ? usersById[c.uid] : null;
        return (
          <div key={c.id} className="comment">
            {anonymous ? <Avatar emoji="🎭" name={c.alias} size={34} /> : <Avatar src={u?.avatar || c.avatar} name={u?.name || c.name} size={34} />}
            <div className="comment-body">
              <div className="comment-head"><strong>{anonymous ? c.alias : (u?.name || c.name)}</strong><span>{fmtRelative(c.createdAt)}</span></div>
              <div className="comment-text"><RichText text={c.text} /></div>
            </div>
            {(anonymous ? isMyAnonComment(c.id) : c.uid === uid) && (
              <button className="icon-btn sm" aria-label="Delete comment"
                onClick={() => (anonymous ? deleteAnonComment(item.id, c.id) : deleteComment(parent, item.id, c.id)).catch(toastError)}><IoTrashOutline /></button>
            )}
          </div>
        );
      })}
      <div ref={endRef} />
    </Sheet>
  );
}

/* ═══════════════════════════ Forums (Reddit) ═══════════════════════════ */

const hot = (t) => (t.score || 0) / Math.pow((Date.now() - toMillis(t.createdAt)) / 3600000 + 2, 1.5);

function Forums() {
  const navigate = useNavigate();
  const [community, setCommunity] = useState(null);
  const [sort, setSort] = useState("hot");
  const [threads, setThreads] = useState(null);
  const [newOpen, setNewOpen] = useState(false);
  useEffect(() => { setThreads(null); return subscribeThreads(setThreads, { community }); }, [community]);
  const sorted = useMemo(() => [...(threads || [])].sort((a, b) =>
    sort === "new" ? toMillis(b.createdAt) - toMillis(a.createdAt) : sort === "top" ? (b.score || 0) - (a.score || 0) : hot(b) - hot(a)), [threads, sort]);
  const comm = COMMUNITIES.find(c => c.key === community);
  return (
    <div className="forums">
      <div className="chips wrap forum-comms">
        <button className={`chip ${!community ? "active" : ""}`} onClick={() => setCommunity(null)}>🌐 All</button>
        {COMMUNITIES.map(c => <button key={c.key} className={`chip ${community === c.key ? "active" : ""}`} onClick={() => setCommunity(c.key)}>{c.emoji} {c.name}</button>)}
      </div>
      {comm && <div className="card comm-banner"><span className="comm-emoji">{comm.emoji}</span><div><strong>h/{comm.key}</strong><p>{comm.desc}</p></div></div>}
      <div className="forum-bar">
        <div className="seg small">
          <button className={sort === "hot" ? "on" : ""} onClick={() => setSort("hot")}><IoFlame /> Hot</button>
          <button className={sort === "new" ? "on" : ""} onClick={() => setSort("new")}><IoTimeOutline /> New</button>
          <button className={sort === "top" ? "on" : ""} onClick={() => setSort("top")}><IoTrophyOutline /> Top</button>
        </div>
        <button className="btn btn-primary btn-sm" onClick={() => setNewOpen(true)}><IoAdd /> New thread</button>
      </div>
      {threads === null && <SkeletonList rows={4} />}
      {threads?.length === 0 && <Empty icon="🗣️" title="No threads yet" body="Start a discussion — ask a question or share something cool." action={<button className="btn btn-primary" onClick={() => setNewOpen(true)}>Start a thread</button>} />}
      {sorted.map(t => <ThreadCard key={t.id} t={t} onOpen={() => navigate(`/explore/forums/${t.id}`)} />)}
      <NewThreadSheet open={newOpen} onClose={() => setNewOpen(false)} initial={community} onCreated={(id) => navigate(`/explore/forums/${id}`)} />
    </div>
  );
}

function Votes({ t, uid, vertical = true }) {
  const up = (t.up || []).includes(uid), down = (t.down || []).includes(uid);
  return (
    <div className={`votes ${vertical ? "" : "row"}`} onClick={e => e.stopPropagation()}>
      <button className={`vote up ${up ? "on" : ""}`} aria-label="Upvote" onClick={() => { sounds.tap(); voteThread(t.id, uid, 1).catch(toastError); }}><IoArrowUp /></button>
      <span className={`vote-score ${up ? "up" : down ? "down" : ""}`}>{t.score || 0}</span>
      <button className={`vote down ${down ? "on" : ""}`} aria-label="Downvote" onClick={() => { sounds.tap(); voteThread(t.id, uid, -1).catch(toastError); }}><IoArrowDown /></button>
    </div>
  );
}

function ThreadCard({ t, onOpen }) {
  const { uid } = useApp();
  const comm = COMMUNITIES.find(c => c.key === t.community);
  return (
    <article className="card thread" onClick={onOpen}>
      <Votes t={t} uid={uid} />
      <div className="thread-main">
        <div className="thread-meta"><span className="thread-comm">{comm?.emoji} h/{t.community}</span> · {t.name} · {fmtRelative(t.createdAt)}</div>
        <h3>{t.title}</h3>
        {t.body && <p className="thread-body">{t.body}</p>}
        <div className="thread-foot"><IoChatbubbleOutline /> {t.commentCount || 0} comments</div>
      </div>
    </article>
  );
}

function NewThreadSheet({ open, onClose, initial, onCreated }) {
  const { me } = useApp();
  const [community, setCommunity] = useState(initial || "general");
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [busy, setBusy] = useState(false);
  useEffect(() => { if (open) { setCommunity(initial || "general"); setTitle(""); setBody(""); } }, [open, initial]);
  const submit = async () => {
    setBusy(true);
    try { const ref = await createThread(me, { community, title, body }); onClose(); onCreated(ref.id); }
    catch (e) { toastError(e); } finally { setBusy(false); }
  };
  return (
    <Sheet open={open} onClose={onClose} title="New thread" size="md"
      footer={<><button className="btn btn-ghost" onClick={onClose}>Cancel</button><button className="btn btn-primary" disabled={!title.trim() || busy} onClick={submit}>{busy ? "Posting…" : "Post"}</button></>}>
      <div className="field">
        <span className="field-label">Community</span>
        <select className="select" value={community} onChange={e => setCommunity(e.target.value)}>
          {COMMUNITIES.map(c => <option key={c.key} value={c.key}>{c.emoji} h/{c.key} — {c.name}</option>)}
        </select>
      </div>
      <div className="field"><span className="field-label">Title</span><input className="input" value={title} maxLength={140} onChange={e => setTitle(e.target.value)} placeholder="An interesting title" autoFocus /></div>
      <div className="field"><span className="field-label">Text (optional)</span><textarea className="textarea" rows={6} value={body} maxLength={4000} onChange={e => setBody(e.target.value)} placeholder="Say more… (*bold*, _italic_, `code` and links supported)" /></div>
    </Sheet>
  );
}

function ThreadView({ tid }) {
  const navigate = useNavigate();
  const { uid, me, usersById } = useApp();
  const [t, setT] = useState(undefined);
  const [comments, setComments] = useState(null);
  const [text, setText] = useState("");
  useEffect(() => subscribeThread(tid, setT), [tid]);
  useEffect(() => subscribeComments("threads", tid, setComments), [tid]);
  const send = async () => {
    const v = text.trim(); if (!v) return;
    setText("");
    try { await addComment("threads", tid, { text: v, uid, name: me?.name || "", avatar: me?.avatar || null }); } catch (e) { toastError(e); }
  };
  return (
    <div className="page explore">
      <header className="page-header">
        <button className="icon-btn" onClick={() => navigate("/explore/forums")} aria-label="Back"><IoArrowBack /></button>
        <h1 className="page-title sm">{t ? `h/${t.community}` : "Thread"}</h1>
        {t && t.uid === uid && <button className="icon-btn" title="Delete thread" onClick={() => deleteThread(tid).then(() => { toastOk("Thread deleted"); navigate("/explore/forums"); }).catch(toastError)}><IoTrashOutline /></button>}
      </header>
      <div className="page-body">
        <div className="page-inner explore-inner">
          {t === undefined && <div className="page-loader"><Spinner /></div>}
          {t === null && <Empty icon="🫥" title="Thread not found" body="It may have been deleted." />}
          {t && (
            <>
              <article className="card thread open">
                <Votes t={t} uid={uid} />
                <div className="thread-main">
                  <div className="thread-meta"><Avatar src={usersById[t.uid]?.avatar || t.avatar} name={t.name} size={20} /> {t.name} · {fmtRelative(t.createdAt)}</div>
                  <h2>{t.title}</h2>
                  {t.body && <div className="thread-body full"><RichText text={t.body} /></div>}
                </div>
              </article>
              <div className="card reply-box">
                <textarea value={text} onChange={e => setText(e.target.value)} placeholder="What are your thoughts?" rows={3} maxLength={2000} />
                <div className="reply-foot"><button className="btn btn-primary btn-sm" disabled={!text.trim()} onClick={send}>Comment</button></div>
              </div>
              <div className="section-label">{comments?.length || 0} comments</div>
              {comments?.map(c => (
                <div key={c.id} className="comment thread-comment">
                  <Avatar src={usersById[c.uid]?.avatar || c.avatar} name={usersById[c.uid]?.name || c.name} size={32} />
                  <div className="comment-body">
                    <div className="comment-head"><strong>{usersById[c.uid]?.name || c.name}</strong>{c.uid === t.uid && <span className="op-tag">OP</span>}<span>{fmtRelative(c.createdAt)}</span></div>
                    <div className="comment-text"><RichText text={c.text} /></div>
                  </div>
                  {c.uid === uid && <button className="icon-btn sm" aria-label="Delete comment" onClick={() => deleteComment("threads", tid, c.id).catch(toastError)}><IoTrashOutline /></button>}
                </div>
              ))}
            </>
          )}
        </div>
      </div>
    </div>
  );
}

/* ═══════════════════════════ Confessions (anonymous) ═══════════════════════════ */

const CONF_REACTIONS = ["❤️", "😂", "😮", "😢", "🔥", "🫂"];

function Confessions() {
  const { uid } = useApp();
  const [list, setList] = useState(null);
  const [mood, setMood] = useState("all");
  const [comments, setComments] = useState(null);
  useEffect(() => subscribeConfessions(setList), []);
  const shown = (list || []).filter(c => mood === "all" || c.mood === mood);
  return (
    <div className="confessions">
      <ConfessionComposer uid={uid} />
      <div className="chips">
        <button className={`chip ${mood === "all" ? "active" : ""}`} onClick={() => setMood("all")}>All</button>
        {MOODS.map(m => <button key={m.key} className={`chip ${mood === m.key ? "active" : ""}`} onClick={() => setMood(m.key)}>{m.emoji} {m.label}</button>)}
      </div>
      {list === null && <SkeletonList rows={3} />}
      {list && shown.length === 0 && <Empty icon="🤫" title="No confessions yet" body="Say what you can't say anywhere else. Nobody will know it's you." />}
      <div className="conf-grid">
        {shown.map(c => <ConfessionCard key={c.id} c={c} uid={uid} onComments={() => setComments(c)} />)}
      </div>
      <CommentsSheet parent="confessions" item={comments} onClose={() => setComments(null)} anonymous />
    </div>
  );
}

function ConfessionComposer({ uid }) {
  const [text, setText] = useState("");
  const [mood, setMood] = useState("confess");
  const [busy, setBusy] = useState(false);
  const post = async () => {
    setBusy(true);
    try { await createConfession(uid, { text, mood }); setText(""); toastOk("Posted anonymously 🎭"); }
    catch (e) { toastError(e); } finally { setBusy(false); }
  };
  return (
    <div className="card conf-composer">
      <div className="conf-anon"><span>🎭</span><div><strong>You're anonymous</strong><span>Your name is never shown or stored with the post.</span></div></div>
      <textarea value={text} maxLength={600} rows={3} onChange={e => setText(e.target.value)} placeholder="Confess, vent, share a hot take…" />
      <div className="conf-foot">
        <div className="chips">{MOODS.map(m => <button key={m.key} className={`chip ${mood === m.key ? "active" : ""}`} onClick={() => setMood(m.key)}>{m.emoji} {m.label}</button>)}</div>
        <button className="btn btn-primary btn-sm" disabled={!text.trim() || busy} onClick={post}>{busy ? "Posting…" : "Post anonymously"}</button>
      </div>
    </div>
  );
}

function ConfessionCard({ c, uid, onComments }) {
  const [mine, setMine] = useState(null);
  const [menu, setMenu] = useState(null);
  const m = MOODS.find(x => x.key === c.mood) || MOODS[0];
  const reactions = Object.entries(c.reactions || {}).filter(([, e]) => e);
  const counts = {};
  reactions.forEach(([, e]) => { counts[e] = (counts[e] || 0) + 1; });
  const myReaction = c.reactions?.[uid];
  const openMenu = async (e) => {
    const r = e.currentTarget.getBoundingClientRect();
    const own = mine ?? await isMyConfession(c.id, uid);
    setMine(own);
    setMenu({ at: { x: r.right - 200, y: r.bottom }, own });
  };
  return (
    <article className={`card conf mood-${c.mood}`}>
      <header className="conf-head">
        <span className="conf-mood">{m.emoji} {m.label}</span>
        <span className="muted-text">{fmtRelative(c.createdAt)}</span>
        <button className="icon-btn sm" aria-label="Options" onClick={openMenu}><IoEllipsisHorizontal /></button>
      </header>
      <p className="conf-text">{c.text}</p>
      <footer className="conf-actions">
        <div className="conf-reacts">
          {CONF_REACTIONS.map(e => (
            <button key={e} className={myReaction === e ? "on" : ""} onClick={() => { sounds.tap(); reactConfession(c.id, uid, myReaction === e ? null : e).catch(toastError); }}>
              {e}{counts[e] ? <span>{counts[e]}</span> : null}
            </button>
          ))}
        </div>
        <button className="act" onClick={onComments}><IoChatbubbleOutline /><span>{c.commentCount || 0}</span></button>
      </footer>
      {menu && <Menu at={menu.at} onClose={() => setMenu(null)} items={[
        { label: "Copy text", icon: <IoLinkOutline />, onClick: () => navigator.clipboard?.writeText(c.text).then(() => toastOk("Copied")) },
        { label: "Delete (you posted this)", icon: <IoTrashOutline />, danger: true, hidden: !menu.own, onClick: () => deleteConfession(c.id).then(() => toastOk("Deleted")).catch(toastError) },
        { label: "Report", icon: <IoFlagOutline />, hidden: menu.own, onClick: () => reportUser(uid, "anonymous", `confession:${c.id}`).then(() => toastOk("Reported")).catch(toastError) },
      ]} />}
    </article>
  );
}
