export type LinkState = "CONNECTED" | "CONNECTING" | "OFFLINE" | "ERROR" | "UNKNOWN";

export type Notice = {
  id: string;
  kind: "mensaje" | "llamada";
  name: string;
  when: string;
  line: string;
  source: "demo";
};

/** Única capa de muestra. Una fuente real debe sustituir este módulo, no la interfaz. */
export const DEMO_NOTES = [
  { name: "Ana", line: "Te paso el archivo" },
  { name: "Luis", line: "Estoy en la sala" },
  { name: "Claudia", line: "Listo el enlace" },
] as const;

export const DEMO_SEED: Notice[] = [
  { id: "demo-m1", kind: "mensaje", name: "Ana", when: "ahora", line: "Te paso el archivo", source: "demo" },
  { id: "demo-m2", kind: "mensaje", name: "Luis", when: "2 min", line: "Estoy en la sala", source: "demo" },
  { id: "demo-m3", kind: "mensaje", name: "Claudia", when: "8 min", line: "Listo el enlace", source: "demo" },
  { id: "demo-c1", kind: "llamada", name: "Ana", when: "ahora", line: "Llamada perdida", source: "demo" },
];

/** No hay canal conectado. No cambiar esto a CONNECTED sin una fuente real. */
export const LINK: LinkState = "UNKNOWN";

export function linkLabel(state: LinkState, demo: boolean): string {
  if (demo) return "DEMO";
  switch (state) {
    case "CONNECTED":
      return "En línea";
    case "CONNECTING":
      return "Conectando";
    case "OFFLINE":
      return "Sin conexión";
    case "ERROR":
      return "Error de conexión";
    default:
      return "Sin conexión real";
  }
}

export function linkDetail(state: LinkState, demo: boolean): string {
  if (demo) return "Muestra. No es actividad real.";
  switch (state) {
    case "CONNECTED":
      return "Canal confirmado.";
    case "CONNECTING":
      return "Comprobando el canal.";
    case "OFFLINE":
      return "El canal no responde.";
    case "ERROR":
      return "No se pudo confirmar el canal.";
    default:
      return "Sin telemetría conectada.";
  }
}
