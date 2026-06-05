import { useState, useEffect, useCallback, useRef } from "react";
import { sendControl, initializeZones } from "./lib/firebase";

type BtnId =
  | "cross" | "circle" | "square" | "triangle"
  | "select" | "start" | "analog"
  | "ls";

const KEY_MAP: Record<string, BtnId> = {
  z: "cross", x: "circle", a: "square", s: "triangle",
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
        width: 44, height: 44,
        borderRadius: "50%",
        border: `2px solid ${active ? meta.color : meta.color + "55"}`,
        background: active
          ? `radial-gradient(circle at 40% 35%, ${meta.color}55, ${meta.color}22)`
          : "rgba(255,255,255,0.04)",
        color: meta.color,
        fontSize: 16,
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

// Analog stick
function AnalogStick({ id, label, pressed, press, release, onMove }: {
  id: BtnId; label: string;
  pressed: Set<BtnId>; press: (id: BtnId) => void; release: (id: BtnId) => void;
  onMove: (x: number, y: number) => void;
}) {
  const [pos, setPos] = useState({ x: 0, y: 0 });
  const dragging = useRef(false);
  const activeTouchId = useRef<number | null>(null);
  const origin = useRef({ x: 0, y: 0 });
  const MAX = 35;
  const DEADZONE = 3;
  const active = pressed.has(id);

  const startDrag = (cx: number, cy: number, touchId: number | null = null) => {
    dragging.current = true;
    activeTouchId.current = touchId;
    origin.current = { x: cx, y: cy };
    press(id);
  };
  const moveDrag = useCallback((cx: number, cy: number) => {
    if (!dragging.current) return;
    let dx = cx - origin.current.x;
    let dy = cy - origin.current.y;
    
    // Apply deadzone
    if (Math.abs(dx) < DEADZONE) dx = 0;
    if (Math.abs(dy) < DEADZONE) dy = 0;
    
    // Clamp to MAX range
    dx = Math.max(-MAX, Math.min(MAX, dx));
    dy = Math.max(-MAX, Math.min(MAX, dy));
    
    setPos({ x: dx, y: dy });
    onMove(Math.round((dx / MAX) * 100), Math.round((dy / MAX) * 100));
  }, [onMove]);
  const endDrag = useCallback(() => {
    dragging.current = false;
    activeTouchId.current = null;
    setPos({ x: 0, y: 0 });
    onMove(0, 0);
    release(id);
  }, [id, onMove, release]);

  useEffect(() => {
    const mm = (e: MouseEvent) => moveDrag(e.clientX, e.clientY);
    const mu = () => endDrag();
    const tm = (e: TouchEvent) => {
      if (activeTouchId.current !== null) {
        for (let i = 0; i < e.touches.length; i++) {
          if (e.touches[i].identifier === activeTouchId.current) {
            moveDrag(e.touches[i].clientX, e.touches[i].clientY);
            break;
          }
        }
      }
    };
    const tu = (e: TouchEvent) => {
      if (activeTouchId.current !== null) {
        let touchEnded = false;
        for (let i = 0; i < e.changedTouches.length; i++) {
          if (e.changedTouches[i].identifier === activeTouchId.current) {
            touchEnded = true;
            break;
          }
        }
        if (touchEnded) {
          endDrag();
        }
      }
    };
    window.addEventListener("mousemove", mm);
    window.addEventListener("mouseup", mu);
    window.addEventListener("touchmove", tm, { passive: true });
    window.addEventListener("touchend", tu);
    return () => {
      window.removeEventListener("mousemove", mm);
      window.removeEventListener("mouseup", mu);
      window.removeEventListener("touchmove", tm);
      window.removeEventListener("touchend", tu);
    };
  }, [moveDrag, endDrag]);

  const pct = { x: (pos.x / MAX) * 100, y: (pos.y / MAX) * 100 };

  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 8 }}>
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
        onTouchStart={e => {
          e.preventDefault();
          const touch = e.changedTouches[0];
          if (touch) {
            startDrag(touch.clientX, touch.clientY, touch.identifier);
          }
        }}
      >
        {/* crosshair guide */}
        <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", pointerEvents: "none" }}>
          <div style={{ width: "80%", height: 1, background: "rgba(255,255,255,0.05)", position: "absolute" }} />
          <div style={{ width: 1, height: "80%", background: "rgba(255,255,255,0.05)", position: "absolute" }} />
        </div>
        {/* nub */}
        <div
          style={{
            width: 45, height: 45,
            borderRadius: "50%",
            background: active
              ? "radial-gradient(circle at 40% 35%, rgba(148,163,184,0.4), rgba(100,116,139,0.3))"
              : "radial-gradient(circle at 40% 35%, rgba(255,255,255,0.12), rgba(255,255,255,0.04))",
            border: `1.5px solid ${active ? "rgba(148,163,184,0.5)" : "rgba(255,255,255,0.12)"}`,
            transform: `translate(${pos.x}px, ${pos.y}px)`,
            transition: dragging.current ? "none" : "transform 0.08s ease-out",
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
    <div style={{ color: "rgba(255,255,255,0.2)", fontSize: 8, fontWeight: 700, letterSpacing: 1.5, textTransform: "uppercase", marginBottom: 6 }}>
      {children}
    </div>
  );
}

function Panel({ children, style }: { children: React.ReactNode; style?: React.CSSProperties }) {
  return (
    <div style={{
      background: "rgba(255,255,255,0.03)",
      border: "1px solid rgba(255,255,255,0.07)",
      borderRadius: 16,
      padding: 12,
      backdropFilter: "blur(12px)",
      minHeight: 0,
      overflow: "hidden",
      ...style,
    }}>
      {children}
    </div>
  );
}

export default function App() {
  const { pressed, press, release } = useButtons();
  const [joystick, setJoystick] = useState({ x: 0, y: 0 });
  const [pwmSpeed, setPwmSpeed] = useState(0);

  const increasePwm = () => setPwmSpeed(prev => Math.min(prev + 10, 255));
  const decreasePwm = () => setPwmSpeed(prev => Math.max(prev - 10, 0));

  useEffect(() => {
    // Disable scrolling on body to prevent page movement/pull-to-refresh on mobile
    document.body.style.overflow = "hidden";
    document.body.style.touchAction = "none";
    document.body.style.overscrollBehavior = "none";

    // Initialize zones in database
    void initializeZones().catch(error => {
      console.error("Failed to initialize zones", error);
    });

    return () => {
      document.body.style.overflow = "";
      document.body.style.touchAction = "";
      document.body.style.overscrollBehavior = "";
    };
  }, []);

  useEffect(() => {
    const snapshot = {
      button_cross_gas: pressed.has("cross"),
      button_circle: pressed.has("circle"),
      button_square: pressed.has("square"),
      button_triangle: pressed.has("triangle"),
      button_select: pressed.has("select"),
      button_start: pressed.has("start"),
      button_analog: pressed.has("analog"),
      joystick_x: joystick.x,
      joystick_y: joystick.y,
      zone_triangle_safe: pressed.has("triangle") ? "SAFE" : null,
      zone_circle_danger: pressed.has("circle") ? "DANGER" : null,
      pwm_speed: pwmSpeed,
    };

    void sendControl(snapshot).catch(error => {
      console.error("Failed to sync control state to Firebase", error);
    });
  }, [pressed, joystick, pwmSpeed]);

  const CenterBtn = ({ id, label }: { id: BtnId; label: string }) => {
    const active = pressed.has(id);
    return (
      <PressBtn id={id} pressed={pressed} press={press} release={release}
        style={{
          padding: "4px 10px",
          borderRadius: 16,
          background: active ? "rgba(148,163,184,0.2)" : "rgba(255,255,255,0.04)",
          border: `1px solid ${active ? "rgba(148,163,184,0.5)" : "rgba(255,255,255,0.1)"}`,
          color: active ? "#e2e8f0" : "rgba(255,255,255,0.35)",
          fontSize: 8,
          fontWeight: 700,
          letterSpacing: 0.5,
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
        position: "fixed",
        inset: 0,
        width: "100%",
        height: "100%",
        overflow: "hidden",
        background: "linear-gradient(135deg, #080810 0%, #0f0f1c 50%, #080810 100%)",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        padding: "8px",
        gap: 8,
        fontFamily: "system-ui, -apple-system, sans-serif",
        touchAction: "none",
      }}
    >
      {/* Header */}
      <div style={{ textAlign: "center", flexShrink: 0 }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 8, marginBottom: 3 }}>
          <div style={{ width: 4, height: 4, borderRadius: "50%", background: "#4ade80", boxShadow: "0 0 8px #4ade80" }} />
          <span style={{ color: "rgba(255,255,255,0.8)", fontSize: 11, fontWeight: 700, letterSpacing: 2 }}>
            PS2 CONTROLLER
          </span>
          <div style={{ width: 4, height: 4, borderRadius: "50%", background: "#4ade80", boxShadow: "0 0 8px #4ade80" }} />
        </div>
        <p style={{ color: "rgba(255,255,255,0.2)", fontSize: 9, letterSpacing: 0.5, margin: 0 }}>DualShock 2 — Interactive Emulator</p>
      </div>

      {/* Controller Layout */}
      <div style={{ width: "100%", maxWidth: "100%", display: "flex", flexDirection: "column", gap: 8, flexShrink: 1, overflow: "hidden" }}>
        {/* Row 1 — Analog / Center / Face */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr auto 1fr", gap: 8, alignItems: "stretch", minHeight: 0 }}>
          {/* Analog Stick */}
          <Panel style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", position: "relative" }}>
            <SectionLabel>Analog</SectionLabel>
            <AnalogStick
              id="ls"
              label=""
              pressed={pressed}
              press={press}
              release={release}
              onMove={(x, y) => setJoystick({ x: -x, y: -y })}
            />
            {/* PWM Controls */}
            <div style={{ display: "flex", gap: 4, marginTop: 6, alignItems: "center" }}>
              <button
                onClick={decreasePwm}
                style={{
                  width: 24, height: 24,
                  borderRadius: 4,
                  background: "rgba(248,113,113,0.15)",
                  border: "1px solid rgba(248,113,113,0.3)",
                  color: "#f87171",
                  cursor: "pointer",
                  fontWeight: 700,
                  fontSize: 10,
                  display: "flex", alignItems: "center", justifyContent: "center",
                  transition: "all 0.1s",
                  padding: 0,
                }}
                onMouseDown={e => e.currentTarget.style.transform = "scale(0.9)"}
                onMouseUp={e => e.currentTarget.style.transform = "scale(1)"}
                title="Decrease PWM"
              >
                −
              </button>
              <div style={{
                fontSize: 11,
                fontWeight: 700,
                color: "#60a5fa",
                fontFamily: "monospace",
                minWidth: 32,
                textAlign: "center",
              }}>
                {pwmSpeed}
              </div>
              <button
                onClick={increasePwm}
                style={{
                  width: 24, height: 24,
                  borderRadius: 4,
                  background: "rgba(74,222,128,0.15)",
                  border: "1px solid rgba(74,222,128,0.3)",
                  color: "#4ade80",
                  cursor: "pointer",
                  fontWeight: 700,
                  fontSize: 10,
                  display: "flex", alignItems: "center", justifyContent: "center",
                  transition: "all 0.1s",
                  padding: 0,
                }}
                onMouseDown={e => e.currentTarget.style.transform = "scale(0.9)"}
                onMouseUp={e => e.currentTarget.style.transform = "scale(1)"}
                title="Increase PWM"
              >
                +
              </button>
            </div>
          </Panel>

          {/* Center */}
          <Panel style={{ padding: "10px 8px", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 6 }}>
            <div style={{ color: "rgba(255,255,255,0.15)", fontSize: 8, fontWeight: 700, letterSpacing: 1.5, textAlign: "center", lineHeight: 1.2 }}>
              SONY<br /><span style={{ fontSize: 6, letterSpacing: 1 }}>PlayStation</span>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 5, alignItems: "center" }}>
              <CenterBtn id="select" label="SELECT" />
              {/* Analog LED */}
              <button
                style={{
                  width: 22, height: 22, borderRadius: "50%",
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
                  width: 8, height: 8, borderRadius: "50%",
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
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 2 }}>
              <FaceBtn id="triangle" pressed={pressed} press={press} release={release} />
              <div style={{ display: "flex", gap: 2 }}>
                <FaceBtn id="square" pressed={pressed} press={press} release={release} />
                <div style={{ width: 44, height: 44 }} />
                <FaceBtn id="circle" pressed={pressed} press={press} release={release} />
              </div>
              <FaceBtn id="cross" pressed={pressed} press={press} release={release} />
            </div>
          </Panel>
        </div>

        {/* Keyboard hint */}
        <div style={{ textAlign: "center", flexShrink: 0 }}>
          <span style={{ color: "rgba(255,255,255,0.15)", fontSize: 8, letterSpacing: 0.5 }}>
            Keyboard: Z=✕ &nbsp;·&nbsp; X=○ &nbsp;·&nbsp; A=□ &nbsp;·&nbsp; S=△
          </span>
        </div>
      </div>
    </div>
  );
}
