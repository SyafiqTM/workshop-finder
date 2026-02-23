const listeners = new Set();

export function subscribeToToasts(listener) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function pushToast(toast) {
  listeners.forEach((listener) => listener(toast));
}
