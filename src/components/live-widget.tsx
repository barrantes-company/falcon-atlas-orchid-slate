import { useEffect, useRef, useState } from "react";
import { ArrowUpRight, Settings } from "lucide-react";
import { closePush, deliverPush, disablePush, enablePush, restorePush, type PushStatus } from "@/lib/push-client";
import { DEMO_NOTES, DEMO_SEED, LINK, linkDetail, linkLabel, type Notice } from "@/lib/widget-demo";
import { WidgetClock } from "@/components/widget-clock";
import { WidgetTrails } from "@/components/widget-trails";

const PUSH_HINT: Record<PushStatus, string> = {
  on: "Solo avisa si no estás mirando la app",
  off: "Aviso del sistema al llegar un mensaje real",
  denied: "El navegador bloqueó los avisos",
  unsupported: "Este navegador no los permite",
};

function usePrefersReducedMotion() {
  const [reduced, setReduced] = useState(false);
  useEffect(() => {
    const media = window.matchMedia("(prefers-reduced-motion: reduce)");
    const apply = () => setReduced(media.matches);
    apply();
    media.addEventListener("change", apply);
    return () => media.removeEventListener("change", apply);
  }, []);
  return reduced;
}

export function LiveWidget() {
  const systemReduced = usePrefersReducedMotion();
  const [seen, setSeen] = useState(false);
  const [focus, setFocus] = useState<"mensajes" | "llamadas" | null>(null);
  const [demoOn, setDemoOn] = useState(true);
  const [notices, setNotices] = useState<Notice[]>(DEMO_SEED);
  const [burst, setBurst] = useState(false);
  const [freshId, setFreshId] = useState<string | null>(null);
  const [peekId, setPeekId] = useState<string | null>(null);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [showClock, setShowClock] = useState(true);
  const [showTrails, setShowTrails] = useState(true);
  const [strongTrails, setStrongTrails] = useState(false);
  const [reducedMode, setReducedMode] = useState(false);
  const [allowMessages, setAllowMessages] = useState(true);
  const [allowCalls, setAllowCalls] = useState(true);
  const [preview, setPreview] = useState(true);
  const [flash, setFlash] = useState(true);
  const [pushOn, setPushOn] = useState(false);
  const [pushStatus, setPushStatus] = useState<PushStatus>("off");
  const probe = useRef(0);
  const pushRef = useRef(false);
  const previewRef = useRef(true);
  const demoRef = useRef(true);
  pushRef.current = pushOn;
  previewRef.current = preview;
  demoRef.current = demoOn;
  const quiet = reducedMode || systemReduced;

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key !== "Escape") return;
      setSettingsOpen(false);
      setFocus(null);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

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
    const id = window.setTimeout(() => setBurst(false), 360);
    return () => window.clearTimeout(id);
  }, [burst]);

  function arrive(notice: Notice) {
    setNotices((list) => [notice, ...list]);
    setFreshId(notice.id);
    setPeekId(notice.id);
    if (flash) setBurst(true);
    if (!demoRef.current && pushRef.current && notice.kind === "mensaje") {
      void deliverPush({
        title: notice.name,
        body: previewRef.current ? notice.line : "Mensaje nuevo",
        tag: `mensaje:${notice.name}`,
      });
    }
  }

  function simulate() {
    const next = DEMO_NOTES[probe.current % DEMO_NOTES.length];
    probe.current += 1;
    arrive({
      id: `demo-live-${probe.current}`,
      kind: "mensaje",
      name: next.name,
      when: "ahora",
      line: next.line,
      source: "demo",
    });
  }

  function setDemo(on: boolean) {
    setDemoOn(on);
    setFocus(null);
    setFreshId(null);
    setPeekId(null);
    setBurst(false);
    setNotices(on ? DEMO_SEED : []);
  }

  function dismiss(id: string) {
    setNotices((list) => {
      const item = list.find((notice) => notice.id === id);
      if (item?.kind === "mensaje" && item.source !== "demo") void closePush(`mensaje:${item.name}`);
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
  const status = linkLabel(LINK, demoOn);

  return (
    <div className="flex w-full flex-col items-center">
      <article
        className={`capsule widget-frame relative flex w-full flex-col overflow-hidden rounded-capsule border border-white/15 bg-obsidian px-5 pt-5 pb-3 sm:px-7${quiet ? " motion-quiet" : ""}`}
        aria-label="Widget de mensajes"
      >
        {showTrails ? <WidgetTrails live={burst && flash} strong={strongTrails} quiet={quiet} /> : null}
        <div aria-hidden className="base-glow pointer-events-none absolute inset-x-0 bottom-0 h-36" />
        <button
          type="button"
          aria-label={seen ? "Visto" : "Abrir"}
          onClick={openChat}
          className="hit absolute top-2 left-2 z-20 grid size-11 place-items-center text-white/45"
        >
          <ArrowUpRight className="size-4" strokeWidth={1.75} />
        </button>
        <button
          type="button"
          aria-label="Ajustes"
          aria-expanded={settingsOpen}
          aria-pressed={settingsOpen}
          onClick={() => setSettingsOpen((value) => !value)}
          className={`hit absolute top-2 right-2 z-20 grid size-11 place-items-center ${settingsOpen ? "text-white" : "text-white/45"}`}
        >
          <Settings className="size-4" strokeWidth={1.75} />
        </button>

        <WidgetClock showClock={showClock} />

        <div className="relative z-10 mt-2 flex items-center justify-center gap-3 text-[13px] leading-none" aria-live="polite">
          {allowMessages ? (
            <button
              type="button"
              aria-pressed={focus === "mensajes"}
              onClick={() => setFocus((value) => (value === "mensajes" ? null : "mensajes"))}
              className="hit inline-flex h-11 items-center gap-1.5 leading-none text-white/55"
            >
              <span className={`font-medium tabular-nums leading-none text-white/90 ${burst && !quiet ? "count-live" : ""}`}>
                {messages}
              </span>
              {messages === 1 ? "mensaje" : "mensajes"}
            </button>
          ) : null}
          {allowMessages && allowCalls ? <span className="text-white/30" aria-hidden>·</span> : null}
          {allowCalls ? (
            <button
              type="button"
              aria-pressed={focus === "llamadas"}
              onClick={() => setFocus((value) => (value === "llamadas" ? null : "llamadas"))}
              className="hit inline-flex h-11 items-center gap-1.5 leading-none text-white/55"
            >
              <span className="font-medium tabular-nums leading-none text-white/90">{calls}</span>
              {calls === 1 ? "llamada" : "llamadas"}
            </button>
          ) : null}
        </div>

        <p role="status" className="status-line relative z-10">
          <span className={status === "Error de conexión" ? "status-error" : undefined}>{status}</span>
          <span aria-hidden> · </span>
          <span>{linkDetail(LINK, demoOn)}</span>
        </p>

        {!settingsOpen && !focus && peek && peek.kind === "mensaje" && allowMessages ? (
          <div className="relative z-10 mt-3">
            <NoteCard item={peek} fresh quiet={quiet} onDismiss={() => dismiss(peek.id)} preview={preview} />
          </div>
        ) : null}

        {!settingsOpen && focus && tray.length > 0 ? (
          <ul className="relative z-10 mt-3 grid gap-1.5">
            {tray.map((item) => (
              <li key={item.id}>
                <NoteCard item={item} fresh={item.id === freshId} quiet={quiet} onDismiss={() => dismiss(item.id)} preview={preview} />
              </li>
            ))}
          </ul>
        ) : null}
      </article>

      {settingsOpen ? (
        <div className="mt-1 grid w-full gap-1.5">
          <Switch on={demoOn} label="Demo" hint="Muestra avisos de ejemplo. No es el canal real." onToggle={() => setDemo(!demoOn)} />
          <Switch on={showClock} label="Reloj" hint="La hora grande" onToggle={() => setShowClock((value) => !value)} />
          <Switch on={showTrails} label="Estelas" hint="Cintas de luz violeta que se cruzan" onToggle={() => setShowTrails((value) => !value)} />
          {showTrails ? (
            <Switch on={strongTrails} label="Intensidad" hint="La corriente se ve con más luz" onToggle={() => setStrongTrails((value) => !value)} />
          ) : null}
          <Switch on={reducedMode} label="Modo reducido" hint="Sin desplazamientos ni ráfagas" onToggle={() => setReducedMode((value) => !value)} />
          <Switch on={flash} label="Destello" hint="Un brillo y unas motas de luz al llegar un aviso" onToggle={() => setFlash((value) => !value)} />
          <Switch on={allowMessages} label="Mensajes" hint="Muestra el contador y la bandeja" onToggle={() => setAllowMessages((value) => !value)} />
          <Switch on={allowCalls} label="Llamadas" hint="Muestra las llamadas perdidas" onToggle={() => setAllowCalls((value) => !value)} />
          <Switch on={preview} label="Vista previa" hint="El texto del aviso, no solo el nombre" onToggle={() => setPreview((value) => !value)} />
          <Switch on={pushOn} label="Push" hint={PUSH_HINT[pushStatus]} onToggle={() => void togglePush()} />
          {demoOn ? (
            <button type="button" onClick={simulate} className="hit min-h-11 rounded-2xl bg-panel px-3 text-left text-sm font-semibold">
              Probar aviso
              <span className="mt-0.5 block text-xs font-normal text-mist">Dispara un aviso de muestra, una sola vez</span>
            </button>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}

function NoteCard({
  item,
  fresh,
  quiet,
  preview,
  onDismiss,
}: {
  item: Notice;
  fresh: boolean;
  quiet: boolean;
  preview: boolean;
  onDismiss: () => void;
}) {
  return (
    <div className={`${quiet ? "" : "rise"} flex items-center gap-3 border-t border-line py-2.5 ${fresh ? "note-fresh border-transparent" : ""}`}>
      <span className="note-mark text-ink" aria-hidden>
        {item.name.slice(0, 1)}
      </span>
      <span className="min-w-0 flex-1 text-left">
        <span className="flex items-baseline justify-between gap-2">
          <span className="flex min-w-0 items-baseline gap-2">
            {fresh ? <span className="note-dot" aria-hidden /> : null}
            <span className="truncate text-sm font-medium tracking-wide">{item.name}</span>
            <span className="shrink-0 text-[11px] text-mist">{item.kind}</span>
          </span>
          <span className="shrink-0 text-[11px] tracking-wide text-mist">{item.when}</span>
        </span>
        {preview ? <span className="mt-0.5 block truncate text-[13px] text-mist">{item.line}</span> : <span className="sr-only">{item.line}</span>}
      </span>
      <button
        type="button"
        aria-label={`Descartar ${item.kind} de ${item.name}`}
        onClick={onDismiss}
        className="hit grid size-11 shrink-0 place-items-center rounded-full text-base leading-none text-mist/70"
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
