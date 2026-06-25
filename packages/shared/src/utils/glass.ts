/**
 * Subtle Glassmorphism Utility - Best Balance Premium UI
 * Targeted use ONLY on: modals/sheets, FABs, LoadCards, headers, key cards.
 * Professional light theme + electric blue accents preserved.
 * No heavy effects. Web uses cheap backdrop-blur. Mobile: performant rgba + border (no blur lib).
 * Military time and shared components unchanged.
 */

type ViewStyle = Record<string, unknown>;

// Web: Tailwind class strings (compose with your elements)
export const GLASS = {
  // Base subtle glass for cards, headers, interactive surfaces
  card: 'bg-white/75 backdrop-blur-md border border-white/50 shadow-sm rounded-2xl overflow-hidden',
  cardActive: 'bg-white/80 backdrop-blur-md border border-sky-200/60 shadow-sm rounded-2xl overflow-hidden',

  // Modal / bottom sheet stronger blur for depth (still subtle)
  sheet: 'bg-white/80 backdrop-blur-lg border border-white/60 shadow-xl rounded-t-3xl overflow-hidden',

  // Header bar (when glass appropriate)
  header: 'bg-white/70 backdrop-blur-md border-b border-white/40',

  // Primary action / FAB targeted glass (accent preserved for contrast)
  // Use on wrapper; inner button keeps electric blue fill
  action: 'bg-white/65 backdrop-blur-sm border border-white/50 rounded-2xl',

  // Light specular highlight helper class (add as first child sibling inside glass container)
  // <div className={GLASS.highlight} aria-hidden />
  highlight: 'pointer-events-none absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-white/70 to-transparent',
} as const;

// RN Mobile: returns clean ViewStyle. NO backdrop blur (perf + compat).
// Add a 1px top View inside your component for specular simulation.
export function getGlassCardStyle(options?: {
  active?: boolean;
  sheet?: boolean;
  elevated?: boolean;
}): ViewStyle {
  const { active, sheet, elevated } = options || {};
  return {
    backgroundColor: active ? 'rgba(255,255,255,0.82)' : 'rgba(255,255,255,0.78)',
    borderWidth: 1,
    borderColor: active ? 'rgba(186,230,253,0.55)' : 'rgba(226,232,240,0.85)',
    borderRadius: sheet ? 24 : 16,
    // Shadow kept very light for professionalism
    shadowColor: '#000',
    shadowOpacity: elevated || sheet ? 0.06 : 0.03,
    shadowRadius: elevated || sheet ? 12 : 6,
    shadowOffset: { width: 0, height: elevated ? 4 : 1 },
    elevation: elevated || sheet ? 2 : 1,
  };
}

// Helper for mobile specular highlight bar (place absolutely at top of glass card)
export const MOBILE_GLASS_HIGHLIGHT: ViewStyle = {
  position: 'absolute',
  top: 0,
  left: 0,
  right: 0,
  height: 1,
  backgroundColor: 'rgba(255,255,255,0.65)',
  borderTopLeftRadius: 16,
  borderTopRightRadius: 16,
};

// For primary action buttons inside glass surfaces (keeps strong tap target)
export const getGlassActionButtonStyle = (disabled?: boolean): ViewStyle => ({
  backgroundColor: '#00BFFF', // electric blue preserved
  borderRadius: 12,
  opacity: disabled ? 0.55 : 1,
});

// Simple type for consumers
export type GlassVariant = 'card' | 'cardActive' | 'sheet' | 'header' | 'action';
