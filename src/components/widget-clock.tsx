import { useEffect, useState } from "react";

const DAYS = ["domingo", "lunes", "martes", "miércoles", "jueves", "viernes", "sábado"];
const MONTHS = ["ene", "feb", "mar", "abr", "may", "jun", "jul", "ago", "sep", "oct", "nov", "dic"];

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
  const dayIndex = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].indexOf(get("weekday"));
  const monthIndex = Number(get("month")) - 1;
  return {
    clock: `${get("hour").padStart(2, "0")}:${get("minute").padStart(2, "0")}`,
    date: `${DAYS[dayIndex] ?? get("weekday")} ${get("day")} ${MONTHS[monthIndex] ?? ""}`,
  };
}

export function WidgetClock({ showClock }: { showClock: boolean }) {
  const [parts, setParts] = useState(() => limaParts(new Date()));

  useEffect(() => {
    let timer = 0;
    const tick = () => {
      const now = new Date();
      setParts(limaParts(now));
      const wait = 60_000 - (now.getSeconds() * 1000 + now.getMilliseconds()) + 40;
      timer = window.setTimeout(tick, wait);
    };
    tick();
    return () => window.clearTimeout(timer);
  }, []);

  return (
    <>
      {showClock ? (
        <p suppressHydrationWarning className="clock-face relative z-10 mt-3 text-center font-medium tracking-[-0.04em] text-white tabular-nums">
          {parts.clock}
        </p>
      ) : (
        <p className="sr-only">Reloj oculto</p>
      )}
      <p suppressHydrationWarning className="relative z-10 mt-1 text-center text-sm text-white/80 lowercase">
        {parts.date}
      </p>
    </>
  );
}
