# Kidamooz App

Kidamooz is a Persian-first storytelling application for families. Members can authenticate with one-time
codes, create stories from children's drawings, review drafts, record narration, and browse or play published
stories. The same Angular codebase supports Android through Capacitor and a web/PWA build.

## Technology

- Angular 20 and TypeScript
- Ionic 8 and Capacitor 8
- Angular service worker for PWA delivery
- Jasmine, Karma, and Angular ESLint

The Android application ID is `com.kidamooz.app`; generated web assets are written to `www/`.

## Architecture

```text
src/app/
├── core/       API clients, stores, models, mappers, guards, and platform services
├── shared/     Reusable UI components and pipes
└── features/   Routed areas such as authentication, stories, player, and profile

android/        Native Capacitor project and maintained Android integrations
```

Shared behavior belongs in `src/`. Native APIs must be guarded with a platform check and keep a safe web
path. Generated `www/` output is not an implementation target.

## Requirements

- Node.js 20 or newer and npm
- JDK 17 or newer for Android work
- Android Studio and an Android SDK for device builds

## Local Development

```bash
npm install
npm start
```

The development server is available at `http://localhost:4200` by default.

```bash
npm run lint
npm test -- --watch=false --browsers=ChromeHeadless
npm run build:pwa
```

## Android Workflow

```bash
npm run ionic:build
npm run cap:sync
npm run cap:android
```

`cap:android` opens the native project in Android Studio. Device or emulator verification is required for
changes involving SMS consent, push notifications, camera access, files, recording, or lifecycle behavior.

Firebase push notifications require a local `android/app/google-services.json`. Never commit the real file,
signing keys, credentials, or production secrets.

## Configuration

Development and production settings live in `src/environments/environment.ts` and
`src/environments/environment.prod.ts`. The backend remains authoritative for authentication, authorization,
quotas, payments, and AI credit balances. Provider credentials must never be stored in the app.

## AI Features and AI-Assisted Development

Kidamooz uses server-side AI to turn a child's drawing into a story and, when selected, generate supporting
cover artwork. The client uploads user input and renders results; model credentials, usage metering, financial
rules, and provider communication remain on the backend.

The repository is also developed with AI-assisted engineering. AI changes remain subject to project rules,
human review, automated checks, and Spec Kit convergence. Generated output is not accepted as complete until
it satisfies the specification and verification requirements.

## Spec-Driven Development

This repository uses [GitHub Spec Kit](https://github.com/github/spec-kit) with the Codex integration.
Instructions are in [AGENTS.md](AGENTS.md), and governing principles are in
[the constitution](.specify/memory/constitution.md).

```text
$speckit-specify
$speckit-clarify
$speckit-plan
$speckit-tasks
$speckit-analyze
$speckit-implement
$speckit-converge
```

Feature artifacts are stored under `specs/<feature>/`. Implementation does not begin before the specification,
plan, and task list exist, and work is complete only when convergence reports `Converged`.

## Idea Assessment

```text
$speckit-assess-intake
$speckit-assess-research
$speckit-assess-define
$speckit-assess-shape
$speckit-assess-decide
```

Assessment evidence is stored under `.specify/assessments/<slug>/`. Only a documented `go` decision moves to
the feature specification workflow.

## Security

Do not commit API keys, tokens, Firebase service accounts, signing keys, real environment files, private media,
or logs containing OTPs. Review staged files and every outgoing commit for secrets before pushing.

## License

No public license has been declared in this repository.
