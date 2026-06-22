# Mobile Skills
# laslogTMX Mobile Build Guidelines (Expo)
Version: 2026-06-21

> **SAFETY CHECK REQUIRED**: At the start of every major task, read and follow `skills/safetySKILL.md` in full. State "SAFETY CHECK PASSED" before making changes. Never hardcode secrets. Limit blast radius.

**Stack**: Expo SDK 52 + React Native + React 19
**Domains** (from shared constants):
- app.laslogtmx.com → production API/web
- dev.laslogtmx.com → staging
- laslogs.cc is deprecated (redirect only)

**Key Rules**:
- Military Time default in all screens
- Reuse packages/shared as much as possible
- Clean professional UI (no memes)
- Strong company isolation
- Realtime chat support
- Receipt OCR with correction screen
- MOTUS Helper as differentiator

**Navigation**: Use @react-navigation/native-stack + tabs
**Auth Flow**: Login → Signup → Company Selection → Main App