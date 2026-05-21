import { useState } from "react";

const API_URL = "http://localhost:5000/resolver";

const defaultInputs = {
  proteina_min: 12, ferro_min: 9, tiamina_min: 15,
  custo_a: 0.30, custo_b: 0.40,
  proteina_a: 2, proteina_b: 1,
  ferro_a: 1, ferro_b: 1,
  tiamina_a: 1, tiamina_b: 3,
};

const inputStyle = {
  background: "#0f172a", border: "1px solid #334155", color: "#e2e8f0",
  borderRadius: 6, padding: "6px 10px", width: "100%", fontSize: 14,
  outline: "none", fontFamily: "inherit", boxSizing: "border-box",
};

function NumInput({ label, name, value, onChange, step = 1 }) {
  return (
    <div style={{ marginBottom: 10 }}>
      <label style={{ display: "block", fontSize: 12, color: "#94a3b8", marginBottom: 4 }}>{label}</label>
      <input type="number" step={step} value={value} name={name}
        onChange={e => onChange(name, parseFloat(e.target.value) || 0)}
        style={inputStyle} />
    </div>
  );
}

function SectionTitle({ children, icon }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 14,
      paddingBottom: 8, borderBottom: "1px solid #1e293b" }}>
      <span style={{ fontSize: 18 }}>{icon}</span>
      <span style={{ fontFamily: "Georgia, serif", fontSize: 15, color: "#38bdf8", letterSpacing: 0.5 }}>
        {children}
      </span>
    </div>
  );
}

function NutriBar({ label, required, achieved }) {
  const pct = Math.min(100, (achieved / required) * 100);
  const ok = achieved >= required - 0.01;
  return (
    <div style={{ marginBottom: 10 }}>
      <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, color: "#cbd5e1", marginBottom: 4 }}>
        <span>{label}</span>
        <span>{achieved.toFixed(1)} / {required} {ok ? "✓" : "✗"}</span>
      </div>
      <div style={{ background: "#1e293b", borderRadius: 4, height: 8, overflow: "hidden" }}>
        <div style={{
          width: `${pct}%`, height: "100%", borderRadius: 4,
          background: ok ? "linear-gradient(90deg,#22c55e,#4ade80)" : "linear-gradient(90deg,#ef4444,#f87171)",
          transition: "width 0.6s ease"
        }} />
      </div>
    </div>
  );
}

export default function App() {
  const [inputs, setInputs] = useState(defaultInputs);
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState("resultado");

  const handleChange = (name, val) => setInputs(prev => ({ ...prev, [name]: val }));

  const handleSolve = async () => {
    setLoading(true);
    setError(null);
    setResult(null);
    try {
      const res = await fetch(API_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(inputs),
      });
      if (!res.ok) throw new Error(`Erro HTTP ${res.status}`);
      const data = await res.json();
      setResult(data);
      setActiveTab("resultado");
    } catch (err) {
      setError("Não foi possível conectar à API. Verifique se o servidor Flask está rodando em localhost:5000.");
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => { setInputs(defaultInputs); setResult(null); setError(null); };

  const nutriAchieved = result?.solucao ? {
    "Proteína": inputs.proteina_a * result.solucao.A + inputs.proteina_b * result.solucao.B,
    "Ferro":    inputs.ferro_a    * result.solucao.A + inputs.ferro_b    * result.solucao.B,
    "Tiamina":  inputs.tiamina_a  * result.solucao.A + inputs.tiamina_b  * result.solucao.B,
  } : null;

  const modelText = `Minimizar: z = ${inputs.custo_a}A + ${inputs.custo_b}B
Sujeito a:
  ${inputs.proteina_a}A + ${inputs.proteina_b}B ≥ ${inputs.proteina_min}  (proteína)
  ${inputs.ferro_a}A + ${inputs.ferro_b}B ≥ ${inputs.ferro_min}  (ferro)
  ${inputs.tiamina_a}A + ${inputs.tiamina_b}B ≥ ${inputs.tiamina_min}  (tiamina)
  A, B ≥ 0`;

  return (
    <div style={{ minHeight: "100vh", background: "#020617", color: "#e2e8f0",
      fontFamily: "'Segoe UI', system-ui, sans-serif", padding: "24px 16px" }}>

      {/* Header */}
      <div style={{ maxWidth: 980, margin: "0 auto 24px", textAlign: "center" }}>
        <div style={{ fontSize: 11, letterSpacing: 4, color: "#475569", textTransform: "uppercase", marginBottom: 8 }}>
          Programação Linear
        </div>
        <h1 style={{
          fontFamily: "Georgia, serif", fontSize: 30, fontWeight: 700,
          background: "linear-gradient(135deg, #38bdf8, #818cf8)",
          WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent",
          margin: 0, lineHeight: 1.2
        }}>
          Solver Simplex Nutricional
        </h1>
        <p style={{ color: "#64748b", marginTop: 8, fontSize: 14 }}>
          Minimização de custo · API Flask + Método Simplex Big-M
        </p>
      </div>

      <div style={{ maxWidth: 980, margin: "0 auto", display: "grid", gridTemplateColumns: "320px 1fr", gap: 20 }}>

        {/* LEFT */}
        <div>
          <div style={{ background: "#0f172a", border: "1px solid #1e293b", borderRadius: 12, padding: 20, marginBottom: 16 }}>
            <SectionTitle icon="🥗">Requisitos Mínimos</SectionTitle>
            <NumInput label="Proteína mínima (un.)" name="proteina_min" value={inputs.proteina_min} onChange={handleChange} />
            <NumInput label="Ferro mínimo (un.)"    name="ferro_min"    value={inputs.ferro_min}    onChange={handleChange} />
            <NumInput label="Tiamina mínima (un.)"  name="tiamina_min"  value={inputs.tiamina_min}  onChange={handleChange} />
          </div>

          <div style={{ background: "#0f172a", border: "1px solid #1e293b", borderRadius: 12, padding: 20, marginBottom: 16 }}>
            <SectionTitle icon="💰">Custos (R$/grama)</SectionTitle>
            <NumInput label="Custo Alimento A" name="custo_a" value={inputs.custo_a} onChange={handleChange} step={0.01} />
            <NumInput label="Custo Alimento B" name="custo_b" value={inputs.custo_b} onChange={handleChange} step={0.01} />
          </div>

          <div style={{ background: "#0f172a", border: "1px solid #1e293b", borderRadius: 12, padding: 20, marginBottom: 20 }}>
            <SectionTitle icon="🔬">Composição (un./grama)</SectionTitle>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0 12px" }}>
              <div>
                <div style={{ fontSize: 11, color: "#475569", marginBottom: 8, textTransform: "uppercase", letterSpacing: 1 }}>Alimento A</div>
                <NumInput label="Proteína" name="proteina_a" value={inputs.proteina_a} onChange={handleChange} />
                <NumInput label="Ferro"    name="ferro_a"    value={inputs.ferro_a}    onChange={handleChange} />
                <NumInput label="Tiamina"  name="tiamina_a"  value={inputs.tiamina_a}  onChange={handleChange} />
              </div>
              <div>
                <div style={{ fontSize: 11, color: "#475569", marginBottom: 8, textTransform: "uppercase", letterSpacing: 1 }}>Alimento B</div>
                <NumInput label="Proteína" name="proteina_b" value={inputs.proteina_b} onChange={handleChange} />
                <NumInput label="Ferro"    name="ferro_b"    value={inputs.ferro_b}    onChange={handleChange} />
                <NumInput label="Tiamina"  name="tiamina_b"  value={inputs.tiamina_b}  onChange={handleChange} />
              </div>
            </div>
          </div>

          <button onClick={handleSolve} disabled={loading} style={{
            width: "100%", padding: "13px 0", borderRadius: 10, border: "none", cursor: loading ? "not-allowed" : "pointer",
            background: loading ? "#1e293b" : "linear-gradient(135deg, #0ea5e9, #6366f1)",
            color: loading ? "#64748b" : "#fff", fontWeight: 700, fontSize: 15,
            boxShadow: loading ? "none" : "0 4px 20px rgba(14,165,233,0.35)", marginBottom: 10,
          }}>
            {loading ? "⏳ Aguardando API..." : "▶ Resolver com Simplex"}
          </button>
          <button onClick={handleReset} style={{
            width: "100%", padding: "10px 0", borderRadius: 10, border: "1px solid #334155",
            background: "transparent", color: "#94a3b8", cursor: "pointer", fontSize: 13,
          }}>
            ↺ Restaurar Padrão
          </button>

          {/* API status indicator */}
          <div style={{ marginTop: 14, background: "#0f172a", border: "1px solid #1e293b",
            borderRadius: 8, padding: "10px 14px", fontSize: 12 }}>
            <div style={{ color: "#475569", marginBottom: 4 }}>🔌 API endpoint</div>
            <code style={{ color: "#7dd3fc", fontSize: 11 }}>POST {API_URL}</code>
          </div>
        </div>

        {/* RIGHT */}
        <div>
          <div style={{ background: "#0f172a", border: "1px solid #1e293b", borderRadius: 12, padding: 20, marginBottom: 16 }}>
            <SectionTitle icon="📐">Modelo Matemático</SectionTitle>
            <pre style={{
              background: "#020617", border: "1px solid #1e293b", borderRadius: 8,
              padding: 16, fontFamily: "'Courier New', monospace", fontSize: 13,
              color: "#7dd3fc", margin: 0, lineHeight: 1.8, whiteSpace: "pre-wrap"
            }}>{modelText}</pre>
          </div>

          {/* Error */}
          {error && (
            <div style={{ background: "#450a0a", border: "1px solid #7f1d1d",
              borderRadius: 12, padding: 20, marginBottom: 16, color: "#f87171" }}>
              <div style={{ fontWeight: 700, marginBottom: 6 }}>⚠ Erro de conexão</div>
              <div style={{ fontSize: 13 }}>{error}</div>
              <div style={{ fontSize: 12, color: "#ef4444", marginTop: 10 }}>
                Execute: <code style={{ background: "#1a0505", padding: "2px 6px", borderRadius: 4 }}>python app.py</code>
              </div>
            </div>
          )}

          {/* Tabs */}
          {result && (
            <div>
              <div style={{ display: "flex", gap: 4, marginBottom: 16 }}>
                {["resultado", "nutricao", "iteracoes"].map(t => (
                  <button key={t} onClick={() => setActiveTab(t)} style={{
                    padding: "8px 18px", borderRadius: 8, border: "1px solid",
                    cursor: "pointer", fontSize: 13, fontWeight: 600,
                    borderColor: activeTab === t ? "#38bdf8" : "#1e293b",
                    background: activeTab === t ? "rgba(56,189,248,0.1)" : "transparent",
                    color: activeTab === t ? "#38bdf8" : "#64748b",
                  }}>
                    {{ resultado: "📊 Resultado", nutricao: "🥦 Nutrição", iteracoes: "🔄 Iterações" }[t]}
                  </button>
                ))}
              </div>

              {activeTab === "resultado" && (
                <div style={{ background: "#0f172a", border: "1px solid #1e293b", borderRadius: 12, padding: 24 }}>
                  <SectionTitle icon="✅">Solução Ótima</SectionTitle>
                  {result.status === "ótimo" && (
                    <>
                      <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 12, marginBottom: 24 }}>
                        {[
                          { label: "Alimento A", value: `${result.solucao.A} g`,          icon: "🟠", color: "#f97316" },
                          { label: "Alimento B", value: `${result.solucao.B} g`,          icon: "🟢", color: "#22c55e" },
                          { label: "Custo Mínimo", value: `R$ ${result.custo_otimo.toFixed(2)}`, icon: "💲", color: "#fbbf24" },
                        ].map(card => (
                          <div key={card.label} style={{ background: "#020617", border: "1px solid #1e293b",
                            borderRadius: 10, padding: "16px 20px", textAlign: "center" }}>
                            <div style={{ fontSize: 24, marginBottom: 6 }}>{card.icon}</div>
                            <div style={{ fontSize: 22, fontWeight: 700, color: card.color, fontFamily: "Georgia,serif" }}>
                              {card.value}
                            </div>
                            <div style={{ fontSize: 12, color: "#64748b", marginTop: 4 }}>{card.label}</div>
                          </div>
                        ))}
                      </div>
                      <div style={{ background: "#020617", border: "1px solid #1e293b", borderRadius: 10, padding: 16 }}>
                        <div style={{ fontSize: 13, color: "#64748b", marginBottom: 10 }}>Folgas (surplus)</div>
                        {Object.entries(result.surplus).map(([k, v]) => (
                          <div key={k} style={{ display: "flex", justifyContent: "space-between",
                            padding: "6px 0", borderBottom: "1px solid #0f172a", fontSize: 14 }}>
                            <span style={{ color: "#cbd5e1" }}>{k}</span>
                            <span style={{ color: v === 0 ? "#f87171" : "#4ade80", fontFamily: "monospace" }}>
                              {v === 0 ? "0 (ativo)" : `+${v}`}
                            </span>
                          </div>
                        ))}
                      </div>
                    </>
                  )}
                  {result.status !== "ótimo" && (
                    <div style={{ textAlign: "center", padding: 32, color: "#f87171" }}>
                      Problema {result.status}. Revise os parâmetros.
                    </div>
                  )}
                </div>
              )}

              {activeTab === "nutricao" && result.status === "ótimo" && nutriAchieved && (
                <div style={{ background: "#0f172a", border: "1px solid #1e293b", borderRadius: 12, padding: 24 }}>
                  <SectionTitle icon="🥦">Verificação Nutricional</SectionTitle>
                  <NutriBar label="Proteína" required={inputs.proteina_min} achieved={nutriAchieved["Proteína"]} />
                  <NutriBar label="Ferro"    required={inputs.ferro_min}    achieved={nutriAchieved["Ferro"]} />
                  <NutriBar label="Tiamina"  required={inputs.tiamina_min}  achieved={nutriAchieved["Tiamina"]} />
                  <div style={{ marginTop: 20, background: "#020617", borderRadius: 10, padding: 16, fontSize: 13 }}>
                    <table style={{ width: "100%", borderCollapse: "collapse" }}>
                      <thead>
                        <tr style={{ color: "#64748b", fontSize: 12 }}>
                          {["Nutriente","Contrib. A","Contrib. B","Total","Mínimo","OK"].map(h => (
                            <th key={h} style={{ padding: "4px 8px", textAlign: "left" }}>{h}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {[
                          { name: "Proteína", a: inputs.proteina_a, b: inputs.proteina_b, min: inputs.proteina_min },
                          { name: "Ferro",    a: inputs.ferro_a,    b: inputs.ferro_b,    min: inputs.ferro_min    },
                          { name: "Tiamina",  a: inputs.tiamina_a,  b: inputs.tiamina_b,  min: inputs.tiamina_min  },
                        ].map(row => {
                          const total = row.a * result.solucao.A + row.b * result.solucao.B;
                          const ok = total >= row.min - 0.01;
                          return (
                            <tr key={row.name} style={{ borderTop: "1px solid #1e293b" }}>
                              <td style={{ padding: "8px", color: "#e2e8f0" }}>{row.name}</td>
                              <td style={{ padding: "8px", fontFamily: "monospace", color: "#7dd3fc" }}>{(row.a * result.solucao.A).toFixed(1)}</td>
                              <td style={{ padding: "8px", fontFamily: "monospace", color: "#86efac" }}>{(row.b * result.solucao.B).toFixed(1)}</td>
                              <td style={{ padding: "8px", fontFamily: "monospace", fontWeight: 700 }}>{total.toFixed(1)}</td>
                              <td style={{ padding: "8px", color: "#64748b" }}>{row.min}</td>
                              <td style={{ padding: "8px" }}>{ok ? "✅" : "❌"}</td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {activeTab === "iteracoes" && (
                <div style={{ background: "#0f172a", border: "1px solid #1e293b", borderRadius: 12, padding: 24 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
                    <SectionTitle icon="🔄">Iterações do Simplex</SectionTitle>
                    <span style={{ fontSize: 12, color: "#475569" }}>{result.num_iteracoes} iteração(ões)</span>
                  </div>
                  {result.iteracoes.map((iter, idx) => (
                    <div key={idx} style={{ background: "#020617", border: "1px solid #1e293b",
                      borderRadius: 10, padding: 16, marginBottom: 10 }}>
                      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 10 }}>
                        <span style={{ background: "rgba(56,189,248,0.15)", color: "#38bdf8",
                          borderRadius: 20, padding: "2px 10px", fontSize: 12, fontWeight: 700 }}>
                          Iteração {iter.iteracao}
                        </span>
                        <span style={{ fontFamily: "monospace", fontSize: 13, color: "#fbbf24" }}>
                          z = {iter.valor_z}
                        </span>
                      </div>
                      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, fontSize: 13 }}>
                        <div><span style={{ color: "#64748b" }}>Entra: </span>
                          <span style={{ color: "#4ade80", fontFamily: "monospace", fontWeight: 600 }}>{iter.entrando}</span></div>
                        <div><span style={{ color: "#64748b" }}>Sai: </span>
                          <span style={{ color: "#f87171", fontFamily: "monospace", fontWeight: 600 }}>{iter.saindo}</span></div>
                      </div>
                      <div style={{ marginTop: 8, fontSize: 12, color: "#475569" }}>
                        Base: {iter.base.join(", ")}
                      </div>
                    </div>
                  ))}
                  <div style={{ background: "rgba(34,197,94,0.08)", border: "1px solid #166534",
                    borderRadius: 10, padding: 14, textAlign: "center", fontSize: 13, color: "#4ade80" }}>
                    ✓ Todos os custos reduzidos ≥ 0 — solução ótima atingida
                  </div>
                </div>
              )}
            </div>
          )}

          {!result && !error && !loading && (
            <div style={{ background: "#0f172a", border: "1px dashed #1e293b", borderRadius: 12,
              padding: 48, textAlign: "center", color: "#475569" }}>
              <div style={{ fontSize: 48, marginBottom: 12 }}>🔢</div>
              <div style={{ fontSize: 15 }}>Configure os parâmetros e clique em</div>
              <div style={{ fontWeight: 700, color: "#38bdf8", marginTop: 4 }}>▶ Resolver com Simplex</div>
            </div>
          )}
        </div>
      </div>

      <div style={{ maxWidth: 980, margin: "24px auto 0", textAlign: "center", fontSize: 12, color: "#334155" }}>
        Backend Flask · Método Simplex Big-M · Python + React
      </div>
    </div>
  );
}
