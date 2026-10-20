import { i as __toESM } from "../_runtime.mjs";
import { K as require_react, b as require_jsx_runtime } from "../_libs/@tanstack/react-router+[...].mjs";
import { a as Clipboard, i as FileStack, n as Settings, o as ArrowUpRight, r as LayoutGrid } from "../_libs/lucide-react.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/routes-VqFdj5bX.js
var import_react = /* @__PURE__ */ __toESM(require_react());
var import_jsx_runtime = require_jsx_runtime();
var KEY = "enlace-push";
function pushSaved() {
	try {
		return localStorage.getItem(KEY) === "1";
	} catch {
		return false;
	}
}
function remember(on) {
	try {
		localStorage.setItem(KEY, on ? "1" : "0");
	} catch {}
}
async function enablePush() {
	if (typeof Notification === "undefined" || !("serviceWorker" in navigator)) return "unsupported";
	let permission = Notification.permission;
	if (permission === "default") permission = await Notification.requestPermission();
	if (permission !== "granted") {
		remember(false);
		return "denied";
	}
	try {
		await navigator.serviceWorker.register("/push-sw.js");
	} catch {
		remember(false);
		return "unsupported";
	}
	remember(true);
	return "on";
}
function disablePush() {
	remember(false);
}
async function restorePush() {
	if (!pushSaved() || typeof Notification === "undefined" || Notification.permission !== "granted") return false;
	if (!("serviceWorker" in navigator)) return false;
	try {
		await navigator.serviceWorker.register("/push-sw.js");
		return true;
	} catch {
		return false;
	}
}
async function deliverPush(note) {
	if (document.visibilityState === "visible") return;
	if (typeof Notification === "undefined" || Notification.permission !== "granted") return;
	try {
		if ("serviceWorker" in navigator) {
			await (await navigator.serviceWorker.ready).showNotification(note.title, {
				body: note.body,
				tag: note.tag,
				icon: "/mark.png",
				silent: true
			});
			return;
		}
	} catch {}
	try {
		new Notification(note.title, {
			body: note.body,
			tag: note.tag,
			silent: true
		});
	} catch {}
}
async function closePush(tag) {
	if (!("serviceWorker" in navigator)) return;
	const list = await (await navigator.serviceWorker.getRegistration())?.getNotifications(tag ? { tag } : void 0) ?? [];
	for (const note of list) note.close();
}
var DAYS = [
	"domingo",
	"lunes",
	"martes",
	"miércoles",
	"jueves",
	"viernes",
	"sábado"
];
var MONTHS = [
	"ene",
	"feb",
	"mar",
	"abr",
	"may",
	"jun",
	"jul",
	"ago",
	"sep",
	"oct",
	"nov",
	"dic"
];
var NOCTURNO = {
	vars: {
		"--color-obsidian": "#000000",
		"--color-panel": "#141414",
		"--color-ink": "#ffffff",
		"--color-mist": "#8f8f8f",
		"--color-ion": "#ffffff",
		"--color-line": "#2a2a2a",
		"--color-gilt": "#ffffff"
	},
	trails: [
		"#3ecfff",
		"#e7f8ff",
		"#79b7ff",
		"#ffffff",
		"#ff4fd8",
		"#ff9ad4",
		"#ff3d78",
		"#ff3b42",
		"#ffc4a0"
	]
};
var NOTES = [
	{
		name: "Ana",
		line: "Te paso el archivo"
	},
	{
		name: "Luis",
		line: "Estoy en la sala"
	},
	{
		name: "Claudia",
		line: "Listo el enlace"
	}
];
var SEED = [
	{
		id: "m1",
		kind: "mensaje",
		name: "Ana",
		when: "ahora",
		line: "Te paso el archivo"
	},
	{
		id: "m2",
		kind: "mensaje",
		name: "Luis",
		when: "2 min",
		line: "Estoy en la sala"
	},
	{
		id: "m3",
		kind: "mensaje",
		name: "Claudia",
		when: "8 min",
		line: "Listo el enlace"
	},
	{
		id: "c1",
		kind: "llamada",
		name: "Ana",
		when: "ahora",
		line: "Llamada perdida"
	}
];
var TRAIL_COUNT = 16;
function trailPath(y, index, tick) {
	const t = tick / 24;
	const sway = Math.sin(t + index * .45) * 22;
	const curl = 78 + Math.cos(t * .7 + index * .2) * 6;
	const y0 = y + sway;
	const y1 = y + sway * .35;
	const y2 = y - curl * .28 + sway;
	const y3 = y - curl;
	return `M-30 ${y0} C 180 ${y1}, 460 ${y2}, 680 ${y3} S 900 ${y3 - 12}, 1040 ${y3 + 6}`;
}
function limaParts(now) {
	const parts = new Intl.DateTimeFormat("en-US", {
		timeZone: "America/Lima",
		weekday: "short",
		day: "numeric",
		month: "numeric",
		hour: "2-digit",
		minute: "2-digit",
		hourCycle: "h23"
	}).formatToParts(now);
	const get = (type) => parts.find((part) => part.type === type)?.value ?? "";
	const weekday = get("weekday");
	const dayIndex = [
		"Sun",
		"Mon",
		"Tue",
		"Wed",
		"Thu",
		"Fri",
		"Sat"
	].indexOf(weekday);
	const monthIndex = Number(get("month")) - 1;
	return {
		clock: `${get("hour").padStart(2, "0")}:${get("minute").padStart(2, "0")}`,
		date: `${DAYS[dayIndex] ?? weekday} ${get("day")} ${MONTHS[monthIndex] ?? ""}`
	};
}
var PUSH_HINT = {
	on: "Solo avisa si no estás mirando la app",
	off: "Aviso del sistema al llegar un mensaje",
	denied: "El navegador bloqueó los avisos",
	unsupported: "Este navegador no los permite"
};
function LiveWidget() {
	const [now, setNow] = (0, import_react.useState)(() => /* @__PURE__ */ new Date());
	const online = true;
	const [seen, setSeen] = (0, import_react.useState)(false);
	const [focus, setFocus] = (0, import_react.useState)(null);
	const [notices, setNotices] = (0, import_react.useState)(SEED);
	const [tick, setTick] = (0, import_react.useState)(0);
	const [burst, setBurst] = (0, import_react.useState)(false);
	const [freshId, setFreshId] = (0, import_react.useState)(null);
	const [peekId, setPeekId] = (0, import_react.useState)(null);
	const [settingsOpen, setSettingsOpen] = (0, import_react.useState)(false);
	const [allowMessages, setAllowMessages] = (0, import_react.useState)(true);
	const [allowCalls, setAllowCalls] = (0, import_react.useState)(true);
	const [preview, setPreview] = (0, import_react.useState)(true);
	const [flash, setFlash] = (0, import_react.useState)(true);
	const [pushOn, setPushOn] = (0, import_react.useState)(false);
	const [pushStatus, setPushStatus] = (0, import_react.useState)("off");
	const seq = (0, import_react.useRef)(5);
	const pushRef = (0, import_react.useRef)(false);
	const previewRef = (0, import_react.useRef)(true);
	pushRef.current = pushOn;
	previewRef.current = preview;
	(0, import_react.useEffect)(() => {
		if (!("serviceWorker" in navigator)) return;
		const onMessage = (event) => {
			if (event.data?.type !== "open-mensajes") return;
			setSettingsOpen(false);
			setFocus("mensajes");
		};
		navigator.serviceWorker.addEventListener("message", onMessage);
		return () => navigator.serviceWorker.removeEventListener("message", onMessage);
	}, []);
	(0, import_react.useEffect)(() => {
		restorePush().then((on) => {
			if (!on) return;
			setPushOn(true);
			setPushStatus("on");
		});
	}, []);
	(0, import_react.useEffect)(() => {
		const updateClock = () => setNow(/* @__PURE__ */ new Date());
		updateClock();
		const clockId = window.setInterval(updateClock, 1e3);
		const motionId = window.setInterval(() => setTick((value) => value + 1), 80);
		return () => {
			window.clearInterval(clockId);
			window.clearInterval(motionId);
		};
	}, []);
	(0, import_react.useEffect)(() => {
		if (!seen) return;
		const id = window.setTimeout(() => setSeen(false), 900);
		return () => window.clearTimeout(id);
	}, [seen]);
	(0, import_react.useEffect)(() => {
		if (!peekId) return;
		const id = window.setTimeout(() => setPeekId(null), 2400);
		return () => window.clearTimeout(id);
	}, [peekId]);
	(0, import_react.useEffect)(() => {
		if (!burst) return;
		const id = window.setTimeout(() => setBurst(false), 700);
		return () => window.clearTimeout(id);
	}, [burst]);
	(0, import_react.useEffect)(() => {
		if (!allowMessages) return;
		let timer = 0;
		const arrive = () => {
			const next = NOTES[seq.current % NOTES.length];
			const id = `m${seq.current}`;
			seq.current += 1;
			setNotices((list) => [{
				id,
				kind: "mensaje",
				name: next.name,
				when: "ahora",
				line: next.line
			}, ...list]);
			setFreshId(id);
			setPeekId(id);
			if (flash) setBurst(true);
			if (pushRef.current) deliverPush({
				title: next.name,
				body: previewRef.current ? next.line : "Mensaje nuevo",
				tag: `mensaje:${next.name}`
			});
			timer = window.setTimeout(arrive, 9e3);
		};
		timer = window.setTimeout(arrive, 4500);
		return () => window.clearTimeout(timer);
	}, [
		online,
		allowMessages,
		flash
	]);
	function dismiss(id) {
		setNotices((list) => {
			const item = list.find((notice) => notice.id === id);
			if (item?.kind === "mensaje") closePush(`mensaje:${item.name}`);
			return list.filter((notice) => notice.id !== id);
		});
		setFreshId((current) => current === id ? null : current);
		setPeekId((current) => current === id ? null : current);
	}
	function openChat() {
		setNotices([]);
		setFocus(null);
		setFreshId(null);
		setPeekId(null);
		setSeen(true);
		closePush();
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
	const tray = notices.filter((item) => focus === "llamadas" ? allowCalls && item.kind === "llamada" : allowMessages && focus === "mensajes" && item.kind === "mensaje").slice(0, focus === "llamadas" ? void 0 : 3);
	const peek = notices.find((item) => item.id === peekId) ?? null;
	const { clock, date } = limaParts(now);
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "flex w-full flex-col items-center",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("article", {
			className: "capsule widget-frame relative flex w-full flex-col overflow-hidden rounded-capsule border border-white/15 bg-obsidian px-7 pt-5 pb-3",
			style: NOCTURNO.vars,
			children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("svg", {
					className: `trails${burst ? " trails-live" : ""}`,
					viewBox: "0 0 800 420",
					preserveAspectRatio: "none",
					"aria-hidden": true,
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("defs", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("linearGradient", {
						id: "trail-fade",
						x1: "0",
						y1: "0",
						x2: "1",
						y2: "0",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("stop", {
								offset: "0",
								stopColor: "#fff",
								stopOpacity: "0"
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("stop", {
								offset: "0.08",
								stopColor: "#fff",
								stopOpacity: "1"
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("stop", {
								offset: "0.82",
								stopColor: "#fff",
								stopOpacity: "0.7"
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("stop", {
								offset: "1",
								stopColor: "#fff",
								stopOpacity: "0"
							})
						]
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("mask", {
						id: "trail-mask",
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("rect", {
							width: "800",
							height: "420",
							fill: "url(#trail-fade)"
						})
					})] }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("g", {
						fill: "none",
						strokeLinecap: "round",
						mask: "url(#trail-mask)",
						children: Array.from({ length: TRAIL_COUNT }, (_, index) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("path", {
							d: trailPath(120 + index * 13, index, tick),
							stroke: NOCTURNO.trails[index % NOCTURNO.trails.length],
							strokeWidth: index % 3 === 0 ? 4.5 : 2.5,
							opacity: index % 4 === 0 ? .82 : .55,
							vectorEffect: "non-scaling-stroke"
						}, index))
					})]
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
					"aria-hidden": true,
					className: "base-glow pointer-events-none absolute inset-x-0 bottom-0 h-36"
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
					type: "button",
					"aria-label": seen ? "Visto" : "Abrir",
					disabled: false,
					onClick: openChat,
					className: "hit absolute top-2 left-2 z-20 grid size-11 place-items-center text-white/45 disabled:opacity-40",
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ArrowUpRight, {
						className: "size-4",
						strokeWidth: 1.75
					})
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
					type: "button",
					"aria-label": "Ajustes",
					"aria-pressed": settingsOpen,
					onClick: () => setSettingsOpen((value) => !value),
					className: `hit absolute top-2 right-2 z-20 grid size-11 place-items-center ${settingsOpen ? "text-white" : "text-white/45"}`,
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Settings, {
						className: "size-4",
						strokeWidth: 1.75
					})
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					suppressHydrationWarning: true,
					className: "clock-face relative z-10 mt-3 text-center text-8xl font-medium tracking-[-0.04em] text-white tabular-nums",
					children: clock
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					suppressHydrationWarning: true,
					className: "relative z-10 mt-1 text-center text-sm text-white/80 lowercase",
					children: date
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "relative z-10 mt-2 flex items-center justify-center gap-3 text-[13px] leading-none",
					children: [
						allowMessages ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
							type: "button",
							disabled: false,
							"aria-pressed": focus === "mensajes",
							onClick: () => setFocus((value) => value === "mensajes" ? null : "mensajes"),
							className: "hit inline-flex h-9 items-center gap-1.5 leading-none text-white/55 disabled:opacity-40",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
								className: `font-medium tabular-nums leading-none ${focus === "mensajes" ? "text-white" : "text-white/90"}${burst ? " count-live" : ""}`,
								children: messages
							}), messages === 1 ? "mensaje" : "mensajes"]
						}) : null,
						allowMessages && allowCalls ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
							className: "text-white/30",
							"aria-hidden": true,
							children: "·"
						}) : null,
						allowCalls ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
							type: "button",
							disabled: false,
							"aria-pressed": focus === "llamadas",
							onClick: () => setFocus((value) => value === "llamadas" ? null : "llamadas"),
							className: "hit inline-flex h-9 items-center gap-1.5 leading-none text-white/55 disabled:opacity-40",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
								className: `font-medium tabular-nums leading-none ${focus === "llamadas" ? "text-white" : "text-white/90"}`,
								children: calls
							}), calls === 1 ? "llamada" : "llamadas"]
						}) : null
					]
				}),
				!settingsOpen && !focus && peek && peek.kind === "mensaje" ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
					className: "relative z-10 mt-3",
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(NoteCard, {
						item: peek,
						fresh: true,
						onDismiss: () => dismiss(peek.id),
						preview
					})
				}) : null,
				!settingsOpen && focus && tray.length > 0 ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
					className: "relative z-10 mt-3 grid gap-1.5",
					children: tray.map((item) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)(NoteCard, {
						item,
						fresh: item.id === freshId,
						onDismiss: () => dismiss(item.id),
						preview
					}, item.id))
				}) : null
			]
		}), settingsOpen ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "mt-1 grid w-full gap-1.5",
			children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Switch, {
					on: pushOn,
					label: "Push",
					hint: PUSH_HINT[pushStatus],
					onToggle: () => void togglePush()
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Switch, {
					on: allowMessages,
					label: "Mensajes",
					hint: "Muestra el contador y la bandeja",
					onToggle: () => setAllowMessages((value) => !value)
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Switch, {
					on: allowCalls,
					label: "Llamadas",
					hint: "Muestra las llamadas perdidas",
					onToggle: () => setAllowCalls((value) => !value)
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Switch, {
					on: preview,
					label: "Vista previa",
					hint: "El texto del aviso, no solo el nombre",
					onToggle: () => setPreview((value) => !value)
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Switch, {
					on: flash,
					label: "Destello",
					hint: "Las estelas se encienden al llegar",
					onToggle: () => setFlash((value) => !value)
				})
			]
		}) : null]
	});
}
function NoteCard({ item, fresh, preview, onDismiss }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: `rise flex items-center gap-3 border-t border-line py-2.5 ${fresh ? "note-fresh border-transparent" : ""}`,
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
				className: "note-mark text-ink",
				children: item.name.slice(0, 1)
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
				className: "min-w-0 flex-1 text-left",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
					className: "flex items-center justify-between gap-2",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
						className: "flex min-w-0 items-center gap-2",
						children: [fresh ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
							className: "note-dot",
							"aria-hidden": true
						}) : null, /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
							className: "truncate text-sm font-medium tracking-wide",
							children: item.name
						})]
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
						className: "text-[11px] tracking-wide text-mist",
						children: item.when
					})]
				}), preview ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
					className: "mt-0.5 block truncate text-[13px] text-mist",
					children: item.line
				}) : null]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
				type: "button",
				"aria-label": `Descartar aviso de ${item.name}`,
				onClick: onDismiss,
				className: "hit grid size-8 shrink-0 place-items-center rounded-full text-base leading-none text-mist/70",
				children: "×"
			})
		]
	});
}
function Switch({ on, label, hint, onToggle }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
		type: "button",
		role: "switch",
		"aria-checked": on,
		onClick: onToggle,
		className: "flex min-h-11 w-full items-center justify-between gap-3 rounded-2xl bg-panel px-3 py-2 text-left",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
			className: "block text-sm font-semibold",
			children: label
		}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
			className: "block text-xs text-mist",
			children: hint
		})] }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
			className: `switch${on ? " switch-on" : ""}`,
			"aria-hidden": true
		})]
	});
}
var MENU = [
	{
		id: "widget",
		label: "Widget",
		icon: LayoutGrid
	},
	{
		id: "archivos",
		label: "Archivos",
		icon: FileStack
	},
	{
		id: "portapapeles",
		label: "Portapapeles",
		icon: Clipboard
	}
];
function Home() {
	const [panel, setPanel] = (0, import_react.useState)("widget");
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("main", {
		className: "grid min-h-dvh bg-void text-ink md:grid-cols-[15rem_1fr]",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("nav", {
			className: "flex gap-2 overflow-x-auto border-b border-line px-3 py-3 md:flex-col md:overflow-visible md:border-r md:border-b-0 md:px-4 md:py-6",
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "hidden px-2 pb-3 text-xs font-bold tracking-widest text-mist md:block",
				children: "MENÚ"
			}), MENU.map((item) => {
				const Icon = item.icon;
				const active = panel === item.id;
				return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
					type: "button",
					onClick: () => setPanel(item.id),
					className: `flex min-h-11 shrink-0 items-center justify-center gap-2 rounded-2xl px-3 text-sm font-semibold whitespace-nowrap md:w-full md:justify-start ${active ? "bg-panel text-ink" : "text-mist"}`,
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Icon, {
						className: "size-4",
						"aria-hidden": true
					}), item.label]
				}, item.id);
			})]
		}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
			className: "flex min-h-dvh min-w-0 items-start justify-center px-4 pt-8 pb-10 md:px-10 md:pt-16",
			children: [
				panel === "widget" ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
					className: "flex w-full max-w-sm flex-col items-center gap-5",
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(LiveWidget, {})
				}) : null,
				panel === "archivos" ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(List, {
					title: "Archivos",
					rows: [
						"Contrato.pdf · listo",
						"Notas.m4a · listo",
						"Foto-0841.jpg · en tránsito"
					]
				}) : null,
				panel === "portapapeles" ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(List, {
					title: "Portapapeles",
					rows: [
						"Texto copiado hace 2 min",
						"Enlace copiado hace 18 min",
						"Código de acceso hace 1 h"
					]
				}) : null
			]
		})]
	});
}
function List({ title, rows }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "w-full max-w-md",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h1", {
			className: "text-2xl font-extrabold tracking-tight",
			children: title
		}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("ul", {
			className: "mt-4 grid gap-2",
			children: rows.map((row) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("li", {
				className: "rounded-2xl bg-panel px-4 py-3 text-base font-medium",
				children: row
			}, row))
		})]
	});
}
//#endregion
export { Home as component };
