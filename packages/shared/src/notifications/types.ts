export type NotificationType =
  | 'load_match'
  | 'chat_message'
  | 'load_status'
  | 'motus_update'
  | 'cble_material';

export interface NotificationRecord {
  id: string;
  user_id: string;
  company_id: string;
  type: NotificationType;
  title: string;
  body: string;
  data: Record<string, unknown>;
  read_at: string | null;
  created_at: string;
}

export interface NotificationSettings {
  user_id: string;
  company_id: string | null;
  preferred_cities: string[];
  enabled_types: Record<NotificationType, boolean>;
  quiet_hours_start: string | null;
  quiet_hours_end: string | null;
  push_enabled: boolean;
}

export type PushPlatform = 'expo' | 'web';

export interface PushSubscriptionPayload {
  platform: PushPlatform;
  token: string;
  endpoint?: string;
  p256dh?: string;
  auth_key?: string;
  device_label?: string;
}