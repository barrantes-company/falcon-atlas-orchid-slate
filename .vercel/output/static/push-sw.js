self.addEventListener("push", (event) => {
  let payload = { title: "Enlace", body: "Mensaje nuevo", tag: "enlace" };
  try {
    if (event.data) payload = { ...payload, ...event.data.json() };
  } catch {
    payload.body = event.data ? event.data.text() : payload.body;
  }
  event.waitUntil(show(payload));
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  event.waitUntil(
    self.clients.matchAll({ type: "window", includeUncontrolled: true }).then(async (list) => {
      const open = list.find((client) => "focus" in client);
      if (open) {
        await open.focus();
        open.postMessage({ type: "open-mensajes" });
        return;
      }
      const created = await self.clients.openWindow?.("/");
      created?.postMessage({ type: "open-mensajes" });
    }),
  );
});

function show(payload) {
  return self.registration.showNotification(payload.title, {
    body: payload.body,
    tag: payload.tag || "enlace",
    icon: "/mark.png",
    silent: true,
    data: { url: "/" },
  });
}
