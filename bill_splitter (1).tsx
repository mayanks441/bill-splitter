import { useState } from "react";

const FIXED = 880;
const NAMES = ["Mayank", "Shantanu", "Anuj"];
const AVATAR_BG = { Mayank: "#6366f1", Shantanu: "#10b981", Anuj: "#f59e0b" };

const n = v => Math.max(0, parseFloat(v) || 0);
const used = (p, c) => Math.max(0, n(c) - n(p));

const init = () => ({
  totalAmount: "",
  totalUnits: "",
  ac: {
    Mayank: { prev: "", curr: "" },
    Shantanu: { prev: "", curr: "" },
    Anuj: { prev: "", curr: "" },
  },
  recharge: { Mayank: "", Shantanu: "", Anuj: "" },
});

function Avatar({ name, size = 32 }) {
  return (
    <div style={{ width: size, height: size, borderRadius: "50%", background: AVATAR_BG[name], display: "flex", alignItems: "center", justifyContent: "center", fontSize: size * 0.38, fontWeight: 600, color: "#fff", flexShrink: 0 }}>
      {name[0]}
    </div>
  );
}

const glass = {
  background: "rgba(255,255,255,0.07)",
  border: "1px solid rgba(255,255,255,0.13)",
  borderRadius: 16,
};

const iStyle = {
  width: "100%", boxSizing: "border-box", padding: "11px 13px", fontSize: 14,
  border: "1px solid rgba(255,255,255,0.15)", borderRadius: 10, outline: "none",
  background: "rgba(255,255,255,0.08)", color: "#fff",
};

const lbl = { fontSize: 11, color: "rgba(255,255,255,0.45)", marginBottom: 6, letterSpacing: "0.05em", textTransform: "uppercase" };

export default function App() {
  const [inp, setInp] = useState(init());
  const [result, setResult] = useState(null);
  const [err, setErr] = useState("");

  const acUnits = (nm) => used(inp.ac[nm].prev, inp.ac[nm].curr);
  const totalAC = NAMES.reduce((s, nm) => s + acUnits(nm), 0);
  const totalRecharge = NAMES.reduce((s, nm) => s + n(inp.recharge[nm]), 0);
  const totalBill = n(inp.totalAmount);
  const totalUnits = n(inp.totalUnits);
  const energyRate = totalUnits > 0 ? (totalBill - FIXED) / totalUnits : 0;

  const setAC = (nm, field, val) =>
    setInp(p => ({ ...p, ac: { ...p.ac, [nm]: { ...p.ac[nm], [field]: val } } }));
  const setR = (nm, val) =>
    setInp(p => ({ ...p, recharge: { ...p.recharge, [nm]: val } }));

  const calculate = () => {
    setErr("");
    if (!totalBill) { setErr("Enter this month's charges from your bill."); return; }
    if (!totalUnits) { setErr("Enter total units from your bill."); return; }
    if (totalAC > totalUnits) { setErr(`AC units total (${totalAC.toFixed(1)}) exceeds total units (${totalUnits}).`); return; }

    const rate = (totalBill - FIXED) / totalUnits;
    const fixedShare = FIXED / 3;
    const commonUnits = totalUnits - totalAC;
    const commonCost = (commonUnits * rate) / 3;

    const data = {};
    NAMES.forEach(nm => {
      const ac = acUnits(nm);
      const acCost = ac * rate;
      const payable = acCost + commonCost + fixedShare;
      const paid = n(inp.recharge[nm]);
      data[nm] = { ac, acCost, commonCost, fixedShare, payable, paid, bal: paid - payable };
    });

    const pos = NAMES.filter(nm => data[nm].bal > 0.5).map(nm => ({ nm, a: data[nm].bal }));
    const neg = NAMES.filter(nm => data[nm].bal < -0.5).map(nm => ({ nm, a: -data[nm].bal }));
    const txns = [];
    let i = 0, j = 0;
    while (i < pos.length && j < neg.length) {
      const amt = Math.min(pos[i].a, neg[j].a);
      if (amt > 0.5) txns.push({ from: neg[j].nm, to: pos[i].nm, amt });
      pos[i].a -= amt; neg[j].a -= amt;
      if (pos[i].a < 0.5) i++;
      if (neg[j].a < 0.5) j++;
    }

    setResult({ data, txns, rate, commonUnits, fixedShare });
  };

  const reset = () => { setInp(init()); setResult(null); setErr(""); };

  return (
    <div style={{ minHeight: "100vh", background: "linear-gradient(135deg, #0f0c29 0%, #1a1a4e 40%, #24243e 100%)", padding: "32px 18px 56px", fontFamily: "var(--font-sans)" }}>
      <div style={{ maxWidth: 460, margin: "0 auto" }}>

        {/* Header */}
        <div style={{ textAlign: "center", marginBottom: 32 }}>
          <div style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", width: 52, height: 52, borderRadius: 16, background: "linear-gradient(135deg, #6366f1, #8b5cf6)", marginBottom: 14 }}>
            <span style={{ fontSize: 26 }}>⚡</span>
          </div>
          <div style={{ fontSize: 24, fontWeight: 600, color: "#fff", letterSpacing: "-0.5px" }}>Bill Splitter</div>
          <div style={{ fontSize: 13, color: "rgba(255,255,255,0.4)", marginTop: 5 }}>Hyde Park · Sector 78 Noida · ₹880 fixed</div>
          <div style={{ display: "flex", justifyContent: "center", gap: 8, marginTop: 14 }}>
            {NAMES.map(nm => <Avatar key={nm} name={nm} size={30} />)}
          </div>
        </div>

        {/* Bill Info */}
        <div style={{ ...glass, padding: "20px", marginBottom: 14 }}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            <div>
              <div style={lbl}>This Month's Charges (₹)</div>
              <div style={{ position: "relative" }}>
                <span style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", fontSize: 14, color: "rgba(255,255,255,0.3)" }}>₹</span>
                <input type="number" min="0" placeholder="e.g. 3548" style={{ ...iStyle, paddingLeft: 26 }}
                  value={inp.totalAmount} onChange={e => setInp(p => ({ ...p, totalAmount: e.target.value }))} />
              </div>
            </div>
            <div>
              <div style={lbl}>Total Units Consumed</div>
              <input type="number" min="0" placeholder="e.g. 385" style={iStyle}
                value={inp.totalUnits} onChange={e => setInp(p => ({ ...p, totalUnits: e.target.value }))} />
            </div>
          </div>
          {energyRate > 0 && (
            <div style={{ marginTop: 12, display: "flex", justifyContent: "space-between", alignItems: "center", padding: "9px 13px", borderRadius: 10, background: "rgba(167,139,250,0.1)", border: "1px solid rgba(167,139,250,0.2)" }}>
              <span style={{ fontSize: 12, color: "rgba(255,255,255,0.4)" }}>Energy rate (excl. ₹880 fixed)</span>
              <span style={{ fontSize: 14, fontWeight: 600, color: "#a78bfa" }}>₹{energyRate.toFixed(2)} / unit</span>
            </div>
          )}
        </div>

        {/* AC Sub-meter */}
        <div style={{ ...glass, padding: "20px", marginBottom: 14 }}>
          <div style={{ ...lbl, marginBottom: 16 }}>AC Sub-meter Readings</div>
          <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
            {NAMES.map(nm => {
              const u = acUnits(nm);
              return (
                <div key={nm}>
                  <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 10 }}>
                    <Avatar name={nm} size={28} />
                    <span style={{ fontSize: 14, fontWeight: 500, color: "#fff" }}>{nm}</span>
                    {u > 0 && (
                      <span style={{ marginLeft: "auto", fontSize: 12, fontWeight: 600, background: AVATAR_BG[nm] + "33", color: AVATAR_BG[nm], padding: "3px 10px", borderRadius: 20, border: `1px solid ${AVATAR_BG[nm]}55` }}>
                        {u.toFixed(1)} units {energyRate > 0 ? `· ₹${(u * energyRate).toFixed(0)}` : ""}
                      </span>
                    )}
                  </div>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
                    <div>
                      <div style={lbl}>Previous</div>
                      <input type="number" min="0" placeholder="0.0" style={iStyle}
                        value={inp.ac[nm].prev} onChange={e => setAC(nm, "prev", e.target.value)} />
                    </div>
                    <div>
                      <div style={lbl}>Current</div>
                      <input type="number" min="0" placeholder="0.0" style={iStyle}
                        value={inp.ac[nm].curr} onChange={e => setAC(nm, "curr", e.target.value)} />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
          {totalAC > 0 && totalUnits > 0 && (
            <div style={{ marginTop: 14, padding: "10px 14px", borderRadius: 10, background: "rgba(99,102,241,0.15)", border: "1px solid rgba(99,102,241,0.3)", display: "flex", justifyContent: "space-between", fontSize: 13 }}>
              <span style={{ color: "rgba(255,255,255,0.5)" }}>AC total: <span style={{ color: "#a78bfa", fontWeight: 600 }}>{totalAC.toFixed(1)} u</span></span>
              <span style={{ color: "rgba(255,255,255,0.5)" }}>Common: <span style={{ color: "#a78bfa", fontWeight: 600 }}>{Math.max(0, totalUnits - totalAC).toFixed(1)} u</span></span>
            </div>
          )}
        </div>

        {/* Recharge */}
        <div style={{ ...glass, padding: "20px", marginBottom: 20 }}>
          <div style={lbl}>Recharge Contributions</div>
          <div style={{ display: "flex", flexDirection: "column", gap: 10, marginTop: 4 }}>
            {NAMES.map(nm => (
              <div key={nm} style={{ display: "flex", alignItems: "center", gap: 12 }}>
                <Avatar name={nm} size={30} />
                <span style={{ fontSize: 14, fontWeight: 500, color: "#fff", width: 76 }}>{nm}</span>
                <div style={{ flex: 1, position: "relative" }}>
                  <span style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", fontSize: 14, color: "rgba(255,255,255,0.3)" }}>₹</span>
                  <input type="number" min="0" placeholder="0" style={{ ...iStyle, paddingLeft: 26 }}
                    value={inp.recharge[nm]} onChange={e => setR(nm, e.target.value)} />
                </div>
              </div>
            ))}
          </div>
          {totalRecharge > 0 && (
            <div style={{ marginTop: 12, display: "flex", justifyContent: "space-between", alignItems: "center", padding: "9px 13px", borderRadius: 10, background: "rgba(16,185,129,0.12)", border: "1px solid rgba(16,185,129,0.3)" }}>
              <span style={{ fontSize: 13, color: "rgba(255,255,255,0.45)" }}>Total recharge</span>
              <span style={{ fontSize: 14, fontWeight: 600, color: "#34d399" }}>₹{totalRecharge.toFixed(2)}</span>
            </div>
          )}
        </div>

        {/* Error */}
        {err && (
          <div style={{ background: "rgba(239,68,68,0.15)", border: "1px solid rgba(239,68,68,0.4)", borderRadius: 12, padding: "12px 16px", marginBottom: 16, fontSize: 13, color: "#fca5a5" }}>
            {err}
          </div>
        )}

        {/* CTA */}
        {!result ? (
          <button onClick={calculate} style={{ width: "100%", padding: "15px", fontSize: 15, fontWeight: 600, background: "linear-gradient(135deg, #6366f1, #8b5cf6)", color: "#fff", border: "none", borderRadius: 14, cursor: "pointer" }}>
            Calculate Split
          </button>
        ) : (
          <>
            <div style={{ display: "flex", alignItems: "center", gap: 10, margin: "4px 0 24px" }}>
              <div style={{ flex: 1, height: 1, background: "rgba(255,255,255,0.1)" }} />
              <span style={{ fontSize: 11, color: "rgba(255,255,255,0.3)", letterSpacing: "0.08em", textTransform: "uppercase" }}>Results</span>
              <div style={{ flex: 1, height: 1, background: "rgba(255,255,255,0.1)" }} />
            </div>

            {/* Per person cards */}
            <div style={{ display: "flex", flexDirection: "column", gap: 10, marginBottom: 20 }}>
              {NAMES.map(nm => {
                const d = result.data[nm];
                const isPos = d.bal > 0.5, isNeg = d.bal < -0.5;
                const verdict = isPos ? `gets back ₹${d.bal.toFixed(2)}` : isNeg ? `owes ₹${Math.abs(d.bal).toFixed(2)}` : "settled ✓";
                const vColor = isPos ? "#34d399" : isNeg ? "#f87171" : "rgba(255,255,255,0.4)";
                return (
                  <div key={nm} style={{ borderRadius: 16, overflow: "hidden", border: "1px solid rgba(255,255,255,0.1)", background: "rgba(255,255,255,0.05)" }}>
                    <div style={{ padding: "13px 16px", display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "1px solid rgba(255,255,255,0.07)", background: `linear-gradient(90deg, ${AVATAR_BG[nm]}22, transparent)` }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                        <Avatar name={nm} size={32} />
                        <span style={{ fontSize: 15, fontWeight: 600, color: "#fff" }}>{nm}</span>
                      </div>
                      <span style={{ fontSize: 13, fontWeight: 600, color: vColor }}>{verdict}</span>
                    </div>
                    <div style={{ display: "grid", gridTemplateColumns: "repeat(5, 1fr)", padding: "12px 16px", gap: 8 }}>
                      {[
                        ["AC units", `${d.ac.toFixed(1)}`],
                        ["AC cost", `₹${d.acCost.toFixed(0)}`],
                        ["Common", `₹${d.commonCost.toFixed(0)}`],
                        ["Fixed", `₹${d.fixedShare.toFixed(0)}`],
                        ["Payable", `₹${d.payable.toFixed(0)}`],
                      ].map(([l, v]) => (
                        <div key={l}>
                          <div style={{ fontSize: 10, color: "rgba(255,255,255,0.35)", marginBottom: 3, textTransform: "uppercase", letterSpacing: "0.04em" }}>{l}</div>
                          <div style={{ fontSize: 13, fontWeight: 600, color: "#e2e8f0" }}>{v}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Settlement */}
            <div style={{ ...glass, padding: "18px 20px", marginBottom: 20 }}>
              <div style={{ ...lbl, marginBottom: 14 }}>Settlement</div>
              {result.txns.length === 0 ? (
                <div style={{ fontSize: 14, color: "#34d399", fontWeight: 500 }}>Everyone is settled. No transfers needed. ✓</div>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                  {result.txns.map((t, i) => (
                    <div key={i} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", background: "rgba(255,255,255,0.06)", borderRadius: 12, padding: "12px 14px" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                        <Avatar name={t.from} size={28} />
                        <span style={{ fontSize: 14, fontWeight: 500, color: "#f87171" }}>{t.from}</span>
                        <span style={{ fontSize: 16, color: "rgba(255,255,255,0.25)" }}>→</span>
                        <Avatar name={t.to} size={28} />
                        <span style={{ fontSize: 14, fontWeight: 500, color: "#34d399" }}>{t.to}</span>
                      </div>
                      <span style={{ fontSize: 16, fontWeight: 700, color: "#fff" }}>₹{t.amt.toFixed(2)}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <button onClick={reset} style={{ width: "100%", padding: "14px", fontSize: 14, fontWeight: 500, background: "rgba(255,255,255,0.08)", color: "rgba(255,255,255,0.7)", border: "1px solid rgba(255,255,255,0.12)", borderRadius: 14, cursor: "pointer" }}>
              Reset
            </button>
          </>
        )}
      </div>
    </div>
  );
}
