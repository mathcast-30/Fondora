import React from 'react';
import { useNotifications } from '../../hooks/useNotifications';
import NotificationToast from './NotificationToast';

// ---------------------------------------------------------------------------
// NotificationToastContainer – gère l'affichage du toast le plus récent
// ---------------------------------------------------------------------------
export default function NotificationToastContainer() {
  const { dernierToast, consommerToast } = useNotifications();

  if (!dernierToast) return null;

  return (
    <NotificationToast
      notification={dernierToast}
      onClose={consommerToast}
    />
  );
}
