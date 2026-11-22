'use client';

import { useEffect } from 'react';

// Registra o service worker só em produção, para não atrapalhar o recarregamento do `next dev`.
export function ServiceWorkerRegister() {
  useEffect(() => {
    if (process.env.NODE_ENV !== 'production' || !('serviceWorker' in navigator)) return;
    navigator.serviceWorker.register('/sw.js', { scope: '/' }).catch(() => {
      // Sem service worker o site continua funcionando; não há o que mostrar ao usuário.
    });
  }, []);
  return null;
}
