import React, { useState } from 'react';
import { Bell } from 'lucide-react';
import { useNotifications } from '../../hooks/useNotifications';
import { useNavigate } from 'react-router-dom';
import { formatRelativeDate } from '../../utils/formatRelativeDate';

// ---------------------------------------------------------------------------
// NotificationBell – displays a bell icon with unread badge and opens a side panel
// ---------------------------------------------------------------------------
export default function NotificationBell() {
  const { nonLuesCount, notifications, marquerCommeLue } = useNotifications();
  const [panelOpen, setPanelOpen] = useState(false);
  const navigate = useNavigate();

  const openPanel = () => setPanelOpen(true);
  const closePanel = () => setPanelOpen(false);

  const handleClick = async (notif) => {
    // Optimistic mark‑as‑read
    if (!notif.lu) await marquerCommeLue(notif.id);
    // Navigate if a link is present
    if (notif.lien) navigate(notif.lien);
    closePanel();
  };

  return (
    <>
      {/* Bell icon with badge */}
      <button
        onClick={openPanel}
        className="relative p-2 rounded-full hover:bg-white/5 transition"
        title="Notifications"
      >
        <Bell size={20} className="text-slate-300" />
        {nonLuesCount > 0 && (
          <span className="absolute -top-1 -right-1 min-w-[1.2rem] h-5 bg-red-600 text-xs font-medium text-white rounded-full flex items-center justify-center px-1">
            {nonLuesCount > 9 ? '9+' : nonLuesCount}
          </span>
        )}
      </button>

      {/* Side‑panel overlay */}
      {panelOpen && (
        <div className="fixed inset-0 z-50 flex justify-end">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-[#0a0f1d]/90 backdrop-blur-md"
            onClick={closePanel}
          />
          {/* Panel */}
          <div className="relative w-80 max-w-full h-full bg-surface border-l border-[var(--border)] overflow-y-auto p-4">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold">Notifications</h2>
              <button onClick={closePanel} className="text-slate-400 hover:text-white">✕</button>
            </div>
            {notifications.length === 0 ? (
              <p className="text-slate-400">Aucune notification.</p>
            ) : (
              <ul className="space-y-2">
                {notifications.map((n) => (
                  <li
                    key={n.id}
                    className={`p-3 rounded-lg cursor-pointer transition ${n.lu ? 'bg-[#1e293b]' : 'bg-[#111827]'} hover:bg-[#111827]`}
                    onClick={() => handleClick(n)}
                  >
                    <p className="text-sm text-slate-200 mb-1 line-clamp-2">{n.titre || n.message}</p>
                    <div className="flex items-center text-xs text-slate-500">
                      <span>{formatRelativeDate(n.created_at)}</span>
                      {!n.lu && <span className="ml-2 text-emerald-400">• Non lue</span>}
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      )}
    </>
  );
}
