import { useState, useEffect, useCallback, useRef } from "react";

type BtnId =
  | "cross" | "circle" | "square" | "triangle"
  | "l1" | "l2" | "r1" | "r2"
  | "select" | "start" | "analog"
  | "ls";

const KEY_MAP: Record<string, BtnId> = {
  z: "cross", x: "circle", a: "square", s: "triangle",
  q: "l1", "1": "l2", e: "r1", "3": "r2",
  Backspace: "select", Enter: "start",
};

const BTN_ICONS: Record<string, React.ReactNode> = {
  cross: (
    <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
      <line x1="4" y1="4" x2="18" y2="18" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"/>
      <line x1="18" y1="4" x2="4" y2="18" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"/>
    </svg>
  ),
  circle: (
    <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
      <circle cx="11" cy="11" r="7" stroke="currentColor" strokeWidth="2.5"/>
    </svg>
  ),
  square: (
    <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
      <rect x="4" y="4" width="14" height="14" rx="2" stroke="currentColor" strokeWidth="2.5"/>
    </svg>
  ),
  triangle: (
    <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
      <polygon points="11,3 20,19 2,19" stroke="currentColor" strokeWidth="2.5" strokeLinejoin="round" fill="none"/>
    </svg>
  ),
};

const BTN_META: Record<string, { color: string; glow: string }> = {
  cross:    { color: "#60a5fa", glow: "#3b82f680" },
  circle:   { color: "#f87171", glow: "#ef444480" },
  square:   { color: "#e879f9", glow: "#d946ef80" },
  triangle: { color: "#4ade80", glow: "#22c55e80" },
};

function useButtons() {
  const [pressed, setPressed] = useState<Set<BtnId>>(new Set());

  const press = useCallback((id: BtnId) => setPressed(p => new Set(p).add(id)), []);
  const release = useCallback((id: BtnId) => setPressed(p => { const n = new Set(p); n.delete(id); return n; }), []);

  useEffect(() => {
    const down = (e: KeyboardEvent) => { const id = KEY_MAP[e.key]; if (id) press(id); };
    const up = (e: KeyboardEvent) => { const id = KEY_MAP[e.key]; if (id) release(id); };
    window.addEventListener("keydown", down);
    window.addEventListener("keyup", up);
    return () => { window.removeEventListener("keydown", down); window.removeEventListener("keyup", up); };
  }, [press, release]);

  return { pressed, press, release };
}

function PressBtn({
  id, pressed, press, release, children, className = "", style,
}: {
  id: BtnId; pressed: Set<BtnId>;
  press: (id: BtnId) => void; release: (id: BtnId) => void;
  children: React.ReactNode; className?: string; style?: React.CSSProperties;
}) {
  const active = pressed.has(id);
  return (
    <button
      className={className}
      style={style}
      data-active={active}
      onMouseDown={() => press(id)}
      onMouseUp={() => release(id)}
      onMouseLeave={() => release(id)}
      onTouchStart={e => { e.preventDefault(); press(id); }}
      onTouchEnd={e => { e.preventDefault(); release(id); }}
    >
      {children}
    </button>
  );
}

// Face button (circle shape)
function FaceBtn({ id, pressed, press, release }: { id: BtnId; pressed: Set<BtnId>; press: (id: BtnId) => void; release: (id: BtnId) => void }) {
  const meta = BTN_META[id];
  const active = pressed.has(id);
  return (
    <PressBtn id={id} pressed={pressed} press={press} release={release}
      style={{
        width: 56, height: 56,
        borderRadius: "50%",
        border: `2px solid ${active ? meta.color : meta.color + "55"}`,
        background: active
          ? `radial-gradient(circle at 40% 35%, ${meta.color}55, ${meta.color}22)`
          : "rgba(255,255,255,0.04)",
        color: meta.color,
        fontSize: 20,
        fontWeight: 700,
        cursor: "pointer",
        display: "flex", alignItems: "center", justifyContent: "center",
        boxShadow: active ? `0 0 20px ${meta.glow}, 0 0 6px ${meta.glow}` : "none",
        transform: active ? "scale(0.93)" : "scale(1)",
        transition: "all 0.08s ease",
        userSelect: "none",
        WebkitTapHighlightColor: "transparent",
        backdropFilter: "blur(4px)",
        filter: active ? `drop-shadow(0 0 6px ${meta.color})` : "none",
      }}
    >
      {BTN_ICONS[id]}
    </PressBtn>
  );
}

// D-Pad direction button

// Shoulder / Trigger buttons
function ShoulderBtn({ id, pressed, press, release, label, side }: {
  id: BtnId; pressed: Set<BtnId>; press: (id: BtnId) => void; release: (id: BtnId) => void;
  label: string; side: "l" | "r";
}) {
  const active = pressed.has(id);
  const isL2R2 = label.includes("2");
  return (
    <PressBtn id={id} pressed={pressed} press={press} release={release}
      style={{
        width: "100%",
        height: isL2R2 ? 38 : 32,
        borderRadius: isL2R2
          ? (side === "l" ? "12px 4px 4px 12px" : "4px 12px 12px 4px")
          : 8,
        background: active
          ? "rgba(148,163,184,0.2)"
          : "rgba(255,255,255,0.05)",
        border: `1.5px solid ${active ? "rgba(148,163,184,0.5)" : "rgba(255,255,255,0.08)"}`,
        color: active ? "#e2e8f0" : "rgba(255,255,255,0.4)",
        fontSize: 11,
        fontWeight: 700,
        letterSpacing: 1,
        cursor: "pointer",
        display: "flex", alignItems: "center", justifyContent: "center",
        boxShadow: active ? "0 0 14px rgba(148,163,184,0.25)" : "none",
        transform: active ? "scale(0.96)" : "scale(1)",
        transition: "all 0.08s ease",
        userSelect: "none",
        WebkitTapHighlightColor: "transparent",
        backdropFilter: "blur(4px)",
      }}
    >
      {label}
    </PressBtn>
  );
}

// Analog stick
function AnalogStick({ id, label, pressed, press, release }: {
  id: BtnId; label: string;
  pressed: Set<BtnId>; press: (id: BtnId) => void; release: (id: BtnId) => void;
}) {
  const [pos, setPos] = useState({ x: 0, y: 0 });
  const dragging = useRef(false);
  const origin = useRef({ x: 0, y: 0 });
  const MAX = 20;
  const active = pressed.has(id);

  const startDrag = (cx: number, cy: number) => {
    dragging.current = true;
    origin.current = { x: cx, y: cy };
    press(id);
  };
  const moveDrag = useCallback((cx: number, cy: number) => {
    if (!dragging.current) return;
    const dx = Math.max(-MAX, Math.min(MAX, cx - origin.current.x));
    const dy = Math.max(-MAX, Math.min(MAX, cy - origin.current.y));
    setPos({ x: dx, y: dy });
  }, []);
  const endDrag = useCallback(() => {
    dragging.current = false;
    setPos({ x: 0, y: 0 });
    release(id);
  }, [id, release]);

  useEffect(() => {
    const mm = (e: MouseEvent) => moveDrag(e.clientX, e.clientY);
    const mu = () => endDrag();
    const tm = (e: TouchEvent) => { if (e.touches[0]) moveDrag(e.touches[0].clientX, e.touches[0].clientY); };
    window.addEventListener("mousemove", mm);
    window.addEventListener("mouseup", mu);
    window.addEventListener("touchmove", tm, { passive: true });
    window.addEventListener("touchend", mu);
    return () => {
      window.removeEventListener("mousemove", mm);
      window.removeEventListener("mouseup", mu);
      window.removeEventListener("touchmove", tm);
      window.removeEventListener("touchend", mu);
    };
  }, [moveDrag, endDrag]);

  const pct = { x: (pos.x / MAX) * 100, y: (pos.y / MAX) * 100 };

  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 10 }}>
      <div
        style={{
          position: "relative",
          width: 100, height: 100,
          borderRadius: "50%",
          background: "rgba(255,255,255,0.04)",
          border: `1.5px solid ${active ? "rgba(148,163,184,0.4)" : "rgba(255,255,255,0.08)"}`,
          boxShadow: active ? "0 0 20px rgba(148,163,184,0.15)" : "none",
          cursor: "grab",
          display: "flex", alignItems: "center", justifyContent: "center",
          transition: "border-color 0.1s, box-shadow 0.1s",
        }}
        onMouseDown={e => startDrag(e.clientX, e.clientY)}
        onTouchStart={e => { e.preventDefault(); if (e.touches[0]) startDrag(e.touches[0].clientX, e.touches[0].clientY); }}
      >
        {/* crosshair guide */}
        <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", pointerEvents: "none" }}>
          <div style={{ width: "80%", height: 1, background: "rgba(255,255,255,0.05)", position: "absolute" }} />
          <div style={{ width: 1, height: "80%", background: "rgba(255,255,255,0.05)", position: "absolute" }} />
        </div>
        {/* nub */}
        <div
          style={{
            width: 48, height: 48,
            borderRadius: "50%",
            background: active
              ? "radial-gradient(circle at 40% 35%, rgba(148,163,184,0.4), rgba(100,116,139,0.3))"
              : "radial-gradient(circle at 40% 35%, rgba(255,255,255,0.12), rgba(255,255,255,0.04))",
            border: `1.5px solid ${active ? "rgba(148,163,184,0.5)" : "rgba(255,255,255,0.12)"}`,
            transform: `translate(${pos.x}px, ${pos.y}px)`,
            transition: dragging.current ? "none" : "transform 0.15s cubic-bezier(0.34,1.56,0.64,1)",
            display: "flex", alignItems: "center", justifyContent: "center",
            boxShadow: active ? "0 0 12px rgba(148,163,184,0.3)" : "none",
          }}
        >
          {/* grip dots */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 6px)", gap: 3 }}>
            {Array.from({ length: 9 }).map((_, i) => (
              <div key={i} style={{ width: 3, height: 3, borderRadius: "50%", background: "rgba(255,255,255,0.2)" }} />
            ))}
          </div>
        </div>
      </div>
      {/* mini axis readout */}
      <div style={{ display: "flex", gap: 6 }}>
        <span style={{
          background: "rgba(255,255,255,0.05)",
          border: "1px solid rgba(255,255,255,0.08)",
          borderRadius: 6,
          padding: "2px 8px",
          fontSize: 10,
          fontFamily: "monospace",
          color: "rgba(255,255,255,0.4)",
          minWidth: 48,
          textAlign: "center",
        }}>X: {pct.x >= 0 ? "+" : ""}{Math.round(pct.x)}</span>
        <span style={{
          background: "rgba(255,255,255,0.05)",
          border: "1px solid rgba(255,255,255,0.08)",
          borderRadius: 6,
          padding: "2px 8px",
          fontSize: 10,
          fontFamily: "monospace",
          color: "rgba(255,255,255,0.4)",
          minWidth: 48,
          textAlign: "center",
        }}>Y: {pct.y >= 0 ? "+" : ""}{Math.round(pct.y)}</span>
      </div>
      <span style={{ color: "rgba(255,255,255,0.25)", fontSize: 10, letterSpacing: 1, fontWeight: 600 }}>{label}</span>
    </div>
  );
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ color: "rgba(255,255,255,0.2)", fontSize: 9, fontWeight: 700, letterSpacing: 2, textTransform: "uppercase", marginBottom: 10 }}>
      {children}
    </div>
  );
}

function Panel({ children, style }: { children: React.ReactNode; style?: React.CSSProperties }) {
  return (
    <div style={{
      background: "rgba(255,255,255,0.03)",
      border: "1px solid rgba(255,255,255,0.07)",
      borderRadius: 20,
      padding: 20,
      backdropFilter: "blur(12px)",
      ...style,
    }}>
      {children}
    </div>
  );
}

const LOG_MAX = 10;
const LABEL_MAP: Record<BtnId, string> = {
  cross: "✕ Cross", circle: "○ Circle", square: "□ Square", triangle: "△ Triangle",
  l1: "L1", l2: "L2", r1: "R1", r2: "R2",
  select: "SELECT", start: "START", analog: "ANALOG",
  ls: "Analog",
};
const COLOR_MAP: Record<string, string> = {
  cross: "#60a5fa", circle: "#f87171", square: "#e879f9", triangle: "#4ade80",
};

export default function App() {
  const { pressed, press, release } = useButtons();
  const [log, setLog] = useState<{ id: BtnId; ts: string }[]>([]);

  useEffect(() => {
    pressed.forEach(id => {
      setLog(prev => {
        if (prev[0]?.id === id) return prev;
        const d = new Date();
        const ts = `${d.getHours().toString().padStart(2,"0")}:${d.getMinutes().toString().padStart(2,"0")}:${d.getSeconds().toString().padStart(2,"0")}`;
        return [{ id, ts }, ...prev].slice(0, LOG_MAX);
      });
    });
  }, [pressed]);

  const CenterBtn = ({ id, label }: { id: BtnId; label: string }) => {
    const active = pressed.has(id);
    return (
      <PressBtn id={id} pressed={pressed} press={press} release={release}
        style={{
          padding: "5px 14px",
          borderRadius: 20,
          background: active ? "rgba(148,163,184,0.2)" : "rgba(255,255,255,0.04)",
          border: `1px solid ${active ? "rgba(148,163,184,0.5)" : "rgba(255,255,255,0.1)"}`,
          color: active ? "#e2e8f0" : "rgba(255,255,255,0.35)",
          fontSize: 10,
          fontWeight: 700,
          letterSpacing: 1,
          cursor: "pointer",
          boxShadow: active ? "0 0 10px rgba(148,163,184,0.2)" : "none",
          transform: active ? "scale(0.95)" : "scale(1)",
          transition: "all 0.08s ease",
          userSelect: "none",
          WebkitTapHighlightColor: "transparent",
        }}
      >
        {label}
      </PressBtn>
    );
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "linear-gradient(135deg, #080810 0%, #0f0f1c 50%, #080810 100%)",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        padding: "32px 16px",
        gap: 24,
        fontFamily: "system-ui, -apple-system, sans-serif",
      }}
    >
      {/* Header */}
      <div style={{ textAlign: "center" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 10, marginBottom: 6 }}>
          <div style={{ width: 6, height: 6, borderRadius: "50%", background: "#4ade80", boxShadow: "0 0 8px #4ade80" }} />
          <span style={{ color: "rgba(255,255,255,0.8)", fontSize: 13, fontWeight: 700, letterSpacing: 3 }}>
            PS2 CONTROLLER
          </span>
          <div style={{ width: 6, height: 6, borderRadius: "50%", background: "#4ade80", boxShadow: "0 0 8px #4ade80" }} />
        </div>
        <p style={{ color: "rgba(255,255,255,0.2)", fontSize: 11, letterSpacing: 1 }}>DualShock 2 — Interactive Emulator</p>
      </div>

      {/* Controller Layout */}
      <div style={{ width: "100%", maxWidth: 640, display: "flex", flexDirection: "column", gap: 10 }}>

        {/* Row 1 — Triggers L2 / R2 */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
          <Panel style={{ padding: "14px 18px" }}>
            <SectionLabel>Trigger</SectionLabel>
            <ShoulderBtn id="l2" pressed={pressed} press={press} release={release} label="L2" side="l" />
          </Panel>
          <Panel style={{ padding: "14px 18px" }}>
            <SectionLabel>Trigger</SectionLabel>
            <ShoulderBtn id="r2" pressed={pressed} press={press} release={release} label="R2" side="r" />
          </Panel>
        </div>

        {/* Row 2 — L1 / R1 */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
          <Panel style={{ padding: "14px 18px" }}>
            <SectionLabel>Bumper</SectionLabel>
            <ShoulderBtn id="l1" pressed={pressed} press={press} release={release} label="L1" side="l" />
          </Panel>
          <Panel style={{ padding: "14px 18px" }}>
            <SectionLabel>Bumper</SectionLabel>
            <ShoulderBtn id="r1" pressed={pressed} press={press} release={release} label="R1" side="r" />
          </Panel>
        </div>

        {/* Row 3 — Analog / Center / Face */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr auto 1fr", gap: 10, alignItems: "stretch" }}>
          {/* Analog Stick */}
          <Panel style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
            <SectionLabel>Analog</SectionLabel>
            <AnalogStick id="ls" label="" pressed={pressed} press={press} release={release} />
          </Panel>

          {/* Center */}
          <Panel style={{ padding: "16px 14px", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 14 }}>
            <div style={{ color: "rgba(255,255,255,0.15)", fontSize: 10, fontWeight: 700, letterSpacing: 2, textAlign: "center", lineHeight: 1.2 }}>
              SONY<br /><span style={{ fontSize: 7, letterSpacing: 1 }}>PlayStation</span>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 8, alignItems: "center" }}>
              <CenterBtn id="select" label="SELECT" />
              {/* Analog LED */}
              <button
                style={{
                  width: 28, height: 28, borderRadius: "50%",
                  background: pressed.has("analog") ? "rgba(248,113,113,0.2)" : "rgba(255,255,255,0.03)",
                  border: `1.5px solid ${pressed.has("analog") ? "#f87171" : "rgba(255,255,255,0.1)"}`,
                  cursor: "pointer",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  transition: "all 0.1s",
                  userSelect: "none",
                }}
                onMouseDown={() => press("analog")}
                onMouseUp={() => release("analog")}
                onMouseLeave={() => release("analog")}
                onTouchStart={e => { e.preventDefault(); press("analog"); }}
                onTouchEnd={e => { e.preventDefault(); release("analog"); }}
              >
                <div style={{
                  width: 10, height: 10, borderRadius: "50%",
                  background: pressed.has("analog") ? "#f87171" : "#991b1b",
                  boxShadow: pressed.has("analog") ? "0 0 10px #f87171, 0 0 4px #f87171" : "none",
                  transition: "all 0.1s",
                }} />
              </button>
              <CenterBtn id="start" label="START" />
            </div>
          </Panel>

          {/* Face Buttons */}
          <Panel>
            <SectionLabel>Face Buttons</SectionLabel>
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 4 }}>
              <FaceBtn id="triangle" pressed={pressed} press={press} release={release} />
              <div style={{ display: "flex", gap: 4 }}>
                <FaceBtn id="square" pressed={pressed} press={press} release={release} />
                <div style={{ width: 56, height: 56 }} />
                <FaceBtn id="circle" pressed={pressed} press={press} release={release} />
              </div>
              <FaceBtn id="cross" pressed={pressed} press={press} release={release} />
            </div>
          </Panel>
        </div>

        {/* Row 4 — Input log */}
        <Panel style={{ padding: "16px 20px" }}>
          <SectionLabel>Input Log</SectionLabel>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 6, minHeight: 28 }}>
            {log.length === 0 && (
              <span style={{ color: "rgba(255,255,255,0.15)", fontSize: 11, fontStyle: "italic" }}>Tekan tombol apapun...</span>
            )}
            {log.map((e, i) => {
              const color = COLOR_MAP[e.id] ?? "rgba(148,163,184,0.9)";
              return (
                <div key={i} style={{
                  display: "flex", alignItems: "center", gap: 5,
                  background: "rgba(255,255,255,0.04)",
                  border: `1px solid ${color}33`,
                  borderRadius: 8,
                  padding: "3px 10px",
                  opacity: Math.max(0.3, 1 - i * 0.08),
                }}>
                  <div style={{ width: 5, height: 5, borderRadius: "50%", background: color, flexShrink: 0 }} />
                  <span style={{ color: color, fontSize: 11, fontWeight: 600 }}>{LABEL_MAP[e.id]}</span>
                  <span style={{ color: "rgba(255,255,255,0.2)", fontSize: 10, fontFamily: "monospace" }}>{e.ts}</span>
                </div>
              );
            })}
          </div>
        </Panel>

        {/* Keyboard hint */}
        <div style={{ textAlign: "center" }}>
          <span style={{ color: "rgba(255,255,255,0.15)", fontSize: 10, letterSpacing: 1 }}>
            Keyboard: Z=✕ &nbsp;·&nbsp; X=○ &nbsp;·&nbsp; A=□ &nbsp;·&nbsp; S=△ &nbsp;·&nbsp; Q=L1 &nbsp;·&nbsp; E=R1 &nbsp;·&nbsp; 1=L2 &nbsp;·&nbsp; 3=R2
          </span>
        </div>
      </div>
    </div>
  );
}
