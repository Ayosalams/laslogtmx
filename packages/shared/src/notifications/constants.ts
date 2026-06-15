import { NotificationType } from './types';

export const NOTIFICATION_TYPE_LABELS: Record<NotificationType, string> = {
  load_match: 'Load Match (Preferred City)',
  chat_message: 'New Chat Message',
  load_status: 'Load Status Change',
  motus_update: 'MOTUS Update',
  cble_material: 'CBLE New Material',
};

export const NOTIFICATION_TYPE_DESCRIPTIONS: Record<NotificationType, string> = {
  load_match: 'Alert when a new load matches one of your preferred cities',
  chat_message: 'Notify when teammates send messages in company channels',
  load_status: 'Updates when load status changes (assigned, in transit, delivered)',
  motus_update: 'MOTUS submission and FMCSA status changes for your company',
  cble_material: 'New internal CBLE training material published',
};

export const DEFAULT_ENABLED_TYPES: Record<NotificationType, boolean> = {
  load_match: true,
  chat_message: true,
  load_status: true,
  motus_update: true,
  cble_material: true,
};

export const SUGGESTED_CITIES = [
  'Chicago',
  'Dallas',
  'Atlanta',
  'Los Angeles',
  'Houston',
  'Memphis',
  'Indianapolis',
  'Columbus',
  'Phoenix',
  'Nashville',
];