const KEY = "enlace-push";

export type PushStatus = "on" | "off" | "denied" | "unsupported";

export function pushSaved(): boolean {
  try {
    return localStorage.getItem(KEY) === "1";
  } catch {
    return false;
  }
}

function remember(on: boolean) {
  try {
    localStorage.setItem(KEY, on ? "1" : "0");
  } catch {
    // Private mode can block storage. The permission still applies this session.
  }
}

export async function enablePush(): Promise<PushStatus> {
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

export function disablePush() {
  remember(false);
}

export async function restorePush(): Promise<boolean> {
  if (!pushSaved() || typeof Notification === "undefined" || Notification.permission !== "granted") return false;
  if (!("serviceWorker" in navigator)) return false;
  try {
    await navigator.serviceWorker.register("/push-sw.js");
    return true;
  } catch {
    return false;
  }
}

export async function deliverPush(note: { title: string; body: string; tag: string }) {
  if (document.visibilityState === "visible") return;
  if (typeof Notification === "undefined" || Notification.permission !== "granted") return;
  try {
    if ("serviceWorker" in navigator) {
      const registration = await navigator.serviceWorker.ready;
      await registration.showNotification(note.title, {
        body: note.body,
        tag: note.tag,
        icon: "/mark.png",
        silent: true,
      });
      return;
    }
  } catch {
    // Fall through to the page notification.
  }
  try {
    new Notification(note.title, { body: note.body, tag: note.tag, silent: true });
  } catch {
    // The browser refused the banner. The widget still shows the message.
  }
}

export async function closePush(tag?: string) {
  if (!("serviceWorker" in navigator)) return;
  const registration = await navigator.serviceWorker.getRegistration();
  const list = (await registration?.getNotifications(tag ? { tag } : undefined)) ?? [];
  for (const note of list) note.close();
}
