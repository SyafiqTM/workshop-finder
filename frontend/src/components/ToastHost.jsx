import { useEffect, useState } from 'react';

import { subscribeToToasts } from '../services/toastBus.js';

export default function ToastHost() {
  const [toasts, setToasts] = useState([]);

  useEffect(() => {
    const unsubscribe = subscribeToToasts((toast) => {
      const id = Date.now() + Math.random();
      setToasts((current) => [...current, { id, ...toast }]);

      setTimeout(() => {
        setToasts((current) => current.filter((item) => item.id !== id));
      }, 4000);
    });

    return unsubscribe;
  }, []);

  if (!toasts.length) {
    return null;
  }

  return (
    <div className="pointer-events-none fixed right-4 top-4 z-[1200] flex w-[min(92vw,360px)] flex-col gap-2">
      {toasts.map((toast) => (
        <div
          key={toast.id}
          className="pointer-events-auto rounded-lg border border-red-200 bg-white px-4 py-3 text-sm text-red-700 shadow"
          role="status"
          aria-live="polite"
        >
          {toast.message}
        </div>
      ))}
    </div>
  );
}
