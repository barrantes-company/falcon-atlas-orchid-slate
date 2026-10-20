import { useEffect, useRef, useState, type CSSProperties } from "react";
import { ArrowUpRight, Settings } from "lucide-react";
import { closePush, deliverPush, disablePush, enablePush, restorePush, type PushStatus } from "@/lib/push-client";

const DAYS = ["domingo", "lunes", "martes", "miércoles", "jueves", "viernes", "sábado"];
const MONTHS = ["ene", "feb", "mar", "abr", "may", "jun", "jul", "ago", "sep", "oct", "nov", "dic"];

const NOCTURNO = {
  vars: {
    "--color-obsidian": "#000000",
    "--color-panel": "#141414",
    "--color-ink": "#ffffff",
    "--color-mist": "#8f8f8f",
    "--color-ion": "#ffffff",
    "--color-line": "#2a2a2a",
    "--color-gilt": "#ffffff",
  },
  trails: ["#3ecfff", "#e7f8ff", "#79b7ff", "#ffffff", "#ff4fd8", "#ff9ad4", "#ff3d78", "#ff3b42", "#ffc4a0"],
} as const;

const NOTES = [
  { name: "Ana", line: "Te paso el archivo" },
  { name: "Luis", line: "Estoy en la sala" },
  { name: "Claudia", line: "Listo el enlace" },
];

type Notice = {
  id: string;
  kind: "mensaje" | "llamada";
  name: string;
  when: string;
  line: string;
};

const SEED: Notice[] = [
  { id: "m1", kind: "mensaje", name: "Ana", when: "ahora", line: "Te paso el archivo" },
  { id: "m2", kind: "mensaje", name: "Luis", when: "2 min", line: "Estoy en la sala" },
  { id: "m3", kind: "mensaje", name: "Claudia", when: "8 min", line: "Listo el enlace" },
  { id: "c1", kind: "llamada", name: "Ana", when: "ahora", line: "Llamada perdida" },
];

const TRAIL_COUNT = 16;

function trailPath(y: number, index: number, tick: number) {
  const t = tick / 24;
  const sway = Math.sin(t + index * 0.45) * 22;
  const curl = 78 + Math.cos(t * 0.7 + index * 0.2) * 6;
  const y0 = y + sway;
  const y1 = y + sway * 0.35;
  const y2 = y - curl * 0.28 + sway;
  const y3 = y - curl;
  return `M-30 ${y0} C 180 ${y1}, 460 ${y2}, 680 ${y3} S 900 ${y3 - 12}, 1040 ${y3 + 6}`;
}

function limaParts(now: Date) {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: "America/Lima",
    weekday: "short",
    day: "numeric",
    month: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  }).formatToParts(now);
  const get = (type: Intl.DateTimeFormatPartTypes) => parts.find((part) => part.type === type)?.value ?? "";
  const weekday = get("weekday");
  const dayIndex = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].indexOf(weekday);
  const monthIndex = Number(get("month")) - 1;
  const hour = get("hour").padStart(2, "0");
  const minute = get("minute").padStart(2, "0");
  return {
    clock: `${hour}:${minute}`,
    date: `${DAYS[dayIndex] ?? weekday} ${get("day")} ${MONTHS[monthIndex] ?? ""}`,
  };
}

const PUSH_HINT: Record<PushStatus, string> = {
  on: "Solo avisa si no estás mirando la app",
  off: "Aviso del sistema al llegar un mensaje",
  denied: "El navegador bloqueó los avisos",
  unsupported: "Este navegador no los permite",
};

export function LiveWidget() {
  const [now, setNow] = useState(() => new Date());
  const online = true;
  const [seen, setSeen] = useState(false);
  const [focus, setFocus] = useState<"mensajes" | "llamadas" | null>(null);
  const [notices, setNotices] = useState<Notice[]>(SEED);
  const [tick, setTick] = useState(0);
  const [burst, setBurst] = useState(false);
  const [freshId, setFreshId] = useState<string | null>(null);
  const [peekId, setPeekId] = useState<string | null>(null);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [allowMessages, setAllowMessages] = useState(true);
  const [allowCalls, setAllowCalls] = useState(true);
  const [preview, setPreview] = useState(true);
  const [flash, setFlash] = useState(true);
  const [pushOn, setPushOn] = useState(false);
  const [pushStatus, setPushStatus] = useState<PushStatus>("off");
  const seq = useRef(5);
  const pushRef = useRef(false);
  const previewRef = useRef(true);
  pushRef.current = pushOn;
  previewRef.current = preview;

  useEffect(() => {
    if (!("serviceWorker" in navigator)) return;
    const onMessage = (event: MessageEvent) => {
      if (event.data?.type !== "open-mensajes") return;
      setSettingsOpen(false);
      setFocus("mensajes");
    };
    navigator.serviceWorker.addEventListener("message", onMessage);
    return () => navigator.serviceWorker.removeEventListener("message", onMessage);
  }, []);

  useEffect(() => {
    void restorePush().then((on) => {
      if (!on) return;
      setPushOn(true);
      setPushStatus("on");
    });
  }, []);

  useEffect(() => {
    const updateClock = () => setNow(new Date());
    updateClock();
    const clockId = window.setInterval(updateClock, 1000);
    const motionId = window.setInterval(() => setTick((value) => value + 1), 80);
    return () => {
      window.clearInterval(clockId);
      window.clearInterval(motionId);
    };
  }, []);

  useEffect(() => {
    if (!seen) return;
    const id = window.setTimeout(() => setSeen(false), 900);
    return () => window.clearTimeout(id);
  }, [seen]);

  useEffect(() => {
    if (!peekId) return;
    const id = window.setTimeout(() => setPeekId(null), 2400);
    return () => window.clearTimeout(id);
  }, [peekId]);

  useEffect(() => {
    if (!burst) return;
    const id = window.setTimeout(() => setBurst(false), 700);
    return () => window.clearTimeout(id);
  }, [burst]);

  useEffect(() => {
    if (!online || !allowMessages) return;
    let timer = 0;
    const arrive = () => {
      const next = NOTES[seq.current % NOTES.length];
      const id = `m${seq.current}`;
      seq.current += 1;
      setNotices((list) => [{ id, kind: "mensaje", name: next.name, when: "ahora", line: next.line }, ...list]);
      setFreshId(id);
      setPeekId(id);
      if (flash) setBurst(true);
      if (pushRef.current) {
        void deliverPush({
          title: next.name,
          body: previewRef.current ? next.line : "Mensaje nuevo",
          tag: `mensaje:${next.name}`,
        });
      }
      timer = window.setTimeout(arrive, 9000);
    };
    timer = window.setTimeout(arrive, 4500);
    return () => window.clearTimeout(timer);
  }, [online, allowMessages, flash]);

  function dismiss(id: string) {
    setNotices((list) => {
      const item = list.find((notice) => notice.id === id);
      if (item?.kind === "mensaje") void closePush(`mensaje:${item.name}`);
      return list.filter((notice) => notice.id !== id);
    });
    setFreshId((current) => (current === id ? null : current));
    setPeekId((current) => (current === id ? null : current));
  }

  function openChat() {
    setNotices([]);
    setFocus(null);
    setFreshId(null);
    setPeekId(null);
    setSeen(true);
    void closePush();
  }

  async function togglePush() {
    if (pushOn) {
      disablePush();
      setPushOn(false);
      setPushStatus("off");
      return;
    }
    const status = await enablePush();
    setPushStatus(status);
    setPushOn(status === "on");
  }

  const messages = allowMessages ? notices.filter((item) => item.kind === "mensaje").length : 0;
  const calls = allowCalls ? notices.filter((item) => item.kind === "llamada").length : 0;
  const tray = notices
    .filter((item) =>
      focus === "llamadas" ? allowCalls && item.kind === "llamada" : allowMessages && focus === "mensajes" && item.kind === "mensaje",
    )
    .slice(0, focus === "llamadas" ? undefined : 3);

  const peek = notices.find((item) => item.id === peekId) ?? null;
  const { clock, date } = limaParts(now);

  return (
    <div className="flex w-full flex-col items-center">
    <article
      className="capsule widget-frame relative flex w-full flex-col overflow-hidden rounded-capsule border border-white/15 bg-obsidian px-7 pt-5 pb-3"
      style={NOCTURNO.vars as CSSProperties}
    >
      <svg className={`trails${burst ? " trails-live" : ""}`} viewBox="0 0 800 420" preserveAspectRatio="none" aria-hidden>
        <defs>
          <linearGradient id="trail-fade" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0" stopColor="#fff" stopOpacity="0" />
            <stop offset="0.08" stopColor="#fff" stopOpacity="1" />
            <stop offset="0.82" stopColor="#fff" stopOpacity="0.7" />
            <stop offset="1" stopColor="#fff" stopOpacity="0" />
          </linearGradient>
          <mask id="trail-mask">
            <rect width="800" height="420" fill="url(#trail-fade)" />
          </mask>
        </defs>
        <g fill="none" strokeLinecap="round" mask="url(#trail-mask)">
          {Array.from({ length: TRAIL_COUNT }, (_, index) => (
            <path
              key={index}
              d={trailPath(120 + index * 13, index, tick)}
              stroke={NOCTURNO.trails[index % NOCTURNO.trails.length]}
              strokeWidth={index % 3 === 0 ? 4.5 : 2.5}
              opacity={index % 4 === 0 ? 0.82 : 0.55}
              vectorEffect="non-scaling-stroke"
            />
          ))}
        </g>
      </svg>
      <div aria-hidden className="base-glow pointer-events-none absolute inset-x-0 bottom-0 h-36" />
      <button
        type="button"
        aria-label={seen ? "Visto" : "Abrir"}
        disabled={!online}
        onClick={openChat}
        className="hit absolute top-2 left-2 z-20 grid size-11 place-items-center text-white/45 disabled:opacity-40"
      >
        <ArrowUpRight className="size-4" strokeWidth={1.75} />
      </button>
      <button
        type="button"
        aria-label="Ajustes"
        aria-pressed={settingsOpen}
        onClick={() => setSettingsOpen((value) => !value)}
        className={`hit absolute top-2 right-2 z-20 grid size-11 place-items-center ${settingsOpen ? "text-white" : "text-white/45"}`}
      >
        <Settings className="size-4" strokeWidth={1.75} />
      </button>

      <p suppressHydrationWarning className="clock-face relative z-10 mt-3 text-center text-8xl font-medium tracking-[-0.04em] text-white tabular-nums">
        {clock}
      </p>
      <p suppressHydrationWarning className="relative z-10 mt-1 text-center text-sm text-white/80 lowercase">
        {date}
      </p>

      <div className="relative z-10 mt-2 flex items-center justify-center gap-3 text-[13px] leading-none">
        {allowMessages ? (
          <button
            type="button"
            disabled={!online}
            aria-pressed={focus === "mensajes"}
            onClick={() => setFocus((value) => (value === "mensajes" ? null : "mensajes"))}
            className="hit inline-flex h-9 items-center gap-1.5 leading-none text-white/55 disabled:opacity-40"
          >
            <span className={`font-medium tabular-nums leading-none ${focus === "mensajes" ? "text-white" : "text-white/90"}${burst ? " count-live" : ""}`}>
              {messages}
            </span>
            {messages === 1 ? "mensaje" : "mensajes"}
          </button>
        ) : null}
        {allowMessages && allowCalls ? <span className="text-white/30" aria-hidden>·</span> : null}
        {allowCalls ? (
          <button
            type="button"
            disabled={!online}
            aria-pressed={focus === "llamadas"}
            onClick={() => setFocus((value) => (value === "llamadas" ? null : "llamadas"))}
            className="hit inline-flex h-9 items-center gap-1.5 leading-none text-white/55 disabled:opacity-40"
          >
            <span className={`font-medium tabular-nums leading-none ${focus === "llamadas" ? "text-white" : "text-white/90"}`}>{calls}</span>
            {calls === 1 ? "llamada" : "llamadas"}
          </button>
        ) : null}
      </div>

      {online && !settingsOpen && !focus && peek && peek.kind === "mensaje" ? (
        <div className="relative z-10 mt-3">
          <NoteCard item={peek} fresh onDismiss={() => dismiss(peek.id)} preview={preview} />
        </div>
      ) : null}

      {online && !settingsOpen && focus && tray.length > 0 ? (
        <div className="relative z-10 mt-3 grid gap-1.5">
          {tray.map((item) => (
            <NoteCard key={item.id} item={item} fresh={item.id === freshId} onDismiss={() => dismiss(item.id)} preview={preview} />
          ))}
        </div>
      ) : null}
    </article>

    {settingsOpen ? (
      <div className="mt-1 grid w-full gap-1.5">
        <Switch on={pushOn} label="Push" hint={PUSH_HINT[pushStatus]} onToggle={() => void togglePush()} />
        <Switch on={allowMessages} label="Mensajes" hint="Muestra el contador y la bandeja" onToggle={() => setAllowMessages((value) => !value)} />
        <Switch on={allowCalls} label="Llamadas" hint="Muestra las llamadas perdidas" onToggle={() => setAllowCalls((value) => !value)} />
        <Switch on={preview} label="Vista previa" hint="El texto del aviso, no solo el nombre" onToggle={() => setPreview((value) => !value)} />
        <Switch on={flash} label="Destello" hint="Las estelas se encienden al llegar" onToggle={() => setFlash((value) => !value)} />
      </div>
    ) : null}
    </div>
  );
}

function NoteCard({
  item,
  fresh,
  preview,
  onDismiss,
}: {
  item: Notice;
  fresh: boolean;
  preview: boolean;
  onDismiss: () => void;
}) {
  return (
    <div className={`rise flex items-center gap-3 border-t border-line py-2.5 ${fresh ? "note-fresh border-transparent" : ""}`}>
      <span className="note-mark text-ink">
        {item.name.slice(0, 1)}
      </span>
      <span className="min-w-0 flex-1 text-left">
        <span className="flex items-center justify-between gap-2">
          <span className="flex min-w-0 items-center gap-2">
            {fresh ? <span className="note-dot" aria-hidden /> : null}
            <span className="truncate text-sm font-medium tracking-wide">{item.name}</span>
          </span>
          <span className="text-[11px] tracking-wide text-mist">{item.when}</span>
        </span>
        {preview ? <span className="mt-0.5 block truncate text-[13px] text-mist">{item.line}</span> : null}
      </span>
      <button
        type="button"
        aria-label={`Descartar aviso de ${item.name}`}
        onClick={onDismiss}
        className="hit grid size-8 shrink-0 place-items-center rounded-full text-base leading-none text-mist/70"
      >
        ×
      </button>
    </div>
  );
}

function Switch({ on, label, hint, onToggle }: { on: boolean; label: string; hint: string; onToggle: () => void }) {
  return (
    <button type="button" role="switch" aria-checked={on} onClick={onToggle} className="flex min-h-11 w-full items-center justify-between gap-3 rounded-2xl bg-panel px-3 py-2 text-left">
      <span>
        <span className="block text-sm font-semibold">{label}</span>
        <span className="block text-xs text-mist">{hint}</span>
      </span>
      <span className={`switch${on ? " switch-on" : ""}`} aria-hidden />
    </button>
  );
}
