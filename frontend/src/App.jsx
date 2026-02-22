import { useState, useCallback } from 'react';
import './index.css';

// ============================================================
// API Configuration
// ============================================================
const API_URL = 'http://localhost:3000/calculate';

// ============================================================
// Argand Diagram Component (SVG)
// วาดระนาบเชิงซ้อน (Complex Plane) พร้อมเวกเตอร์และมุม θ
// ============================================================
function ArgandDiagram({ re, im, magnitude, argumentDeg }) {
  const width = 500;
  const height = 500;
  const cx = width / 2;   // จุดกำเนิด (Origin) อยู่กลาง SVG
  const cy = height / 2;

  // กำหนด scale — ปรับอัตโนมัติตามขนาด magnitude
  const maxVal = Math.max(Math.abs(re || 0), Math.abs(im || 0), 1);
  const scale = (width / 2 - 60) / (maxVal * 1.3);

  // แปลงพิกัดคณิตศาสตร์ → พิกัด SVG (แกน y กลับด้าน)
  const px = cx + (re || 0) * scale;
  const py = cy - (im || 0) * scale;

  // สร้าง Arc path สำหรับแสดงมุม θ
  const arcRadius = 40;
  const angleRad = Math.atan2(im || 0, re || 0);
  const arcEndX = cx + arcRadius * Math.cos(angleRad);
  const arcEndY = cy - arcRadius * Math.sin(angleRad);
  const largeArcFlag = Math.abs(argumentDeg || 0) > 180 ? 1 : 0;
  const sweepFlag = (im || 0) >= 0 ? 0 : 1;

  // Grid lines
  const gridLines = [];
  const gridStep = Math.ceil(maxVal / 4) || 1;
  for (let i = -4; i <= 4; i++) {
    const val = i * gridStep;
    const gx = cx + val * scale;
    const gy = cy - val * scale;
    // Vertical grid lines
    gridLines.push(
      <line key={`v${i}`} x1={gx} y1={20} x2={gx} y2={height - 20}
        stroke="rgba(0,240,255,0.07)" strokeWidth="1" />
    );
    // Horizontal grid lines
    gridLines.push(
      <line key={`h${i}`} x1={20} y1={gy} x2={width - 20} y2={gy}
        stroke="rgba(0,240,255,0.07)" strokeWidth="1" />
    );
    // Axis label — Real
    if (i !== 0) {
      gridLines.push(
        <text key={`lx${i}`} x={gx} y={cy + 18} fill="#64748b"
          fontSize="11" textAnchor="middle" fontFamily="'JetBrains Mono', monospace">
          {val}
        </text>
      );
      // Axis label — Imaginary
      gridLines.push(
        <text key={`ly${i}`} x={cx - 18} y={gy + 4} fill="#64748b"
          fontSize="11" textAnchor="end" fontFamily="'JetBrains Mono', monospace">
          {val}i
        </text>
      );
    }
  }

  const hasPoint = re !== null && im !== null && (re !== 0 || im !== 0);

  return (
    <div className="diagram-container">
      <svg viewBox={`0 0 ${width} ${height}`} width="100%" height="100%"
        style={{ display: 'block' }}>

        {/* Grid */}
        {gridLines}

        {/* แกน Real (แกน X) */}
        <line x1={20} y1={cy} x2={width - 20} y2={cy}
          stroke="#334155" strokeWidth="1.5" />
        <text x={width - 15} y={cy - 8} fill="#94a3b8" fontSize="13"
          fontWeight="600" fontFamily="'Inter', sans-serif">Re</text>

        {/* แกน Imaginary (แกน Y) */}
        <line x1={cx} y1={20} x2={cx} y2={height - 20}
          stroke="#334155" strokeWidth="1.5" />
        <text x={cx + 10} y={28} fill="#94a3b8" fontSize="13"
          fontWeight="600" fontFamily="'Inter', sans-serif">Im</text>

        {/* จุดกำเนิด O */}
        <text x={cx - 15} y={cy + 18} fill="#64748b" fontSize="12"
          fontFamily="'JetBrains Mono', monospace">O</text>

        {hasPoint && (
          <>
            {/* เส้นประ — Projection ลงแกน Re และ Im */}
            <line x1={px} y1={py} x2={px} y2={cy}
              stroke="rgba(0,240,255,0.2)" strokeWidth="1" strokeDasharray="4,4" />
            <line x1={px} y1={py} x2={cx} y2={py}
              stroke="rgba(0,240,255,0.2)" strokeWidth="1" strokeDasharray="4,4" />

            {/* เวกเตอร์ r — จากจุดกำเนิดไปยัง (re, im) */}
            <line x1={cx} y1={cy} x2={px} y2={py}
              stroke="#00f0ff" strokeWidth="2.5"
              markerEnd="url(#arrowhead)" />

            {/* มุม θ — Arc */}
            {magnitude > 0 && (
              <path
                d={`M ${cx + arcRadius} ${cy} A ${arcRadius} ${arcRadius} 0 ${largeArcFlag} ${sweepFlag} ${arcEndX} ${arcEndY}`}
                fill="none" stroke="#39ff14" strokeWidth="2" strokeDasharray="3,3" />
            )}

            {/* Label θ */}
            {magnitude > 0 && (
              <text
                x={cx + arcRadius * 1.4 * Math.cos(angleRad / 2)}
                y={cy - arcRadius * 1.4 * Math.sin(angleRad / 2)}
                fill="#39ff14" fontSize="14" fontWeight="700"
                fontFamily="'JetBrains Mono', monospace" textAnchor="middle">
                θ
              </text>
            )}

            {/* จุด (re, im) */}
            <circle cx={px} cy={py} r="6" fill="#00f0ff"
              style={{ filter: 'drop-shadow(0 0 6px rgba(0,240,255,0.6))' }} />
            <circle cx={px} cy={py} r="12" fill="none"
              stroke="rgba(0,240,255,0.3)" strokeWidth="1.5">
              <animate attributeName="r" values="8;16;8" dur="2s" repeatCount="indefinite" />
              <animate attributeName="opacity" values="0.5;0;0.5" dur="2s" repeatCount="indefinite" />
            </circle>

            {/* Label พิกัด */}
            <text x={px + 12} y={py - 12} fill="#e2e8f0" fontSize="13"
              fontWeight="600" fontFamily="'JetBrains Mono', monospace">
              ({re}, {im}i)
            </text>

            {/* Label |r| */}
            {magnitude > 0 && (
              <text
                x={(cx + px) / 2 - 10}
                y={(cy + py) / 2 - 10}
                fill="#00f0ff" fontSize="12" fontWeight="500"
                fontFamily="'JetBrains Mono', monospace"
                opacity="0.8">
                r = {magnitude.toFixed(2)}
              </text>
            )}
          </>
        )}

        {/* Arrowhead marker */}
        <defs>
          <marker id="arrowhead" markerWidth="10" markerHeight="7"
            refX="9" refY="3.5" orient="auto" markerUnits="strokeWidth">
            <polygon points="0 0, 10 3.5, 0 7" fill="#00f0ff" />
          </marker>
        </defs>
      </svg>
    </div>
  );
}

// ============================================================
// Main App Component
// ============================================================
function App() {
  // State
  const [re, setRe] = useState('');
  const [im, setIm] = useState('');
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // เรียก Rust Backend API
  const handleCalculate = useCallback(async () => {
    const realVal = parseFloat(re);
    const imagVal = parseFloat(im);

    if (isNaN(realVal) || isNaN(imagVal)) {
      setError('กรุณาใส่ค่าตัวเลขที่ถูกต้อง');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await fetch(API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ re: realVal, im: imagVal }),
      });

      if (!response.ok) throw new Error(`Server error: ${response.status}`);

      const data = await response.json();
      setResult(data);
    } catch (err) {
      setError(`เชื่อมต่อ Backend ไม่สำเร็จ: ${err.message}`);
    } finally {
      setLoading(false);
    }
  }, [re, im]);

  // กด Enter เพื่อคำนวณ
  const handleKeyDown = (e) => {
    if (e.key === 'Enter') handleCalculate();
  };

  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '2rem 1.5rem' }}>

      {/* ── Header ─────────────────────────── */}
      <header style={{ textAlign: 'center', marginBottom: '2.5rem' }}>
        <h1 style={{
          fontSize: 'clamp(1.8rem, 4vw, 2.8rem)',
          background: 'linear-gradient(135deg, #00f0ff, #a855f7)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          marginBottom: '0.5rem',
        }}>
          ⚡ Complex Polar Lab
        </h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: '1.05rem' }}>
          จำนวนเชิงซ้อนในรูปเชิงขั้ว — Interactive Visualization
        </p>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginTop: '0.3rem' }}>
          โปรเจกต์คณิตศาสตร์ ม.5 | Powered by <strong className="glow-text">Rust + Axum</strong>
        </p>
      </header>

      {/* ── Main Grid: Input + Diagram ─────── */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'minmax(0, 1fr) minmax(0, 1.2fr)',
        gap: '1.5rem',
        marginBottom: '1.5rem',
        alignItems: 'start',
      }}
        className="main-grid"
      >

        {/* LEFT — Input Panel */}
        <div className="card">
          <h2 style={{ fontSize: '1.15rem', marginBottom: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <span style={{ fontSize: '1.3rem' }}>🔢</span> ป้อนจำนวนเชิงซ้อน
          </h2>

          <div style={{ marginBottom: '1rem' }}>
            <label style={{ display: 'block', marginBottom: '0.4rem', color: 'var(--text-secondary)', fontSize: '0.9rem', fontWeight: 500 }}>
              ส่วนจริง (Real part, a)
            </label>
            <input
              type="number"
              className="input-field"
              placeholder="เช่น 3"
              value={re}
              onChange={(e) => setRe(e.target.value)}
              onKeyDown={handleKeyDown}
            />
          </div>

          <div style={{ marginBottom: '1.25rem' }}>
            <label style={{ display: 'block', marginBottom: '0.4rem', color: 'var(--text-secondary)', fontSize: '0.9rem', fontWeight: 500 }}>
              ส่วนจินตภาพ (Imaginary part, b)
            </label>
            <input
              type="number"
              className="input-field"
              placeholder="เช่น 4"
              value={im}
              onChange={(e) => setIm(e.target.value)}
              onKeyDown={handleKeyDown}
            />
          </div>

          <p style={{ color: 'var(--text-muted)', fontSize: '0.8rem', marginBottom: '1rem', fontFamily: 'var(--font-mono)' }}>
            z = {re || '?'} + {im || '?'}i
          </p>

          <button
            className="btn-primary"
            onClick={handleCalculate}
            disabled={loading}
            style={{ width: '100%' }}
          >
            {loading ? '⏳ กำลังคำนวณ...' : '⚡ คำนวณ (Calculate)'}
          </button>

          {error && (
            <div style={{
              marginTop: '1rem',
              padding: '0.75rem 1rem',
              background: 'rgba(239, 68, 68, 0.1)',
              border: '1px solid rgba(239, 68, 68, 0.3)',
              borderRadius: 'var(--radius-sm)',
              color: '#f87171',
              fontSize: '0.875rem',
            }}>
              ❌ {error}
            </div>
          )}

          {/* ── Results Panel ──────────────── */}
          {result && (
            <div className="animate-in" style={{ marginTop: '1.5rem' }}>
              <h3 style={{ fontSize: '1rem', marginBottom: '1rem', color: 'var(--accent-cyan)' }}>
                📊 ผลลัพธ์การคำนวณ
              </h3>

              <div style={{
                display: 'grid',
                gridTemplateColumns: '1fr 1fr',
                gap: '0.75rem',
                marginBottom: '1rem',
              }}>
                <ResultBox label="Magnitude (r)" value={result.magnitude.toFixed(4)} />
                <ResultBox label="θ (องศา)" value={`${result.argument_deg.toFixed(4)}°`} />
                <ResultBox label="θ (เรเดียน)" value={`${result.argument_rad.toFixed(4)} rad`} />
                <ResultBox label="z" value={`${result.re} + ${result.im}i`} />
              </div>

              <div style={{
                padding: '0.85rem 1rem',
                background: 'rgba(57, 255, 20, 0.06)',
                border: '1px solid rgba(57, 255, 20, 0.15)',
                borderRadius: 'var(--radius-sm)',
              }}>
                <p style={{ color: 'var(--text-muted)', fontSize: '0.75rem', marginBottom: '0.3rem' }}>
                  รูปเชิงขั้ว (Polar Form)
                </p>
                <p className="result-value" style={{ fontSize: '1rem' }}>
                  {result.polar_form}
                </p>
              </div>
            </div>
          )}
        </div>

        {/* RIGHT — Argand Diagram */}
        <div className="card" style={{ padding: '1rem' }}>
          <h2 style={{ fontSize: '1.05rem', marginBottom: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <span style={{ fontSize: '1.2rem' }}>📐</span> Argand Diagram
          </h2>
          <ArgandDiagram
            re={result ? result.re : parseFloat(re) || null}
            im={result ? result.im : parseFloat(im) || null}
            magnitude={result ? result.magnitude : 0}
            argumentDeg={result ? result.argument_deg : 0}
          />
          <p style={{ color: 'var(--text-muted)', fontSize: '0.75rem', marginTop: '0.5rem', textAlign: 'center' }}>
            แสดงตำแหน่งจุด z บนระนาบเชิงซ้อน พร้อมเวกเตอร์ r และมุม θ
          </p>
        </div>
      </div>

      {/* ── Steps Section ──────────────────── */}
      {result && result.steps && (
        <div className="card animate-in" style={{ marginBottom: '1.5rem' }}>
          <h2 style={{ fontSize: '1.15rem', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <span style={{ fontSize: '1.3rem' }}>📝</span> วิธีทำ (Step-by-Step Solution)
          </h2>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.8rem', marginBottom: '1rem' }}>
            ลอจิกคณิตศาสตร์ถูกประมวลผลโดย Rust Backend — ผลลัพธ์ด้านล่างแสดง "วิธีทำ" แบบละเอียด
          </p>
          {result.steps.map((step, i) => (
            <div key={i} className="step-item" style={{ animationDelay: `${i * 0.08}s` }}>
              {step}
            </div>
          ))}
        </div>
      )}

      {/* ── Performance / Rust Explanation ── */}
      <div className="perf-banner">
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: '1rem', flexWrap: 'wrap' }}>
          <span style={{ fontSize: '2rem' }}>🦀</span>
          <div>
            <h3 style={{ fontSize: '1rem', marginBottom: '0.4rem' }}>
              ทำไมถึงใช้ <span className="glow-text">Rust</span> เป็น Backend?
            </h3>
            <ul style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', lineHeight: '1.8', paddingLeft: '1.2rem' }}>
              <li><strong>Memory Safety</strong> — ไม่มี Null Pointer / Buffer Overflow ทำให้โปรแกรมปลอดภัย</li>
              <li><strong>Zero-Cost Abstractions</strong> — โค้ด High-level แต่ Performance เทียบเท่า C/C++</li>
              <li><strong>Blazing Fast</strong> — คอมไพล์เป็น Native Code ไม่ต้อง Garbage Collector</li>
              <li><strong>Axum + Tokio</strong> — Async Runtime ที่จัดการ Concurrent Requests ได้มหาศาล</li>
            </ul>
          </div>
        </div>
      </div>

      {/* ── Footer ──────────────────────────── */}
      <footer style={{
        textAlign: 'center',
        marginTop: '2.5rem',
        padding: '1.5rem 0',
        borderTop: '1px solid var(--border-color)',
        color: 'var(--text-muted)',
        fontSize: '0.8rem',
      }}>
        <p>Complex Polar Lab — โปรเจกต์คณิตศาสตร์ ม.5</p>
        <p style={{ marginTop: '0.3rem' }}>
          Built with <span className="glow-text">React + Vite</span> &amp; <span className="glow-text">Rust + Axum</span>
        </p>
      </footer>

      {/* ── Responsive Styles (injected) ──── */}
      <style>{`
        @media (max-width: 768px) {
          .main-grid {
            grid-template-columns: 1fr !important;
          }
        }
      `}</style>
    </div>
  );
}

// ============================================================
// Sub-component: ResultBox — แสดงผลลัพธ์แต่ละค่า
// ============================================================
function ResultBox({ label, value }) {
  return (
    <div style={{
      padding: '0.7rem 0.85rem',
      background: 'rgba(0, 240, 255, 0.05)',
      border: '1px solid rgba(0, 240, 255, 0.1)',
      borderRadius: 'var(--radius-sm)',
    }}>
      <p style={{ color: 'var(--text-muted)', fontSize: '0.7rem', marginBottom: '0.2rem' }}>
        {label}
      </p>
      <p className="result-value" style={{ fontSize: '1rem' }}>
        {value}
      </p>
    </div>
  );
}

export default App;
