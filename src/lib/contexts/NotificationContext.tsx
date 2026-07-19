
"use client"

import React, { createContext, useContext, useEffect, useRef, useState } from "react";
import { AppNotification } from "@/lib/types";
import { NotificationService } from "@/services/notification.service";
import { useAuth } from "./AuthContext";
import { useStore } from "./StoreContext";
import { toast } from "sonner";

interface NotificationContextType {
  notifications: AppNotification[];
  unreadCount: number;
  subscriptionError: string | null;
  markAsRead: (id: string) => Promise<void>;
  markAllAsRead: () => Promise<void>;
  deleteNotification: (id: string) => Promise<void>;
  clearAll: () => Promise<void>;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export function NotificationProvider({ children }: { children: React.ReactNode }) {
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [subscriptionError, setSubscriptionError] = useState<string | null>(null);
  const { userProfile } = useAuth();
  const { activeStore } = useStore();
  const initializedRef = useRef(false);
  const knownIdsRef = useRef<Set<string>>(new Set());

  useEffect(() => {
    initializedRef.current = false;
    knownIdsRef.current = new Set();

    if (!userProfile) {
      setNotifications([]);
      setSubscriptionError(null);
      initializedRef.current = false;
      knownIdsRef.current = new Set();
      return;
    }

    const unsubscribe = NotificationService.subscribe(
      { storeId: activeStore?.id, userId: userProfile.uid },
      (notes) => {
        setSubscriptionError(null);

        if (!initializedRef.current) {
          initializedRef.current = true;
          knownIdsRef.current = new Set(notes.map((n) => n.id));
          setNotifications(notes);
          return;
        }

        const newUnread = notes.filter(
          (n) => !n.read && !knownIdsRef.current.has(n.id)
        );
        newUnread.forEach((notification) => {
          toast.info(notification.title, {
            description: notification.message,
            duration: 5000,
          });
        });

        knownIdsRef.current = new Set(notes.map((n) => n.id));
        setNotifications(notes);
      },
      () => {
        setSubscriptionError("subscription_failed");
        setNotifications([]);
      }
    );

    return () => unsubscribe();
  }, [userProfile, activeStore?.id]);

  const unreadCount = notifications.filter((n) => !n.read).length;

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
    await NotificationService.clearAll({
      storeId: activeStore?.id,
      userId: userProfile?.uid,
    });
  };

  return (
    <NotificationContext.Provider
      value={{
        notifications,
        unreadCount,
        subscriptionError,
        markAsRead,
        markAllAsRead,
        deleteNotification,
        clearAll,
      }}
    >
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
