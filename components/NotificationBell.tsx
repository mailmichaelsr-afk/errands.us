'use client';

// components/NotificationBell.tsx
// Drop this into your nav/layout. Shows unread badge + dropdown.
// Falls back to polling if push not supported/denied.

import { useState, useEffect, useRef, useCallback } from 'react';

const VAPID_PUBLIC_KEY = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY || '';
const POLL_INTERVAL = 15000; // 15 seconds

interface AppNotification {
  id: string;
  type: string;
  title: string;
  body: string;
  url: string;
  created_at: string;
  read?: boolean;
}

interface NotificationBellProps {
  userId: number;
  role: string;
}

function urlBase64ToUint8Array(base64String: string): ArrayBuffer {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray.buffer as ArrayBuffer;
}

export default function NotificationBell({ userId, role }: NotificationBellProps) {
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [open, setOpen] = useState(false);
  const [pushEnabled, setPushEnabled] = useState(false);
  const [pushPrompted, setPushPrompted] = useState(false);
  const lastChecked = useRef<string>(new Date().toISOString());
  const dropdownRef = useRef<HTMLDivElement>(null);

  const unreadCount = notifications.filter(n => !n.read).length;

  // Register service worker + subscribe to push
  const enablePushNotifications = useCallback(async () => {
    if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
      console.log('Push not supported');
      return false;
    }

    try {
      const permission = await Notification.requestPermission();
      if (permission !== 'granted') return false;

      const reg = await navigator.serviceWorker.register('/sw.js');
      await navigator.serviceWorker.ready;

      const existing = await reg.pushManager.getSubscription();
      let subscription = existing;

      if (!existing) {
        subscription = await reg.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY)
        });
      }

      // Save subscription to DB
      await fetch('/.netlify/functions/push-subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, subscription })
      });

      setPushEnabled(true);
      localStorage.setItem('push_enabled', 'true');
      return true;
    } catch (err) {
      console.error('Push setup failed:', err);
      return false;
    }
  }, [userId]);

  // Poll for notifications
  const checkNotifications = useCallback(async () => {
    if (!userId || !role) return;

    try {
      const res = await fetch(
        `/.netlify/functions/notifications-get?userId=${userId}&role=${role}&since=${lastChecked.current}`
      );
      const data = await res.json();

      if (data.notifications?.length > 0) {
        setNotifications(prev => {
          const existingIds = new Set(prev.map(n => n.id));
          const newOnes = data.notifications.filter((n: AppNotification) => !existingIds.has(n.id));
          return [...newOnes, ...prev].slice(0, 20); // keep last 20
        });
      }

      lastChecked.current = data.checkedAt || new Date().toISOString();
    } catch (err) {
      // Silent fail — polling is best-effort
    }
  }, [userId, role]);

  // Auto-prompt for push on runner/owner dashboards
  useEffect(() => {
    if (!pushPrompted && (role === 'runner' || role === 'owner')) {
      const alreadyEnabled = localStorage.getItem('push_enabled') === 'true';
      const dismissed = localStorage.getItem('push_dismissed') === 'true';

      if (!alreadyEnabled && !dismissed) {
        setPushPrompted(true);
      } else if (alreadyEnabled) {
        setPushEnabled(true);
        // Re-register service worker silently
        enablePushNotifications();
      }
    }
  }, [role, pushPrompted, enablePushNotifications]);

  // Start polling
  useEffect(() => {
    if (!userId) return;
    checkNotifications();
    const interval = setInterval(checkNotifications, POLL_INTERVAL);
    return () => clearInterval(interval);
  }, [checkNotifications, userId]);

  // Close dropdown on outside click
  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  const markAllRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
  };

  const handleNotificationClick = (notification: AppNotification) => {
    setNotifications(prev =>
      prev.map(n => n.id === notification.id ? { ...n, read: true } : n)
    );
    setOpen(false);
    window.location.href = notification.url;
  };

  const handleDismissPush = () => {
    localStorage.setItem('push_dismissed', 'true');
    setPushPrompted(false);
  };

  const handleEnablePush = async () => {
    await enablePushNotifications();
    setPushPrompted(false);
  };

  return (
    <div style={{ position: 'relative' }} ref={dropdownRef}>
      {/* Push prompt banner */}
      {pushPrompted && !pushEnabled && (
        <div style={{
          position: 'fixed',
          bottom: '20px',
          left: '50%',
          transform: 'translateX(-50%)',
          background: '#2d4a2d',
          color: 'white',
          padding: '14px 20px',
          borderRadius: '12px',
          boxShadow: '0 4px 20px rgba(0,0,0,0.3)',
          zIndex: 9999,
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
          maxWidth: '360px',
          width: 'calc(100% - 40px)'
        }}>
          <span style={{ fontSize: '22px' }}>🔔</span>
          <div style={{ flex: 1 }}>
            <div style={{ fontWeight: 600, fontSize: '14px', marginBottom: '2px' }}>
              Get notified of new jobs
            </div>
            <div style={{ fontSize: '12px', opacity: 0.8 }}>
              Enable push notifications so you never miss a request
            </div>
          </div>
          <div style={{ display: 'flex', gap: '8px', flexShrink: 0 }}>
            <button
              onClick={handleDismissPush}
              style={{
                background: 'rgba(255,255,255,0.2)',
                border: 'none',
                color: 'white',
                padding: '6px 10px',
                borderRadius: '6px',
                cursor: 'pointer',
                fontSize: '12px'
              }}
            >
              Not now
            </button>
            <button
              onClick={handleEnablePush}
              style={{
                background: '#7ab87a',
                border: 'none',
                color: 'white',
                padding: '6px 12px',
                borderRadius: '6px',
                cursor: 'pointer',
                fontSize: '12px',
                fontWeight: 600
              }}
            >
              Enable
            </button>
          </div>
        </div>
      )}

      {/* Bell button */}
      <button
        onClick={() => {
          setOpen(!open);
          if (!open) markAllRead();
        }}
        style={{
          background: 'none',
          border: 'none',
          cursor: 'pointer',
          position: 'relative',
          padding: '6px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        }}
        title="Notifications"
      >
        <span style={{ fontSize: '22px' }}>🔔</span>
        {unreadCount > 0 && (
          <span style={{
            position: 'absolute',
            top: '0px',
            right: '0px',
            background: '#e53e3e',
            color: 'white',
            borderRadius: '50%',
            width: '18px',
            height: '18px',
            fontSize: '11px',
            fontWeight: 700,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            lineHeight: 1
          }}>
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {/* Dropdown */}
      {open && (
        <div style={{
          position: 'absolute',
          right: 0,
          top: '100%',
          marginTop: '8px',
          width: '320px',
          background: 'white',
          borderRadius: '12px',
          boxShadow: '0 8px 30px rgba(0,0,0,0.15)',
          zIndex: 1000,
          overflow: 'visible'
        }}>
          <div style={{
            padding: '14px 16px',
            borderBottom: '1px solid #f0f0f0',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center'
          }}>
            <span style={{ fontWeight: 700, fontSize: '15px', color: '#2d4a2d' }}>
              Notifications
            </span>
            {!pushEnabled && (
              <button
                onClick={handleEnablePush}
                style={{
                  background: '#f5f0e8',
                  border: 'none',
                  color: '#2d4a2d',
                  padding: '4px 10px',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  fontSize: '12px',
                  fontWeight: 600
                }}
              >
                Enable Push
              </button>
            )}
          </div>

          <div style={{ maxHeight: '360px', overflowY: 'auto' }}>
            {notifications.length === 0 ? (
              <div style={{
                padding: '30px 20px',
                textAlign: 'center',
                color: '#888',
                fontSize: '14px'
              }}>
                No notifications yet
              </div>
            ) : (
              notifications.map(notification => (
                <div
                  key={notification.id}
                  onClick={() => handleNotificationClick(notification)}
                  style={{
                    padding: '12px 16px',
                    borderBottom: '1px solid #f5f5f5',
                    cursor: 'pointer',
                    background: notification.read ? 'white' : '#f0f7f0',
                    transition: 'background 0.15s'
                  }}
                  onMouseEnter={e => (e.currentTarget.style.background = '#f5f5f5')}
                  onMouseLeave={e => (e.currentTarget.style.background = notification.read ? 'white' : '#f0f7f0')}
                >
                  <div style={{
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: '10px'
                  }}>
                    <span style={{ fontSize: '20px', flexShrink: 0 }}>
                      {notification.type === 'new_request' ? '📦' :
                       notification.type === 'new_message' ? '💬' :
                       notification.type === 'request_accepted' ? '✅' : '🔔'}
                    </span>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{
                        fontWeight: notification.read ? 500 : 700,
                        fontSize: '13px',
                        color: '#2d4a2d',
                        marginBottom: '2px'
                      }}>
                        {notification.title}
                      </div>
                      <div style={{
                        fontSize: '12px',
                        color: '#666',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap'
                      }}>
                        {notification.body}
                      </div>
                      <div style={{ fontSize: '11px', color: '#aaa', marginTop: '4px' }}>
                        {new Date(notification.created_at).toLocaleTimeString([], {
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </div>
                    </div>
                    {!notification.read && (
                      <div style={{
                        width: '8px',
                        height: '8px',
                        background: '#7ab87a',
                        borderRadius: '50%',
                        flexShrink: 0,
                        marginTop: '4px'
                      }} />
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
