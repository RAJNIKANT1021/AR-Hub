import React, { useEffect, useMemo, useRef, useState } from "react";
import { IoPlay, IoCheckmarkCircle, IoCloseCircle, IoRefresh, IoTrophy, IoArrowBack, IoShareSocialOutline, IoCodeSlash } from "react-icons/io5";
import { useApp, toastError, toastOk } from "../../../Context/ChatContext";
import { subscribeLeaderboard, subscribeMySolves, recordSolve, createPost } from "../../../lib/social";
import { sounds } from "../../../lib/notify";
import Avatar from "../../common/Avatar";
import PROBLEMS from "./problems";

// Runs user code in a throw-away Web Worker so infinite loops can be killed.
const WORKER_SRC = `
self.onmessage = (e) => {
  const { code, fn, tests, unordered } = e.data;
  const logs = [];
  const log = (...a) => logs.push(a.map(x => { try { return typeof x === "string" ? x : JSON.stringify(x); } catch { return String(x); } }).join(" "));
  self.console = { log, info: log, warn: log, error: log };
  let f;
  try { f = new Function("console", code + "\\n;return typeof " + fn + " === 'function' ? " + fn + " : undefined;")(self.console); }
  catch (err) { self.postMessage({ compileError: String(err && err.message || err), logs }); return; }
  if (!f) { self.postMessage({ compileError: "Function \\"" + fn + "\\" is not defined.", logs }); return; }
  const norm = (v) => {
    if (unordered && Array.isArray(v)) v = [...v].sort((a, b) => JSON.stringify(a) < JSON.stringify(b) ? -1 : 1);
    return JSON.stringify(v === undefined ? null : v);
  };
  const results = tests.map((t) => {
    const t0 = performance.now();
    try {
      const out = f(...JSON.parse(JSON.stringify(t.args)));
      const ms = performance.now() - t0;
      return { ok: norm(out) === norm(t.expected), got: JSON.stringify(out === undefined ? null : out), ms };
    } catch (err) {
      return { ok: false, error: String(err && err.message || err), ms: performance.now() - t0 };
    }
  });
  self.postMessage({ results, logs: logs.slice(0, 50) });
};`;

function runInWorker(payload, timeout = 3000) {
  return new Promise((resolve) => {
    const url = URL.createObjectURL(new Blob([WORKER_SRC], { type: "text/javascript" }));
    const w = new Worker(url);
    const t = setTimeout(() => { w.terminate(); URL.revokeObjectURL(url); resolve({ timeout: true }); }, timeout);
    w.onmessage = (e) => { clearTimeout(t); w.terminate(); URL.revokeObjectURL(url); resolve(e.data); };
    w.onerror = (e) => { clearTimeout(t); w.terminate(); URL.revokeObjectURL(url); resolve({ compileError: e.message || "Error" }); };
    w.postMessage(payload);
  });
}

const draftKey = (id) => `arhub_code_${id}`;
const DIFF_COLOR = { Easy: "#22c55e", Medium: "#f59e0b", Hard: "#ef4444" };

export default function CodeArena() {
  const { uid, me } = useApp();
  const [solves, setSolves] = useState({ solved: {} });
  const [board, setBoard] = useState([]);
  const [active, setActive] = useState(null);
  const [filter, setFilter] = useState("All");
  useEffect(() => subscribeMySolves(uid, setSolves), [uid]);
  useEffect(() => subscribeLeaderboard(setBoard), []);

  const solvedCount = Object.keys(solves.solved || {}).length;
  const list = PROBLEMS.filter(p => filter === "All" || p.difficulty === filter);

  if (active) return <Solver p={active} me={me} solved={!!solves.solved?.[active.id]} onBack={() => setActive(null)} />;

  return (
    <div className="arena">
      <div className="arena-hero card">
        <div className="arena-ring" style={{ "--p": Math.round((solvedCount / PROBLEMS.length) * 100) }}><span>{solvedCount}/{PROBLEMS.length}</span></div>
        <div>
          <h2><IoCodeSlash /> Code Arena</h2>
          <p className="muted-text">Solve classic interview problems in JavaScript. Code runs safely in your browser against hidden test cases — climb the leaderboard!</p>
        </div>
      </div>
      <div className="arena-cols">
        <div>
          <div className="chips" style={{ marginBottom: 10 }}>
            {["All", "Easy", "Medium", "Hard"].map(d => <button key={d} className={`chip ${filter === d ? "active" : ""}`} onClick={() => setFilter(d)}>{d}</button>)}
          </div>
          <div className="problem-list">
            {list.map((p, i) => {
              const done = solves.solved?.[p.id];
              return (
                <button key={p.id} className="problem-row card" onClick={() => setActive(p)}>
                  <span className={`p-status ${done ? "done" : ""}`}>{done ? <IoCheckmarkCircle /> : i + 1}</span>
                  <span className="p-main"><strong>{p.title}</strong><span>{p.tags.join(" · ")}</span></span>
                  <span className="p-diff" style={{ color: DIFF_COLOR[p.difficulty] }}>{p.difficulty}</span>
                </button>
              );
            })}
          </div>
        </div>
        <aside className="leaderboard card">
          <h3><IoTrophy style={{ color: "#f59e0b" }} /> Leaderboard</h3>
          {board.length === 0 && <p className="muted-text" style={{ padding: ".5rem 0" }}>Be the first to solve a problem!</p>}
          {board.map((r, i) => (
            <div key={r.id} className={`lb-row ${r.id === uid ? "me" : ""}`}>
              <span className="lb-rank">{i < 3 ? ["🥇", "🥈", "🥉"][i] : i + 1}</span>
              <Avatar src={r.avatar} name={r.name} size={30} />
              <span className="lb-name">{r.id === uid ? "You" : r.name}</span>
              <strong>{r.count}</strong>
            </div>
          ))}
        </aside>
      </div>
    </div>
  );
}

function Solver({ p, me, solved, onBack }) {
  const [code, setCode] = useState(() => { try { return localStorage.getItem(draftKey(p.id)) || p.starter; } catch { return p.starter; } });
  const [running, setRunning] = useState(false);
  const [result, setResult] = useState(null);
  const taRef = useRef(null);
  const gutterRef = useRef(null);
  const lines = useMemo(() => code.split("\n").length, [code]);

  useEffect(() => { try { localStorage.setItem(draftKey(p.id), code); } catch {} }, [code, p.id]);

  const run = async () => {
    setRunning(true); setResult(null);
    const t0 = performance.now();
    const res = await runInWorker({ code, fn: p.fn, tests: p.tests, unordered: !!p.unordered });
    const total = Math.round(performance.now() - t0);
    setRunning(false);
    setResult({ ...res, total });
    const allOk = res.results && res.results.every(r => r.ok);
    if (allOk) {
      sounds.notify();
      const ms = Math.max(1, Math.round(res.results.reduce((a, r) => a + r.ms, 0)));
      try { await recordSolve(me, p.id, ms); toastOk("Accepted ✅", `${p.title} solved in ${ms} ms`); } catch (e) { toastError(e); }
    }
  };

  const onKeyDown = (e) => {
    if (e.key === "Tab") {
      e.preventDefault();
      const el = e.currentTarget, s = el.selectionStart, en = el.selectionEnd;
      const next = code.slice(0, s) + "  " + code.slice(en);
      setCode(next);
      requestAnimationFrame(() => { el.selectionStart = el.selectionEnd = s + 2; });
    }
    if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) { e.preventDefault(); run(); }
  };

  const passed = result?.results?.filter(r => r.ok).length || 0;
  const accepted = result?.results && passed === p.tests.length;

  return (
    <div className="solver">
      <div className="solver-top">
        <button className="btn btn-ghost btn-sm" onClick={onBack}><IoArrowBack /> Problems</button>
        {solved && <span className="pill ok"><IoCheckmarkCircle /> Solved</span>}
      </div>
      <div className="solver-grid">
        <section className="card solver-desc">
          <h2>{p.title}</h2>
          <div className="solver-tags"><span style={{ color: DIFF_COLOR[p.difficulty] }}>{p.difficulty}</span>{p.tags.map(t => <span key={t} className="stack-pill sm">{t}</span>)}</div>
          <p>{p.description.split(/(`[^`]+`)/).map((x, i) => x.startsWith("`") ? <code key={i} className="rt-code">{x.slice(1, -1)}</code> : x)}</p>
          <h4>Examples</h4>
          {p.tests.slice(0, 2).map((t, i) => (
            <pre key={i} className="example">{`Input:  ${t.args.map(a => JSON.stringify(a)).join(", ")}\nOutput: ${JSON.stringify(t.expected)}`}</pre>
          ))}
        </section>
        <section className="solver-editor">
          <div className="editor card">
            <div className="editor-bar"><span>JavaScript</span><button className="icon-btn sm" title="Reset code" onClick={() => setCode(p.starter)}><IoRefresh /></button></div>
            <div className="editor-body">
              <div className="gutter" ref={gutterRef} aria-hidden>{Array.from({ length: lines }).map((_, i) => <span key={i}>{i + 1}</span>)}</div>
              <textarea ref={taRef} spellCheck={false} autoCapitalize="off" autoCorrect="off" value={code} onChange={e => setCode(e.target.value)} onKeyDown={onKeyDown}
                onScroll={e => { if (gutterRef.current) gutterRef.current.scrollTop = e.currentTarget.scrollTop; }} aria-label="Code editor" />
            </div>
          </div>
          <div className="solver-actions">
            <span className="muted-text">Ctrl/⌘ + Enter to run</span>
            <button className="btn btn-primary" onClick={run} disabled={running}><IoPlay /> {running ? "Running…" : "Run & submit"}</button>
          </div>
          {result && (
            <div className={`card results ${accepted ? "ok" : "bad"}`}>
              {result.timeout ? <strong>⏱️ Time limit exceeded (3s) — check for infinite loops.</strong>
                : result.compileError ? <><strong>❌ Error</strong><pre className="example">{result.compileError}</pre></>
                : <>
                  <strong>{accepted ? "✅ Accepted" : `❌ Wrong answer — ${passed}/${p.tests.length} tests passed`}</strong>
                  <div className="test-list">
                    {result.results.map((r, i) => (
                      <div key={i} className={`test ${r.ok ? "ok" : ""}`}>
                        {r.ok ? <IoCheckmarkCircle /> : <IoCloseCircle />}
                        <span>Test {i + 1}</span>
                        {!r.ok && <code>{r.error ? `Error: ${r.error}` : `got ${r.got}, expected ${JSON.stringify(p.tests[i].expected)}`}</code>}
                        <span className="muted-text">{r.ms < 1 ? "<1" : r.ms.toFixed(1)} ms</span>
                      </div>
                    ))}
                  </div>
                  {accepted && <button className="btn btn-soft btn-sm" onClick={() => createPost(me, { text: `Just solved "${p.title}" (${p.difficulty}) in the Code Arena 💻✅ #codearena #javascript` }).then(() => toastOk("Shared to your feed")).catch(toastError)}><IoShareSocialOutline /> Share to feed</button>}
                </>}
              {result.logs?.length > 0 && <><div className="field-label" style={{ marginTop: 8 }}>Console</div><pre className="example">{result.logs.join("\n")}</pre></>}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
