import React, { useEffect } from 'react';
import { X } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useNotifications } from '../../hooks/useNotifications';

// ---------------------------------------------------------------------------
// NotificationToast – petite notification transiente qui apparaît en haut‑droite
// Auto‑dismiss après 6 s, navigation au clic, marque comme lue
// ---------------------------------------------------------------------------
export default function NotificationToast({ notification, onClose }) {
  const navigate = useNavigate();
  const { marquerCommeLue } = useNotifications();

  // Auto‑dismiss après 6 secondes
  useEffect(() => {
    const timer = setTimeout(onClose, 6000);
    return () => clearTimeout(timer);
  }, [onClose]);

  const handleClick = async () => {
    if (!notification.lu) await marquerCommeLue(notification.id);
    if (notification.lien) navigate(notification.lien);
    onClose();
  };

  return (
    <div
      className="w-full bg-[#1E293B] border border-emerald-500/30 rounded-2xl shadow-xl flex items-start p-4 cursor-pointer hover:brightness-110 transition-all"
      onClick={handleClick}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => e.key === 'Enter' && handleClick()}
    >
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-white truncate">
          {notification.titre || '🔔 Notification'}
        </p>
        {notification.message && (
          <p className="text-xs text-slate-400 mt-0.5 line-clamp-2">
            {notification.message}
          </p>
        )}
      </div>
      <button
        onClick={(e) => { e.stopPropagation(); onClose(); }}
        className="ml-3 flex-shrink-0 text-slate-500 hover:text-white transition"
        aria-label="Fermer"
      >
        <X size={15} />
      </button>
    </div>
  );
}
