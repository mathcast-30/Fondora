import React, { useEffect } from 'react';
import { X } from 'lucide-react';
import { useNotifications } from '../../hooks/useNotifications';

// ---------------------------------------------------------------------------
// NotificationToast – petite notification transient qui apparaît en haut‑right
// ---------------------------------------------------------------------------
export default function NotificationToast({ notification, onClose }) {
  // Auto‑dismiss after 5 seconds
  useEffect(() => {
    const timer = setTimeout(onClose, 5000);
    return () => clearTimeout(timer);
  }, [onClose]);

  return (
    <div className="fixed top-4 right-4 z-50 max-w-sm w-full bg-surface border border-[var(--border)] rounded-lg shadow-lg flex items-start p-4 animate-fade-in">
      <div className="flex-1">
        <p className="text-sm font-medium text-white">
          {notification.titre || notification.message}
        </p>
        {notification.lien && (
          <a href={notification.lien} className="text-xs text-emerald-400 underline mt-1 block" target="_blank" rel="noopener noreferrer">
            Voir
          </a>
        )}
      </div>
      <button onClick={onClose} className="ml-2 text-slate-400 hover:text-white" aria-label="Fermer">
        <X size={16} />
      </button>
    </div>
  );
}
