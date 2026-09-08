import React, { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';

const NotificationsContext = createContext(null);

export const NotificationsProvider = ({ children }) => {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState([]);
  const [nonLuesCount, setNonLuesCount] = useState(0);
  const [dernierToast, setDernierToast] = useState(null);

  // Fetch initial notifications
  useEffect(() => {
    if (!user?.id) return;
    const fetch = async () => {
      const { data, error } = await supabase
        .from('notifications_log')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(50);
      if (!error && data) {
        setNotifications(data);
        setNonLuesCount(data.filter(n => !n.lu).length);
      }
    };
    fetch();
  }, [user?.id]);

  // Realtime subscription
  useEffect(() => {
    if (!user?.id) return undefined;
    const channel = supabase.channel(`notifications:${user.id}`);
    const handleInsert = async payload => {
      const newNotif = payload.new;
      setNotifications(prev => {
        if (prev.some(n => n.id === newNotif.id)) return prev;
        return [newNotif, ...prev];
      });
      setNonLuesCount(prev => prev + (newNotif.lu ? 0 : 1));
      setDernierToast(newNotif);
    };
    channel.on('postgres_changes', {
      event: 'INSERT',
      schema: 'public',
      table: 'notifications_log',
      filter: `user_id=eq.${user.id}`,
    }, handleInsert);
    channel.subscribe();
    return () => {
      channel.unsubscribe();
    };
  }, [user?.id]);

  const marquerCommeLue = async id => {
    // optimistic UI
    setNotifications(prev =>
      prev.map(n => (n.id === id ? { ...n, lu: true } : n))
    );
    setNonLuesCount(prev => Math.max(prev - 1, 0));
    await supabase
      .from('notifications_log')
      .update({ lu: true })
      .eq('id', id);
  };

  const marquerToutesCommeLues = async () => {
    // optimistic update for loaded notifications
    setNotifications(prev => prev.map(n => ({ ...n, lu: true })));
    setNonLuesCount(0);
    if (user?.id) {
      await supabase
        .rpc('mark_all_notifications_as_read', { uid: user.id })
        .catch(() => {});
      // fallback if rpc not exists
      await supabase
        .from('notifications_log')
        .update({ lu: true })
        .eq('user_id', user.id)
        .neq('lu', true);
    }
  };

  const consommerToast = () => setDernierToast(null);

  return (
    <NotificationsContext.Provider
      value={{
        notifications,
        nonLuesCount,
        dernierToast,
        setDernierToast,
        consommerToast,
        marquerCommeLue,
        marquerToutesCommeLues,
      }}
    >
      {children}
    </NotificationsContext.Provider>
  );
};

export const useNotifications = () => useContext(NotificationsContext);
