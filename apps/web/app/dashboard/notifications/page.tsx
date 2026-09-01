"use client";

import { useState, useEffect } from "react";
import { 
  Bell, 
  CheckCircle2, 
  Info, 
  AlertTriangle, 
  XCircle, 
  Clock, 
  MoreVertical,
  Trash2,
  Check,
  Loader2
} from "lucide-react";
import { getNotifications, markAllNotificationsRead, markNotificationRead } from "@/lib/api-auth";
import { formatDistanceToNow } from "date-fns";
import { toast } from "sonner";
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
        setNotifications(prev => prev.map(n => n._id === id ? { ...n, isRead: true } : n));
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
        setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
        refreshUnreadCount();
        toast.success("All notifications marked as read");
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Failed to mark all as read");
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-20">
      {/* Header Actions */}
      <div className="flex items-center justify-between bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="bg-indigo-50 p-2 rounded-lg">
            <Bell className="w-5 h-5 text-indigo-600" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-gray-900">Notifications</h2>
            <p className="text-xs text-gray-500">Stay updated with your platform's latest activities ({meta.total})</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button 
            onClick={markAllAsRead}
            className="text-xs font-bold text-indigo-600 hover:bg-indigo-50 px-4 py-2 rounded-xl transition-all"
          >
            Mark all as read
          </button>
        </div>
      </div>

      {/* Notifications List */}
      <div className="space-y-3">
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-20 bg-white rounded-3xl border border-gray-100/50 shadow-sm">
            <Loader2 className="w-8 h-8 text-indigo-600 animate-spin mb-4" />
            <p className="text-gray-500 font-medium">Loading notifications...</p>
          </div>
        ) : notifications.length > 0 ? (
          notifications.map((n) => (
            <NotificationItem 
              key={n._id} 
              notification={n} 
              onMarkAsRead={() => markAsRead(n._id)}
            />
          ))
        ) : (
          <div className="bg-white p-12 rounded-2xl border border-dashed border-gray-200 flex flex-col items-center justify-center text-center">
            <div className="bg-gray-50 p-4 rounded-full mb-4">
              <Bell className="w-8 h-8 text-gray-300" />
            </div>
            <h3 className="text-lg font-bold text-gray-900 mb-1">All caught up!</h3>
            <p className="text-sm text-gray-500">You don't have any new notifications at the moment.</p>
          </div>
        )}
      </div>
    </div>
  );
}

function NotificationItem({ notification: n, onMarkAsRead }: { notification: Notification, onMarkAsRead: () => void }) {
  const getStyle = (type: string) => {
    switch(type) {
      case 'payment_failed':
        return {
          icon: <XCircle className="w-5 h-5 text-red-500" />,
          bg: "bg-red-50"
        };
      case 'group_completed':
        return {
          icon: <CheckCircle2 className="w-5 h-5 text-emerald-500" />,
          bg: "bg-emerald-50"
        };
      case 'group_started':
      default:
        return {
          icon: <Bell className="w-5 h-5 text-indigo-500" />,
          bg: "bg-indigo-50"
        };
    }
  };

  const style = getStyle(n.type);

  return (
    <div className={`group bg-white p-6 rounded-2xl border transition-all ${
      n.isRead ? "border-gray-100 opacity-70" : "border-indigo-100 shadow-sm"
    } relative overflow-hidden`}>
      {!n.isRead && (
        <div className="absolute top-0 left-0 w-1 h-full bg-indigo-600" />
      )}
      
      <div className="flex gap-4">
        <div className={`${style.bg} w-12 h-12 rounded-2xl flex items-center justify-center shrink-0`}>
          {style.icon}
        </div>
        <div className="flex-1 space-y-1">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-gray-900">{n.title}</h3>
            <span className="text-[10px] font-medium text-gray-400 flex items-center gap-1">
              <Clock className="w-3 h-3" />
              {formatDistanceToNow(new Date(n.createdAt), { addSuffix: true })}
            </span>
          </div>
          <p className="text-xs text-gray-500 leading-relaxed md:max-w-xl">
            {n.message}
          </p>
          <div className="pt-2 flex items-center gap-4">
            {!n.isRead && (
              <button 
                onClick={onMarkAsRead}
                className="text-[10px] font-bold text-indigo-600 flex items-center gap-1 hover:underline"
              >
                <Check className="w-3 h-3" />
                Mark as read
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
