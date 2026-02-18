// lib/useRealtime.ts
// Smart polling hook for real-time updates

import { useEffect, useRef, useState } from 'react';

type PollingOptions = {
  url: string;
  interval?: number; // milliseconds, default 5000
  enabled?: boolean; // can disable polling
  onUpdate?: (data: any) => void;
};

export function useRealtimeData<T>(options: PollingOptions) {
  const { url, interval = 5000, enabled = true, onUpdate } = options;
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const isVisibleRef = useRef(true);

  const fetchData = async () => {
    try {
      const res = await fetch(url);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const newData = await res.json();
      setData(newData);
      setError(null);
      if (onUpdate) onUpdate(newData);
    } catch (e: any) {
      setError(e.message);
      console.error('Polling error:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!enabled) return;

    // Initial fetch
    fetchData();

    // Visibility change handler - poll less when tab is hidden
    const handleVisibilityChange = () => {
      isVisibleRef.current = !document.hidden;
      
      // Clear existing interval
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }

      // Set new interval based on visibility
      const pollInterval = isVisibleRef.current ? interval : interval * 6; // 30s when hidden
      
      intervalRef.current = setInterval(fetchData, pollInterval);
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    // Start polling
    intervalRef.current = setInterval(fetchData, interval);

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [url, interval, enabled]);

  const refresh = () => fetchData();

  return { data, loading, error, refresh };
}

// Hook specifically for messages in a request
export function useRealtimeMessages(requestId: number | string) {
  return useRealtimeData<any[]>({
    url: `/.netlify/functions/messages-get?id=${requestId}`,
    interval: 3000, // Poll every 3 seconds for active chat
    onUpdate: (messages) => {
      // Play sound on new message (optional)
      if (typeof window !== 'undefined' && messages.length > 0) {
        // Could add sound notification here
      }
    }
  });
}

// Hook for territory owner's request feed
export function useRealtimeRequests(ownerId: number | string) {
  return useRealtimeData<any[]>({
    url: `/.netlify/functions/requests-get-by-owner?owner_id=${ownerId}`,
    interval: 5000, // Poll every 5 seconds
    onUpdate: (requests) => {
      // Could trigger browser notification on new requests
      if (typeof window !== 'undefined' && 'Notification' in window) {
        // Notification logic here
      }
    }
  });
}
