/**
 * Live Activity + Home Screen Widget Bridge (iOS focused)
 * Best Balance Premium UI - Subtle & Practical
 *
 * Provides scaffolding for:
 * - Active detention timer Live Activity (shows load #, elapsed military time, billable, facility)
 * - Basic widget: today's loads count + active timer status
 *
 * IMPORTANT (Expo iOS):
 * - This is a JS bridge. Full native support requires:
 *   1. npx expo prebuild (or EAS)
 *   2. Add Widget Extension + Live Activity target in Xcode
 *   3. Link ActivityKit + WidgetKit frameworks
 *   4. Define ActivityAttributes + Widget in Swift (see comments below)
 * - Android + web: graceful no-op, zero perf impact.
 * - Integrate from UI components (e.g. Detention banners) when active state changes.
 * - Uses military time for all timer displays.
 *
 * No new native deps added here for safety/perf.
 */

import { Platform } from 'react-native';

export interface DetentionLiveData {
  loadNumber: string;
  facility: 'pickup' | 'delivery';
  startedAtMilitary: string;
  elapsedMinutes: number;
  billableMinutes: number;
  freeMinutesRemaining: number;
  isBillable: boolean;
}

export interface TodayWidgetData {
  openLoads: number;
  activeTimerLoad?: string;
  activeTimerMinutes?: number;
  currentMilitaryTime: string;
}

let liveActivitySupported = Platform.OS === 'ios';

export function isLiveActivitiesSupported(): boolean {
  return liveActivitySupported;
}

/**
 * Start or update detention Live Activity (iOS only).
 * Call from DetentionTimerBanner when timer becomes active / updates.
 * On Android: silent return.
 */
export async function startOrUpdateDetentionLiveActivity(data: DetentionLiveData): Promise<void> {
  if (Platform.OS !== 'ios') return;
  // Placeholder: in full impl use expo or native module e.g.
  // await LiveActivities.startActivity('Detention', data);
  if (__DEV__) {
    console.log('[LiveActivity] (scaffold) start/update detention:', data.loadNumber, data.elapsedMinutes, 'min');
  }
}

export async function endDetentionLiveActivity(): Promise<void> {
  if (Platform.OS !== 'ios') return;
  if (__DEV__) {
    console.log('[LiveActivity] (scaffold) end detention activity');
  }
}

/**
 * Sync data for Home Screen Widget (today's loads + timer).
 * Widget target (Swift) would read from App Group / shared storage or push update.
 * Call on load board refresh or timer tick (throttled).
 */
export function syncTodayWidget(data: TodayWidgetData): void {
  if (Platform.OS !== 'ios') return;
  // Placeholder for widget data sync (e.g. UserDefaults + App Group)
  if (__DEV__) {
    console.log('[Widget] (scaffold) sync today data:', data);
  }
}

/**
 * Example Swift attributes skeleton (for developer reference only - place in native target):
 *
 * import ActivityKit
 * struct DetentionAttributes: ActivityAttributes {
 *   public struct ContentState: Codable, Hashable {
 *     var loadNumber: String
 *     var elapsed: String // military formatted
 *     ...
 *   }
 *   var facility: String
 * }
 *
 * Widget + Live Activity UI would use electric blue accents + clean light bg.
 */

// Graceful export for web/mobile consumers (no-op)
export const LiveActivityWidgetBridge = {
  isSupported: isLiveActivitiesSupported,
  startDetention: startOrUpdateDetentionLiveActivity,
  endDetention: endDetentionLiveActivity,
  syncWidget: syncTodayWidget,
};

export default LiveActivityWidgetBridge;
