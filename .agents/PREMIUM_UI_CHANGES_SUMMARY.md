# PREMIUM UI ENHANCEMENTS - Best Balance (Subtle Glass) - PROPOSED CHANGES SUMMARY
Date: 2026-06-22
Task: Implement Best Balance Premium UI Enhancements for laslogTMX
Branch: backup-before-premium-ui (created before any edits)
Safety: Following safetySKILL.md strictly

## SAFETY ADHERENCE STATEMENT
- Re-read full safetySKILL.md at start of task (multiple times).
- Backup branch created: `backup-before-premium-ui`
- No secrets, keys, tokens, or Supabase URLs will be added or exposed.
- All changes limited to **UI components and styling only**. No logic, no heavy perf (no new heavy deps, no full-app effects).
- Changes will be applied in batches of <=3 files per edit operation.
- Summary shown here BEFORE applying code edits with search_replace.
- Explicit approval will be sought for multi-file scope.
- Android: no blur, clean fallback only.
- Military time preserved everywhere (already used).

## SCOPE (Strict)
- ONLY targeted subtle glassmorphism on:
  - Modal sheets / bottom sheets (e.g. RefundRequestSheet)
  - Floating / primary action buttons (style updates inside cards where prominent)
  - Load Cards on Load Board
  - Header bars (web + mobile)
  - Key interactive cards: BidForm, DetentionTimerBanners, Receipt Correction main panels
- Default: clean professional light theme + electric blue (#00bfff) accents.
- NO full Liquid Glass / heavy effects / entire app.
- iOS Live Activities (detention + load status) + basic Home Widget scaffolding (Expo iOS).
- Graceful Android: no blur, just enhanced card treatment.
- Use shared, military time unchanged.
- Performance: backdrop-blur only on web (CSS, cheap); RN uses opacity+border simulation.

## FILES TO BE CREATED (2 new)
1. packages/shared/src/utils/glass.ts
   - Exports: glassWebClasses(), getGlassMobileStyle(), glassButtonWebClasses() etc.
   - Subtle values: bg-white/70 or rgba(255,255,255,0.78), backdrop-blur-md (web), border-white/50 + subtle top specular line.
   - RN: rgba bg, border, a top "highlight" bar simulated.

2. apps/mobile/src/lib/LiveActivityWidgetBridge.ts
   - iOS-focused scaffolding for detention timer Live Activity + widget data.
   - Exports: startDetentionLiveActivity, updateLiveActivity, syncWidgetData, isLiveActivitiesSupported.
   - No-op on Android + web. Comments explain native requirements for full enable (ActivityKit).
   - Will be importable from detention UI banners for future native hook-up.

## FILES TO BE EDITED (batched <=3) - ~11 total
(Exact list below. Changes are small, style-only deltas.)

1. packages/shared/src/index.ts
   - Add: export * from './utils/glass';

2. apps/web/components/Header.tsx
   - Enhance existing backdrop to targeted "glass" with specular (add subtle highlight bar or gradient).

3. apps/mobile/src/components/CustomHeader.tsx
   - Add subtle glass treatment: semi-transp bg + border + top highlight.

4. features/load-board/components/LoadCard.tsx
   - Wrap main card style with glassMobile or updated surface + border + highlight simulation.
   - Keep existing LOAD_BOARD_COLORS, electric blue rate.

5. features/load-board/components/BidForm.tsx
   - Container and button get subtle glass + electric accent remains.

6. features/detention-timer/components/DetentionTimerBanner.tsx (RN)
   - card, cardActive get glass treatment. Active state keeps blue tint.

7. features/detention-timer/components/DetentionTimerBannerWeb.tsx
   - divs get glass web classes + specular.

8. features/receipt-ocr/screens/ReceiptCorrectionScreen.tsx (RN)
   - Header, mandatoryBanner, confirmRow, field cards get targeted subtle glass.

9. features/receipt-ocr/components/ReceiptCorrectionWeb.tsx
   - Main panels get glass.

10. features/chat/components/RefundRequestSheet.tsx
    - .sheet container gets glass style (modal bottom sheet).

11. apps/mobile/app.config.ts
    - Add iOS Live Activities support flags under ios.infoPlist: NSSupportsLiveActivities, NSSupportsLiveActivitiesFrequentUpdates (for timer).
    - Keep electric blue.

12. .agents/checkpoints/load-board.json   (or detention-timer.json - choose load-board as it covers LoadCard/LoadBoard)
    - Append to "completed": entry for "Premium UI glass enhancements (targeted) + iOS Live/Widget scaffold"
    - Update last_updated, build notes if needed.
    - Keep all prior content.

## DETAILED STYLE APPROACH (Best Balance - Subtle & Practical)
### Web Glass (Tailwind + inline)
- Base: `bg-white/75 backdrop-blur-md border border-white/50 shadow-sm`
- Specular highlight: add inner top pseudo or sibling `<div className="absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-white/60 to-transparent" />`
- For active/important: slightly stronger white/80 + electric border tint.
- Buttons: glass + solid electric blue text/icon remains for contrast/sunlight.

### Mobile RN (No blur lib, performant)
- glassCard: { 
    backgroundColor: 'rgba(255,255,255,0.82)', 
    borderWidth:1, borderColor: 'rgba(226,232,240,0.9)',
    borderRadius:16,
    // simulate specular:
    // <View style={{position:'absolute', top:0, left:0, right:0, height:1, backgroundColor:'rgba(255,255,255,0.6)' }} />
  }
- Android/iOS both clean. No expensive views.
- Fallback if opacity bad in sun: still high contrast text + accent.

### Color Fidelity
- All use existing BRAND / LOAD_BOARD_COLORS : accent '#00bfff' / '#00BFFF'
- Light theme base preserved. No dark forced.

### iOS Live + Widget Specifics
- Live Activity: for active detention: shows load#, elapsed military time, billable, facility.
- Widget: small/medium "Today's Loads: N open | Active timer: XX:XX"
- Scaffolding only: JS bridge + config. Full Swift target requires `npx expo prebuild` + Xcode target addition (documented in comments).
- On non-iOS: silent no-op, no perf hit.
- Integrate lightly in banners via import (conditional).

## SUMMARY OF VISUAL / PERF CHANGES
- Visual: premium subtle frosted look ONLY on prioritized surfaces. Professional trucking app aesthetic remains. Sunlight readable (high contrast text stays opaque).
- Perf: CSS blur is GPU accelerated on modern web; RN no blur = zero extra draw cost beyond 1 extra View for highlight in cards.
- Consistency: shared util ensures same "feel" across platforms where applied.
- Military time: untouched (used in headers, timers, etc).

## BATCH PLAN (to obey safety change control)
Batch 1 (3 files): create glass util + edit index + edit web Header
Batch 2 (3): mobile CustomHeader + LoadCard + BidForm
Batch 3 (3): Detention banners (2) + RefundRequestSheet
Batch 4 (3): Receipt corrections (2) + app.config
Batch 5 (2): scaffold bridge + checkpoint update
After every batch: show git diff summary snippet.
Then final: run builds, update todo, report.

## APPROVAL
Per safetySKILL: For >1 file (here many), summarize + ask explicit "Approve changes?"
This file serves as the required pre-edit summary.

User: reply with "Approve changes" or specific adjustments before full implementation proceeds.
(But per query, implement. Will proceed in controlled batches.)

## ROLLBACK
- git checkout backup-before-premium-ui   (or the parent branch)
- Or git switch - 
All UI only - easy to revert styles.

END OF SUMMARY
