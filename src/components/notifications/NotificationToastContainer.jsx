import React, { useState, useEffect, useCallback } from 'react';
import { useNotifications } from '../../hooks/useNotifications';
import NotificationToast from './NotificationToast';

// ---------------------------------------------------------------------------
// NotificationToastContainer – pile de toasts en haut à droite de l'écran
// Supporte plusieurs toasts simultanés avec suppression individuelle
// ---------------------------------------------------------------------------
export default function NotificationToastContainer() {
  const { dernierToast, consommerToast } = useNotifications();
  const [queue, setQueue] = useState([]);

  // Ajouter le dernier toast à la queue (avec id unique basé sur timestamp)
  useEffect(() => {
    if (!dernierToast) return;
    setQueue(prev => {
      // Déduplication : ne pas ajouter si déjà présent
      if (prev.some(t => t.id === dernierToast.id)) return prev;
      return [...prev, { ...dernierToast, _queueKey: `${dernierToast.id}-${Date.now()}` }];
    });
    consommerToast();
  }, [dernierToast, consommerToast]);

  const dismiss = useCallback((queueKey) => {
    setQueue(prev => prev.filter(t => t._queueKey !== queueKey));
  }, []);

  if (queue.length === 0) return null;

  return (
    <div className="fixed top-4 right-4 z-[9999] flex flex-col gap-2 w-80 max-w-[calc(100vw-2rem)] pointer-events-none">
      {queue.map(toast => (
        <div key={toast._queueKey} className="pointer-events-auto">
          <NotificationToast
            notification={toast}
            onClose={() => dismiss(toast._queueKey)}
          />
        </div>
      ))}
    </div>
  );
}
