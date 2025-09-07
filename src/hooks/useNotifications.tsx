import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';

export interface Notification {
  id: string;
  title: string;
  message: string;
  type: 'proposal' | 'client' | 'system';
  read: boolean;
  data?: any;
  created_at: string;
  updated_at: string;
}

export function useNotifications() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [unreadCount, setUnreadCount] = useState(0);

  // Fetch initial notifications
  useEffect(() => {
    if (user) {
      fetchNotifications();
    }
  }, [user]);

  // Set up real-time subscription
  useEffect(() => {
    if (!user) return;

    const channel = supabase
      .channel('notifications-channel')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${user.id}`
        },
        (payload) => {
          const newNotification = { 
            ...payload.new, 
            type: payload.new.type as 'proposal' | 'client' | 'system' 
          } as Notification;
          setNotifications(prev => [newNotification, ...prev]);
          setUnreadCount(prev => prev + 1);
          
          // Show toast notification for new notifications
          toast({
            title: newNotification.title,
            description: newNotification.message,
          });
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${user.id}`
        },
        (payload) => {
          const updatedNotification = { 
            ...payload.new, 
            type: payload.new.type as 'proposal' | 'client' | 'system' 
          } as Notification;
          setNotifications(prev => 
            prev.map(n => n.id === updatedNotification.id ? updatedNotification : n)
          );
          
          // Update unread count if notification was marked as read
          if (updatedNotification.read && !payload.old?.read) {
            setUnreadCount(prev => Math.max(0, prev - 1));
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, toast]);

  const fetchNotifications = async () => {
    if (!user) return;

    try {
      setLoading(true);
      
      const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) throw error;

      setNotifications(data?.map(item => ({
        ...item,
        type: item.type as 'proposal' | 'client' | 'system'
      })) || []);
      setUnreadCount(data?.filter(n => !n.read).length || 0);
    } catch (error) {
      console.error('Error fetching notifications:', error);
      toast({
        title: "Erro ao carregar notificações",
        description: "Não foi possível carregar as notificações.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const markAsRead = async (notificationId: string) => {
    try {
      const { error } = await supabase.rpc('mark_notification_read', {
        notification_id: notificationId
      });

      if (error) throw error;

      // The real-time subscription will handle the state update
    } catch (error) {
      console.error('Error marking notification as read:', error);
      toast({
        title: "Erro",
        description: "Não foi possível marcar a notificação como lida.",
        variant: "destructive",
      });
    }
  };

  const markAllAsRead = async () => {
    try {
      const { error } = await supabase.rpc('mark_all_notifications_read');

      if (error) throw error;

      // Update local state immediately for better UX
      setNotifications(prev => prev.map(n => ({ ...n, read: true })));
      setUnreadCount(0);

      toast({
        title: "Notificações marcadas como lidas",
        description: "Todas as notificações foram marcadas como lidas.",
      });
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
      toast({
        title: "Erro",
        description: "Não foi possível marcar todas as notificações como lidas.",
        variant: "destructive",
      });
    }
  };

  const createNotification = async (
    title: string,
    message: string,
    type: 'proposal' | 'client' | 'system' = 'system',
    data: any = {}
  ) => {
    if (!user) return;

    try {
      const { error } = await supabase.rpc('create_notification', {
        p_user_id: user.id,
        p_title: title,
        p_message: message,
        p_type: type,
        p_data: data
      });

      if (error) throw error;

      // The real-time subscription will handle adding it to the state
    } catch (error) {
      console.error('Error creating notification:', error);
    }
  };

  return {
    notifications,
    loading,
    unreadCount,
    markAsRead,
    markAllAsRead,
    createNotification,
    fetchNotifications
  };
}