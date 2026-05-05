'use client';

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import Pusher from 'pusher-js';
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

    const pusher = new Pusher(process.env.NEXT_PUBLIC_PUSHER_KEY || 'fake-key', {
      cluster: process.env.NEXT_PUBLIC_PUSHER_CLUSTER || 'us2'
    });

    const channel = pusher.subscribe('public-channel');
    setPusherChannel(channel);

    channel.bind('notification', (notif) => {
      if (notif.recipient_id === session.user.id) {
        setNotifications(prev => {
          if (prev.some(n => n.id === notif.id)) return prev;
          return [notif, ...prev];
        });
        setUnreadCount(prev => prev + 1);

        const audio = new Audio('/sounds/MHWilds-Ping.mp3');
        audio.play().catch(() => { });
      }
    });

    channel.bind('notification_update', (update) => {
      setNotifications(prev => prev.map(n => n.id === update.id ? { ...n, ...update } : n));
    });

    channel.bind('notification_remove', (filter) => {
      setNotifications(prev => prev.filter(n => {
        if (filter.id && n.id === filter.id) return false;
        if (filter.user_id && n.user_id === filter.user_id && filter.monster_id && n.monster_id === filter.monster_id) return false;
        return true;
      }));
      setUnreadCount(prev => Math.max(0, prev - 1));
    });

    channel.bind('crown_update', () => {
      router.refresh();
    });

    // Re-fetch notifications when a hunt is accepted (creates hunt_accepted notification)
    // or when any beacon-related update occurs — avoids router.refresh() which can
    // briefly destabilise the session and cause useEffect to re-run / re-add stale data.
    channel.bind('mission_update', () => {
      fetchNotifications();
    });

    channel.bind('notification_created', () => {
      fetchNotifications();
    });

    return () => {
      setPusherChannel(null);
      pusher.unsubscribe('public-channel');
      pusher.disconnect();
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

