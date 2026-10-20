import { memo, useEffect, useId, useRef } from "react";

type Point = { x: number; y: number };
type Curve = { p0: Point; p1: Point; p2: Point; p3: Point; color: string; ink: string };
type Particle = {
  on: boolean;
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  max: number;
  r: number;
  color: string;
};

const POOL = 36;
const SAMPLES = 24;

const STREAKS: { y: number; lift: number; width: number; color: string; ink: string }[] = [
  { y: 108, lift: 74, width: 1.2, color: "#7c3aed", ink: "#ffffff" },
  { y: 126, lift: 82, width: 0.85, color: "#a78bfa", ink: "#ffffff" },
  { y: 144, lift: 68, width: 1.35, color: "#c084fc", ink: "#ffffff" },
  { y: 162, lift: 90, width: 0.95, color: "#e879f9", ink: "#ffffff" },
  { y: 180, lift: 76, width: 1.1, color: "#d946ef", ink: "#ffffff" },
  { y: 198, lift: 96, width: 1.2, color: "#f0abfc", ink: "#ffffff" },
  { y: 216, lift: 80, width: 1.45, color: "#e879f9", ink: "#ffffff" },
  { y: 236, lift: 104, width: 0.95, color: "#c026d3", ink: "#ffffff" },
  { y: 254, lift: 84, width: 1.2, color: "#a855f7", ink: "#ffffff" },
  { y: 274, lift: 108, width: 1.05, color: "#d8b4fe", ink: "#ffffff" },
  { y: 294, lift: 92, width: 1.4, color: "#f5d0fe", ink: "#ffffff" },
  { y: 314, lift: 116, width: 0.9, color: "#fae8ff", ink: "#ffffff" },
];

function at(p0: Point, p1: Point, p2: Point, p3: Point, t: number): Point {
  const u = 1 - t;
  return {
    x: u * u * u * p0.x + 3 * u * u * t * p1.x + 3 * u * t * t * p2.x + t * t * t * p3.x,
    y: u * u * u * p0.y + 3 * u * u * t * p1.y + 3 * u * t * t * p2.y + t * t * t * p3.y,
  };
}

function tangent(p0: Point, p1: Point, p2: Point, p3: Point, t: number): Point {
  const u = 1 - t;
  return {
    x: 3 * u * u * (p1.x - p0.x) + 6 * u * t * (p2.x - p1.x) + 3 * t * t * (p3.x - p2.x),
    y: 3 * u * u * (p1.y - p0.y) + 6 * u * t * (p2.y - p1.y) + 3 * t * t * (p3.y - p2.y),
  };
}

function bend(p0: Point, p1: Point, p2: Point, p3: Point, t: number) {
  const u = 1 - t;
  const d = tangent(p0, p1, p2, p3, t);
  const dd = {
    x: 6 * u * (p2.x - 2 * p1.x + p0.x) + 6 * t * (p3.x - 2 * p2.x + p1.x),
    y: 6 * u * (p2.y - 2 * p1.y + p0.y) + 6 * t * (p3.y - 2 * p2.y + p1.y),
  };
  const len = Math.hypot(d.x, d.y) || 1;
  const cross = d.x * dd.y - d.y * dd.x;
  const radius = Math.max(80, (len * len * len) / (Math.abs(cross) || 1));
  const side = cross >= 0 ? 1 : -1;
  return {
    len,
    radius,
    nx: (-d.y / len) * side,
    ny: (d.x / len) * side,
  };
}

function ribbon(p0: Point, p1: Point, p2: Point, p3: Point, width: number) {
  const round = (n: number) => Math.round(n * 10) / 10;
  const upper: string[] = [];
  const lower: string[] = [];
  for (let i = 0; i <= SAMPLES; i += 1) {
    const t = i / SAMPLES;
    const p = at(p0, p1, p2, p3, t);
    const d = tangent(p0, p1, p2, p3, t);
    const len = Math.hypot(d.x, d.y) || 1;
    const span = Math.sin(Math.PI * t) ** 1.15 * width;
    const nx = (-d.y / len) * span;
    const ny = (d.x / len) * span;
    upper.push(`${round(p.x + nx)} ${round(p.y + ny)}`);
    lower.push(`${round(p.x - nx)} ${round(p.y - ny)}`);
  }
  lower.reverse();
  return `M ${upper[0]} ${upper.slice(1).map((p) => `L ${p}`).join(" ")} ${lower.map((p) => `L ${p}`).join(" ")} Z`;
}

function centerline(p0: Point, p1: Point, p2: Point, p3: Point) {
  const round = (n: number) => Math.round(n * 10) / 10;
  let d = "";
  for (let i = 0; i <= SAMPLES; i += 1) {
    const p = at(p0, p1, p2, p3, i / SAMPLES);
    d += `${i === 0 ? "M" : " L"} ${round(p.x)} ${round(p.y)}`;
  }
  return d;
}

const CURVES: Curve[] = STREAKS.map((streak) => ({
  color: streak.color,
  ink: streak.ink,
  p0: { x: -40, y: streak.y },
  p1: { x: 260, y: streak.y - streak.lift * 0.05 },
  p2: { x: 560, y: streak.y - streak.lift * 0.32 },
  p3: { x: 960, y: streak.y - streak.lift },
}));

const PATHS = CURVES.map((curve, index) => ({
  key: index,
  color: curve.color,
  ink: curve.ink,
  halo: ribbon(curve.p0, curve.p1, curve.p2, curve.p3, STREAKS[index].width),
  body: ribbon(curve.p0, curve.p1, curve.p2, curve.p3, STREAKS[index].width * 0.42),
  core: ribbon(curve.p0, curve.p1, curve.p2, curve.p3, STREAKS[index].width * 0.12),
  flow: centerline(curve.p0, curve.p1, curve.p2, curve.p3),
}));

function sineRibbon(width: number, height: number, y: number, amp: number, phase: number, time: number) {
  const count = 48;
  const pts: { x: number; y: number }[] = [];
  for (let i = 0; i < count; i += 1) {
    const u = i / (count - 1);
    const wave = Math.sin(u * Math.PI * 3.1 + time * 0.00055 + phase);
    pts.push({ x: u * width, y: y + wave * amp });
  }
  return pts;
}

function makePool(): Particle[] {
  return Array.from({ length: POOL }, () => ({
    on: false,
    x: 0,
    y: 0,
    vx: 0,
    vy: 0,
    life: 0,
    max: 1,
    r: 1,
    color: "#fff",
  }));
}

function spawn(pool: Particle[]) {
  let spawned = 0;
  for (const slot of pool) {
    if (slot.on) continue;
    const curve = CURVES[spawned % CURVES.length];
    const t = 0.34 + Math.random() * 0.4;
    const p = at(curve.p0, curve.p1, curve.p2, curve.p3, t);
    const d = tangent(curve.p0, curve.p1, curve.p2, curve.p3, t);
    const len = Math.hypot(d.x, d.y) || 1;
    const speed = 3.2 + Math.random() * 2.4;
    const slip = (Math.random() - 0.5) * 0.55;
    slot.on = true;
    slot.x = p.x;
    slot.y = p.y;
    slot.vx = (d.x / len) * speed + (-d.y / len) * slip;
    slot.vy = (d.y / len) * speed + (d.x / len) * slip;
    slot.max = 380 + Math.random() * 70;
    slot.life = slot.max;
    slot.r = 5 + Math.random() * 4;
    slot.color = curve.color;
    spawned += 1;
    if (spawned >= 24) break;
  }
}

function project(x: number, y: number, width: number, height: number) {
  const scale = Math.max(width / 800, height / 420);
  const ox = (width - 800 * scale) / 2;
  const oy = (height - 420 * scale) / 2;
  return [ox + x * scale, oy + y * scale, scale] as const;
}

type FlowAgent = { curve: number; t: number; v: number; n: number; flash: number };

function FlowParticles({ quiet }: { quiet: boolean }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (quiet) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const agents: FlowAgent[] = [];
    CURVES.forEach((_, curve) => {
      agents.push({ curve, t: (curve * 0.083) % 1, v: 0.58 + (curve % 4) * 0.08, n: 0, flash: 0 });
      agents.push({ curve, t: 0.55, v: -0.22 - (curve % 3) * 0.03, n: 0, flash: 0 });
    });
    let rafId = 0;
    let last = performance.now();

    const frame = (now: number) => {
      const ctx = canvas.getContext("2d");
      if (!ctx) return;
      const dt = Math.min(32, now - last);
      last = now;
      const parent = canvas.parentElement;
      const dpr = Math.min(2, window.devicePixelRatio || 1);
      const nextW = Math.max(1, Math.round((parent?.clientWidth ?? 0) * dpr));
      const nextH = Math.max(1, Math.round((parent?.clientHeight ?? 0) * dpr));
      if (canvas.width !== nextW || canvas.height !== nextH) {
        canvas.width = nextW;
        canvas.height = nextH;
      }

      const step = dt / 1000;
      for (const agent of agents) {
        const curve = CURVES[agent.curve];
        const curved = bend(curve.p0, curve.p1, curve.p2, curve.p3, agent.t);
        const slope = tangent(curve.p0, curve.p1, curve.p2, curve.p3, agent.t);
        const len = curved.len;
        agent.v += ((160 * (slope.y / len)) / len) * step;
        const orbital = Math.sqrt(140000 / curved.radius) / len;
        const heading = Math.sign(agent.v) || 1;
        agent.v += (heading * orbital - agent.v) * 0.35 * step;
        const speed = Math.abs(agent.v) * len;
        const lean = Math.min(64, (speed * speed) / curved.radius * 0.7);
        agent.n += (lean - agent.n) * Math.min(1, 6 * step);
        agent.v *= 0.985 ** (dt / 16.67);
      }

      for (let curve = 0; curve < CURVES.length; curve += 1) {
        const pair = agents.filter((agent) => agent.curve === curve);
        const a = pair[0];
        const b = pair[1];
        if (!a || !b) continue;
        let gap = b.t - a.t;
        if (gap > 0.5) gap -= 1;
        if (gap < -0.5) gap += 1;
        const dist = Math.max(0.02, Math.abs(gap));
        const pull = Math.min(0.2, 0.003 / (dist * dist));
        const sign = Math.sign(gap) || 1;
        a.v += sign * pull * step;
        b.v -= sign * pull * step;
        a.v = Math.max(-0.9, Math.min(0.9, a.v));
        b.v = Math.max(-0.9, Math.min(0.9, b.v));
      }

      for (const agent of agents) {
        agent.t = (agent.t + agent.v * step + 1) % 1;
        agent.flash *= 0.94 ** (dt / 16.67);
      }

      for (let curve = 0; curve < CURVES.length; curve += 1) {
        const pair = agents.filter((agent) => agent.curve === curve);
        const a = pair[0];
        const b = pair[1];
        if (!a || !b) continue;
        let gap = b.t - a.t;
        if (gap > 0.5) gap -= 1;
        if (gap < -0.5) gap += 1;
        const dist = Math.abs(gap);
        const closing = gap * (b.v - a.v) < 0;
        if (dist < 0.045 && closing) {
          const swap = a.v;
          a.v = b.v;
          b.v = swap;
          const push = (0.05 - dist) / 2;
          const sign = Math.sign(gap) || 1;
          a.t = (a.t - sign * push + 1) % 1;
          b.t = (b.t + sign * push + 1) % 1;
          a.flash = 1;
          b.flash = 1;
        }
      }

      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.globalCompositeOperation = "lighter";
      ctx.lineJoin = "round";
      ctx.lineCap = "round";
      const drawPts = (pts: { x: number; y: number }[], color: string, width: number, alpha: number) => {
        if (pts.length < 2) return;
        ctx.beginPath();
        ctx.moveTo(pts[0].x, pts[0].y);
        for (let i = 1; i < pts.length; i += 1) ctx.lineTo(pts[i].x, pts[i].y);
        ctx.strokeStyle = color;
        ctx.lineWidth = width;
        ctx.globalAlpha = alpha;
        ctx.stroke();
      };
      const fog = ctx.createLinearGradient(0, canvas.height * 0.32, 0, canvas.height);
      fog.addColorStop(0, "rgba(90,0,140,0)");
      fog.addColorStop(0.7, "rgba(170,0,150,0.14)");
      fog.addColorStop(1, "rgba(255,40,180,0.2)");
      ctx.globalCompositeOperation = "source-over";
      ctx.fillStyle = fog;
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.globalCompositeOperation = "lighter";
      const ribbons = [
        { y: 0.38, amp: 0.072, phase: 0.15, glow: "#ddd6fe" },
        { y: 0.48, amp: 0.078, phase: 3.3, glow: "#c084fc" },
        { y: 0.58, amp: 0.074, phase: 0.9, glow: "#e879f9" },
        { y: 0.68, amp: 0.066, phase: 4.2, glow: "#ff4fd8" },
      ];
      for (const item of ribbons) {
        const ribbon = sineRibbon(canvas.width, canvas.height, canvas.height * item.y, canvas.height * item.amp, item.phase, now);
        ctx.shadowColor = item.glow;
        ctx.shadowBlur = 28 * dpr;
        drawPts(ribbon, item.glow, 18 * dpr, 0.2);
        ctx.shadowBlur = 8 * dpr;
        drawPts(ribbon, "#fdf4ff", 2.1 * dpr, 0.55);
        ctx.shadowBlur = 0;
        drawPts(ribbon, "#ffffff", 0.9 * dpr, 0.92);
      }
      ctx.globalAlpha = 1;
      ctx.shadowBlur = 0;
      ctx.globalCompositeOperation = "source-over";
      rafId = requestAnimationFrame(frame);
    };

    rafId = requestAnimationFrame(frame);
    return () => cancelAnimationFrame(rafId);
  }, [quiet]);

  if (quiet) return null;
  return <canvas ref={canvasRef} className="trail-particles" />;
}

function TrailParticles({ live, quiet }: { live: boolean; quiet: boolean }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const pool = useRef<Particle[]>(makePool());
  const raf = useRef(0);
  const running = useRef(false);
  const quietRef = useRef(quiet);
  quietRef.current = quiet;

  useEffect(() => {
    return () => cancelAnimationFrame(raf.current);
  }, []);

  useEffect(() => {
    if (!live || quiet) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    spawn(pool.current);
    if (running.current) return;
    running.current = true;
    let last = performance.now();

    const frame = (now: number) => {
      const ctx = canvas.getContext("2d");
      if (!ctx) return;
      const dt = Math.min(34, now - last);
      last = now;
      const parent = canvas.parentElement;
      const dpr = Math.min(2, window.devicePixelRatio || 1);
      const cssW = parent?.clientWidth ?? 0;
      const cssH = parent?.clientHeight ?? 0;
      const nextW = Math.max(1, Math.round(cssW * dpr));
      const nextH = Math.max(1, Math.round(cssH * dpr));
      if (canvas.width !== nextW || canvas.height !== nextH) {
        canvas.width = nextW;
        canvas.height = nextH;
      }

      const list = pool.current;
      let alive = false;
      if (!quietRef.current) {
        const drag = 0.9 ** (dt / 16.67);
        const step = dt / 16.67;
        for (const particle of list) {
          if (!particle.on) continue;
          particle.life -= dt;
          if (particle.life <= 0) {
            particle.on = false;
            continue;
          }
          particle.vx *= drag;
          particle.vy *= drag;
          particle.x += particle.vx * step;
          particle.y += particle.vy * step;
          alive = true;
        }
      } else {
        for (const particle of list) particle.on = false;
      }

      ctx.clearRect(0, 0, canvas.width, canvas.height);
      if (!alive) {
        running.current = false;
        return;
      }
      ctx.globalCompositeOperation = "lighter";
      for (const particle of list) {
        if (!particle.on) continue;
        const fade = particle.life / particle.max;
        const [sx, sy, scale] = project(particle.x, particle.y, canvas.width, canvas.height);
        const radius = particle.r * scale * (0.55 + 0.45 * fade);
        ctx.globalAlpha = fade * fade * 0.85;
        ctx.fillStyle = particle.color;
        ctx.beginPath();
        ctx.arc(sx, sy, radius, 0, Math.PI * 2);
        ctx.fill();
        ctx.globalAlpha = fade * 0.28;
        ctx.beginPath();
        ctx.arc(sx, sy, radius * 2.1, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.globalAlpha = 1;
      ctx.globalCompositeOperation = "source-over";
      raf.current = requestAnimationFrame(frame);
    };

    raf.current = requestAnimationFrame(frame);
  }, [live, quiet]);

  if (quiet) return null;
  return <canvas ref={canvasRef} className="trail-particles" />;
}

export const WidgetTrails = memo(function WidgetTrails({
  live,
  strong,
  quiet,
}: {
  live: boolean;
  strong: boolean;
  quiet: boolean;
}) {
  const id = useId().replace(/:/g, "");
  const motion = quiet ? (live ? " trails-ack" : "") : live ? " trails-live" : "";

  return (
    <div className={`trails-field${strong ? " trails-strong" : ""}`} aria-hidden>
      <svg className={`trails${motion}`} viewBox="0 0 800 420" preserveAspectRatio="xMidYMid slice">
        <defs>
          {PATHS.map((path) => (
            <linearGradient key={path.key} id={`${id}-${path.key}`} x1="0" y1="0" x2="800" y2="0" gradientUnits="userSpaceOnUse">
              <stop offset="0" stopColor={path.color} stopOpacity="0" />
              <stop offset="0.08" stopColor={path.color} stopOpacity="0.55" />
              <stop offset="0.5" stopColor={path.color} stopOpacity="1" />
              <stop offset="0.82" stopColor="#ffffff" stopOpacity="0.95" />
              <stop offset="1" stopColor={path.color} stopOpacity="0" />
            </linearGradient>
          ))}
          <linearGradient id={`${id}-sheen`} x1="0" y1="0" x2="1" y2="0">
            <stop offset="0" stopColor="#fff" stopOpacity="0" />
            <stop offset="0.5" stopColor="#fff" stopOpacity="0.9" />
            <stop offset="1" stopColor="#fff" stopOpacity="0" />
          </linearGradient>
          <filter id={`${id}-flow-blur`} x="-30%" y="-40%" width="160%" height="180%">
            <feGaussianBlur stdDeviation="1.1" />
          </filter>
          <mask id={`${id}-shape`}>
            <rect width="800" height="420" fill="#000" />
            {PATHS.map((path) => (
              <path key={path.key} d={path.halo} fill="#fff" />
            ))}
          </mask>
        </defs>
        <g className="trail-ink">
          {PATHS.map((path) => (
            <g key={path.key} fill={`url(#${id}-${path.key})`}>
              <path d={path.halo} opacity="0" />
              <path d={path.body} opacity="0" />
              <path d={path.flow} fill="none" stroke={path.color} strokeWidth="4.2" strokeLinecap="round" opacity="0" filter={`url(#${id}-flow-blur)`} />
              <path d={path.flow} fill="none" stroke={path.color} strokeWidth="1.7" strokeLinecap="round" opacity="0" />
              <path d={path.flow} fill="none" stroke="#ffffff" strokeWidth="0.7" strokeLinecap="round" opacity="0" />
            </g>
          ))}
          <rect className="trail-sheen" x="-280" y="0" width="360" height="420" fill={`url(#${id}-sheen)`} mask={`url(#${id}-shape)`} />
        </g>
        <g className="trail-flow" fill="none" strokeLinecap="round" opacity="0">
          {PATHS.map((path, index) => {
            const effect = (["spark", "return", "twin", "swell"] as const)[index % 4];
            const flow = effect === "spark" ? 2200 + index * 140 : effect === "return" ? 3600 + index * 180 : effect === "twin" ? 4800 : 7000 + index * 220;
            return (
              <path
                key={path.key}
                className={`trail-energy trail-fx-${effect}`}
                d={path.flow}
                stroke={effect === "swell" || effect === "return" ? path.color : "#ffffff"}
                strokeWidth={effect === "swell" ? 2.5 : effect === "return" ? 1.5 : 1.05}
                filter={effect === "swell" ? `url(#${id}-flow-blur)` : undefined}
                style={{ ["--flow" as string]: `${flow}ms`, ["--flow-delay" as string]: `${-index * 0.6}s` }}
              />
            );
          })}
        </g>
      </svg>
      <FlowParticles quiet={quiet} />
      <TrailParticles live={live} quiet={quiet} />
    </div>
  );
});
