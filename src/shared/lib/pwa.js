export function registerServiceWorker() {
  if (!("serviceWorker" in navigator)) {
    return;
  }

  if (!import.meta.env.PROD) {
    window.addEventListener("load", () => {
      navigator.serviceWorker.getRegistrations().then((registrations) => {
        registrations.forEach((registration) => registration.unregister());
      }).catch(() => {});

      if ("caches" in window) {
        caches.keys().then((keys) => {
          keys.forEach((key) => caches.delete(key));
        }).catch(() => {});
      }
    });
    return;
  }

  window.addEventListener("load", () => {
    navigator.serviceWorker.register("/sw.js").catch(() => {});
  });
}
