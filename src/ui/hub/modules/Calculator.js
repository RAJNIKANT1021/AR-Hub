import React, { useCallback, useEffect, useState } from "react";

/** Safe expression evaluator (shunting-yard) — no eval(). Supports + − × ÷ % ^ ( ) and decimals. */
export function evaluate(expr) {
  const src = expr.replace(/×/g, "*").replace(/÷/g, "/").replace(/−/g, "-").replace(/\s+/g, "");
  const tokens = [];
  let i = 0;
  while (i < src.length) {
    const c = src[i];
    if (/[0-9.]/.test(c)) {
      let n = "";
      while (i < src.length && /[0-9.]/.test(src[i])) n += src[i++];
      if ((n.match(/\./g) || []).length > 1) throw new Error("bad number");
      tokens.push({ t: "n", v: parseFloat(n) });
      continue;
    }
    if (c === "%") { tokens.push({ t: "pct" }); i++; continue; }
    if ("+-*/^()".includes(c)) {
      const prev = tokens[tokens.length - 1];
      const unary = c === "-" && (!prev || prev.t === "op" || prev.t === "(");
      tokens.push(c === "(" ? { t: "(" } : c === ")" ? { t: ")" } : { t: "op", v: unary ? "u" : c });
      i++;
      continue;
    }
    throw new Error("bad char");
  }
  const prec = { "+": 1, "-": 1, "*": 2, "/": 2, "^": 3, u: 4 };
  const out = [], ops = [];
  tokens.forEach(tk => {
    if (tk.t === "n") out.push(tk.v);
    else if (tk.t === "pct") out.push(out.pop() / 100);
    else if (tk.t === "op" && tk.v === "u") ops.push(tk);
    else if (tk.t === "op") {
      while (ops.length) {
        const top = ops[ops.length - 1];
        if (top.t === "op" && (prec[top.v] > prec[tk.v] || (prec[top.v] === prec[tk.v] && tk.v !== "^"))) apply(out, ops.pop().v);
        else break;
      }
      ops.push(tk);
    } else if (tk.t === "(") ops.push(tk);
    else if (tk.t === ")") {
      while (ops.length && ops[ops.length - 1].t !== "(") apply(out, ops.pop().v);
      if (!ops.length) throw new Error("paren");
      ops.pop();
    }
  });
  while (ops.length) { const o = ops.pop(); if (o.t === "(") throw new Error("paren"); apply(out, o.v); }
  if (out.length !== 1 || !isFinite(out[0])) throw new Error("invalid");
  return Math.round(out[0] * 1e10) / 1e10;
}
function apply(out, op) {
  if (op === "u") {
    if (!out.length) throw new Error("syntax");
    out.push(-out.pop());
    return;
  }
  const b = out.pop(), a = out.pop();
  if (a === undefined || b === undefined) throw new Error("syntax");
  out.push(op === "+" ? a + b : op === "-" ? a - b : op === "*" ? a * b : op === "/" ? a / b : Math.pow(a, b));
}

const KEYS = ["C", "(", ")", "÷", "7", "8", "9", "×", "4", "5", "6", "−", "1", "2", "3", "+", "%", "0", ".", "="];

export default function Calculator() {
  const [expr, setExpr] = useState("");
  const [history, setHistory] = useState(() => { try { return JSON.parse(localStorage.getItem("arhub_calc")) || []; } catch { return []; } });
  let preview = "";
  try { if (expr && /[+\-×÷*/^%−]/.test(expr)) preview = String(evaluate(expr)); } catch {}

  const press = useCallback((k) => {
    if (k === "C") { setExpr(""); return; }
    if (k === "⌫") { setExpr(e => e.slice(0, -1)); return; }
    if (k === "=") {
      setExpr(e => {
        try {
          const r = String(evaluate(e));
          setHistory(h => { const n = [{ e, r }, ...h].slice(0, 20); localStorage.setItem("arhub_calc", JSON.stringify(n)); return n; });
          return r;
        } catch { return e; }
      });
      return;
    }
    setExpr(e => e + k);
  }, []);

  useEffect(() => {
    const map = { "*": "×", "/": "÷", "-": "−", Enter: "=", "=": "=", Backspace: "⌫", Escape: "C" };
    const h = (e) => {
      if (e.target.tagName === "INPUT" || e.target.tagName === "TEXTAREA") return;
      const k = map[e.key] || (/^[0-9.+()%^]$/.test(e.key) ? e.key : null);
      if (k) { e.preventDefault(); press(k); }
    };
    window.addEventListener("keydown", h);
    return () => window.removeEventListener("keydown", h);
  }, [press]);

  return (
    <div className="calc-wrap">
      <div className="calc card">
        <div className="calc-screen">
          <div className="calc-expr">{expr || "0"}</div>
          <div className="calc-preview">{preview && preview !== expr ? `= ${preview}` : " "}</div>
        </div>
        <div className="calc-keys">
          {KEYS.map(k => (
            <button key={k} className={`calc-key ${"÷×−+=".includes(k) ? "op" : ""} ${k === "=" ? "eq" : ""} ${k === "C" ? "clr" : ""}`} onClick={() => press(k)}>{k}</button>
          ))}
        </div>
        <button className="btn btn-ghost btn-block" style={{ marginTop: 8 }} onClick={() => press("⌫")}>⌫ Backspace</button>
      </div>
      <div className="calc-history">
        <div className="field-label" style={{ marginBottom: 8 }}>History</div>
        {history.length === 0 && <p className="muted-text">Calculations you finish appear here.</p>}
        {history.map((h, i) => (
          <button key={i} className="calc-hist" onClick={() => setExpr(h.r)}><span>{h.e}</span><strong>= {h.r}</strong></button>
        ))}
        {history.length > 0 && <button className="link-btn" onClick={() => { setHistory([]); localStorage.removeItem("arhub_calc"); }}>Clear history</button>}
      </div>
    </div>
  );
}
