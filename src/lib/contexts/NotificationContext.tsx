
"use client"

import React, { createContext, useContext, useEffect, useRef, useState } from "react";
import { AppNotification } from "@/lib/types";
import { NotificationService } from "@/services/notification.service";
import { countUnread, isImportantNotification } from "@/lib/notification-utils";
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
  const knownIdsRef = useRef<Set<string>>(new Set());
  const subscribedUidRef = useRef<string | null>(null);

  useEffect(() => {
    if (!userProfile) {
      setNotifications([]);
      setSubscriptionError(null);
      knownIdsRef.current = new Set();
      subscribedUidRef.current = null;
      return;
    }

    // Ne réinitialiser les IDs connus qu'au changement d'utilisateur
    // (pas au passage null → boutique active après login).
    if (subscribedUidRef.current !== userProfile.uid) {
      knownIdsRef.current = new Set();
      subscribedUidRef.current = userProfile.uid;
    }

    let isFirstSnapshot = true;

    const unsubscribe = NotificationService.subscribe(
      { storeId: activeStore?.id, userId: userProfile.uid },
      (notes) => {
        setSubscriptionError(null);
        const important = notes.filter(isImportantNotification);

        if (isFirstSnapshot) {
          isFirstSnapshot = false;
          // Amorçage silencieux : pas de toast pour l'historique au login / changement de boutique
          important.forEach((n) => knownIdsRef.current.add(n.id));
          setNotifications(important);
          void NotificationService.purgeRoutineNotifications({
            storeId: activeStore?.id,
            userId: userProfile.uid,
          });
          return;
        }

        const newUnread = important.filter(
          (n) => !n.read && !knownIdsRef.current.has(n.id)
        );
        newUnread.forEach((notification) => {
          toast.info(notification.title, {
            id: `notif-${notification.id}`,
            description: notification.message,
            duration: 5000,
          });
        });

        important.forEach((n) => knownIdsRef.current.add(n.id));
        setNotifications(important);
      },
      () => {
        setSubscriptionError("subscription_failed");
        setNotifications([]);
      }
    );

    return () => unsubscribe();
  }, [userProfile, activeStore?.id]);

  const unreadCount = countUnread(notifications);

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
