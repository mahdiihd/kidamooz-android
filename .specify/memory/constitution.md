<!--
Sync Impact Report
- Version change: template -> 1.0.0
- Added principles: Shared App Contract; Native Boundaries; Secure Client; Verifiable Changes; Focused Scope
- Added sections: Platform Constraints; Spec-Driven Workflow
- Removed sections: none
- Follow-up TODOs: none
-->
# Kidamooz App Constitution

## Core Principles

### I. Shared App Contract
Features MUST preserve the shared Angular/Ionic behavior for Android and web/PWA unless the specification
explicitly limits a capability to one platform. API DTOs, mappers, guards, translations, and loading/error
states MUST change together when their contract changes.

### II. Native Boundaries
Capacitor and Android APIs MUST be guarded with platform checks and MUST have a safe web behavior. Native
source changes MUST be made in the maintained source locations, never in generated `www/` output. A native
change is complete only after browser and device-specific behavior are separately considered.

### III. Secure Client
Secrets, provider credentials, signing material, and privileged business rules MUST remain outside the app.
The server MUST remain authoritative for identity, authorization, payments, quotas, and credit balances.
Logs and UI errors MUST NOT expose tokens, OTP values, private media, or provider response bodies.

### IV. Verifiable Changes
Every specification MUST define observable acceptance scenarios. Changed TypeScript behavior MUST pass the
relevant tests plus `npm run lint` and `npm run build:pwa`. Native changes MUST additionally compile or sync
and be verified on a device or emulator when available; missing device verification MUST be stated.

### V. Focused Scope
Each feature specification MUST describe one reviewable outcome, its compatibility boundaries, and its
non-goals. Existing services, stores, routes, and UI patterns MUST be extended before parallel abstractions
are introduced. Complexity requires a concrete product or platform reason in the plan.

## Platform Constraints

- The app uses Angular 20, Ionic 8, and Capacitor 8; plans MUST use compatible APIs.
- Persian RTL behavior and all affected translation keys MUST be included in UI specifications.
- Authentication guards, story creation guards, offline/cache behavior, and previous installed versions
  MUST be considered when a change touches routing, persistence, or service workers.
- Android-only payment or SMS behavior MUST not leak into the web runtime.

## Spec-Driven Workflow

1. Use Idea Assessment for proposals whose value, user, scope, or cost is uncertain.
2. For approved bounded work, run specify, clarify when needed, plan, tasks, and analyze.
3. Implementation MUST follow the approved spec and task list; discoveries MUST update the artifacts.
4. Run converge after implementation and repeat implementation until the result is converged.
5. Keep completed feature artifacts as the reviewable decision record.

## Governance

This constitution governs Spec Kit work in the Kidamooz app and complements `AGENTS.md`; when both apply,
the stricter testable constraint wins. Amendments require a documented reason, an impact review, and a
semantic version change. Every plan and implementation review MUST check these principles. Exceptions MUST
be recorded in the feature plan with their scope and removal condition.

**Version**: 1.0.0 | **Ratified**: 2026-09-16 | **Last Amended**: 2026-09-16
