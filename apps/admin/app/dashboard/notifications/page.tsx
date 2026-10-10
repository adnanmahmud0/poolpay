"use client";

import { useEffect, useState } from "react";

import {
  AlertTriangle,
  Bell,
  Check,
  CheckCircle2,
  Clock,
  Info,
  Loader2,
  MoreVertical,
  Trash2,
  XCircle
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { toast } from "sonner";

import { getNotifications, markAllNotificationsRead, markNotificationRead } from "@/lib/api-auth";

import { useNotifications } from "@/context/NotificationContext";

interface Notification {
  _id: string;
  title: string;
  message: string;
  type: string;
  isRead: boolean;
  createdAt: string;
}

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [meta, setMeta] = useState({ total: 0 });
  const { refreshUnreadCount } = useNotifications();

  useEffect(() => {
    fetchNotifications();
  }, []);

  const fetchNotifications = async () => {
    setIsLoading(true);
    try {
      const response = await getNotifications({ page: 1, limit: 10 });
      if (response.success) {
        setNotifications(response.data.data);
        setMeta(response.data.meta);
        // Sync context on load
        refreshUnreadCount();
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Failed to fetch notifications");
    } finally {
      setIsLoading(false);
    }
  };

  const markAsRead = async (id: string) => {
    try {
      const response = await markNotificationRead(id);
      if (response.success) {
        setNotifications((prev) => prev.map((n) => (n._id === id ? { ...n, isRead: true } : n)));
        refreshUnreadCount();
        toast.success("Notification marked as read");
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Failed to mark notification as read");
    }
  };

  const markAllAsRead = async () => {
    try {
      const response = await markAllNotificationsRead();
      if (response.success) {
        setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
        refreshUnreadCount();
        toast.success("All notifications marked as read");
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Failed to mark all as read");
    }
  };

  return (
    <div className="mx-auto max-w-4xl space-y-6 pb-20">
      {/* Header Actions */}
      <div className="flex flex-col justify-between gap-4 rounded-2xl border border-gray-100 bg-white p-4 shadow-sm sm:flex-row sm:items-center sm:p-6">
        <div className="flex items-center gap-3">
          <div className="shrink-0 rounded-lg bg-indigo-50 p-2">
            <Bell className="h-5 w-5 text-indigo-600" />
          </div>
          <div>
            <h2 className="text-base font-bold text-gray-900 sm:text-lg">Notifications</h2>
            <p className="text-xs text-gray-500">
              Stay updated with your platform's latest activities ({meta.total})
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={markAllAsRead}
            className="w-full rounded-xl px-3 py-2 text-center text-xs font-bold text-indigo-600 transition-all hover:bg-indigo-50 sm:w-auto sm:px-4"
          >
            Mark all as read
          </button>
        </div>
      </div>

      {/* Notifications List */}
      <div className="space-y-3">
        {isLoading ? (
          <div className="flex flex-col items-center justify-center rounded-3xl border border-gray-100/50 bg-white py-20 shadow-sm">
            <Loader2 className="mb-4 h-8 w-8 animate-spin text-indigo-600" />
            <p className="text-sm font-medium text-gray-500">Loading notifications...</p>
          </div>
        ) : notifications.length > 0 ? (
          notifications.map((n) => (
            <NotificationItem key={n._id} notification={n} onMarkAsRead={() => markAsRead(n._id)} />
          ))
        ) : (
          <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-gray-200 bg-white p-8 text-center sm:p-12">
            <div className="mb-4 rounded-full bg-gray-50 p-4">
              <Bell className="h-8 w-8 text-gray-300" />
            </div>
            <h3 className="mb-1 text-base font-bold text-gray-900 sm:text-lg">All caught up!</h3>
            <p className="text-xs text-gray-500 sm:text-sm">
              You don't have any new notifications at the moment.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

function NotificationItem({
  notification: n,
  onMarkAsRead
}: {
  notification: Notification;
  onMarkAsRead: () => void;
}) {
  const getStyle = (type: string) => {
    switch (type) {
      case "payment_failed":
        return {
          icon: <XCircle className="h-5 w-5 text-red-500" />,
          bg: "bg-red-50"
        };
      case "group_completed":
        return {
          icon: <CheckCircle2 className="h-5 w-5 text-emerald-500" />,
          bg: "bg-emerald-50"
        };
      case "group_started":
      default:
        return {
          icon: <Bell className="h-5 w-5 text-indigo-500" />,
          bg: "bg-indigo-50"
        };
    }
  };

  const style = getStyle(n.type);

  return (
    <div
      className={`group rounded-2xl border bg-white p-4 transition-all sm:p-6 ${
        n.isRead ? "border-gray-100 opacity-70" : "border-indigo-100 shadow-sm"
      } relative overflow-hidden`}
    >
      {!n.isRead && <div className="absolute top-0 left-0 h-full w-1 bg-indigo-600" />}

      <div className="flex gap-3 sm:gap-4">
        <div
          className={`${style.bg} flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl sm:h-12 sm:w-12`}
        >
          {style.icon}
        </div>
        <div className="min-w-0 flex-1 space-y-1">
          <div className="flex flex-col justify-between gap-1 sm:flex-row sm:items-center">
            <h3 className="truncate text-sm font-bold text-gray-900">{n.title}</h3>
            <span className="flex shrink-0 items-center gap-1 text-[10px] font-medium text-gray-400">
              <Clock className="h-3 w-3" />
              {formatDistanceToNow(new Date(n.createdAt), { addSuffix: true })}
            </span>
          </div>
          <p className="text-xs leading-relaxed break-words text-gray-500 md:max-w-xl">
            {n.message}
          </p>
          <div className="flex items-center gap-4 pt-2">
            {!n.isRead && (
              <button
                onClick={onMarkAsRead}
                className="flex items-center gap-1 text-[10px] font-bold text-indigo-600 hover:underline"
              >
                <Check className="h-3 w-3" />
                Mark as read
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
