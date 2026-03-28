import { useState, useEffect, useCallback } from 'react';
import { useMeetingsQuery, useEventsQuery } from '@/hooks/useApi';
import { Meeting, GreenAreaEvent } from '@/types';
import { isAfter, parseISO, differenceInHours, format } from 'date-fns';
import { es } from 'date-fns/locale';

export interface AppNotification {
  id: string;
  type: 'meeting' | 'event';
  title: string;
  message: string;
  date: string;
  read: boolean;
  createdAt: number;
}

const NOTIFICATIONS_KEY = 'privadas_notifications_read';
const PERMISSION_ASKED_KEY = 'privadas_push_permission_asked';

function getReadIds(): Set<string> {
  try {
    const stored = localStorage.getItem(NOTIFICATIONS_KEY);
    return stored ? new Set(JSON.parse(stored)) : new Set();
  } catch {
    return new Set();
  }
}

function saveReadIds(ids: Set<string>) {
  localStorage.setItem(NOTIFICATIONS_KEY, JSON.stringify([...ids]));
}

export function useNotifications() {
  const { data: meetings = [] } = useMeetingsQuery();
  const { data: events = [] } = useEventsQuery();
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [pushPermission, setPushPermission] = useState<NotificationPermission>(
    typeof Notification !== 'undefined' ? Notification.permission : 'denied'
  );

  // Generate notifications from upcoming meetings/events (next 48 hours)
  useEffect(() => {
    const now = new Date();
    const readIds = getReadIds();
    const notifs: AppNotification[] = [];

    meetings.forEach((m: Meeting) => {
      const meetingDate = parseISO(m.date);
      const hoursUntil = differenceInHours(meetingDate, now);
      if (hoursUntil >= -1 && hoursUntil <= 48) {
        const id = `meeting-${m.id}`;
        notifs.push({
          id,
          type: 'meeting',
          title: m.title,
          message: `${format(meetingDate, "d 'de' MMMM", { locale: es })} a las ${m.startTime} hrs — ${m.location}`,
          date: m.date,
          read: readIds.has(id),
          createdAt: meetingDate.getTime(),
        });
      }
    });

    events.forEach((e: GreenAreaEvent) => {
      const eventDate = parseISO(e.date);
      const hoursUntil = differenceInHours(eventDate, now);
      if (hoursUntil >= -1 && hoursUntil <= 48) {
        const id = `event-${e.id}`;
        notifs.push({
          id,
          type: 'event',
          title: e.title,
          message: `${format(eventDate, "d 'de' MMMM", { locale: es })} a las ${e.startTime} hrs — ${e.greenArea}`,
          date: e.date,
          read: readIds.has(id),
          createdAt: eventDate.getTime(),
        });
      }
    });

    notifs.sort((a, b) => a.createdAt - b.createdAt);
    setNotifications(notifs);
  }, [meetings, events]);

  const unreadCount = notifications.filter(n => !n.read).length;

  const markAsRead = useCallback((id: string) => {
    const readIds = getReadIds();
    readIds.add(id);
    saveReadIds(readIds);
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
  }, []);

  const markAllAsRead = useCallback(() => {
    const readIds = getReadIds();
    notifications.forEach(n => readIds.add(n.id));
    saveReadIds(readIds);
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
  }, [notifications]);

  // Request push permission
  const requestPushPermission = useCallback(async () => {
    if (typeof Notification === 'undefined') return;
    const result = await Notification.requestPermission();
    setPushPermission(result);
    localStorage.setItem(PERMISSION_ASKED_KEY, 'true');
    return result;
  }, []);

  // Send browser notification
  const sendBrowserNotification = useCallback((title: string, body: string) => {
    if (typeof Notification === 'undefined' || Notification.permission !== 'granted') return;
    new Notification(title, {
      body,
      icon: '/favicon.ico',
      badge: '/favicon.ico',
    });
  }, []);

  // Auto-send browser notifications for unread items on mount
  useEffect(() => {
    if (pushPermission !== 'granted') return;
    const sentKey = 'privadas_push_sent';
    const sentIds: Set<string> = (() => {
      try {
        const s = sessionStorage.getItem(sentKey);
        return s ? new Set(JSON.parse(s)) : new Set();
      } catch { return new Set(); }
    })();

    notifications.filter(n => !n.read && !sentIds.has(n.id)).forEach(n => {
      sendBrowserNotification(
        n.type === 'meeting' ? '📅 Reunión próxima' : '🌳 Evento próximo',
        `${n.title}: ${n.message}`
      );
      sentIds.add(n.id);
    });

    sessionStorage.setItem(sentKey, JSON.stringify([...sentIds]));
  }, [notifications, pushPermission, sendBrowserNotification]);

  const shouldAskPermission = typeof Notification !== 'undefined' 
    && Notification.permission === 'default'
    && !localStorage.getItem(PERMISSION_ASKED_KEY);

  return {
    notifications,
    unreadCount,
    markAsRead,
    markAllAsRead,
    requestPushPermission,
    pushPermission,
    shouldAskPermission,
  };
}
