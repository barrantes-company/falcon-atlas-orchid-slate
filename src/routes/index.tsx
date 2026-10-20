import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Clipboard, FileStack, LayoutGrid } from "lucide-react";
import { LiveWidget } from "@/components/live-widget";

export const Route = createFileRoute("/")({ component: Home });

type Panel = "widget" | "archivos" | "portapapeles";

const MENU: { id: Panel; label: string; icon: typeof LayoutGrid }[] = [
  { id: "widget", label: "Widget", icon: LayoutGrid },
  { id: "archivos", label: "Archivos", icon: FileStack },
  { id: "portapapeles", label: "Portapapeles", icon: Clipboard },
];

function Home() {
  const [panel, setPanel] = useState<Panel>("widget");

  return (
    <main className="grid min-h-dvh bg-void text-ink md:grid-cols-[15rem_1fr]">
      <nav className="flex gap-2 overflow-x-auto border-b border-line px-3 py-3 md:flex-col md:overflow-visible md:border-r md:border-b-0 md:px-4 md:py-6">
        <p className="hidden px-2 pb-3 text-xs font-bold tracking-widest text-mist md:block">MENÚ</p>
        {MENU.map((item) => {
          const Icon = item.icon;
          const active = panel === item.id;
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => setPanel(item.id)}
              className={`flex min-h-11 shrink-0 items-center justify-center gap-2 rounded-2xl px-3 text-sm font-semibold whitespace-nowrap md:w-full md:justify-start ${
                active ? "bg-panel text-ink" : "text-mist"
              }`}
            >
              <Icon className="size-4" aria-hidden />
              {item.label}
            </button>
          );
        })}
      </nav>

      <section className="flex min-h-dvh min-w-0 items-start justify-center px-4 pt-8 pb-10 md:px-10 md:pt-16">
        {panel === "widget" ? (
          <div className="flex w-full max-w-sm flex-col items-center gap-5">
            <LiveWidget />
          </div>
        ) : null}
        {panel === "archivos" ? (
          <List
            title="Archivos"
            note="DEMO · lista de muestra. No son archivos del dispositivo."
            rows={["Contrato.pdf · listo", "Notas.m4a · listo", "Foto-0841.jpg · en tránsito"]}
          />
        ) : null}
        {panel === "portapapeles" ? (
          <List
            title="Portapapeles"
            note="DEMO · lista de muestra. No es el portapapeles del sistema."
            rows={["Texto copiado hace 2 min", "Enlace copiado hace 18 min", "Código de acceso hace 1 h"]}
          />
        ) : null}
      </section>
    </main>
  );
}

function List({ title, note, rows }: { title: string; note: string; rows: string[] }) {
  return (
    <div className="w-full max-w-md">
      <h1 className="text-2xl font-extrabold tracking-tight">{title}</h1>
      <p className="mt-2 text-xs text-mist">{note}</p>
      <ul className="mt-4 grid gap-2">
        {rows.map((row) => (
          <li key={row} className="rounded-2xl bg-panel px-4 py-3 text-base font-medium">
            {row}
          </li>
        ))}
      </ul>
    </div>
  );
}
