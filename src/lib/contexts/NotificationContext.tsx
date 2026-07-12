
"use client"

import React, { createContext, useContext, useEffect, useState } from "react";
import { AppNotification } from "@/lib/types";
import { NotificationService } from "@/services/notification.service";
import { useAuth } from "./AuthContext";
import { useStore } from "./StoreContext";

interface NotificationContextType {
  notifications: AppNotification[];
  unreadCount: number;
  markAsRead: (id: string) => Promise<void>;
  markAllAsRead: () => Promise<void>;
  deleteNotification: (id: string) => Promise<void>;
  clearAll: () => Promise<void>;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export function NotificationProvider({ children }: { children: React.ReactNode }) {
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const { userProfile } = useAuth();
  const { activeStore } = useStore();

  useEffect(() => {
    if (!userProfile) {
      setNotifications([]);
      return;
    }

    const unsubscribe = NotificationService.subscribe(
      { storeId: activeStore?.id, userId: userProfile.uid },
      (notes) => setNotifications(notes)
    );

    return () => unsubscribe();
  }, [userProfile, activeStore]);

  const unreadCount = notifications.filter(n => !n.read).length;

  const markAsRead = async (id: string) => {
    await NotificationService.markAsRead(id);
  };

  const markAllAsRead = async () => {
    const unreadIds = notifications.filter((n) => !n.read).map((n) => n.id);
    await NotificationService.markAllAsRead(unreadIds);
  };

  const deleteNotification = async (id: string) => {
    await NotificationService.deleteNotification(id);
  };

  const clearAll = async () => {
    await NotificationService.clearAll({ storeId: activeStore?.id, userId: userProfile?.uid });
  };

  return (
    <NotificationContext.Provider value={{ 
      notifications, 
      unreadCount, 
      markAsRead,
      markAllAsRead,
      deleteNotification, 
      clearAll 
    }}>
      {children}
    </NotificationContext.Provider>
  );
}

export const useNotifications = () => {
  const context = useContext(NotificationContext);
  if (context === undefined) {
    throw new Error("useNotifications must be used within a NotificationProvider");
  }
  return context;
};
