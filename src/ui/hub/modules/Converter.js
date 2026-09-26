import React, { useMemo, useState } from "react";
import { IoSwapVertical } from "react-icons/io5";

// factor = how many base units in one of this unit
const UNITS = {
  Length: { base: "m", units: { mm: 0.001, cm: 0.01, m: 1, km: 1000, in: 0.0254, ft: 0.3048, yd: 0.9144, mi: 1609.344 } },
  Weight: { base: "kg", units: { mg: 1e-6, g: 0.001, kg: 1, t: 1000, oz: 0.028349523, lb: 0.45359237, st: 6.35029318 } },
  Temperature: { special: true, units: { "°C": 1, "°F": 1, K: 1 } },
  Volume: { base: "L", units: { mL: 0.001, L: 1, "m³": 1000, tsp: 0.00492892, tbsp: 0.0147868, cup: 0.24, "fl oz": 0.0295735, gal: 3.78541 } },
  Speed: { base: "m/s", units: { "m/s": 1, "km/h": 1 / 3.6, mph: 0.44704, knot: 0.514444 } },
  Area: { base: "m²", units: { "cm²": 0.0001, "m²": 1, "km²": 1e6, "ft²": 0.092903, acre: 4046.86, hectare: 10000 } },
  Data: { base: "B", units: { bit: 0.125, B: 1, KB: 1024, MB: 1024 ** 2, GB: 1024 ** 3, TB: 1024 ** 4 } },
  Time: { base: "s", units: { ms: 0.001, s: 1, min: 60, h: 3600, day: 86400, week: 604800, year: 31557600 } },
};

function convertTemp(v, from, to) {
  const c = from === "°C" ? v : from === "°F" ? (v - 32) * 5 / 9 : v - 273.15;
  return to === "°C" ? c : to === "°F" ? c * 9 / 5 + 32 : c + 273.15;
}

const fmt = (n) => {
  if (!isFinite(n)) return "—";
  if (Math.abs(n) >= 1e9 || (Math.abs(n) < 1e-4 && n !== 0)) return n.toExponential(4);
  return String(Math.round(n * 1e6) / 1e6);
};

export default function Converter() {
  const [cat, setCat] = useState("Length");
  const def = UNITS[cat];
  const keys = Object.keys(def.units);
  const [from, setFrom] = useState(keys[2] || keys[0]);
  const [to, setTo] = useState(keys[3] || keys[1]);
  const [value, setValue] = useState("1");

  const switchCat = (c) => {
    setCat(c);
    const k = Object.keys(UNITS[c].units);
    setFrom(k[Math.min(2, k.length - 2)] || k[0]);
    setTo(k[Math.min(3, k.length - 1)] || k[1]);
  };

  const v = parseFloat(value);
  const result = useMemo(() => {
    if (isNaN(v)) return "";
    if (def.special) return fmt(convertTemp(v, from, to));
    return fmt((v * def.units[from]) / def.units[to]);
  }, [v, from, to, def]);

  const all = useMemo(() => {
    if (isNaN(v)) return [];
    return keys.filter(k => k !== from).map(k => ({ k, r: def.special ? fmt(convertTemp(v, from, k)) : fmt((v * def.units[from]) / def.units[k]) }));
  }, [v, from, keys, def]);

  return (
    <div className="conv-tool">
      <div className="chips wrap" style={{ marginBottom: 14 }}>
        {Object.keys(UNITS).map(c => <button key={c} className={`chip ${cat === c ? "active" : ""}`} onClick={() => switchCat(c)}>{c}</button>)}
      </div>
      <div className="conv-card card">
        <div className="conv-line">
          <input className="input conv-val" inputMode="decimal" value={value} onChange={e => setValue(e.target.value)} />
          <select className="select" value={from} onChange={e => setFrom(e.target.value)}>{keys.map(k => <option key={k}>{k}</option>)}</select>
        </div>
        <button className="conv-swap" onClick={() => { setFrom(to); setTo(from); }} aria-label="Swap units"><IoSwapVertical /></button>
        <div className="conv-line">
          <div className="input conv-val result">{result}</div>
          <select className="select" value={to} onChange={e => setTo(e.target.value)}>{keys.map(k => <option key={k}>{k}</option>)}</select>
        </div>
      </div>
      <div className="field-label" style={{ margin: "18px 0 8px" }}>All conversions</div>
      <div className="conv-all">
        {all.map(a => <div key={a.k} className="conv-all-item card"><strong>{a.r}</strong><span>{a.k}</span></div>)}
      </div>
    </div>
  );
}
