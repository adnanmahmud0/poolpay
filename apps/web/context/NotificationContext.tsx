"use client";

import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import { getNotifications } from "@/lib/api-auth";

interface NotificationContextType {
  unreadCount: number;
  refreshUnreadCount: () => Promise<void>;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export function NotificationProvider({ children }: { children: React.ReactNode }) {
  const [unreadCount, setUnreadCount] = useState(0);

  const refreshUnreadCount = useCallback(async () => {
    try {
      // Fetching with limit 1 just to get the unread info if the API supports it
      // or we filter from a larger list. For now, we'll fetch a small batch.
      const response = await getNotifications({ page: 1, limit: 100 });
      if (response.success) {
        const unread = response.data.data.filter((n: any) => !n.isRead).length;
        setUnreadCount(unread);
      }
    } catch (error) {
      console.error("Failed to refresh unread count:", error);
    }
  }, []);

  useEffect(() => {
    refreshUnreadCount();
    // Optional: Set up polling if real-time is desired without WebSockets
    const interval = setInterval(refreshUnreadCount, 30000); // 30 seconds
    return () => clearInterval(interval);
  }, [refreshUnreadCount]);

  return (
    <NotificationContext.Provider value={{ unreadCount, refreshUnreadCount }}>
      {children}
    </NotificationContext.Provider>
  );
}

export function useNotifications() {
  const context = useContext(NotificationContext);
  if (context === undefined) {
    throw new Error("useNotifications must be used within a NotificationProvider");
  }
  return context;
}
