'use client';

// components/NotificationBell.tsx
// Simple, mobile-friendly notification bell
// Push prompt is a fixed bottom sheet, not a dropdown

import { useState, useEffect, useRef, useCallback } from 'react';

const VAPID_PUBLIC_KEY = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY || '';
const POLL_INTERVAL = 15000;
const PREVIEW_ROLE_KEY = 'errands_preview_role';

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
  const [showDropdown, setShowDropdown] = useState(false);
  const [pushEnabled, setPushEnabled] = useState(false);
  const [showPushPrompt, setShowPushPrompt] = useState(false);
  const [enabling, setEnabling] = useState(false);
  const lastChecked = useRef<string>(new Date().toISOString());

  const unreadCount = notifications.filter(n => !n.read).length;

  // Get effective role (respects admin preview)
  const effectiveRole = typeof window !== 'undefined'
    ? sessionStorage.getItem(PREVIEW_ROLE_KEY) || role
    : role;

  const enablePushNotifications = useCallback(async () => {
    if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
      alert('Push notifications are not supported on this browser.');
      return false;
    }
    setEnabling(true);
    try {
      const permission = await Notification.requestPermission();
      if (permission !== 'granted') {
        alert('Please allow notifications when prompted.');
        setEnabling(false);
        return false;
      }

      const reg = await navigator.serviceWorker.register('/sw.js');
      await navigator.serviceWorker.ready;

      let subscription = await reg.pushManager.getSubscription();
      if (!subscription) {
        subscription = await reg.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY)
        });
      }

      const res = await fetch('/.netlify/functions/push-subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, subscription })
      });

      if (res.ok) {
        setPushEnabled(true);
        localStorage.setItem('push_enabled', 'true');
        setShowPushPrompt(false);
        alert('✅ Push notifications enabled!');
        setEnabling(false);
        return true;
      }
    } catch (err) {
      console.error('Push setup failed:', err);
      alert('Failed to enable push notifications. Please try again.');
    }
    setEnabling(false);
    return false;
  }, [userId]);

  // Check if already enabled
  useEffect(() => {
    const stored = localStorage.getItem('push_enabled');
    if (stored === 'true') {
      setPushEnabled(true);
      // Re-register silently
      if ('serviceWorker' in navigator) {
        navigator.serviceWorker.register('/sw.js').catch(() => {});
      }
    }
  }, []);

  // Show push prompt for runners/owners after a delay
  useEffect(() => {
    if (pushEnabled) return;
    const dismissed = localStorage.getItem('push_dismissed');
    if (dismissed === 'true') return;
    if (effectiveRole === 'runner' || effectiveRole === 'territory_owner' || effectiveRole === 'owner') {
      const timer = setTimeout(() => setShowPushPrompt(true), 3000);
      return () => clearTimeout(timer);
    }
  }, [effectiveRole, pushEnabled]);

  // Poll for notifications
  const checkNotifications = useCallback(async () => {
    if (!userId || !effectiveRole) return;
    try {
      const res = await fetch(
        `/.netlify/functions/notifications-get?userId=${userId}&role=${effectiveRole}&since=${lastChecked.current}`
      );
      if (res.ok) {
        const data = await res.json();
        if (data.notifications?.length > 0) {
          setNotifications(prev => {
            const existingIds = new Set(prev.map((n: AppNotification) => n.id));
            const newOnes = data.notifications.filter((n: AppNotification) => !existingIds.has(n.id));
            return [...newOnes, ...prev].slice(0, 20);
          });
        }
        lastChecked.current = data.checkedAt || new Date().toISOString();
      }
    } catch (e) {
      // silent fail
    }
  }, [userId, effectiveRole]);

  useEffect(() => {
    if (!userId) return;
    checkNotifications();
    const interval = setInterval(checkNotifications, POLL_INTERVAL);
    return () => clearInterval(interval);
  }, [checkNotifications, userId]);

  const markAllRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
  };

  const handleNotificationClick = (n: AppNotification) => {
    setNotifications(prev => prev.map(x => x.id === n.id ? { ...x, read: true } : x));
    setShowDropdown(false);
    window.location.href = n.url;
  };

  return (
    <>
      {/* Push prompt — fixed bottom sheet, always on top */}
      {showPushPrompt && !pushEnabled && (
        <div
          style={{
            position: 'fixed',
            bottom: 0,
            left: 0,
            right: 0,
            background: '#2d4a2d',
            color: 'white',
            padding: '20px',
            zIndex: 99999,
            boxShadow: '0 -4px 20px rgba(0,0,0,0.3)',
          }}
        >
          <div style={{ maxWidth: '500px', margin: '0 auto' }}>
            <div style={{ fontWeight: 700, fontSize: '16px', marginBottom: '6px' }}>
              🔔 Get notified of new jobs
            </div>
            <div style={{ fontSize: '14px', opacity: 0.85, marginBottom: '16px' }}>
              Enable push notifications so you never miss a request.
            </div>
            <div style={{ display: 'flex', gap: '12px' }}>
              <button
                onClick={enablePushNotifications}
                disabled={enabling}
                style={{
                  flex: 1,
                  background: '#7ab87a',
                  border: 'none',
                  color: 'white',
                  padding: '14px',
                  borderRadius: '10px',
                  fontSize: '15px',
                  fontWeight: 700,
                  cursor: 'pointer',
                  fontFamily: 'DM Sans, sans-serif',
                }}
              >
                {enabling ? 'Enabling...' : '✅ Enable Notifications'}
              </button>
              <button
                onClick={() => {
                  localStorage.setItem('push_dismissed', 'true');
                  setShowPushPrompt(false);
                }}
                style={{
                  background: 'rgba(255,255,255,0.15)',
                  border: 'none',
                  color: 'white',
                  padding: '14px 20px',
                  borderRadius: '10px',
                  fontSize: '14px',
                  cursor: 'pointer',
                  fontFamily: 'DM Sans, sans-serif',
                }}
              >
                Not now
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Bell button */}
      <div style={{ position: 'relative' }}>
        <button
          onClick={() => {
            setShowDropdown(!showDropdown);
            if (!showDropdown) markAllRead();
          }}
          style={{
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            position: 'relative',
            padding: '6px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            minWidth: '44px',
            minHeight: '44px',
          }}
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
            }}>
              {unreadCount > 9 ? '9+' : unreadCount}
            </span>
          )}
          {!pushEnabled && (
            <span style={{
              position: 'absolute',
              top: '0px',
              left: '0px',
              background: '#ff9800',
              borderRadius: '50%',
              width: '8px',
              height: '8px',
            }} />
          )}
        </button>

        {/* Dropdown */}
        {showDropdown && (
          <>
            {/* Backdrop to close */}
            <div
              onClick={() => setShowDropdown(false)}
              style={{
                position: 'fixed',
                top: 0, left: 0, right: 0, bottom: 0,
                zIndex: 998,
              }}
            />
            <div style={{
              position: 'absolute',
              right: 0,
              top: '100%',
              marginTop: '8px',
              width: '300px',
              background: 'white',
              borderRadius: '12px',
              boxShadow: '0 8px 30px rgba(0,0,0,0.15)',
              zIndex: 999,
              maxHeight: '400px',
              overflowY: 'auto',
            }}>
              <div style={{
                padding: '14px 16px',
                borderBottom: '1px solid #f0f0f0',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                position: 'sticky',
                top: 0,
                background: 'white',
              }}>
                <span style={{ fontWeight: 700, fontSize: '15px', color: '#2d4a2d' }}>
                  Notifications
                </span>
                {!pushEnabled && (
                  <button
                    onPointerDown={(e) => {
                      e.stopPropagation();
                      setShowDropdown(false);
                      setTimeout(() => setShowPushPrompt(true), 100);
                    }}
                    style={{
                      background: '#2d4a2d',
                      border: 'none',
                      color: 'white',
                      padding: '6px 12px',
                      borderRadius: '6px',
                      cursor: 'pointer',
                      fontSize: '12px',
                      fontWeight: 600,
                      fontFamily: 'DM Sans, sans-serif',
                    }}
                  >
                    Enable Push
                  </button>
                )}
              </div>

              {notifications.length === 0 ? (
                <div style={{ padding: '30px 20px', textAlign: 'center', color: '#888', fontSize: '14px' }}>
                  No notifications yet
                </div>
              ) : notifications.map(n => (
                <div
                  key={n.id}
                  onPointerDown={() => handleNotificationClick(n)}
                  style={{
                    padding: '12px 16px',
                    borderBottom: '1px solid #f5f5f5',
                    cursor: 'pointer',
                    background: n.read ? 'white' : '#f0f7f0',
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: '10px',
                  }}
                >
                  <span style={{ fontSize: '20px', flexShrink: 0 }}>
                    {n.type === 'new_request' ? '📦' : n.type === 'new_message' ? '💬' : '🔔'}
                  </span>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: n.read ? 500 : 700, fontSize: '13px', color: '#2d4a2d' }}>
                      {n.title}
                    </div>
                    <div style={{ fontSize: '12px', color: '#666', marginTop: '2px' }}>
                      {n.body}
                    </div>
                    <div style={{ fontSize: '11px', color: '#aaa', marginTop: '4px' }}>
                      {new Date(n.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </div>
                  </div>
                  {!n.read && (
                    <div style={{ width: '8px', height: '8px', background: '#7ab87a', borderRadius: '50%', flexShrink: 0, marginTop: '4px' }} />
                  )}
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </>
  );
}
