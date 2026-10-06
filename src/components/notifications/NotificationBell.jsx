import React, { useState } from 'react';
import { Bell, CheckCheck } from 'lucide-react';
import { useNotifications } from '../../hooks/useNotifications';
import { useNavigate } from 'react-router-dom';
import { formatRelativeDate } from '../../utils/formatRelativeDate';

// ---------------------------------------------------------------------------
// NotificationBell – cloche avec badge et panneau latéral
// ---------------------------------------------------------------------------
export default function NotificationBell() {
  const { nonLuesCount, notifications, marquerCommeLue, marquerToutesCommeLues } = useNotifications();
  const [panelOpen, setPanelOpen] = useState(false);
  const navigate = useNavigate();

  const closePanel = () => setPanelOpen(false);

  const handleClick = async (notif) => {
    if (!notif.lu) void marquerCommeLue(notif.id);
    if (notif.lien) navigate(notif.lien);
    closePanel();
  };

  const handleMarquerToutes = () => {
    void marquerToutesCommeLues();
  };

  const ariaLabel = nonLuesCount > 0
    ? `Notifications (${nonLuesCount} non lues)`
    : 'Notifications';

  return (
    <>
      {/* Cloche avec badge */}
      <button
        onClick={() => setPanelOpen(true)}
        className="relative p-2 rounded-full hover:bg-white/5 transition"
        title="Notifications"
        aria-label={ariaLabel}
      >
        <Bell size={20} className={nonLuesCount > 0 ? 'text-white' : 'text-slate-400'} />
        {nonLuesCount > 0 && (
          <span className="absolute -top-1 -right-1 min-w-[1.2rem] h-5 bg-red-600 text-[10px] font-bold text-white rounded-full flex items-center justify-center px-1 leading-none">
            {nonLuesCount > 9 ? '9+' : nonLuesCount}
          </span>
        )}
      </button>

      {/* Panneau latéral */}
      {panelOpen && (
        <div className="fixed inset-0 z-50 flex justify-end">
          {/* Backdrop */}
          <button
            type="button"
            className="absolute inset-0 bg-[#0a0f1d]/90 backdrop-blur-md cursor-default"
            onClick={closePanel}
            aria-label="Fermer le panneau"
          />
          {/* Panneau */}
          <div className="relative w-80 max-w-full h-full bg-surface border-l border-[var(--border)] flex flex-col shadow-2xl">
            {/* En-tête */}
            <div className="flex items-center justify-between px-4 py-4 border-b border-[var(--border)] flex-shrink-0">
              <div className="flex items-center gap-2">
                <Bell size={18} className="text-emerald-400" />
                <h2 className="text-base font-semibold text-white">Notifications</h2>
                {nonLuesCount > 0 && (
                  <span className="text-xs bg-emerald-500/20 text-emerald-400 px-1.5 py-0.5 rounded-full font-medium">
                    {nonLuesCount}
                  </span>
                )}
              </div>
              <div className="flex items-center gap-2">
                {nonLuesCount > 0 && (
                  <button
                    onClick={handleMarquerToutes}
                    className="flex items-center gap-1 text-xs text-slate-400 hover:text-emerald-400 transition"
                    title="Tout marquer comme lu"
                    aria-label="Tout marquer comme lu"
                  >
                    <CheckCheck size={14} />
                    <span className="hidden sm:inline">Tout lire</span>
                  </button>
                )}
                <button
                  onClick={closePanel}
                  className="text-slate-500 hover:text-white transition text-lg leading-none"
                  aria-label="Fermer le panneau"
                >
                  ✕
                </button>
              </div>
            </div>

            {/* Liste */}
            <ul className="flex-1 overflow-y-auto p-3 space-y-1.5" aria-label="Liste des notifications">
              {notifications.length === 0 ? (
                <li className="flex flex-col items-center justify-center h-40 text-center">
                  <Bell size={32} className="text-slate-600 mb-2" />
                  <p className="text-slate-500 text-sm">Aucune notification.</p>
                </li>
              ) : (
                notifications.map((n) => {
                  const itemClass = n.lu
                    ? 'bg-white/[0.02] border-transparent hover:bg-white/[0.05]'
                    : 'bg-emerald-500/5 border-emerald-500/20 hover:bg-emerald-500/10';
                  return (
                    <li key={n.id}>
                      <button
                        type="button"
                        className={`w-full text-left p-3 rounded-xl transition border ${itemClass}`}
                        onClick={() => void handleClick(n)}
                        aria-label={n.titre || n.message}
                      >
                        <div className="flex items-start gap-2">
                          {!n.lu && (
                            <span
                              className="mt-1.5 w-1.5 h-1.5 rounded-full bg-emerald-400 flex-shrink-0"
                              aria-hidden="true"
                            />
                          )}
                          <div className="flex-1 min-w-0">
                            <p className={`text-sm mb-0.5 line-clamp-2 ${n.lu ? 'text-slate-400' : 'text-white font-medium'}`}>
                              {n.titre || n.message}
                            </p>
                            <span className="text-[11px] text-slate-500">
                              {formatRelativeDate(n.created_at)}
                            </span>
                          </div>
                        </div>
                      </button>
                    </li>
                  );
                })
              )}
            </ul>
          </div>
        </div>
      )}
    </>
  );
}
