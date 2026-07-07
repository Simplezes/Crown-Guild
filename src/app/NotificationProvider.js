'use client';

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';

const NotificationContext = createContext();

export const useNotifications = () => useContext(NotificationContext);

export function NotificationProvider({ children }) {
  const { data: session } = useSession();
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [pusherChannel, setPusherChannel] = useState(null);
  const router = useRouter();

  const fetchNotifications = useCallback(async () => {
    if (!session?.user?.id) return;
    try {
      const res = await fetch('/api/user/notifications');
      const data = await res.json();
      if (data.notifications) {
        setNotifications(data.notifications);
        const unread = data.notifications.filter(n => n.status === 'sent' || n.status === 'pending').length;
        setUnreadCount(unread);
      }
    } catch (err) {
      console.error('Failed to fetch notifications:', err);
    }
  }, [session?.user?.id]);

  useEffect(() => {
    if (!session?.user?.id) {
      setNotifications([]);
      setUnreadCount(0);
      return;
    }

    fetchNotifications();

    let cancelled = false;
    let cleanup = () => {};

    // pusher-js touches browser-only globals (`self`), so it must only be
    // loaded on the client, not evaluated during SSR of this component.
    import('@/lib/pusher-client').then(({ pusherClient }) => {
      if (cancelled) return;

      const channelName = `private-user-${session.user.id}`;
      const channel = pusherClient.subscribe(channelName);
      const publicChannel = pusherClient.subscribe('public-channel');
      setPusherChannel(channel);

      const onNotification = (notif) => {
        setNotifications(prev => {
          if (prev.some(n => n.id === notif.id)) return prev;
          return [notif, ...prev];
        });
        setUnreadCount(prev => prev + 1);

        const audio = new Audio('/sounds/MHWilds-Ping.mp3');
        audio.play().catch(() => { });
      };

      const onNotificationRemove = (filter) => {
        setNotifications(prev => prev.filter(n => {
          if (filter.id && n.id === filter.id) return false;
          if (filter.user_id && n.user_id === filter.user_id && filter.monster_id && n.monster_id === filter.monster_id) return false;
          return true;
        }));
        setUnreadCount(prev => Math.max(0, prev - 1));
      };

      const onMissionUpdate = () => fetchNotifications();
      const onNotificationCreated = () => fetchNotifications();
      const onCrownUpdate = () => router.refresh();

      channel.bind('notification', onNotification);
      channel.bind('notification_remove', onNotificationRemove);
      channel.bind('mission_update', onMissionUpdate);
      channel.bind('notification_created', onNotificationCreated);
      publicChannel.bind('crown_update', onCrownUpdate);

      cleanup = () => {
        setPusherChannel(null);
        channel.unbind('notification', onNotification);
        channel.unbind('notification_remove', onNotificationRemove);
        channel.unbind('mission_update', onMissionUpdate);
        channel.unbind('notification_created', onNotificationCreated);
        publicChannel.unbind('crown_update', onCrownUpdate);
        pusherClient.unsubscribe(channelName);
      };
    });

    return () => {
      cancelled = true;
      cleanup();
    };
  }, [session?.user?.id, fetchNotifications, router]);

  const markAsRead = async (id) => {
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, status: 'read' } : n));
    setUnreadCount(prev => Math.max(0, prev - 1));

    try {
      await fetch(`/api/user/notifications/${id}/read`, { method: 'POST' });
    } catch (err) {
      console.error('Failed to mark notification as read:', err);
    }
  };

  const markAllAsRead = async (type = null) => {
    setNotifications(prev => prev.map(n => (!type || n.type === type) ? { ...n, status: 'read' } : n));
    setUnreadCount(prev => {
      const remaining = notifications.filter(n => (type && n.type !== type) && (n.status === 'sent' || n.status === 'pending')).length;
      return remaining;
    });

    try {
      await fetch('/api/user/notifications/read-all', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type })
      });
    } catch (err) {
      console.error('Failed to mark all as read:', err);
    }
  };

  const actOnNotification = async (id, action) => {
    const method = action === 'accept' ? 'POST' : 'DELETE';
    setNotifications(prev => prev.filter(n => n.id !== id));
    setUnreadCount(prev => Math.max(0, prev - 1));

    try {
      const res = await fetch(`/api/user/notifications/${id}`, { method });
      if (!res.ok) {
        fetchNotifications();
        const data = await res.json();
        throw new Error(data.error || 'Action failed');
      }
    } catch (err) {
      console.error(`Failed to ${action} notification:`, err);
      throw err;
    }
  };

  const value = {
    notifications,
    unreadCount,
    pusherChannel,
    markAsRead,
    markAllAsRead,
    actOnNotification,
    refresh: fetchNotifications
  };

  return (
    <NotificationContext.Provider value={value}>
      {children}
    </NotificationContext.Provider>
  );
}

